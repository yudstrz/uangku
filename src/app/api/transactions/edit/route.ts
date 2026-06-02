import { requireAuth } from "@/lib/auth";
import { execute, transaction } from "@/lib/turso";
import { TransactionType } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    const token = await requireAuth(request);
    if (token instanceof NextResponse) return token;

    const { id, type, amount, date, categoryId, accountId, notes } = await request.json();

    if (!id || !type || !amount || !date || !categoryId || !accountId || !notes) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const transactionDate = new Date(date);
    const userId = (token as { id: string }).id;

    try {
        // Get existing transaction with the associated account
        const existingResult = await execute(
            `SELECT t.*, a.id as acc_id, a.name as acc_name, a.type as acc_type, a.balance as acc_balance, a.userId as acc_userId
             FROM Transactions t
             JOIN Account a ON t.accountId = a.id
             WHERE t.id = ?`,
            [id]
        );
        if (existingResult.rows.length === 0) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        const existing = existingResult.rows[0];

        // Verify new account exists
        const newAccResult = await execute(
            "SELECT * FROM Account WHERE id = ?",
            [accountId]
        );
        if (newAccResult.rows.length === 0) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }
        const newAccount = newAccResult.rows[0];

        // Calculate account balance changes
        const oldAmount = Number(existing.amount);
        const newAmount = amount;
        const oldType = existing.type as string;
        const newType = type as TransactionType;
        const oldAccountId = existing.accountId as string;
        const isSameAccount = oldAccountId === accountId;

        // Start a transaction for all database operations
        const result = await transaction(async (tx) => {
            // Handle budget updates
            const existingDate = new Date(existing.date as string);
            const oldMonth = existingDate.toISOString().slice(0, 7);
            const newMonth = transactionDate.toISOString().slice(0, 7);

            const oldBudgetResult = await tx.execute({
                sql: "SELECT * FROM Budget WHERE userId = ? AND categoryId = ? AND month = ? LIMIT 1",
                args: [userId, existing.categoryId as string, oldMonth]
            });
            const oldBudget = oldBudgetResult.rows.length > 0 ? oldBudgetResult.rows[0] : null;

            const newBudgetResult = await tx.execute({
                sql: "SELECT * FROM Budget WHERE userId = ? AND categoryId = ? AND month = ? LIMIT 1",
                args: [userId, categoryId, newMonth]
            });
            const newBudget = newBudgetResult.rows.length > 0 ? newBudgetResult.rows[0] : null;

            if (existing.categoryId === categoryId && oldMonth === newMonth && oldBudget) {
                const diff = (newType === 'expense' ? newAmount : 0) - (oldType === 'expense' ? oldAmount : 0);
                await tx.execute({
                    sql: "UPDATE Budget SET spent = ? WHERE id = ?",
                    args: [Number(oldBudget.spent) + diff, oldBudget.id as string]
                });
            } else {
                if (oldBudget && oldType === 'expense') {
                    await tx.execute({
                        sql: "UPDATE Budget SET spent = ? WHERE id = ?",
                        args: [Math.max(0, Number(oldBudget.spent) - oldAmount), oldBudget.id as string]
                    });
                }
                if (newBudget && newType === 'expense') {
                    await tx.execute({
                        sql: "UPDATE Budget SET spent = ? WHERE id = ?",
                        args: [Number(newBudget.spent) + newAmount, newBudget.id as string]
                    });
                }
            }

            // Handle account balance updates
            if (isSameAccount) {
                // Same account, adjust balance based on type changes
                let balanceChange = 0;
                
                if (oldType === 'income' && newType === 'income') {
                    balanceChange = newAmount - oldAmount;
                } else if (oldType === 'income' && newType === 'expense') {
                    balanceChange = -oldAmount - newAmount;
                } else if (oldType === 'expense' && newType === 'income') {
                    balanceChange = oldAmount + newAmount;
                } else if (oldType === 'expense' && newType === 'expense') {
                    balanceChange = oldAmount - newAmount;
                }

                await tx.execute({
                    sql: "UPDATE Account SET balance = ? WHERE id = ?",
                    args: [Number(newAccount.balance) + balanceChange, accountId]
                });
            } else {
                // Different accounts, revert old account and update new account
                // Revert old account
                const oldAccountChange = oldType === 'income' ? -oldAmount : oldAmount;
                await tx.execute({
                    sql: "UPDATE Account SET balance = balance + ? WHERE id = ?",
                    args: [oldAccountChange, oldAccountId]
                });

                // Update new account
                const newAccountChange = newType === 'income' ? newAmount : -newAmount;
                await tx.execute({
                    sql: "UPDATE Account SET balance = balance + ? WHERE id = ?",
                    args: [newAccountChange, accountId]
                });
            }

            // Update the transaction
            await tx.execute({
                sql: "UPDATE Transactions SET type = ?, amount = ?, date = ?, categoryId = ?, accountId = ?, notes = ? WHERE id = ?",
                args: [type, amount, transactionDate.toISOString(), categoryId, accountId, notes, id]
            });

            return { id, type, amount, date: transactionDate.toISOString(), categoryId, accountId, notes, userId };
        });

        return NextResponse.json({ 
            message: "Transaction updated successfully",
            transaction: result
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating transaction:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}