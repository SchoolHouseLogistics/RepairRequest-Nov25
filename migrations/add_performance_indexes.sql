-- Performance Indexes Migration
-- Adds indexes for frequently queried columns to improve performance

-- ============================================
-- REQUESTS TABLE INDEXES
-- ============================================

-- Index for filtering by priority (used in SLA calculations and dashboard)
CREATE INDEX IF NOT EXISTS idx_requests_priority
  ON requests(priority)
  WHERE deleted_at IS NULL;

-- Index for filtering by request type
CREATE INDEX IF NOT EXISTS idx_requests_type
  ON requests(request_type)
  WHERE deleted_at IS NULL;

-- Index for requestor queries (my requests page)
CREATE INDEX IF NOT EXISTS idx_requests_requestor_status
  ON requests(requestor_id, status)
  WHERE deleted_at IS NULL;

-- Index for facility/building lookups
CREATE INDEX IF NOT EXISTS idx_requests_facility
  ON requests(facility)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_requests_building
  ON requests(building)
  WHERE deleted_at IS NULL;

-- ============================================
-- STATUS UPDATES TABLE INDEXES
-- ============================================

-- Index for request timeline queries
CREATE INDEX IF NOT EXISTS idx_status_updates_request_updated
  ON status_updates(request_id, updated_at DESC);

-- Index for finding first non-pending status (SLA response time)
CREATE INDEX IF NOT EXISTS idx_status_updates_status_time
  ON status_updates(request_id, status, updated_at)
  WHERE status != 'pending';

-- Index for finding completed status (SLA resolution time)
CREATE INDEX IF NOT EXISTS idx_status_updates_completed
  ON status_updates(request_id, updated_at)
  WHERE status = 'completed';

-- ============================================
-- ASSIGNMENTS TABLE INDEXES
-- ============================================

-- Index for assigned requests queries
CREATE INDEX IF NOT EXISTS idx_assignments_user_request
  ON assignments(assigned_to, request_id);

-- ============================================
-- MESSAGES TABLE INDEXES
-- ============================================

-- Index for request messages
CREATE INDEX IF NOT EXISTS idx_messages_request_created
  ON messages(request_id, created_at DESC);

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Composite index for maintenance staff queries (by org + role)
CREATE INDEX IF NOT EXISTS idx_users_org_role
  ON users(organization_id, role)
  WHERE deleted_at IS NULL;

-- Index for email lookups (if not already indexed as unique)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email)
  WHERE deleted_at IS NULL;

-- ============================================
-- BUILDINGS TABLE INDEXES
-- ============================================

-- Index for organization buildings
CREATE INDEX IF NOT EXISTS idx_buildings_org_active
  ON buildings(organization_id, is_active)
  WHERE deleted_at IS NULL;

-- ============================================
-- FACILITIES TABLE INDEXES
-- ============================================

-- Index for organization facilities
CREATE INDEX IF NOT EXISTS idx_facilities_org_active
  ON facilities(organization_id, is_active)
  WHERE deleted_at IS NULL;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_facilities_category
  ON facilities(organization_id, category)
  WHERE deleted_at IS NULL AND is_active = true;

-- ============================================
-- AUDIT LOGS TABLE INDEXES
-- ============================================

-- Composite index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time
  ON audit_logs(organization_id, timestamp DESC);

-- Index for resource lookup
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs(resource_type, resource_id, timestamp DESC);

-- ============================================
-- WEBHOOKS TABLE INDEXES
-- ============================================

-- Index for active webhooks by organization
CREATE INDEX IF NOT EXISTS idx_webhooks_org_enabled
  ON webhooks(organization_id, is_enabled)
  WHERE deleted_at IS NULL;

-- ============================================
-- API KEYS TABLE INDEXES
-- ============================================

-- Index for API key lookups (hashed key)
CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON api_keys(key_hash)
  WHERE is_revoked = false AND deleted_at IS NULL;

-- Index for organization API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_org
  ON api_keys(organization_id)
  WHERE is_revoked = false AND deleted_at IS NULL;

-- ============================================
-- REQUEST PHOTOS TABLE INDEXES
-- ============================================

-- Index for request photos
CREATE INDEX IF NOT EXISTS idx_request_photos_request
  ON request_photos(request_id, uploaded_at DESC);

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update table statistics for query planner
ANALYZE requests;
ANALYZE status_updates;
ANALYZE assignments;
ANALYZE messages;
ANALYZE users;
ANALYZE buildings;
ANALYZE facilities;
ANALYZE audit_logs;
ANALYZE webhooks;
ANALYZE api_keys;
ANALYZE request_photos;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
