import { db } from './turso';

/**
 * DDL statements to initialize all tables if they don't exist.
 * Safe to run multiple times (uses IF NOT EXISTS).
 */
const SCHEMA_STATEMENTS = [
    `CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        preferredCurrency TEXT NOT NULL DEFAULT 'IDR',
        isDarkMode INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS Category (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id)
    )`,
    `CREATE TABLE IF NOT EXISTS Account (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id)
    )`,
    `CREATE TABLE IF NOT EXISTS Transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        accountId TEXT NOT NULL,
        userId TEXT NOT NULL,
        notes TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id),
        FOREIGN KEY (categoryId) REFERENCES Category(id),
        FOREIGN KEY (accountId) REFERENCES Account(id)
    )`,
    `CREATE TABLE IF NOT EXISTS PasswordResetToken (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        userId TEXT NOT NULL UNIQUE,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_password_reset_token ON PasswordResetToken(token)`,
    `CREATE TABLE IF NOT EXISTS Budget (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        amount REAL NOT NULL,
        month TEXT NOT NULL,
        spent REAL NOT NULL DEFAULT 0,
        isDailyLimitEnabled INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (userId) REFERENCES User(id),
        FOREIGN KEY (categoryId) REFERENCES Category(id)
    )`,
    `CREATE TABLE IF NOT EXISTS Wishlist (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        link TEXT,
        userId TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id)
    )`,
];

/**
 * Initialize the database schema. Safe to call multiple times.
 */
export async function initializeSchema() {
    for (const stmt of SCHEMA_STATEMENTS) {
        await db.execute(stmt);
    }
    
    // Migration: Add image column to User table if it doesn't exist
    try {
        await db.execute("ALTER TABLE User ADD COLUMN image TEXT");
        console.log("Migration: Added 'image' column to 'User' table.");
    } catch (error: any) {
        // SQLite will throw error if column already exists
        const errMsg = error?.message || "";
        if (!errMsg.includes("duplicate column") && !errMsg.includes("already exists")) {
            console.warn("Migration notice: failed to add 'image' column:", errMsg);
        }
    }
    
    // Migration: Add isDailyLimitEnabled column to Budget table
    try {
        await db.execute("ALTER TABLE Budget ADD COLUMN isDailyLimitEnabled INTEGER DEFAULT 1");
        console.log("Migration: Added 'isDailyLimitEnabled' column to 'Budget' table.");
    } catch (error: any) {
        const errMsg = error?.message || "";
        if (!errMsg.includes("duplicate column") && !errMsg.includes("already exists")) {
            console.warn("Migration notice: failed to add 'isDailyLimitEnabled' column:", errMsg);
        }
    }
    
    console.log('Database schema initialized successfully.');
}
