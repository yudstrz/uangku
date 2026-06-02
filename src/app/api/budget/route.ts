import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = await requireAuth(req);
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string };

    try {
        const result = await execute(
            "SELECT * FROM Budget WHERE userId = ?",
            [userId]
        );
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.error("Error fetching transactions:", error);
    }
}