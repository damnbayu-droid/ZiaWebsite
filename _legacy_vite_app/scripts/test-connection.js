import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Simple .env parser since we might not have dotenv
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env.local:', e.message);
        return {};
    }
}

async function testConnection() {
    console.log('Testing Supabase Connection...');
    const env = loadEnv();

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
        process.exit(1);
    }

    console.log(`URL: ${supabaseUrl}`);
    // hide key log
    console.log(`Key: ${supabaseKey.substring(0, 10)}...`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            if (error.code === 'PGRST116') {
                console.log('   (This might be because the table "profiles" does not exist yet. Please run the SQL setup.)');
            }
        } else {
            console.log('✅ Connection Successful!');
            console.log('✅ "profiles" table is accessible.');
        }

        // Check Auth service status (indirectly)
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
            console.error('❌ Auth Service Error:', authError.message);
        } else {
            console.log('✅ Auth Service is responding.');
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
