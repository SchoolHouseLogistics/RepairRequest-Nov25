import { Router } from 'express';
import { storage as dbStorage } from '../storage';
import { sendEmail } from '../emailService';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Get the default organization ID for new user signups.
 * Uses environment variable DEFAULT_ORGANIZATION_ID if set,
 * otherwise falls back to the first active organization.
 * Returns undefined if no organizations exist (requires manual assignment).
 */
async function getDefaultOrganizationId(): Promise<number | undefined> {
  // Check environment variable first
  const envOrgId = process.env.DEFAULT_ORGANIZATION_ID;
  if (envOrgId) {
    const orgId = parseInt(envOrgId, 10);
    if (!isNaN(orgId)) {
      // Verify the organization exists
      const org = await dbStorage.getOrganization(orgId);
      if (org) {
        return orgId;
      }
      console.warn(`DEFAULT_ORGANIZATION_ID ${orgId} not found in database, falling back to first org`);
    }
  }

  // Fallback: get the first organization
  const orgs = await dbStorage.getAllOrganizations();
  if (orgs && orgs.length > 0) {
    return orgs[0].id;
  }

  // No organizations exist - new users will need manual org assignment
  console.warn("No organizations found in database - new users will have no organization assigned");
  return undefined;
}

/**
 * Helper to get the correct host for OAuth redirect
 */
const getOAuthRedirectUri = (req: any) => {
  // Use the request host to support both dev and production domains
  const host = req.get('host') || process.env.REPLIT_DOMAINS?.split(',')[0];
  const protocol = req.get('x-forwarded-proto') || 'https';
  return `${protocol}://${host}/api/auth/callback/google`;
};

// ============================================
// PASSWORD RESET ROUTES
// ============================================

/**
 * POST /api/forgot-password
 * Request a password reset email
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ status: "error", error: { message: "Email is required" } });
  }

  try {
    const user = await dbStorage.getUserByEmail(email);

    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({ status: "success", message: "If an account exists with this email, a reset link has been sent." });
    }

    // Generate password reset token
    const { token, expiresAt } = await dbStorage.createPasswordResetToken(user.id);

    // Build the reset URL
    const host = req.get('host') || process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const protocol = req.get('x-forwarded-proto') || 'https';
    const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

    // Send the email
    const emailSent = await sendEmail({
      to: user.email!,
      from: process.env.FROM_EMAIL || "noreply@schoolhouselogistics.com",
      subject: "Password Reset Request - RepairRequest",
      text: `Hello ${user.firstName || ''},\n\nYou requested a password reset for your RepairRequest account.\n\nClick the link below to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe RepairRequest Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.firstName || ''},</p>
          <p>You requested a password reset for your RepairRequest account.</p>
          <p>Click the button below to reset your password (valid for 1 hour):</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't request this password reset, you can safely ignore this email.</p>
        </div>
      `
    });

    if (!emailSent) {
      console.error("Failed to send password reset email to:", user.email);
      return res.status(500).json({ status: "error", error: { message: "Failed to send reset email. Please try again later." } });
    }

    console.log(`Password reset email sent to ${user.email}, expires at ${expiresAt}`);
    return res.json({ status: "success", message: "If an account exists with this email, a reset link has been sent." });
  } catch (err) {
    console.error("Password reset error:", err);
    return res.status(500).json({ status: "error", error: { message: "Internal server error" } });
  }
});

/**
 * GET /api/reset-password/validate
 * Validate a password reset token
 */
router.get("/reset-password/validate", async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ valid: false, error: "Token is required" });
  }

  try {
    const { valid } = await dbStorage.validatePasswordResetToken(token);
    return res.json({ valid });
  } catch (err) {
    console.error("Token validation error:", err);
    return res.status(500).json({ valid: false, error: "Internal server error" });
  }
});

