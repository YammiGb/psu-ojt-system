-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: portfolio_and_narrative_report_files
-- Adds filename columns to ojt_grades for OJT Portfolio and Narrative Report.
-- Creates Supabase storage bucket 'portfolio-files' and sets up RLS policies.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add filename columns to ojt_grades table
ALTER TABLE ojt_grades
    ADD COLUMN IF NOT EXISTS portfolio_file_name TEXT,
    ADD COLUMN IF NOT EXISTS narrative_report_file_name TEXT;

-- 2. Create Supabase Storage bucket for portfolio/narrative report attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-files', 'portfolio-files', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies — allow authenticated users to upload/read
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
  (
    'Allow authenticated upload for portfolio files',
    'portfolio-files',
    'INSERT',
    'auth.role() = ''authenticated'''
  ),
  (
    'Allow public read for portfolio files',
    'portfolio-files',
    'SELECT',
    'true'
  )
ON CONFLICT DO NOTHING;
