import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/turso";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const token = await requireAuth(req);
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string };

    try {
        const body = await req.json();
        const { name, price, link } = body;

        if (!name || price === undefined) {
            return NextResponse.json(
                { error: "Name and price are required" },
                { status: 400 }
            );
        }

        const id = crypto.randomUUID();

        await execute(
            "INSERT INTO Wishlist (id, name, price, link, userId) VALUES (?, ?, ?, ?, ?)",
            [id, name, price, link || null, userId]
        );

        return NextResponse.json(
            { message: "Wishlist item added successfully", id },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error adding wishlist item:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
