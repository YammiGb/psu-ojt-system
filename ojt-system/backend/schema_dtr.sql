-- ─────────────────────────────────────────────────────────────────
-- DTR / HOURS TRACKING
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dtr_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id    UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL,
    time_in         TIME,
    time_out        TIME,
    hours_rendered  NUMERIC(5,2) NOT NULL DEFAULT 0,
    dtr_type        VARCHAR(20) NOT NULL DEFAULT 'manual'
                        CHECK (dtr_type IN ('manual','biometric','school_dtr')),
    remarks         TEXT,
    verified        BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by     UUID REFERENCES users(id),
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate entries for same day
    UNIQUE(placement_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_dtr_placement ON dtr_logs(placement_id);
CREATE INDEX IF NOT EXISTS idx_dtr_student   ON dtr_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_dtr_date      ON dtr_logs(log_date);
