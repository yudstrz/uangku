import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    const token = await requireAuth(req);
    if (token instanceof NextResponse) {
        return token;
    }
    const { id: userId } = token as { id: string };
    const { categoryId, amount, month } = await req.json();

    try {
        const userResult = await execute(
            "SELECT id FROM User WHERE id = ?",
            [userId]
        );
        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { start, end } = getStartAndEndOfMonth(month);
        console.log(start, end);

        const txResult = await execute(
            "SELECT * FROM Transactions WHERE userId = ? AND categoryId = ? AND date >= ? AND date <= ?",
            [userId, categoryId, start.toISOString(), end.toISOString()]
        );

        const totalSpent = txResult.rows.reduce((acc, t) => acc + Number(t.amount), 0);
        console.log(totalSpent);

        const existingResult = await execute(
            "SELECT id FROM Budget WHERE userId = ? AND categoryId = ? AND month = ? LIMIT 1",
            [userId, categoryId, month]
        );
        if (existingResult.rows.length > 0) {
            return NextResponse.json({ error: "Budget already available for this month" }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const spent = txResult.rows.length > 0 ? totalSpent : 0;
        await execute(
            "INSERT INTO Budget (id, categoryId, amount, month, userId, spent) VALUES (?, ?, ?, ?, ?, ?)",
            [id, categoryId, amount, month, userId, spent]
        );

        const budget = { id, categoryId, amount, month, userId, spent };

        if (!budget) {
            return NextResponse.json({ error: "Error creating budget" }, { status: 500 });
        }
        return NextResponse.json({ budget }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating budget:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

function getStartAndEndOfMonth(month: string) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59, 999);
    return { start, end };
}
