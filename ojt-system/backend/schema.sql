-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────
-- PLACEMENTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    application_id UUID REFERENCES ojt_applications(id) ON DELETE SET NULL,
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    ojt_status VARCHAR(30) DEFAULT 'active' CHECK (ojt_status IN ('active','completed','not_completed','transferred','withdrawn')),
    start_date DATE,
    end_date DATE,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester, academic_year)
);

CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    from_company_id UUID NOT NULL REFERENCES companies(id),
    to_company_id UUID NOT NULL REFERENCES companies(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placements_student ON placements(student_id);
CREATE INDEX IF NOT EXISTS idx_placements_company ON placements(company_id);
CREATE INDEX IF NOT EXISTS idx_placements_status  ON placements(ojt_status);

-- ─────────────────────────────────────────────────────────────────
-- MOA REQUESTS
-- Signing chain: campus_coordinator → ced → lingayen → legal →
--                ojt_director → vp → bordsec → president → signed
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moa_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    initiated_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(40) NOT NULL DEFAULT 'campus_coordinator'
        CHECK (status IN (
            'campus_coordinator','ced','lingayen','legal',
            'ojt_director','vp','bordsec','president',
            'signed','rejected'
        )),
    current_step INTEGER NOT NULL DEFAULT 0 CHECK (current_step BETWEEN 0 AND 8),
    document_url TEXT,
    semester VARCHAR(20),
    academic_year VARCHAR(20),
    rejection_reason TEXT,
    rejected_by UUID REFERENCES users(id),
    rejected_at_step VARCHAR(60),

    -- Per-step audit columns (signed_at + who + optional name + remarks)
    campus_coordinator_signed_at TIMESTAMPTZ,
    campus_coordinator_by UUID REFERENCES users(id),
    campus_coordinator_name VARCHAR(200),
    campus_coordinator_remarks TEXT,

    ced_signed_at TIMESTAMPTZ,
    ced_by UUID REFERENCES users(id),
    ced_name VARCHAR(200),
    ced_remarks TEXT,

    lingayen_signed_at TIMESTAMPTZ,
    lingayen_by UUID REFERENCES users(id),
    lingayen_name VARCHAR(200),
    lingayen_remarks TEXT,

    legal_signed_at TIMESTAMPTZ,
    legal_by UUID REFERENCES users(id),
    legal_name VARCHAR(200),
    legal_remarks TEXT,

    ojt_director_signed_at TIMESTAMPTZ,
    ojt_director_by UUID REFERENCES users(id),
    ojt_director_name VARCHAR(200),
    ojt_director_remarks TEXT,

    vp_signed_at TIMESTAMPTZ,
    vp_by UUID REFERENCES users(id),
    vp_name VARCHAR(200),
    vp_remarks TEXT,

    bordsec_signed_at TIMESTAMPTZ,
    bordsec_by UUID REFERENCES users(id),
    bordsec_name VARCHAR(200),
    bordsec_remarks TEXT,

    president_signed_at TIMESTAMPTZ,
    president_by UUID REFERENCES users(id),
    president_name VARCHAR(200),
    president_remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moa_company  ON moa_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_moa_status   ON moa_requests(status);
CREATE INDEX IF NOT EXISTS idx_moa_semester ON moa_requests(semester);
