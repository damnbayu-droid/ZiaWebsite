const { Client } = require('pg');

// Connection string from your .env.local
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

        console.log('🛠️ Applying Emergency Fixes...');

        // 1. DROP RECURSIVE POLICIES
        await client.query(`
      DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
      DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
      DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
      DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "identity_read_policy" ON public.student_identity;
      DROP POLICY IF EXISTS "identity_write_policy" ON public.student_identity;
    `);
        console.log('🗑️ Dropped bad policies.');

        // 2. ENABLE SIMPLE ACCESS
        await client.query(`
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "simple_access_profiles" ON public.profiles;
      CREATE POLICY "simple_access_profiles" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');

      ALTER TABLE public.student_identity ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "simple_access_identity" ON public.student_identity;
      CREATE POLICY "simple_access_identity" ON public.student_identity FOR ALL USING (auth.role() = 'authenticated');
    `);
        console.log('jwk🔓 Enabled simple access policies.');

        // 3. SYNC USERS
        const res = await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, is_verified, account_status)
      SELECT id, email, raw_user_meta_data->>'full_name', 'student', false, 'active'
      FROM auth.users
      WHERE id NOT IN (SELECT id FROM public.profiles)
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `);
        console.log(`✨ Synced ${res.rowCount} missing users to Profiles table.`);

        console.log('✅ DATABASE REPAIR COMPLETE.');
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await client.end();
    }
}

runFix();
