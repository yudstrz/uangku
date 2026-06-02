import { initializeSchema } from './schema';

async function run() {
    console.log('Initializing database schema...');
    try {
        await initializeSchema();
        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

run();
