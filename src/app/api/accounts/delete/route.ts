import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    const token = await requireAuth(request);
    if (token instanceof NextResponse) {
        return token;
    }
    const body = await request.json();
    const { id }: { id: string } = body;

    if (!id) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        // Check if account has any transactions
        const countResult = await execute(
            "SELECT COUNT(*) as count FROM Transactions WHERE accountId = ?",
            [id]
        );
        const transactionCount = Number(countResult.rows[0].count);

        if (transactionCount > 0) {
            return NextResponse.json({ 
                error: "Cannot delete this account because it has transactions associated with it. Please delete the transactions first or transfer them to another account.",
                type: "FOREIGN_KEY_CONSTRAINT"
            }, { status: 400 });
        }

        const accResult = await execute(
            "SELECT * FROM Account WHERE id = ?",
            [id]
        );
        if (accResult.rows.length === 0) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        await execute(
            "DELETE FROM Account WHERE id = ?",
            [id]
        );
        return NextResponse.json(accResult.rows[0], { status: 200 });
    } catch (error: any) {
        // Check if it's a foreign key constraint error
        if (error.message?.includes('FOREIGN KEY constraint failed')) {
            return NextResponse.json({ 
                error: "This account has transactions associated with it. Please delete them first or transfer them to another account.",
                type: "FOREIGN_KEY_CONSTRAINT"
            }, { status: 400 });
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
