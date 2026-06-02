import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/turso";
import { requireAuth } from "@/lib/auth";

export async function GET(req:NextRequest) {
    const token = await requireAuth(req);
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string };
    try {
        const result = await execute(
            "SELECT * FROM Category WHERE userId = ?",
            [userId]
        );
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}