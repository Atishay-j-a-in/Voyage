import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
// import * as schema from './schema'; 

// 1. Cache the Pool instead of the Drizzle instance
const globalForDb = globalThis as unknown as { 
  pool: Pool | undefined 
};

// 2. Instantiate or reuse the Pool
export const pool = globalForDb.pool ?? new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// 3. Save the Pool globally in development
if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

// 4. Wrap the pool in Drizzle (optionally passing in your schema)
export const db = drizzle(pool);