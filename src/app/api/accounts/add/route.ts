import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { AccountType } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    const token = await requireAuth(request);
    if (token instanceof NextResponse) {
        return token;
    }
    const { id: userId } = token as { id: string };
    const body = await request.json();
    const { name, balance, type }: { name: string; balance: number; type: AccountType } = body;

    if (!name || !balance || !type || !userId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        const id = crypto.randomUUID();
        await execute(
            "INSERT INTO Account (id, name, balance, type, userId) VALUES (?, ?, ?, ?, ?)",
            [id, name, balance, type, userId]
        );
        const account = { id, name, balance, type, userId };
        return NextResponse.json(account, { status: 201 });
    } catch (error: any) {
        console.error("Error creating account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}