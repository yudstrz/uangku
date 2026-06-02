import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const token = await requireAuth(request);
    if (token instanceof NextResponse) return token;

    const userId = (token as { id: string }).id;

    try {
        // Fetch all data in parallel for better performance
        const [categoriesResult, accountsResult, allTransactionsResult, recentTransactionsResult] = await Promise.all([
            execute(
                "SELECT * FROM Category WHERE userId = ?",
                [userId]
            ),
            execute(
                "SELECT * FROM Account WHERE userId = ?",
                [userId]
            ),
            execute(
                `SELECT t.*, 
                    c.id as cat_id, c.name as cat_name, c.color as cat_color, c.type as cat_type, c.userId as cat_userId,
                    a.id as acc_id, a.name as acc_name, a.type as acc_type, a.balance as acc_balance, a.userId as acc_userId
                 FROM Transactions t
                 LEFT JOIN Category c ON t.categoryId = c.id
                 LEFT JOIN Account a ON t.accountId = a.id
                 WHERE t.userId = ?
                 ORDER BY t.date DESC`,
                [userId]
            ),
            execute(
                `SELECT t.*, 
                    c.id as cat_id, c.name as cat_name, c.color as cat_color, c.type as cat_type, c.userId as cat_userId,
                    a.id as acc_id, a.name as acc_name, a.type as acc_type, a.balance as acc_balance, a.userId as acc_userId
                 FROM Transactions t
                 LEFT JOIN Category c ON t.categoryId = c.id
                 LEFT JOIN Account a ON t.accountId = a.id
                 WHERE t.userId = ?
                 ORDER BY t.date DESC
                 LIMIT 6`,
                [userId]
            ),
        ]);

        // Transform rows to include nested category and account objects (matching Prisma include behavior)
        const transformTransaction = (row: any) => ({
            id: row.id,
            type: row.type,
            amount: row.amount,
            date: row.date,
            categoryId: row.categoryId,
            accountId: row.accountId,
            userId: row.userId,
            notes: row.notes,
            category: {
                id: row.cat_id,
                name: row.cat_name,
                color: row.cat_color,
                type: row.cat_type,
                userId: row.cat_userId,
            },
            account: {
                id: row.acc_id,
                name: row.acc_name,
                type: row.acc_type,
                balance: row.acc_balance,
                userId: row.acc_userId,
            },
        });

        return NextResponse.json({
            categories: categoriesResult.rows,
            accounts: accountsResult.rows,
            transactions: allTransactionsResult.rows.map(transformTransaction),
            recentTransactions: recentTransactionsResult.rows.map(transformTransaction),
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}