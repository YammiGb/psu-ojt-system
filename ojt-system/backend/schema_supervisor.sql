-- Add supervisor_user_id to companies so supervisors are linked to their company
-- Run in Supabase SQL Editor

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS supervisor_user_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_companies_supervisor ON companies(supervisor_user_id);
