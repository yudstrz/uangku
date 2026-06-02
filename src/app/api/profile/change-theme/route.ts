import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    const token = await requireAuth(req)
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string }
    const body = await req.json()
    const { isDarkMode }: { isDarkMode: boolean } = body;

    try {
        const userResult = await execute(
            "SELECT id FROM User WHERE id = ?",
            [userId]
        );
        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        await execute(
            "UPDATE User SET isDarkMode = ?, updatedAt = ? WHERE id = ?",
            [isDarkMode ? 1 : 0, new Date().toISOString(), userId]
        );

        return NextResponse.json({ message: "Theme updated successfully" }, { status: 200 })
    } catch (error: any) {
        console.error(error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }

}