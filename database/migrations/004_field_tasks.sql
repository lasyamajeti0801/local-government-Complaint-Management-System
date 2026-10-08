-- =============================================================
-- NAGAR CONNECT — MEMBER 4: FIELD OPERATIONS MIGRATION
-- Migration: 004_field_tasks.sql
-- Extends: complaints, complaint_assignments, complaint_evidence
--          complaint_status_history (created by M1/M2/M3)
-- =============================================================

-- ─────────────────────────────────────────
-- TABLE: field_tasks
-- One field task per complaint assignment
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS field_tasks (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id            UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    assignment_id           UUID REFERENCES complaint_assignments(id) ON DELETE SET NULL,
    field_staff_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_by             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- Officer user id

    -- Task lifecycle status
    status                  VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED'
                            CHECK (status IN (
                                'ASSIGNED',
                                'ACCEPTED',
                                'ARRIVED',
                                'IN_PROGRESS',
                                'WORK_COMPLETED',
                                'RESOLUTION_SUBMITTED',
                                'CANNOT_RESOLVE',
                                'NEEDS_ESCALATION'
                            )),

    -- Lifecycle timestamps
    assigned_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at             TIMESTAMPTZ,
    arrived_at              TIMESTAMPTZ,
    started_at              TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    resolution_submitted_at TIMESTAMPTZ,

    -- SLA reference (mirrors complaint SLA deadline)
    sla_deadline            TIMESTAMPTZ,

    -- Work content
    work_notes              TEXT,                   -- running notes during work
    work_description        TEXT,                   -- structured description before completion
    resolution_notes        TEXT,                   -- final resolution summary

    -- Cannot resolve / escalation
    cannot_resolve_reason   TEXT,
    escalation_reason       TEXT,
    escalation_notes        TEXT,

    -- Soft delete / audit
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_field_tasks_complaint_id    ON field_tasks(complaint_id);
CREATE INDEX IF NOT EXISTS idx_field_tasks_field_staff_id  ON field_tasks(field_staff_id);
CREATE INDEX IF NOT EXISTS idx_field_tasks_assigned_by     ON field_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_field_tasks_status          ON field_tasks(status);
CREATE INDEX IF NOT EXISTS idx_field_tasks_assigned_at     ON field_tasks(assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_tasks_sla_deadline    ON field_tasks(sla_deadline);

-- ─────────────────────────────────────────
-- TABLE: field_task_status_history
-- Audit every status change on a field task
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS field_task_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_task_id   UUID NOT NULL REFERENCES field_tasks(id) ON DELETE CASCADE,
    from_status     VARCHAR(30),
    to_status       VARCHAR(30) NOT NULL,
    changed_by      UUID NOT NULL REFERENCES users(id),
    reason          TEXT,
    notes           TEXT,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ftsh_field_task_id ON field_task_status_history(field_task_id);
CREATE INDEX IF NOT EXISTS idx_ftsh_changed_at    ON field_task_status_history(changed_at DESC);

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at on field_tasks
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_field_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_field_tasks_updated_at ON field_tasks;
CREATE TRIGGER trg_field_tasks_updated_at
    BEFORE UPDATE ON field_tasks
    FOR EACH ROW EXECUTE FUNCTION update_field_tasks_updated_at();

-- ─────────────────────────────────────────
-- EXTEND complaint_evidence for field types
-- Adds evidence_category if not present
-- (existing complaint_evidence table from M2)
-- ─────────────────────────────────────────
DO $$
BEGIN
    -- Add evidence_category column if not already present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'complaint_evidence'
          AND column_name = 'evidence_category'
    ) THEN
        ALTER TABLE complaint_evidence
            ADD COLUMN evidence_category VARCHAR(30) DEFAULT 'GENERAL'
            CHECK (evidence_category IN (
                'GENERAL',
                'BEFORE_PHOTO',
                'AFTER_PHOTO',
                'FIELD_DOCUMENT',
                'FIELD_NOTES',
                'CITIZEN_UPLOAD',
                'OTHER'
            ));
    END IF;

    -- Add field_task_id foreign key if not present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'complaint_evidence'
          AND column_name = 'field_task_id'
    ) THEN
        ALTER TABLE complaint_evidence
            ADD COLUMN field_task_id UUID REFERENCES field_tasks(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Index on new field_task_id column
CREATE INDEX IF NOT EXISTS idx_complaint_evidence_field_task_id
    ON complaint_evidence(field_task_id);

-- ─────────────────────────────────────────
-- EXTEND complaint_status_history
-- Add source tracking (FIELD / OFFICER / SYSTEM / CITIZEN)
-- ─────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'complaint_status_history'
          AND column_name = 'source'
    ) THEN
        ALTER TABLE complaint_status_history
            ADD COLUMN source VARCHAR(20) DEFAULT 'SYSTEM'
            CHECK (source IN ('CITIZEN','OFFICER','FIELD','SYSTEM','ADMIN'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'complaint_status_history'
          AND column_name = 'field_task_id'
    ) THEN
        ALTER TABLE complaint_status_history
            ADD COLUMN field_task_id UUID REFERENCES field_tasks(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ─────────────────────────────────────────
-- EXTEND escalations table for field-origin
-- ─────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'escalations'
          AND column_name = 'field_task_id'
    ) THEN
        ALTER TABLE escalations
            ADD COLUMN field_task_id UUID REFERENCES field_tasks(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'escalations'
          AND column_name = 'origin'
    ) THEN
        ALTER TABLE escalations
            ADD COLUMN origin VARCHAR(20) DEFAULT 'OFFICER'
            CHECK (origin IN ('OFFICER','FIELD','SYSTEM','CITIZEN'));
    END IF;
END $$;

-- ─────────────────────────────────────────
-- SEED: allowed evidence types comment
-- ─────────────────────────────────────────
COMMENT ON TABLE field_tasks IS
    'Member 4 — Field Operations. One task per complaint assignment. Tracks field staff lifecycle from ASSIGNED through RESOLUTION_SUBMITTED.';

COMMENT ON TABLE field_task_status_history IS
    'Audit log for every status transition on a field_task row.';
