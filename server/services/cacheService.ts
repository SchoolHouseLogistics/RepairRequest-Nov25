import { cache, CacheKeys, CacheTTL } from '../redis';
import { storage as dbStorage } from '../storage';

/**
 * Cache Service
 *
 * Provides caching wrappers for frequently accessed data.
 * Uses cache-aside pattern with automatic invalidation.
 *
 * Performance improvements:
 * - Organizations: Cached for 1 hour (rarely change)
 * - Buildings/Facilities: Cached for 30 minutes (occasionally updated)
 * - Users: Cached for 10 minutes (balance between freshness and performance)
 */

// ============================================
// ORGANIZATION CACHING
// ============================================

export const cachedOrganization = {
  /**
   * Get organization by ID (cached)
   */
  async get(id: number) {
    return cache.getOrSet(
      CacheKeys.organization(id),
      () => dbStorage.getOrganization(id),
      CacheTTL.ORGANIZATION
    );
  },

  /**
   * Get all organizations (cached)
   */
  async getAll() {
    return cache.getOrSet(
      CacheKeys.organizationAll(),
      () => dbStorage.getAllOrganizations(),
      CacheTTL.ORGANIZATION
    );
  },

  /**
   * Get organization features (cached)
   */
  async getFeatures(id: number) {
    return cache.getOrSet(
      CacheKeys.organizationFeatures(id),
      () => dbStorage.getOrganizationFeatures(id),
      CacheTTL.ORGANIZATION
    );
  },

  /**
   * Create organization (bypasses cache, invalidates list)
   */
  async create(data: any) {
    const org = await dbStorage.createOrganization(data);
    // Invalidate organization list cache
    await cache.del(CacheKeys.organizationAll());
    return org;
  },

  /**
   * Update organization (invalidates cache)
   */
  async update(id: number, data: any) {
    const org = await dbStorage.updateOrganization(id, data);
    // Invalidate specific organization and list cache
    await cache.del([
      CacheKeys.organization(id),
      CacheKeys.organizationAll(),
    ]);
    return org;
  },

  /**
   * Delete organization (invalidates cache)
   */
  async delete(id: number) {
    await dbStorage.deleteOrganization(id);
    // Invalidate specific organization and list cache
    await cache.del([
      CacheKeys.organization(id),
      CacheKeys.organizationAll(),
      CacheKeys.organizationFeatures(id),
    ]);
  },

  /**
   * Update organization features (invalidates cache)
   */
  async updateFeatures(id: number, data: any) {
    const features = await dbStorage.upsertOrganizationFeatures(id, data);
    // Invalidate features cache
    await cache.del(CacheKeys.organizationFeatures(id));
    return features;
  },
};

// ============================================
// BUILDING CACHING
// ============================================

export const cachedBuilding = {
  /**
   * Get buildings by organization (cached)
   */
  async getByOrganization(orgId: number) {
    return cache.getOrSet(
      CacheKeys.buildings(orgId),
      () => dbStorage.getBuildingsByOrganization(orgId),
      CacheTTL.BUILDINGS
    );
  },

  /**
   * Get building by ID (cached)
   */
  async get(id: number) {
    return cache.getOrSet(
      CacheKeys.building(id),
      () => dbStorage.getBuilding(id),
      CacheTTL.BUILDINGS
    );
  },

  /**
   * Create building (invalidates organization cache)
   */
  async create(data: any) {
    const building = await dbStorage.createBuilding(data);
    // Invalidate organization's buildings cache
    if (building.organizationId) {
      await cache.del(CacheKeys.buildings(building.organizationId));
    }
    return building;
  },

  /**
   * Update building (invalidates cache)
   */
  async update(id: number, data: any) {
    const building = await dbStorage.updateBuilding(id, data);
    // Invalidate specific building and organization's buildings cache
    await cache.del(CacheKeys.building(id));
    if (building.organizationId) {
      await cache.del(CacheKeys.buildings(building.organizationId));
    }
    return building;
  },

  /**
   * Delete building (invalidates cache)
   */
  async delete(id: number) {
    // Get building first to know which org cache to invalidate
    const building = await dbStorage.getBuilding(id);
    await dbStorage.deleteBuilding(id);

    // Invalidate caches
    await cache.del(CacheKeys.building(id));
    if (building?.organizationId) {
      await cache.del(CacheKeys.buildings(building.organizationId));
    }
  },
};

// ============================================
// FACILITY CACHING
// ============================================

