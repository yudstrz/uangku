import { requireAuth } from "@/lib/auth";
import { execute, batch } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    const token = await requireAuth(req)
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string }

    try {
        const userResult = await execute(
            "SELECT id FROM User WHERE id = ?",
            [userId]
        );
        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }


    try {
        // Delete in proper order to respect foreign key constraints
        await batch([
            { sql: "DELETE FROM Budget WHERE userId = ?", args: [userId] },
            { sql: "DELETE FROM Transactions WHERE userId = ?", args: [userId] },
            { sql: "DELETE FROM Category WHERE userId = ?", args: [userId] },
            { sql: "DELETE FROM Account WHERE userId = ?", args: [userId] },
            { sql: "DELETE FROM PasswordResetToken WHERE userId = ?", args: [userId] },
            { sql: "DELETE FROM User WHERE id = ?", args: [userId] },
        ]);
        return NextResponse.json({ message: "User deleted successfully." })
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}