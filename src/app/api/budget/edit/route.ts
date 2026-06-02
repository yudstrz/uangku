import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/turso";


export async function PUT(req: NextRequest) {
    const token = await requireAuth(req);
    if (token instanceof NextResponse) {
        return token;
    }
    const { id: userId } = token as { id: string };
    const { id, categoryId, amount, month, spent } = await req.json();

    if (!id || !categoryId || !amount || !month || spent === undefined) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    try {
        // 1️⃣ Find existing first
        const existingResult = await execute(
            "SELECT * FROM Budget WHERE id = ?",
            [id]
        );

        if (existingResult.rows.length === 0) {
            return NextResponse.json({ error: "Budget not found" }, { status: 404 });
        }
        const existing = existingResult.rows[0];

        if (existing.userId !== userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }
        
        if (existing.categoryId !== categoryId ||
            existing.month !== month) {
            return NextResponse.json({ 
                error: "Category or month cannot be changed once set" 
            }, { status: 400 });
        }
        
        await execute(
            "UPDATE Budget SET amount = ?, spent = ? WHERE id = ?",
            [amount, spent, id]
        );

        const updated = { ...existing, amount, spent };
        return NextResponse.json({ message: "Budget updated successfully", budget: updated }, { status: 200 });

    } catch (error) {
        console.error("Error updating budget:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

