import { execute } from "@/lib/turso";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
    const body = await request.json();
    const { id }: { id: string } = body;

    if (!id) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        // Check if category has any transactions
        const txCountResult = await execute(
            "SELECT COUNT(*) as count FROM Transactions WHERE categoryId = ?",
            [id]
        );
        const transactionCount = Number(txCountResult.rows[0].count);

        // Check if category has any budgets
        const budgetCountResult = await execute(
            "SELECT COUNT(*) as count FROM Budget WHERE categoryId = ?",
            [id]
        );
        const budgetCount = Number(budgetCountResult.rows[0].count);

        if (transactionCount > 0 || budgetCount > 0) {
            let errorMessage = "Cannot delete this category because it has ";
            
            if (transactionCount > 0 && budgetCount > 0) {
                errorMessage += "transactions and budgets associated with it. Please delete those first.";
            } else if (transactionCount > 0) {
                errorMessage += "transactions associated with it. Please delete or reassign these transactions first.";
            } else {
                errorMessage += "budgets associated with it. Please delete or reassign these budgets first.";
            }
            
            return NextResponse.json({ 
                error: errorMessage,
                type: "FOREIGN_KEY_CONSTRAINT",
                hasTransactions: transactionCount > 0,
                hasBudgets: budgetCount > 0
            }, { status: 400 });
        }

        const catResult = await execute(
            "SELECT * FROM Category WHERE id = ?",
            [id]
        );
        if (catResult.rows.length === 0) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        await execute(
            "DELETE FROM Category WHERE id = ?",
            [id]
        );
        return NextResponse.json(catResult.rows[0], { status: 200 });
    } catch (error: any) {
        // Check if it's a foreign key constraint error
        if (error.message?.includes('FOREIGN KEY constraint failed')) {
            return NextResponse.json({ 
                error: "This category has related transactions or budgets. Please delete those first.",
                type: "FOREIGN_KEY_CONSTRAINT"
            }, { status: 400 });
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
