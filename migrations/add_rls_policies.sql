-- Migration: Enable Row Level Security (RLS) for multi-tenant isolation
-- This provides database-level security to prevent cross-tenant data access

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Organizations table (super_admin only, or own org)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

-- Buildings table
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings FORCE ROW LEVEL SECURITY;

-- Facilities table
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities FORCE ROW LEVEL SECURITY;

-- Requests table
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests FORCE ROW LEVEL SECURITY;

-- Building requests table
ALTER TABLE building_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_requests FORCE ROW LEVEL SECURITY;

-- Tech requests table
ALTER TABLE tech_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_requests FORCE ROW LEVEL SECURITY;

-- Assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments FORCE ROW LEVEL SECURITY;

-- Messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;

-- Status updates table
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates FORCE ROW LEVEL SECURITY;

-- Request photos table
ALTER TABLE request_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_photos FORCE ROW LEVEL SECURITY;

-- Organization features table
ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_features FORCE ROW LEVEL SECURITY;

-- Audit logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Webhooks table
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks FORCE ROW LEVEL SECURITY;

-- API keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;

-- Request templates table
ALTER TABLE request_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_templates FORCE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
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
-- USERS POLICIES
-- ============================================
DROP POLICY IF EXISTS users_org_isolation ON users;
CREATE POLICY users_org_isolation ON users
  FOR ALL
  USING (
    is_super_admin()
    OR organization_id = current_org_id()
    OR organization_id IS NULL  -- Users without org (during signup)
  );

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================
DROP POLICY IF EXISTS organizations_isolation ON organizations;
CREATE POLICY organizations_isolation ON organizations
  FOR ALL
  USING (
    is_super_admin()
    OR id = current_org_id()
  );

-- ============================================
-- BUILDINGS POLICIES
-- ============================================
DROP POLICY IF EXISTS buildings_org_isolation ON buildings;
CREATE POLICY buildings_org_isolation ON buildings
  FOR ALL
  USING (
    is_super_admin()
    OR organization_id = current_org_id()
  );

-- ============================================
-- FACILITIES POLICIES
-- ============================================
DROP POLICY IF EXISTS facilities_org_isolation ON facilities;
CREATE POLICY facilities_org_isolation ON facilities
  FOR ALL
  USING (
    is_super_admin()
    OR organization_id = current_org_id()
  );

-- ============================================
-- REQUESTS POLICIES
-- ============================================
DROP POLICY IF EXISTS requests_org_isolation ON requests;
CREATE POLICY requests_org_isolation ON requests
  FOR ALL
  USING (
    is_super_admin()
    OR organization_id = current_org_id()
  );

-- ============================================
-- BUILDING REQUESTS POLICIES
-- ============================================
DROP POLICY IF EXISTS building_requests_org_isolation ON building_requests;
CREATE POLICY building_requests_org_isolation ON building_requests
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = building_requests.request_id
      AND r.organization_id = current_org_id()
    )
  );

-- ============================================
-- TECH REQUESTS POLICIES
-- ============================================
DROP POLICY IF EXISTS tech_requests_org_isolation ON tech_requests;
CREATE POLICY tech_requests_org_isolation ON tech_requests
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = tech_requests.request_id
      AND r.organization_id = current_org_id()
    )
  );

-- ============================================
-- ASSIGNMENTS POLICIES
-- ============================================
DROP POLICY IF EXISTS assignments_org_isolation ON assignments;
CREATE POLICY assignments_org_isolation ON assignments
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = assignments.request_id
      AND r.organization_id = current_org_id()
    )
  );

-- ============================================
-- MESSAGES POLICIES
-- ============================================
DROP POLICY IF EXISTS messages_org_isolation ON messages;
CREATE POLICY messages_org_isolation ON messages
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = messages.request_id
      AND r.organization_id = current_org_id()
    )
  );

-- ============================================
-- STATUS UPDATES POLICIES
-- ============================================
DROP POLICY IF EXISTS status_updates_org_isolation ON status_updates;
CREATE POLICY status_updates_org_isolation ON status_updates
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = status_updates.request_id
      AND r.organization_id = current_org_id()
    )
  );

-- ============================================
-- REQUEST PHOTOS POLICIES
-- ============================================
DROP POLICY IF EXISTS request_photos_org_isolation ON request_photos;
CREATE POLICY request_photos_org_isolation ON request_photos
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_photos.request_id
      AND r.organization_id = current_org_id()
    )
  );

-- ============================================
-- ORGANIZATION FEATURES POLICIES
-- ============================================
DROP POLICY IF EXISTS organization_features_org_isolation ON organization_features;
CREATE POLICY organization_features_org_isolation ON organization_features
  FOR ALL
  USING (
    is_super_admin()
    OR organization_id = current_org_id()
  );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================
DROP POLICY IF EXISTS audit_logs_org_isolation ON audit_logs;
CREATE POLICY audit_logs_org_isolation ON audit_logs
  FOR ALL
  USING (
    is_super_admin()
    OR organization_id = current_org_id()
  );

-- ============================================
-- WEBHOOKS POLICIES
-- ============================================
DROP POLICY IF EXISTS webhooks_org_isolation ON webhooks;
CREATE POLICY webhooks_org_isolation ON webhooks
  FOR ALL
  USING (
    is_super_admin()
    OR organization_id = current_org_id()
  );

-- ============================================
-- API KEYS POLICIES
-- ============================================
DROP POLICY IF EXISTS api_keys_org_isolation ON api_keys;
CREATE POLICY api_keys_org_isolation ON api_keys
  FOR ALL
  USING (
    is_super_admin()
    OR organization_id = current_org_id()
  );

-- ============================================
-- REQUEST TEMPLATES POLICIES
-- ============================================
DROP POLICY IF EXISTS request_templates_org_isolation ON request_templates;
CREATE POLICY request_templates_org_isolation ON request_templates
  FOR ALL
  USING (
    is_super_admin()
    OR organization_id = current_org_id()
  );

-- ============================================
-- BYPASS RLS FOR SERVICE ROLE (optional)
-- If you have a service role for migrations/admin tasks
-- ============================================
-- CREATE ROLE service_role;
-- ALTER TABLE users OWNER TO service_role;
-- ... repeat for all tables

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'organizations', 'buildings', 'facilities',
    'requests', 'building_requests', 'tech_requests',
    'assignments', 'messages', 'status_updates', 'request_photos',
    'organization_features', 'audit_logs', 'webhooks', 'api_keys', 'request_templates'
  )
ORDER BY tablename;
