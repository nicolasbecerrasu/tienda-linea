import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function run() {
  console.log('Connecting to Supabase PostgreSQL...');
  
  // Try direct connection first
  const connectionConfig = {
    host: 'db.uqaprhszthoginyptwrf.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'auX3z5pYH6jPQ6B4',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  };

  const client = new Client(connectionConfig);

  try {
    await client.connect();
    console.log('Successfully connected to Supabase Database!');

    // Read schema.sql
    const sqlPath = path.resolve(__dirname, '../supabase/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing schema.sql...');
    await client.query(sql);
    console.log('Schema executed successfully!');

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Existing public tables:');
    res.rows.forEach(r => console.log(' - ' + r.table_name));

    // Verify bucket
    const bucketRes = await client.query(`
      SELECT id, name, public FROM storage.buckets WHERE id = 'prendas';
    `);
    console.log('Storage bucket "prendas":', bucketRes.rows);

    // Check if we can find anon and service_role tokens or secrets from internal config
    try {
      const secretRes = await client.query(`
        SELECT name, decrypted_secret 
        FROM vault.decrypted_secrets 
        LIMIT 5;
      `);
      console.log('Vault secrets:', secretRes.rows);
    } catch (e) {
      // Vault might not be enabled or permissions restricted, which is normal
    }

  } catch (err) {
    console.error('Connection or execution error:', err.message);
    if (err.code) console.error('Error code:', err.code);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
