-- =============================================================
-- NAGAR CONNECT — MEMBER 4: FIELD OPERATIONS SEED DATA
-- Seed: 004_seed_field_data.sql
-- Creates realistic demo field tasks for development/testing
-- Uses demo users created by Member 1
-- =============================================================

-- NOTE: This seed assumes the following demo users exist (created by M1):
--   field_staff_1@nagarconnect.gov.in  (FIELD_STAFF role)
--   field_staff_2@nagarconnect.gov.in  (FIELD_STAFF role)
--   officer_1@nagarconnect.gov.in      (OFFICER role)
--
-- And sample complaints exist from M2 seed data.
-- All UUIDs below are resolved via subqueries for portability.

-- ─────────────────────────────────────────
-- Helper: Insert sample field tasks
-- ─────────────────────────────────────────

-- Task 1: ACCEPTED — Road pothole (assigned to field_staff_1)
INSERT INTO field_tasks (
    complaint_id, field_staff_id, assigned_by, status,
    assigned_at, accepted_at, sla_deadline, work_notes
)
SELECT
    c.id,
    fs.id,
    o.id,
    'ACCEPTED',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 45 minutes',
    NOW() + INTERVAL '22 hours',
    'Complaint verified. Heading to site for inspection.'
FROM complaints c
CROSS JOIN (SELECT id FROM users WHERE email = 'field_staff_1@nagarconnect.gov.in' LIMIT 1) fs
CROSS JOIN (SELECT id FROM users WHERE email = 'officer_1@nagarconnect.gov.in' LIMIT 1) o
WHERE c.title ILIKE '%pothole%' OR c.title ILIKE '%road%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Task 2: IN_PROGRESS — Streetlight not working
INSERT INTO field_tasks (
    complaint_id, field_staff_id, assigned_by, status,
    assigned_at, accepted_at, arrived_at, started_at, sla_deadline, work_notes
)
SELECT
    c.id,
    fs.id,
    o.id,
    'IN_PROGRESS',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '3 hours 30 minutes',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours 30 minutes',
    NOW() + INTERVAL '20 hours',
    'Bulb found fused. Replacing with LED. Wiring inspection ongoing.'
FROM complaints c
CROSS JOIN (SELECT id FROM users WHERE email = 'field_staff_1@nagarconnect.gov.in' LIMIT 1) fs
CROSS JOIN (SELECT id FROM users WHERE email = 'officer_1@nagarconnect.gov.in' LIMIT 1) o
WHERE c.title ILIKE '%streetlight%' OR c.title ILIKE '%light%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Task 3: ASSIGNED — Blocked drainage (pending acceptance)
INSERT INTO field_tasks (
    complaint_id, field_staff_id, assigned_by, status,
    assigned_at, sla_deadline
)
SELECT
    c.id,
    fs.id,
    o.id,
    'ASSIGNED',
    NOW() - INTERVAL '30 minutes',
    NOW() + INTERVAL '47 hours 30 minutes'
FROM complaints c
CROSS JOIN (SELECT id FROM users WHERE email = 'field_staff_2@nagarconnect.gov.in' LIMIT 1) fs
CROSS JOIN (SELECT id FROM users WHERE email = 'officer_1@nagarconnect.gov.in' LIMIT 1) o
WHERE c.title ILIKE '%drain%' OR c.title ILIKE '%drainage%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Task 4: WORK_COMPLETED — Garbage not collected
INSERT INTO field_tasks (
    complaint_id, field_staff_id, assigned_by, status,
    assigned_at, accepted_at, arrived_at, started_at, completed_at,
    sla_deadline, work_description,
    work_notes, resolution_notes
)
SELECT
    c.id,
    fs.id,
    o.id,
    'WORK_COMPLETED',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '23 hours',
    NOW() - INTERVAL '22 hours 30 minutes',
    NOW() - INTERVAL '22 hours',
    NOW() - INTERVAL '20 hours',
    NOW() - INTERVAL '18 hours',
    'Area cleaned and garbage collected. Bins emptied and sanitized.',
    'Large accumulation at Zone 4 corner. Required 2 trucks.',
    'All waste cleared. Area sanitized. No further immediate action required.'
FROM complaints c
CROSS JOIN (SELECT id FROM users WHERE email = 'field_staff_2@nagarconnect.gov.in' LIMIT 1) fs
CROSS JOIN (SELECT id FROM users WHERE email = 'officer_1@nagarconnect.gov.in' LIMIT 1) o
WHERE c.title ILIKE '%garbage%' OR c.title ILIKE '%waste%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Task 5: CANNOT_RESOLVE — Water leakage (requires different department)
INSERT INTO field_tasks (
    complaint_id, field_staff_id, assigned_by, status,
    assigned_at, accepted_at, arrived_at,
    sla_deadline, cannot_resolve_reason
)
SELECT
    c.id,
    fs.id,
    o.id,
    'CANNOT_RESOLVE',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '5 hours 30 minutes',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '4 hours',
    'Underground main pipe leak requires specialized PWD team. Issue beyond field staff scope. Forwarded for departmental reassignment.'
FROM complaints c
CROSS JOIN (SELECT id FROM users WHERE email = 'field_staff_1@nagarconnect.gov.in' LIMIT 1) fs
CROSS JOIN (SELECT id FROM users WHERE email = 'officer_1@nagarconnect.gov.in' LIMIT 1) o
WHERE c.title ILIKE '%water%' OR c.title ILIKE '%leak%'
LIMIT 1
ON CONFLICT DO NOTHING;
