-- Migration: Add soft delete columns to all major tables
-- Run this on your production database to enable soft delete functionality

-- Add deleted_at to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS "IDX_users_deleted_at" ON users(deleted_at);

-- Add deleted_at to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS "IDX_organizations_deleted_at" ON organizations(deleted_at);

-- Add deleted_at to buildings table
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS "IDX_buildings_deleted_at" ON buildings(deleted_at);

-- Add deleted_at to facilities table
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS "IDX_facilities_deleted_at" ON facilities(deleted_at);

-- Add deleted_at to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS "IDX_requests_deleted_at" ON requests(deleted_at);

-- Create additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS "IDX_requests_org_status_created" ON requests(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS "IDX_requests_requestor_status" ON requests(requestor_id, status);
CREATE INDEX IF NOT EXISTS "IDX_requests_org_deleted" ON requests(organization_id, deleted_at);

-- Verify columns were added
SELECT
  table_name,
  column_name
FROM information_schema.columns
WHERE column_name = 'deleted_at'
  AND table_schema = 'public'
ORDER BY table_name;
