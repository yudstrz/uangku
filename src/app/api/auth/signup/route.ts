import bcrypt from "bcryptjs";
import { execute } from "@/lib/turso";
import { initializeSchema } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

let schemaInitialized = false;

async function ensureSchema() {
    if (!schemaInitialized) {
        await initializeSchema();
        schemaInitialized = true;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
        }

        // Ensure database schema exists
        await ensureSchema();

        const existingResult = await execute(
            "SELECT id FROM User WHERE email = ?",
            [email]
        );
        if (existingResult.rows.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await execute(
            "INSERT INTO User (id, name, email, password, preferredCurrency, isDarkMode, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'IDR', 0, ?, ?)",
            [id, name, email, hashedPassword, now, now]
        );

        return NextResponse.json({ message: 'User created successfully', email }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}