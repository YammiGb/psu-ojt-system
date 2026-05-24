-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: moa_files_upload
-- Adds document_name column to moa_requests so we can store the original
-- filename alongside the storage URL (document_url).
-- Creates Supabase storage bucket 'moa-documents' and sets up RLS policies.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add document_name column (original filename for display)
ALTER TABLE moa_requests
    ADD COLUMN IF NOT EXISTS document_name TEXT;

-- 2. Create Supabase Storage bucket for MOA document attachments
--    The bucket is set to public so coordinator/signatories can view files.
INSERT INTO storage.buckets (id, name, public)
VALUES ('moa-documents', 'moa-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies — allow authenticated users to upload/read
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
  (
    'Allow authenticated upload for MOA documents',
    'moa-documents',
    'INSERT',
    'auth.role() = ''authenticated'''
  ),
  (
    'Allow public read for MOA documents',
    'moa-documents',
    'SELECT',
    'true'
  )
ON CONFLICT DO NOTHING;
