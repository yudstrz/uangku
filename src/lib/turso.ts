import { createClient, type Client, type InStatement, type Transaction } from '@libsql/client';

const globalForTurso = global as unknown as {
    turso: Client;
};

function getClient(): Client {
    if (globalForTurso.turso) {
        return globalForTurso.turso;
    }

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    if (process.env.NODE_ENV !== "production") {
        globalForTurso.turso = client;
    }

    return client;
}

export const db = getClient();

/**
 * Execute a single SQL statement.
 */
export async function execute(sql: string, args?: Record<string, unknown> | unknown[]) {
    return db.execute({ sql, args: args as any });
}

/**
 * Execute multiple SQL statements in a batch (atomic).
 * Replacement for Prisma's `$transaction([...])` (array form).
 */
export async function batch(stmts: InStatement[]) {
    return db.batch(stmts, "write");
}

/**
 * Execute an interactive transaction.
 * Replacement for Prisma's `$transaction(async (prisma) => {...})` (callback form).
 */
export async function transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    const tx = await db.transaction("write");
    try {
        const result = await fn(tx);
        await tx.commit();
        return result;
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}
