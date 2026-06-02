import { requireAuth } from "@/lib/auth";
import { execute, transaction } from "@/lib/turso";
import { TransactionType } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    const token = await requireAuth(req)
    if (token instanceof NextResponse) {
        return token
    }

    const { id: userId } = token as { id: string }
    const body = await req.json()
    const { type, amount, date, categoryId, accountId, notes }: { type: TransactionType, amount: number, date: Date, categoryId: string, accountId: string, notes: string } = body

    if (!type || !amount || !date || !categoryId || !accountId || !notes) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const transactionDate = new Date(date);
    try {
        // Verify category exists
        const catResult = await execute(
            "SELECT * FROM Category WHERE id = ?",
            [categoryId]
        );
        if (catResult.rows.length === 0) {
            return NextResponse.json({ error: 'Category not found' }, { status: 400 })
        }

        // Verify account exists
        const accResult = await execute(
            "SELECT * FROM Account WHERE id = ?",
            [accountId]
        );
        if (accResult.rows.length === 0) {
            return NextResponse.json({ error: 'Account not found' }, { status: 400 })
        }
        const account = accResult.rows[0];

        // Check if budget exists for this category and month
        const budgetResult = await execute(
            "SELECT * FROM Budget WHERE userId = ? AND categoryId = ? AND month = ? LIMIT 1",
            [userId, categoryId, transactionDate.toISOString().slice(0, 7)]
        );
        const haveBudget = budgetResult.rows.length > 0 ? budgetResult.rows[0] : null;

        // Calculate new account balance
        const newBalance = type === 'income' 
            ? Number(account.balance) + amount 
            : Number(account.balance) - amount;

        // Create transaction and update account balance atomically
        const txId = crypto.randomUUID();

        const result = await transaction(async (tx) => {
            await tx.execute({
                sql: "INSERT INTO Transactions (id, userId, type, amount, date, categoryId, accountId, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                args: [txId, userId, type, amount, transactionDate.toISOString(), categoryId, accountId, notes]
            });

            await tx.execute({
                sql: "UPDATE Account SET balance = ? WHERE id = ?",
                args: [newBalance, accountId]
            });

            return {
                transaction: { id: txId, userId, type, amount, date: transactionDate.toISOString(), categoryId, accountId, notes },
                account: { ...account, balance: newBalance }
            };
        });

        // Update budget if exists
        if (haveBudget) {
            const newSpent = Number(haveBudget.spent) + (type === 'expense' ? amount : 0);
            await execute(
                "UPDATE Budget SET spent = ? WHERE id = ?",
                [newSpent, haveBudget.id as string]
            );
            console.log({ ...haveBudget, spent: newSpent });
        }

        if (!result.transaction) {
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 400 })
        }
        return NextResponse.json({ 
            message: "Transaction created successfully", 
            transaction: result.transaction,
            account: result.account 
        }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating transaction' }, { status: 500 })
    }
}