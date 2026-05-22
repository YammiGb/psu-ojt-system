-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS semester_archives (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester     VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    total        INTEGER DEFAULT 0,
    summary      JSONB,
    archived_by  UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(semester, academic_year)
);
