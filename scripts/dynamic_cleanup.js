const { Client } = require('pg');

const connectionString = "postgresql://postgres.hlsupdlvszbinfoeltnj:%40LacunaCoilflames@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function dynamicDropAll() {
    try {
        await client.connect();

        // 1. Get all policies
        const res = await client.query(`
            SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
        `);

        const currentPolicies = res.rows.map(r => r.policyname);
        console.log('Current policies:', currentPolicies);

        // 2. Drop them all
        for (const p of currentPolicies) {
            console.log(`🗑️ Dropping ${p}...`);
            await client.query(`DROP POLICY IF EXISTS "${p}" ON public.profiles`);
        }

        // 3. Apply the ONE TRUE POLICY
        console.log('🛠️ Applying safe_profiles_access...');
        await client.query(`
            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "safe_profiles_access" ON public.profiles
            FOR ALL 
            TO authenticated
            USING (
                id = auth.uid() 
                OR 
                (SELECT (role = 'admin') FROM public.profiles WHERE id = auth.uid())
            );
        `);
        // Wait, NO! The line above "(SELECT (role = 'admin') FROM public.profiles WHERE id = auth.uid())" IS RECURSIVE IF DIRECT!
        // It MUST use the SECURITY DEFINER function.

        await client.query(`DROP POLICY IF EXISTS "safe_profiles_access" ON public.profiles`);

        await client.query(`
            CREATE POLICY "safe_profiles_access" ON public.profiles
            FOR ALL 
            TO authenticated
            USING (
                id = auth.uid() 
                OR 
                public.is_admin()
            );
        `);

        console.log('✅ Final cleanup complete.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

dynamicDropAll();
