import { execute } from "@/lib/turso";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
    const { password, token } = await request.json();

    if (!password || !token) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tokenResult = await execute(
        `SELECT prt.id as tokenId, prt.token, prt.userId, prt.expiresAt, prt.createdAt,
                u.id as uid, u.name, u.email, u.password as userPassword
         FROM PasswordResetToken prt
         JOIN User u ON prt.userId = u.id
         WHERE prt.token = ?`,
        [token]
    );

    const resetToken = tokenResult.rows[0];

    if (!resetToken) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (new Date(resetToken.expiresAt as string) < new Date()) {
        await execute(
            "DELETE FROM PasswordResetToken WHERE id = ?",
            [resetToken.tokenId as string]
        );
        return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await execute(
        "UPDATE User SET password = ?, updatedAt = ? WHERE id = ?",
        [hashedPassword, new Date().toISOString(), resetToken.userId as string]
    );

    await execute(
        "DELETE FROM PasswordResetToken WHERE id = ?",
        [resetToken.tokenId as string]
    );

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
}