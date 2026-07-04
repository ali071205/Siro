-- ─────────────────────────────────────────────────────────
--  GHOST PROTOCOL v5.0 — Authentication Trigger
--  Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────

-- 1. Ensure the required columns exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- 1.5 Create a debug logs table to catch exactly what fails
CREATE TABLE IF NOT EXISTS public.auth_debug_logs (
    id SERIAL PRIMARY KEY,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create a function that automatically populates the user_profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, credits, created_at, preferences)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Agent ' || substr(new.id::text, 1, 8)),
    10, -- Default free credits
    now(),
    '{
        "llm": {
            "primary_engine": "groq|llama-3.1-8b-instant",
            "secondary_engine": "groq|llama-3.1-8b-instant"
        },
        "scoring": {
            "target_roles": [],
            "telegram_threshold": 75,
            "blacklist_companies": [],
            "blacklist_keywords": []
        },
        "notifications": {
            "instant_telegram_alerts": true,
            "daily_digest": true
        }
    }'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Catch the exact error and log it to auth_debug_logs so we can read it
  INSERT INTO public.auth_debug_logs (error_message) VALUES (SQLERRM);
  RETURN new; -- Always return new so the user is at least allowed to log in!
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the trigger to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Ensure users can only read/update their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);