/**
 * POST /api/reset-password
 * Reset password with token
 */
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ status: "error", error: { message: "Token and new password are required" } });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ status: "error", error: { message: "Password must be at least 8 characters long" } });
  }

  try {
    // Validate the token
    const { valid, userId } = await dbStorage.validatePasswordResetToken(token);

    if (!valid || !userId) {
      return res.status(400).json({ status: "error", error: { message: "Invalid or expired reset token" } });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const updated = await dbStorage.updateUserPassword(userId, hashedPassword);

    if (!updated) {
      return res.status(500).json({ status: "error", error: { message: "Failed to update password" } });
    }

    // Mark the token as used
    await dbStorage.usePasswordResetToken(token);

    console.log(`Password successfully reset for user ${userId}`);
    return res.json({ status: "success", message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Password reset error:", err);
    return res.status(500).json({ status: "error", error: { message: "Internal server error" } });
  }
});

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

/**
 * GET /api/auth/callback/google
 * OAuth callback handler
 */
router.get("/auth/callback/google", async (req, res) => {
  try {
    // Check for OAuth errors from Google
    if (req.query.error) {
      return res.redirect("/?error=oauth_error");
    }

    // Check for authorization code
    if (!req.query.code) {
      return res.redirect("/?error=no_code");
    }

    // Get redirect URI using same logic as login route
    const redirectUri = getOAuthRedirectUri(req);

    // Exchange authorization code for access token
    console.log("OAuth callback - redirect URI:", redirectUri);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: req.query.code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("OAuth token exchange failed:", tokenData);
      return res.redirect("/?error=token_failed");
    }

    // Get user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await profileResponse.json();

    if (!profile.email) {
      return res.redirect("/?error=no_email");
    }

    // Find or create user
    let user = await dbStorage.getUserByEmail(profile.email);
    if (!user) {
      // Get default organization for new users
      const defaultOrgId = await getDefaultOrganizationId();

      // Create new user using upsertUser
      const userData = {
        id: profile.id,
        email: profile.email,
        firstName: profile.given_name || '',
        lastName: profile.family_name || '',
        role: 'requester' as const,
        organizationId: defaultOrgId,
        profileImageUrl: profile.picture || null,
      };
      user = await dbStorage.upsertUser(userData);
    }

    // Set session
    req.session!.user = {
      id: user.id,
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'requester',
      organizationId: user.organizationId ?? undefined,
    };

    // Save session before redirect
    req.session!.save((err: any) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect("/?error=session_failed");
      }
      res.redirect("/dashboard");
    });

  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return res.redirect("/?error=callback_failed");
  }
});

/**
 * GET /api/login
 * Initiate Google OAuth login
 */
router.get("/login", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getOAuthRedirectUri(req);
  const scope = "profile email";
  const state = req.sessionID;

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;

  res.redirect(googleAuthUrl);
});

/**
 * GET /api/auth/google
 * Alias route for /api/login (some pages use this URL)
 */
router.get("/auth/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getOAuthRedirectUri(req);
  const scope = "profile email";
  const state = req.sessionID;

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;

  res.redirect(googleAuthUrl);
});

// ============================================
// LOCAL AUTH ROUTES (Email/Password)
// ============================================

/**
 * POST /api/auth/signup
 * Email/password signup
 */
router.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user exists
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Get default organization for new users
    const defaultOrgId = await getDefaultOrganizationId();

    // Create user
    const id = crypto.randomUUID();
    const now = new Date();
    const [user] = await db.insert(users).values({
      id,
      email,
      firstName,
      lastName,
      password: hashed,
      role: "requester",
      organizationId: defaultOrgId,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Set session for user after signup
    req.session.user = {
      id: user.id,
      email: user.email || '',
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      organizationId: user.organizationId ?? undefined
    };

    // Save session before sending response
    req.session.save((err: any) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Failed to save session" });
      }

      return res.status(201).json({
        message: "Signup successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return res.status(500).json({
      message: "Signup failed",
      error: err.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Email/password login
 */
router.post("/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }
    email = email.trim().toLowerCase();
    password = password.trim();

    // Find user by email
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    if (!user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set session for user (no Google Auth/passport)
    req.session.user = {
      id: user.id,
      email: user.email || '',
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      organizationId: user.organizationId ?? undefined
    };

    // Save session before sending response
    req.session.save((err: any) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Failed to save session" });
      }

      console.log("Session saved with user:", req.session.user);

      return res.status(200).json({
        message: "Login successful",
        user: req.session.user,
      });
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
});

/**
 * GET /api/logout
 * Logout and destroy session
 */
router.get('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }

    // Clear cookie with same options it was set with
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax'
    });

    // Set cache control headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({ message: "Logged out" });
  });
});

export default router;
