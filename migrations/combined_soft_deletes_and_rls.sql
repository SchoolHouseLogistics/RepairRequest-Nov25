-- ============================================
-- COMBINED MIGRATION: Soft Deletes + Row Level Security
-- Run this script on your production database (Neon)
-- ============================================

-- ============================================
-- PART 1: ADD SOFT DELETE COLUMNS
-- ============================================

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

-- Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS "IDX_requests_org_status_created" ON requests(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS "IDX_requests_requestor_status" ON requests(requestor_id, status);
CREATE INDEX IF NOT EXISTS "IDX_requests_org_deleted" ON requests(organization_id, deleted_at);

-- ============================================
-- PART 2: CREATE RLS HELPER FUNCTIONS
-- ============================================

-- Helper function to get current organization ID from session
CREATE OR REPLACE FUNCTION current_org_id() RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.organization_id', true), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(current_setting('app.is_super_admin', true), 'false')::BOOLEAN;
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings FORCE ROW LEVEL SECURITY;

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities FORCE ROW LEVEL SECURITY;

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests FORCE ROW LEVEL SECURITY;

ALTER TABLE building_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE tech_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments FORCE ROW LEVEL SECURITY;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;

ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates FORCE ROW LEVEL SECURITY;

ALTER TABLE request_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_photos FORCE ROW LEVEL SECURITY;

-- Enable RLS on newer tables (if they exist)
DO $$ BEGIN
  ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;
  ALTER TABLE organization_features FORCE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE webhooks FORCE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
  ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE request_templates ENABLE ROW LEVEL SECURITY;
  ALTER TABLE request_templates FORCE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- PART 4: CREATE RLS POLICIES
-- ============================================

-- Users policy
DROP POLICY IF EXISTS users_org_isolation ON users;
CREATE POLICY users_org_isolation ON users FOR ALL USING (
  is_super_admin() OR organization_id = current_org_id() OR organization_id IS NULL
);

-- Organizations policy
DROP POLICY IF EXISTS organizations_isolation ON organizations;
CREATE POLICY organizations_isolation ON organizations FOR ALL USING (
  is_super_admin() OR id = current_org_id()
);

-- Buildings policy
DROP POLICY IF EXISTS buildings_org_isolation ON buildings;
CREATE POLICY buildings_org_isolation ON buildings FOR ALL USING (
  is_super_admin() OR organization_id = current_org_id()
);

-- Facilities policy
DROP POLICY IF EXISTS facilities_org_isolation ON facilities;
CREATE POLICY facilities_org_isolation ON facilities FOR ALL USING (
  is_super_admin() OR organization_id = current_org_id()
);

-- Requests policy
DROP POLICY IF EXISTS requests_org_isolation ON requests;
CREATE POLICY requests_org_isolation ON requests FOR ALL USING (
  is_super_admin() OR organization_id = current_org_id()
);

-- Building requests policy (via requests join)
DROP POLICY IF EXISTS building_requests_org_isolation ON building_requests;
CREATE POLICY building_requests_org_isolation ON building_requests FOR ALL USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM requests r WHERE r.id = building_requests.request_id AND r.organization_id = current_org_id()
  )
);

-- Tech requests policy (via requests join)
DROP POLICY IF EXISTS tech_requests_org_isolation ON tech_requests;
CREATE POLICY tech_requests_org_isolation ON tech_requests FOR ALL USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM requests r WHERE r.id = tech_requests.request_id AND r.organization_id = current_org_id()
  )
);

-- Assignments policy (via requests join)
DROP POLICY IF EXISTS assignments_org_isolation ON assignments;
CREATE POLICY assignments_org_isolation ON assignments FOR ALL USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM requests r WHERE r.id = assignments.request_id AND r.organization_id = current_org_id()
  )
);

-- Messages policy (via requests join)
DROP POLICY IF EXISTS messages_org_isolation ON messages;
CREATE POLICY messages_org_isolation ON messages FOR ALL USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM requests r WHERE r.id = messages.request_id AND r.organization_id = current_org_id()
  )
);

-- Status updates policy (via requests join)
DROP POLICY IF EXISTS status_updates_org_isolation ON status_updates;
CREATE POLICY status_updates_org_isolation ON status_updates FOR ALL USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM requests r WHERE r.id = status_updates.request_id AND r.organization_id = current_org_id()
  )
);

-- Request photos policy (via requests join)
DROP POLICY IF EXISTS request_photos_org_isolation ON request_photos;
CREATE POLICY request_photos_org_isolation ON request_photos FOR ALL USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM requests r WHERE r.id = request_photos.request_id AND r.organization_id = current_org_id()
  )
);

-- Organization features policy (if table exists)
DO $$ BEGIN
  DROP POLICY IF EXISTS organization_features_org_isolation ON organization_features;
  CREATE POLICY organization_features_org_isolation ON organization_features FOR ALL USING (
    is_super_admin() OR organization_id = current_org_id()
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Audit logs policy (if table exists)
DO $$ BEGIN
  DROP POLICY IF EXISTS audit_logs_org_isolation ON audit_logs;
  CREATE POLICY audit_logs_org_isolation ON audit_logs FOR ALL USING (
    is_super_admin() OR organization_id = current_org_id()
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Webhooks policy (if table exists)
DO $$ BEGIN
  DROP POLICY IF EXISTS webhooks_org_isolation ON webhooks;
  CREATE POLICY webhooks_org_isolation ON webhooks FOR ALL USING (
    is_super_admin() OR organization_id = current_org_id()
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- API keys policy (if table exists)
DO $$ BEGIN
  DROP POLICY IF EXISTS api_keys_org_isolation ON api_keys;
  CREATE POLICY api_keys_org_isolation ON api_keys FOR ALL USING (
    is_super_admin() OR organization_id = current_org_id()
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Request templates policy (if table exists)
DO $$ BEGIN
  DROP POLICY IF EXISTS request_templates_org_isolation ON request_templates;
  CREATE POLICY request_templates_org_isolation ON request_templates FOR ALL USING (
    is_super_admin() OR organization_id = current_org_id()
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- PART 5: VERIFICATION
-- ============================================

-- Verify soft delete columns
SELECT
  'Soft Delete Columns' as check_type,
  table_name,
  column_name
FROM information_schema.columns
WHERE column_name = 'deleted_at'
  AND table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'organizations', 'buildings', 'facilities', 'requests')
ORDER BY tablename;

-- Verify policies exist
SELECT
  'RLS Policies' as check_type,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
