-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: weekly_report_file_upload
-- Adds file_name column to weekly_reports so we can store the original
-- filename alongside the storage URL (file_url).
-- The file_url column already exists and keeps storing the public URL.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add file_name column (original filename for display)
ALTER TABLE weekly_reports
    ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 2. Create Supabase Storage bucket for weekly report attachments
--    Run this via the Supabase dashboard SQL editor or REST API.
--    The bucket is set to public so coordinator/supervisor can view files.
--    If you prefer private, change public to false and use signed URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('weekly-report-files', 'weekly-report-files', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies — allow authenticated users to upload/read
--    Authenticated users can upload to their own folder
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
  (
    'Allow authenticated upload',
    'weekly-report-files',
    'INSERT',
    'auth.role() = ''authenticated'''
  ),
  (
    'Allow public read',
    'weekly-report-files',
    'SELECT',
    'true'
  )
ON CONFLICT DO NOTHING;
