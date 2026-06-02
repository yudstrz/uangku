import bcrypt from "bcrypt";
import { execute } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingResult = await execute(
        "SELECT id FROM User WHERE email = ?",
        [email]
    );
    if (existingResult.rows.length > 0) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await execute(
            "INSERT INTO User (id, name, email, password, preferredCurrency, isDarkMode, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'LKR', 0, ?, ?)",
            [id, name, email, hashedPassword, now, now]
        );

        return NextResponse.json({ message: 'User created successfully', email }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}