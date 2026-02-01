const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Hardcoded from .env.local view
const DATABASE_URL = "postgresql://postgres.hlsupdlvszbinfoeltnj:%40LacunaCoilflames@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function applySchema() {
    console.log('Connecting to database...');
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Read schema file
        const schemaPath = path.join(__dirname, '../supabase/storage_fix.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema...');

        // Split by statement if needed, but client.query usually handles valid SQL blocks
        // However, for complex scripts with mixed transactions/commands, simple query might fail on some drivers.
        // 'pg' usually handles multiple statements if they are standard SQL.

        await client.query(sql);

        console.log('Schema applied successfully!');
    } catch (err) {
        console.error('Error applying schema:', err);
    } finally {
        await client.end();
    }
}

applySchema();
