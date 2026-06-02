import { NextResponse } from "next/server";
import { execute } from "@/lib/turso";
import type { TransactionType } from "@/types";
import crypto from "crypto";

export async function POST(request: Request) {
    const body = await request.json();
    const { name, type, color, userId }: { name: string; type: TransactionType, color: string, userId: string } = body;

    if (!name || !type || !color || !userId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        const userResult = await execute(
            "SELECT id FROM User WHERE id = ?",
            [userId]
        );
        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
    } catch (error: any) {
        console.error("Error finding user:", error);
        return NextResponse.json({ error: "Error finding user" }, { status: 500 });
    }

    try {
        const id = crypto.randomUUID();
        await execute(
            "INSERT INTO Category (id, name, type, color, userId) VALUES (?, ?, ?, ?, ?)",
            [id, name, type, color, userId]
        );
        const category = { id, name, type, color, userId };
        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}