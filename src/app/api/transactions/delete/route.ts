import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { TransactionType } from "@/types";
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
        const txResult = await execute(
            "SELECT * FROM Transactions WHERE id = ?",
            [id]
        );
        if (txResult.rows.length === 0) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        await execute(
            "DELETE FROM Transactions WHERE id = ?",
            [id]
        );
        return NextResponse.json(txResult.rows[0], { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}