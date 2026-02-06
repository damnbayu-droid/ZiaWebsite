-- Zia Arena: Gamification System Schema

-- 1. Arena Categories/Games
CREATE TABLE IF NOT EXISTS public.arenas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Lucide icon name
    slug TEXT UNIQUE NOT NULL, -- 'english-duel', 'cerdas-cermat'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bank Soal (Question Bank)
CREATE TABLE IF NOT EXISTS public.arena_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings ["A", "B", "C", "D"]
    correct_answer TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    points INTEGER DEFAULT 10,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Player Stats & Achievements
CREATE TABLE IF NOT EXISTS public.arena_profiles (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    total_xp INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    rank_title TEXT DEFAULT 'Pemula',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. High Scores / Leaderboards
CREATE TABLE IF NOT EXISTS public.arena_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    xp_gained INTEGER NOT NULL,
    achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Zia Arena
ALTER TABLE public.arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read arenas" ON public.arenas FOR SELECT USING (active = true);
CREATE POLICY "Public read questions" ON public.arena_questions FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON public.arena_profiles FOR SELECT USING (true);
CREATE POLICY "Public read scores" ON public.arena_scores FOR SELECT USING (true);

-- Insert Initial Arenas
INSERT INTO public.arenas (name, description, icon, slug)
VALUES 
('English Duel', 'Duel kosakata dan grammar Bahasa Inggris tingkat SMA.', 'Zap', 'english-duel'),
('Cerdas Cermat', 'Asah wawasan kebangsaan dan pengetahuan umum Indonesia.', 'Trophy', 'cerdas-cermat')
ON CONFLICT (slug) DO NOTHING;
