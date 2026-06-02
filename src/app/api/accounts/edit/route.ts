import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { AccountType } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    const token = await requireAuth(request);
    if (token instanceof NextResponse) {
        return token;
    }

    const body = await request.json();
    const { id, name, balance, type }: { name: string; balance: number; type: AccountType; id: string; } = body;
    if (!id || !name || !balance || !type) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        const accResult = await execute(
            "SELECT * FROM Account WHERE id = ?",
            [id]
        );

        if (accResult.rows.length === 0) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        await execute(
            "UPDATE Account SET name = ?, balance = ?, type = ? WHERE id = ?",
            [name, balance, type, id]
        );
        const account = { id, name, balance, type, userId: accResult.rows[0].userId };
        return NextResponse.json(account, { status: 200 });
    } catch (error: any) {
        console.error("Error updating account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}