export const cachedFacility = {
  /**
   * Get facilities by organization (cached)
   */
  async getByOrganization(orgId: number) {
    return cache.getOrSet(
      CacheKeys.facilities(orgId),
      () => dbStorage.getFacilitiesByOrganization(orgId),
      CacheTTL.FACILITIES
    );
  },

  /**
   * Get facility by ID (cached)
   */
  async get(id: number) {
    return cache.getOrSet(
      CacheKeys.facility(id),
      () => dbStorage.getFacility(id),
      CacheTTL.FACILITIES
    );
  },

  /**
   * Create facility (invalidates organization cache)
   */
  async create(data: any) {
    const facility = await dbStorage.createFacility(data);
    // Invalidate organization's facilities cache
    if (facility.organizationId) {
      await cache.del(CacheKeys.facilities(facility.organizationId));
    }
    return facility;
  },

  /**
   * Update facility (invalidates cache)
   */
  async update(id: number, data: any) {
    const facility = await dbStorage.updateFacility(id, data);
    // Invalidate specific facility and organization's facilities cache
    await cache.del(CacheKeys.facility(id));
    if (facility.organizationId) {
      await cache.del(CacheKeys.facilities(facility.organizationId));
    }
    return facility;
  },

  /**
   * Delete facility (invalidates cache)
   */
  async delete(id: number) {
    // Get facility first to know which org cache to invalidate
    const facility = await dbStorage.getFacility(id);
    await dbStorage.deleteFacility(id);

    // Invalidate caches
    await cache.del(CacheKeys.facility(id));
    if (facility?.organizationId) {
      await cache.del(CacheKeys.facilities(facility.organizationId));
    }
  },
};

// ============================================
// USER CACHING
// ============================================

export const cachedUser = {
  /**
   * Get user by ID (cached)
   */
  async get(id: string) {
    return cache.getOrSet(
      CacheKeys.user(id),
      () => dbStorage.getUser(id),
      CacheTTL.USER
    );
  },

  /**
   * Get user by email (cached)
   */
  async getByEmail(email: string) {
    return cache.getOrSet(
      CacheKeys.userByEmail(email),
      () => dbStorage.getUserByEmail(email),
      CacheTTL.USER
    );
  },

  /**
   * Get maintenance staff by organization (cached)
   */
  async getMaintenanceStaff(orgId: number) {
    return cache.getOrSet(
      CacheKeys.maintenanceStaff(orgId),
      () => dbStorage.getMaintenanceStaff(orgId),
      CacheTTL.USER
    );
  },

  /**
   * Update user (invalidates cache)
   */
  async upsert(data: any) {
    const user = await dbStorage.upsertUser(data);
    // Invalidate user caches
    await cache.del([
      CacheKeys.user(user.id),
      CacheKeys.userByEmail(user.email || ''),
    ]);
    // Invalidate maintenance staff cache if applicable
    if (user.organizationId && (user.role === 'maintenance' || user.role === 'admin')) {
      await cache.del(CacheKeys.maintenanceStaff(user.organizationId));
    }
    return user;
  },

  /**
   * Update user role (invalidates cache)
   */
  async updateRole(id: string, role: string) {
    const user = await dbStorage.updateUserRole(id, role);
    // Invalidate user and staff caches
    await cache.del(CacheKeys.user(id));
    if (user.organizationId) {
      await cache.del(CacheKeys.maintenanceStaff(user.organizationId));
    }
    return user;
  },

  /**
   * Update user organization (invalidates cache)
   */
  async updateOrganization(id: string, orgId: number | null) {
    const oldUser = await dbStorage.getUser(id);
    const user = await dbStorage.updateUserOrganization(id, orgId);

    // Invalidate user cache
    await cache.del(CacheKeys.user(id));

    // Invalidate maintenance staff cache for both old and new orgs
    if (oldUser?.organizationId) {
      await cache.del(CacheKeys.maintenanceStaff(oldUser.organizationId));
    }
    if (user.organizationId) {
      await cache.del(CacheKeys.maintenanceStaff(user.organizationId));
    }

    return user;
  },

  /**
   * Delete user (invalidates cache)
   */
  async delete(id: string) {
    const user = await dbStorage.getUser(id);
    await dbStorage.deleteUser(id);

    // Invalidate caches
    await cache.del([
      CacheKeys.user(id),
      CacheKeys.userByEmail(user?.email || ''),
    ]);
    if (user?.organizationId) {
      await cache.del(CacheKeys.maintenanceStaff(user.organizationId));
    }
  },
};

/**
 * Warm up frequently accessed caches on application startup
 */
export async function warmUpCache() {
  try {
    console.log('🔥 Warming up cache...');

    // Pre-fetch all organizations (most frequently accessed)
    await cachedOrganization.getAll();

    console.log('✅ Cache warmed up successfully');
  } catch (error) {
    console.error('❌ Error warming up cache:', error);
    // Non-fatal error, continue startup
  }
}
