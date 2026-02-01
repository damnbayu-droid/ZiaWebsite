const { Client } = require('pg');

const connectionString = "postgresql://postgres.hlsupdlvszbinfoeltnj:%40LacunaCoilflames@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runNuclearFix() {
    try {
        console.log('🔌 Connecting...');
        await client.connect();
        console.log('✅ Connected.');

        // 1. DROP ALL IDENTIFIED POLICIES
        const policies = [
            'Admins can view all profiles',
            'Admins can update all profiles',
            'View Profiles',
            'profiles_universal_policy',
            'profiles_read_policy',
            'profiles_update_policy',
            'profiles_insert_policy',
            'Service Role Insert',
            'Allow authenticated read',
            'simple_access_profiles'
        ];

        console.log('🗑️ Dropping policies...');
        for (const p of policies) {
            await client.query(`DROP POLICY IF EXISTS "${p}" ON public.profiles`).catch(e => console.log(`Error dropping ${p}:`, e.message));
        }

        // 2. RECREATE THE SAFE ADMIN CHECK
        console.log('🛠️ Recreating is_admin function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION public.is_admin()
            RETURNS BOOLEAN
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public
            AS $$
            BEGIN
              -- This subquery is SAFE because it is in a SECURITY DEFINER function
              -- and does not trigger RLS when called from a policy on the same table.
              RETURN EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role = 'admin'
              );
            END;
            $$;
        `);

        // 3. APPLY THE SINGLE CLEAN POLICY
        console.log('🔓 Applying clean policy...');
        await client.query(`
            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "safe_profiles_access" ON public.profiles
            FOR ALL 
            TO authenticated
            USING (
                id = auth.uid() 
                OR 
                public.is_admin()
            );
        `);

        // 4. FIX ADMIN DATA
        console.log('🛡️ Fixing admin profile data...');
        // We know the ID of the admin from debug: 7042e5ac-74fa-4bae-93ae-400c8582b0a3
        // But let's just use email to be sure.
        await client.query(`
            UPDATE public.profiles 
            SET email = 'damnbayu@gmail.com', role = 'admin', is_verified = true 
            WHERE id = '7042e5ac-74fa-4bae-93ae-400c8582b0a3' OR email = 'damnbayu@gmail.com';
        `);

        console.log('✅ NUCLEAR FIX COMPLETE.');
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await client.end();
    }
}

runNuclearFix();
