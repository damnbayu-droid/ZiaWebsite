const { Client } = require('pg');

const connectionString = "postgresql://postgres.hlsupdlvszbinfoeltnj:%40LacunaCoilflames@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkClasses() {
    try {
        await client.connect();

        console.log('--- Checking classes table ---');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('classes', 'class_members');
        `);
        console.table(tables.rows);

        if (tables.rows.some(r => r.table_name === 'classes')) {
            console.log('\n--- Columns in classes ---');
            const cols = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'classes';
            `);
            console.table(cols.rows);

            console.log('\n--- Policies on classes ---');
            const policies = await client.query(`
                SELECT policyname, qual FROM pg_policies WHERE tablename = 'classes';
            `);
            console.table(policies.rows);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

checkClasses();
