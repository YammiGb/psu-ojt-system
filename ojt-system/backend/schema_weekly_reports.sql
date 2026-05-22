-- ─────────────────────────────────────────────────────────────────
-- WEEKLY REPORTS
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weekly_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id        UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    week_number         INTEGER NOT NULL CHECK (week_number > 0),
    week_start          DATE NOT NULL,
    week_end            DATE NOT NULL,
    accomplishments     TEXT NOT NULL,
    challenges          TEXT,
    learnings           TEXT,
    file_url            TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'submitted'
                            CHECK (status IN ('submitted', 'acknowledged', 'returned')),
    coordinator_remarks TEXT,
    acknowledged_by     UUID REFERENCES users(id),
    acknowledged_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    -- One report per week per placement
    UNIQUE(placement_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_placement ON weekly_reports(placement_id);
CREATE INDEX IF NOT EXISTS idx_weekly_student   ON weekly_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_weekly_status    ON weekly_reports(status);
