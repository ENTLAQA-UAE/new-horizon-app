-- AI Talent Hub: Allow pool recommendations (candidates without applications)
-- Make application_id nullable and update constraint for talent pool scanning

-- Drop the existing unique constraint on application_id
ALTER TABLE candidate_ai_screening DROP CONSTRAINT IF EXISTS candidate_ai_screening_application_id_key;

-- Make application_id nullable (pool recommendations don't have applications yet)
ALTER TABLE candidate_ai_screening ALTER COLUMN application_id DROP NOT NULL;

-- Add a new unique constraint: one screening per candidate per job (covers both pool and application scenarios)
ALTER TABLE candidate_ai_screening ADD CONSTRAINT candidate_ai_screening_job_candidate_unique UNIQUE (job_id, candidate_id);

-- Add source column to distinguish pool recommendations from application screenings
ALTER TABLE candidate_ai_screening ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'application' CHECK (source IN ('application', 'talent_pool'));

-- Add index for efficient talent pool queries
CREATE INDEX IF NOT EXISTS idx_candidate_ai_screening_source ON candidate_ai_screening (source, job_id) WHERE source = 'talent_pool';
CREATE INDEX IF NOT EXISTS idx_candidate_ai_screening_job_recommendation ON candidate_ai_screening (job_id, recommendation, overall_score DESC);
