import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = await requireAuth(req)
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string }

    try {
        const result = await execute(
            "SELECT * FROM User WHERE id = ?",
            [userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const user = result.rows[0];
        // Convert isDarkMode from integer to boolean for consistency
        return NextResponse.json({
            ...user,
            isDarkMode: Boolean(user.isDarkMode)
        }, { status: 200 });
    } catch (error: any) {
        console.error(error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}