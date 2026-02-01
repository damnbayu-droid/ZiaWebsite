const { Client } = require('pg');

const connectionString = "postgresql://postgres.hlsupdlvszbinfoeltnj:%40LacunaCoilflames@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function fix() {
    try {
        await client.connect();
        console.log('🔌 Connected to Supabase...');

        // 1. Profiles Columns Cleanup
        console.log('🛠️ Ensuring Profile columns exist...');
        await client.query(`
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school TEXT;
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade TEXT;
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_place TEXT;
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';
        `);

        // 2. Schools Table
        console.log('🛠️ Creating Schools table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.schools (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                address TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            INSERT INTO public.schools (name) VALUES ('SMAN 1 Kotabunan'), ('SMKN 1 Tutuyan') ON CONFLICT DO NOTHING;
        `);

        // 3. Classes and Members
        console.log('🛠️ Creating Classes and Members tables...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.classes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
                name TEXT NOT NULL,
                code TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS public.class_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
                user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
                role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
                joined_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(class_id, user_id)
            );
        `);

        // 4. Assignments & Submissions
        console.log('🛠️ Creating Assignments and Submissions tables...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.assignments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                due_date TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS public.submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
                user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
                content TEXT,
                grade DECIMAL,
                feedback TEXT,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'graded', 'late')),
                submitted_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(assignment_id, user_id)
            );
        `);

        // 5. Activity Logs
        console.log('🛠️ Creating Activity Logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES public.profiles(id),
                action TEXT NOT NULL,
                details JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // RLS Logic - Simplified for Broad Access
        console.log('🔓 Applying RLS and broad policies...');
        const tables = ['schools', 'classes', 'class_members', 'assignments', 'submissions', 'activity_logs'];
        for (const t of tables) {
            await client.query(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`).catch(() => { });
            await client.query(`DROP POLICY IF EXISTS "${t}_universal_access" ON public.${t};`).catch(() => { });
            await client.query(`CREATE POLICY "${t}_universal_access" ON public.${t} FOR ALL TO authenticated USING (true) WITH CHECK (true);`);
        }

        console.log('✅ DATABASE FULLY RECONSTRUCTED.');
    } catch (e) {
        console.error('❌ Error Reconstruction:', e);
    } finally {
        await client.end();
    }
}
fix();
