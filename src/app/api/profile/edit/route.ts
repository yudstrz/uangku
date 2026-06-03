import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const token = await requireAuth(req)
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string }
    const body = await req.json()
    const { name, image }: { name: string; image?: string | null } = body;

    try {
        const userResult = await execute(
            "SELECT id FROM User WHERE id = ?",
            [userId]
        );
        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        if (image !== undefined) {
            await execute(
                "UPDATE User SET name = ?, image = ?, updatedAt = ? WHERE id = ?",
                [name, image, new Date().toISOString(), userId]
            );
        } else {
            await execute(
                "UPDATE User SET name = ?, updatedAt = ? WHERE id = ?",
                [name, new Date().toISOString(), userId]
            );
        }
        return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 })
    } catch (error: any) {
        console.error(error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }

}


