-- ─────────────────────────────────────────────────────────
--  GHOST PROTOCOL v4.0 — Global Job Pool Normalization
--  Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────

-- 1. Create the centralized global_jobs table
CREATE TABLE IF NOT EXISTS global_jobs (
    job_id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    url TEXT,
    source TEXT,
    dedup_hash TEXT UNIQUE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on global_jobs (read-only for all authenticated users)
ALTER TABLE global_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS global_jobs_read_policy ON global_jobs;
CREATE POLICY global_jobs_read_policy ON global_jobs
    FOR SELECT USING (auth.role() = 'authenticated');
    
DROP POLICY IF EXISTS global_jobs_insert_policy ON global_jobs;
CREATE POLICY global_jobs_insert_policy ON global_jobs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Migrate existing job data from job_leads into global_jobs
INSERT INTO global_jobs (job_id, company, title, description, location, url, source, dedup_hash)
SELECT DISTINCT ON (job_id) job_id, company, title, raw_description, NULL, job_url, source, dedup_hash
FROM job_leads
ON CONFLICT (job_id) DO NOTHING;

-- 4. Create user_job_pipelines to replace job_leads (as a linking table)
CREATE TABLE IF NOT EXISTS user_job_pipelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES global_jobs(job_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Found',
    match_score NUMERIC DEFAULT 0,
    score_band TEXT,
    notes TEXT,
    resume_url TEXT,
    resume_tailored JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- 5. Migrate user-specific data into user_job_pipelines
INSERT INTO user_job_pipelines (user_id, job_id, status, match_score, score_band, notes, resume_url, created_at)
SELECT user_id, job_id, status, match_score, score_band, notes, resume_url, created_at
FROM job_leads
ON CONFLICT (user_id, job_id) DO NOTHING;

-- 6. Enable RLS on user_job_pipelines
ALTER TABLE user_job_pipelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_job_pipelines_policy ON user_job_pipelines;
CREATE POLICY user_job_pipelines_policy ON user_job_pipelines
    FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- 7. Update delivery_queue, user_feedback, and stage_logs to support multi-tenant and correct type mismatches
ALTER TABLE delivery_queue ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop RLS policies that depend on job_id first so we can alter its type
DROP POLICY IF EXISTS delivery_queue_policy ON delivery_queue;
DROP POLICY IF EXISTS user_feedback_policy ON user_feedback;
DROP POLICY IF EXISTS stage_logs_policy ON stage_logs;

-- Drop old constraints before altering types
ALTER TABLE delivery_queue DROP CONSTRAINT IF EXISTS delivery_queue_job_id_fkey;
ALTER TABLE delivery_queue DROP CONSTRAINT IF EXISTS delivery_queue_job_leads_fkey;
ALTER TABLE user_feedback DROP CONSTRAINT IF EXISTS user_feedback_job_id_fkey;
ALTER TABLE user_feedback DROP CONSTRAINT IF EXISTS user_feedback_job_leads_fkey;
ALTER TABLE stage_logs DROP CONSTRAINT IF EXISTS stage_logs_job_id_fkey;
ALTER TABLE stage_logs DROP CONSTRAINT IF EXISTS stage_logs_job_leads_fkey;

-- Alter job_id column types from UUID to TEXT to match global_jobs(job_id)
ALTER TABLE delivery_queue ALTER COLUMN job_id TYPE TEXT USING job_id::text;
ALTER TABLE user_feedback ALTER COLUMN job_id TYPE TEXT USING job_id::text;
ALTER TABLE stage_logs ALTER COLUMN job_id TYPE TEXT USING job_id::text;

-- Make delivery_queue reference user_job_pipelines
ALTER TABLE delivery_queue DROP CONSTRAINT IF EXISTS delivery_queue_pipeline_fkey;
ALTER TABLE delivery_queue ADD CONSTRAINT delivery_queue_pipeline_fkey FOREIGN KEY (user_id, job_id) REFERENCES user_job_pipelines(user_id, job_id) ON DELETE CASCADE;

-- Recreate RLS policies pointing to the new user_job_pipelines table
CREATE POLICY delivery_queue_policy ON delivery_queue
    FOR ALL USING (
        auth.uid() IS NULL OR
        EXISTS (
            SELECT 1 FROM user_job_pipelines
            WHERE user_job_pipelines.job_id = delivery_queue.job_id
              AND user_job_pipelines.user_id = auth.uid()
        )
    );

CREATE POLICY user_feedback_policy ON user_feedback
    FOR ALL USING (
        auth.uid() IS NULL OR
        EXISTS (
            SELECT 1 FROM user_job_pipelines
            WHERE user_job_pipelines.job_id = user_feedback.job_id
              AND user_job_pipelines.user_id = auth.uid()
        )
    );

CREATE POLICY stage_logs_policy ON stage_logs
    FOR ALL USING (
        auth.uid() IS NULL OR
        EXISTS (
            SELECT 1 FROM user_job_pipelines
            WHERE user_job_pipelines.job_id = stage_logs.job_id
              AND user_job_pipelines.user_id = auth.uid()
        )
    );

-- 8. (Optional but Recommended) Backup and Drop the old job_leads table
-- NOTE: We are renaming job_leads to legacy_job_leads to be safe.
ALTER TABLE job_leads RENAME TO legacy_job_leads;

-- 9. RPC for local search
CREATE OR REPLACE FUNCTION search_global_jobs_for_user(p_user_id UUID, p_query TEXT, p_limit INTEGER DEFAULT 20)
RETURNS SETOF global_jobs AS $$
BEGIN
    RETURN QUERY
    SELECT gj.*
    FROM global_jobs gj
    WHERE (gj.title ILIKE '%' || p_query || '%' OR gj.description ILIKE '%' || p_query || '%')
      AND NOT EXISTS (
          SELECT 1 FROM user_job_pipelines ujp
          WHERE ujp.job_id = gj.job_id AND ujp.user_id = p_user_id
      )
    ORDER BY gj.scraped_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
