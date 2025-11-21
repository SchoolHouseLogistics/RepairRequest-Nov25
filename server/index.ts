import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import session from "express-session";
import pgSimple from "connect-pg-simple";
import { db } from "./db.js";
// import adminUsersRouter from "./routes/adminUsers";

const app = express();
app.use(express.json({ limit: "5mb" }));
// app.use(adminUsersRouter);

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
    console.log("✅ Sessions table ready");
  } catch (error) {
    console.error("❌ Error creating sessions table:", error);
  }
};

// Initialize sessions table
createSessionsTable();

app.use(session({
  store: new PostgresStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
    },
    tableName: 'sessions',
  }),
  secret: "your-secret", // use a strong secret in production!
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, sameSite: "lax" }
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

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})()