import type { Express } from "express";
import { createServer, type Server } from "http";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { setRLSContext } from './middleware/rlsContext';

// Import modular route handlers
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import organizationRoutes from './routes/organizations';
import buildingRoutes from './routes/buildings';
import facilityRoutes from './routes/facilities';
import requestRoutes from './routes/requests';
import dashboardRoutes from './routes/dashboard';
import uploadRoutes from './routes/uploads';
import apiRoutes from './routes/api';

/**
 * Register all application routes
 *
 * This function sets up all API endpoints by mounting modular route handlers.
 * Routes are organized by domain for better maintainability and scalability.
 */
export async function registerRoutes(app: Express): Promise<Server> {

  // ============================================
  // MIDDLEWARE SETUP
  // ============================================

  // Apply RLS (Row Level Security) context middleware globally
  // This sets PostgreSQL session variables for multi-tenant isolation
  app.use(setRLSContext);

  // ============================================
  // ROUTE MODULE REGISTRATION
  // ============================================

  /**
   * Authentication & Authorization Routes
   * Handles: Google OAuth, local auth (email/password), password reset
   * Base path: /api
   */
  app.use('/api', authRoutes);

  /**
   * User Management Routes
   * Handles: User CRUD, role management, bulk import
   * Base path: /api
   */
  app.use('/api', userRoutes);

  /**
   * Organization Management Routes
   * Handles: Organization CRUD, feature flags
   * Base path: /api
   */
  app.use('/api', organizationRoutes);

  /**
   * Building Management Routes
   * Handles: Building CRUD, image uploads, room management
   * Base path: /api
   */
  app.use('/api', buildingRoutes);

  /**
   * Facility Management Routes
   * Handles: Facility CRUD, organization-specific facilities
   * Base path: /api
   */
  app.use('/api', facilityRoutes);

  /**
   * Request Management Routes
   * Handles: Request CRUD (facilities/building/tech), assignments, status updates, messages, photos
   * Base path: /api/requests
   */
  app.use('/api/requests', requestRoutes);

  /**
   * Dashboard & Analytics Routes
   * Handles: Dashboard stats, reports
   * Base path: /api
   */
  app.use('/api', dashboardRoutes);

  /**
   * File Upload & Serving Routes
   * Handles: File uploads, S3 pre-signed URLs, contact form
   * Base path: /api (for uploads) and root (for /get-presigned-url, /api/contact)
   */
  app.use('/', uploadRoutes);

  /**
   * Advanced API Routes
   * Handles: Webhooks, API keys, data export, templates, audit logs, SLA, analytics
   * Base path: /api
   */
  app.use('/api', apiRoutes);

  // ============================================
  // ADDITIONAL ENDPOINTS
  // ============================================

  /**
   * S3 Proxy Endpoint
   * Proxies requests to S3 to handle private bucket access
   * This allows serving images from private S3 buckets through the app
   */
  app.get('/api/s3-proxy', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
      // Parse S3 URL to get bucket and key
      const s3UrlMatch = url.match(/https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/);
      if (!s3UrlMatch) {
        return res.status(400).json({ error: 'Invalid S3 URL format' });
      }

      const [, bucket, region, key] = s3UrlMatch;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: decodeURIComponent(key),
      });

      // Create S3 client with proper region
      const regionalS3Client = new S3Client({
        region: region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const response = await regionalS3Client.send(command);

      // Set content type
      if (response.ContentType) {
        res.setHeader('Content-Type', response.ContentType);
      }
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Stream the body
      if (response.Body) {
        const stream = response.Body as NodeJS.ReadableStream;
        stream.pipe(res);
      } else {
        res.status(404).json({ error: 'Image not found' });
      }
    } catch (err) {
      console.error('Error proxying S3 image:', err);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  });

  // ============================================
  // HTTP SERVER CREATION
  // ============================================

  const httpServer = createServer(app);
  return httpServer;
}
