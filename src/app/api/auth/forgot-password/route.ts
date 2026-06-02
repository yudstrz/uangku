import { sendPasswordResetEmail } from "@/lib/email";
import { execute } from "@/lib/turso";
import { randomBytes, randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { email } = await request.json();

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const userResult = await execute(
        "SELECT * FROM User WHERE email = ?",
        [email]
    );
    const user = userResult.rows[0];

    if (!user) {
        return NextResponse.json({ error: "If an account exists with this email, a reset link has been sent" }, { status: 404 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // Token expires in 1 hour

    // Upsert: delete existing token for this user, then insert new one
    const existingToken = await execute(
        "SELECT id FROM PasswordResetToken WHERE userId = ?",
        [user.id as string]
    );

    if (existingToken.rows.length > 0) {
        await execute(
            "UPDATE PasswordResetToken SET token = ?, expiresAt = ?, createdAt = ? WHERE userId = ?",
            [token, expiresAt, new Date().toISOString(), user.id as string]
        );
    } else {
        const id = randomUUID();
        await execute(
            "INSERT INTO PasswordResetToken (id, token, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)",
            [id, token, user.id as string, expiresAt, new Date().toISOString()]
        );
    }

    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
    //send mail
    const response = await sendPasswordResetEmail(email, resetLink) as any;
    console.log(response);
    if (!response) {
        return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Password reset link sent to your email" }, { status: 200 });
}