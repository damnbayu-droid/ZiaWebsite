const { Client } = require('pg');

const connectionString = "postgresql://postgres.hlsupdlvszbinfoeltnj:%40LacunaCoilflames@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function debugRecursion() {
    try {
        await client.connect();

        console.log('--- Current Policies on profiles table ---');
        const policies = await client.query(`
            SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'profiles';
        `);
        console.table(policies.rows);

        console.log('\n--- Admin Status Check ---');
        const admins = await client.query(`
            SELECT id, email, role, is_verified 
            FROM public.profiles 
            WHERE role = 'admin' OR email = 'damnbayu@gmail.com';
        `);
        console.table(admins.rows);

        console.log('\n--- Trigger Check ---');
        const triggers = await client.query(`
            SELECT trigger_name, event_manipulation, event_object_table, action_statement 
            FROM information_schema.triggers 
            WHERE event_object_table = 'profiles' OR event_object_table = 'users';
        `);
        console.table(triggers.rows);

    } catch (e) {
        console.error('Error debugging:', e);
    } finally {
        await client.end();
    }
}

debugRecursion();
