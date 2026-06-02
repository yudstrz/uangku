import { execute } from "@/lib/turso";
import { TransactionType } from "@/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();
    const { id, name, type, color, userId }: { id: string; name: string; type: TransactionType; color: string, userId: string } = body;

    if (!id || !name || !type || !color|| !userId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        await execute(
            "UPDATE Category SET name = ?, type = ?, color = ? WHERE id = ?",
            [name, type, color, id]
        );
        const category = { id, name, type, color, userId };
        return NextResponse.json(category, { status: 200 });
    } catch (error: any) {
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}