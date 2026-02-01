const { Client } = require('pg');

const connectionString = "postgresql://postgres.hlsupdlvszbinfoeltnj:%40LacunaCoilflames@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkSchema() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles';
        `);
        console.log('Columns in profiles table:');
        console.table(res.rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

checkSchema();
