import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import session from "express-session";
import pgSimple from "connect-pg-simple";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { db } from "./db.js";

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Security: Add Helmet.js for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://assets.calendly.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://assets.calendly.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://api.zeptomail.com", "https://calendly.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://calendly.com"],
      frameAncestors: isProduction ? ["'self'", "https://*.replit.dev", "https://*.replit.app"] : ["'self'", "http://localhost:*", "https://*.replit.dev"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

// Security: Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith('/api'), // Only limit API routes
});

// Security: Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: { message: "Too many login attempts, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/signup', authLimiter);
app.use('/api/auth', authLimiter);

app.use(express.json({ limit: "5mb" }));

// Serve attached assets directory as static files FIRST
app.use('/attached_assets', express.static(path.resolve(process.cwd(), 'attached_assets')));

// Serve uploads directory for photo attachments
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Configure PostgreSQL session store
const PostgresStore = pgSimple(session);

// Create sessions table if it doesn't exist
const createSessionsTable = async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY NOT NULL,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);
    if (!isProduction) {
      console.log("✅ Sessions table ready");
    }
  } catch (error) {
    console.error("❌ Error creating sessions table:", error);
  }
};

// Initialize sessions table
createSessionsTable();

// Get or generate session secret
const getSessionSecret = (): string => {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  if (isProduction) {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  return 'dev-secret-change-in-production';
};

app.use(session({
  store: new PostgresStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
    },
    tableName: 'sessions',
  }),
  secret: getSessionSecret(),
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: { 
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Middleware to set req.user and req.isAuthenticated for local login
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    (req as any).isAuthenticated = () => true;
  } else {
    (req as any).isAuthenticated = () => false;
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Production-aware logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;

  // Skip detailed logging in production for non-error responses
  if (isProduction) {
    res.on("finish", () => {
      // Only log errors in production
      if (res.statusCode >= 400) {
        const duration = Date.now() - start;
        log(`${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`);
      }
    });
  } else {
    // Development: detailed logging
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (reqPath.startsWith("/api")) {
        let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          // Don't log sensitive data even in development
          const safeResponse = { ...capturedJsonResponse };
          delete safeResponse.password;
          delete safeResponse.token;
          delete safeResponse.secret;
          logLine += ` :: ${JSON.stringify(safeResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });
  }

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  })

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})()
