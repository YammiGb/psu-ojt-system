-- ─────────────────────────────────────────────────────────────────
-- EVALUATIONS & GRADE ENGINE
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evaluations (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id     UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    evaluator_type   VARCHAR(20) NOT NULL CHECK (evaluator_type IN ('supervisor', 'coordinator')),
    period           VARCHAR(10) NOT NULL CHECK (period IN ('midterm', 'final')),
    technical_skills NUMERIC(5,2),
    work_attitude    NUMERIC(5,2),
    punctuality      NUMERIC(5,2),
    communication    NUMERIC(5,2),
    initiative       NUMERIC(5,2),
    overall_score    NUMERIC(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    remarks          TEXT,
    submitted_by     UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),

    -- One eval per type per period per placement
    UNIQUE(placement_id, evaluator_type, period)
);

-- Computed grades per placement (auto-updated by backend)
CREATE TABLE IF NOT EXISTS ojt_grades (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id              UUID NOT NULL UNIQUE REFERENCES placements(id) ON DELETE CASCADE,
    supervisor_midterm_score  NUMERIC(5,2),
    supervisor_final_score    NUMERIC(5,2),
    supervisor_average        NUMERIC(5,2),
    coordinator_midterm_score NUMERIC(5,2),
    coordinator_final_score   NUMERIC(5,2),
    coordinator_average       NUMERIC(5,2),
    final_grade               NUMERIC(5,2),
    portfolio_submitted       BOOLEAN DEFAULT FALSE,
    portfolio_url             TEXT,
    narrative_report_submitted BOOLEAN DEFAULT FALSE,
    narrative_report_url      TEXT,
    computed_at               TIMESTAMPTZ,
    created_at                TIMESTAMPTZ DEFAULT NOW(),
    updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Intervention / remedial cases
CREATE TABLE IF NOT EXISTS interventions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id      UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    intervention_type VARCHAR(30) NOT NULL
                          CHECK (intervention_type IN ('company_counseling','school_pullout','monitoring_visit','other')),
    description       TEXT NOT NULL,
    follow_up_date    DATE,
    status            VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','resolved')),
    outcome           TEXT,
    logged_by         UUID REFERENCES users(id),
    resolved_by       UUID REFERENCES users(id),
    resolved_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_placement ON evaluations(placement_id);
CREATE INDEX IF NOT EXISTS idx_grades_placement ON ojt_grades(placement_id);
CREATE INDEX IF NOT EXISTS idx_interventions_placement ON interventions(placement_id);
