-- Add screening_data JSONB column to store full AI screening results
-- This allows the complete AI analysis to be persisted and retrieved

ALTER TABLE candidate_ai_screening
ADD COLUMN IF NOT EXISTS screening_data JSONB;

-- Add a comment explaining the column
COMMENT ON COLUMN candidate_ai_screening.screening_data IS
'Full AI screening result JSON including all analysis details (matched skills, missing skills, experience analysis, cultural fit, interview focus areas, etc.)';
