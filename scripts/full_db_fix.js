const { Client } = require('pg');

const connectionString = "postgresql://postgres.hlsupdlvszbinfoeltnj:%40LacunaCoilflames@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runFix() {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected.');

        console.log('🛠️ Applying Comprehensive Database Fix...');

        // 1. DROP ALL POSSIBLE OLD POLICIES on profiles to stop recursion
        // We will try to drop every policy name we've ever used or seen
        const policiesToDrop = [
            'profiles_read_policy',
            'profiles_update_policy',
            'profiles_insert_policy',
            'Admins can view all profiles',
            'Users can see their own profile',
            'Public profiles are viewable by everyone.',
            'Users can insert their own profile.',
            'Users can update own profile.',
            'Admin can do everything',
            'Allow authenticated read',
            'simple_access_profiles'
        ];

        for (const policy of policiesToDrop) {
            await client.query(`DROP POLICY IF EXISTS "${policy}" ON public.profiles`).catch(() => { });
        }
        console.log('🗑️ Attempted to drop all known policies on profiles.');

        // 2. Create the SAFE admin check function (SECURITY DEFINER)
        await client.query(`
            CREATE OR REPLACE FUNCTION public.is_admin()
            RETURNS BOOLEAN
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public
            AS $$
            BEGIN
              RETURN EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role = 'admin'
              );
            END;
            $$;
        `);
        console.log('✅ Created is_admin function.');

        // 3. Apply a single, robust, NON-RECURSIVE policy
        // If is_admin() is SECURITY DEFINER, it doesn't trigger the policy itself when called, breaking the recursion.
        await client.query(`
            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "profiles_universal_policy" ON public.profiles
            FOR ALL USING (
                auth.uid() = id 
                OR 
                public.is_admin()
            );
        `);
        console.log('🔓 Applied robust profiles_universal_policy.');

        // 4. Fix other tables too
        await client.query(`
            ALTER TABLE public.student_identity ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "identity_read_policy" ON public.student_identity;
            DROP POLICY IF EXISTS "identity_write_policy" ON public.student_identity;
            DROP POLICY IF EXISTS "simple_access_identity" ON public.student_identity;
            
            CREATE POLICY "identity_admin_policy" ON public.student_identity
            FOR ALL USING (public.is_admin() OR user_id = auth.uid());
        `);
        console.log('🔓 Applied student_identity policies.');

        // 5. Fix the Trigger for future users
        await client.query(`
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS TRIGGER 
            LANGUAGE plpgsql
            SECURITY DEFINER 
            SET search_path = public
            AS $$
            BEGIN
              INSERT INTO public.profiles (id, email, full_name, role, is_verified, account_status)
              VALUES (
                new.id,
                new.email,
                COALESCE(new.raw_user_meta_data->>'full_name', 'New Student'),
                'student',
                false,
                'active'
              );
              RETURN new;
            END;
            $$;

            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        `);
        console.log('⚡ Repaired handle_new_user trigger.');

        // 6. SYNC ALL USERS RIGHT NOW (Fix "Data doesn't show up")
        const res = await client.query(`
            INSERT INTO public.profiles (id, email, full_name, role, is_verified, account_status)
            SELECT 
                id, 
                email, 
                COALESCE(raw_user_meta_data->>'full_name', 'Student User'),
                'student',
                false,
                'active'
            FROM auth.users
            WHERE id NOT IN (SELECT id FROM public.profiles)
            ON CONFLICT (id) DO NOTHING
            RETURNING id;
        `);
        console.log(`✨ Synced ${res.rowCount} missing users to profiles table.`);

        // 7. Force specific admin status
        await client.query(`
            UPDATE public.profiles 
            SET role = 'admin', is_verified = true 
            WHERE email = 'damnbayu@gmail.com';
        `);
        console.log('🛡️ Guaranteed admin status for damnbayu@gmail.com.');

        console.log('✅ FULL DATABASE REPAIR COMPLETE.');
    } catch (e) {
        console.error('❌ Error during database fix:', e);
    } finally {
        await client.end();
    }
}

runFix();
