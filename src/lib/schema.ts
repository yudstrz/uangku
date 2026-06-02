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
        preferredCurrency TEXT NOT NULL DEFAULT 'LKR',
        isDarkMode INTEGER NOT NULL DEFAULT 0,
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
        FOREIGN KEY (userId) REFERENCES User(id),
        FOREIGN KEY (categoryId) REFERENCES Category(id)
    )`,
];

/**
 * Initialize the database schema. Safe to call multiple times.
 */
export async function initializeSchema() {
    for (const stmt of SCHEMA_STATEMENTS) {
        await db.execute(stmt);
    }
    console.log('Database schema initialized successfully.');
}
