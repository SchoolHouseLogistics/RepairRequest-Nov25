# Stripe Integration & Tiered Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe subscription billing with a free tier and 3 paid tiers (Starter, Professional, Premium), enforce user and request limits per plan, and gate features by tier.

**Architecture:** Organizations get plan-related columns in the database. A Stripe service handles checkout sessions, webhooks, and customer portal. Middleware enforces limits on request creation and user invitations. Feature gating checks plan tier before allowing access to gated endpoints.

**Tech Stack:** Stripe API (stripe npm package), Express middleware, Drizzle ORM, PostgreSQL

**Spec:** `docs/superpowers/specs/2026-03-24-pricing-overhaul-design.md` (Sections 1 & 3)

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `server/services/stripeService.ts` | Stripe API wrapper — create customers, checkout sessions, portal sessions |
| `server/middleware/planEnforcement.ts` | Middleware for user limits, request limits, and feature gating |

### Modified Files
| File | Changes |
|------|---------|
| `shared/schema.ts` | Add plan columns to organizations table |
| `server/storage.ts` | Add plan/usage query methods |
| `server/routes.ts` | Add Stripe routes (checkout, webhook, portal, billing status), apply enforcement middleware |
| `package.json` | Add `stripe` dependency |

---

## Task 1: Add plan columns to organizations schema

**Files:**
- Modify: `shared/schema.ts`

- [ ] **Step 1: Add plan-related columns to organizations table**

Add these columns after `onboardingCompleted` in the organizations table:

```typescript
plan: varchar("plan").notNull().default("free"),
planInterval: varchar("plan_interval"),
stripeCustomerId: varchar("stripe_customer_id"),
stripeSubscriptionId: varchar("stripe_subscription_id"),
userLimit: integer("user_limit").default(100),
monthlyRequestLimit: integer("monthly_request_limit").default(500),
currentMonthRequestCount: integer("current_month_request_count").default(0),
requestCountResetDate: timestamp("request_count_reset_date"),
```

- [ ] **Step 2: Add plan constants to shared location**

Add a plan configuration object that both server and client can use. Add to the bottom of `shared/schema.ts`:

```typescript
export const PLAN_CONFIGS = {
  free: { userLimit: 100, monthlyRequestLimit: 500 },
  starter: { userLimit: 250, monthlyRequestLimit: 2000 },
  professional: { userLimit: 500, monthlyRequestLimit: 5000 },
  premium: { userLimit: null, monthlyRequestLimit: 10000 },
  enterprise: { userLimit: null, monthlyRequestLimit: null },
} as const;

export type PlanType = keyof typeof PLAN_CONFIGS;

export const PLAN_FEATURES: Record<string, PlanType[]> = {
  "multi-building": ["starter", "professional", "premium", "enterprise"],
  "request-templates": ["starter", "professional", "premium", "enterprise"],
  "analytics": ["professional", "premium", "enterprise"],
  "messaging": ["professional", "premium", "enterprise"],
  "api-webhooks": ["premium", "enterprise"],
  "audit-logging": ["premium", "enterprise"],
};
```

- [ ] **Step 3: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add plan columns and config to organizations schema"
```

---

## Task 2: Install Stripe and create Stripe service

**Files:**
- Modify: `package.json`
- Create: `server/services/stripeService.ts`

- [ ] **Step 1: Install stripe package**

```bash
cd /c/Users/jeffa/Documents/RepairRequest-Nov25
npm install stripe
```

- [ ] **Step 2: Create the Stripe service**

Create `server/services/stripeService.ts`:

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

// Stripe Price IDs — set these after creating products in Stripe Dashboard
const PRICE_IDS: Record<string, Record<string, string>> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "",
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || "",
  },
  professional: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "",
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || "",
    annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID || "",
  },
};

export async function createCustomer(email: string, orgName: string, orgId: number): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name: orgName,
    metadata: { organizationId: String(orgId) },
  });
  return customer.id;
}

export async function createCheckoutSession(
  customerId: string,
  plan: string,
  interval: "monthly" | "annual",
  orgId: number,
  returnUrl: string,
): Promise<string> {
  const priceId = PRICE_IDS[plan]?.[interval];
  if (!priceId) throw new Error(`No price ID for ${plan}/${interval}`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}/dashboard?upgraded=true`,
    cancel_url: `${returnUrl}/pricing`,
    metadata: { organizationId: String(orgId), plan, interval },
  });

  return session.url!;
}

export async function createSetupFeeCheckout(
  email: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "RepairRequest Setup Fee" },
        unit_amount: 5000, // $50.00
      },
      quantity: 1,
    }],
    success_url: `${returnUrl}/setup-confirmed`,
    cancel_url: `${returnUrl}/pricing`,
  });

  return session.url!;
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${returnUrl}/dashboard`,
  });
  return session.url;
}

export async function constructWebhookEvent(
  body: Buffer,
  signature: string,
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || "",
  );
}

export { stripe };
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json server/services/stripeService.ts
git commit -m "feat: install stripe and create stripe service"
```

---

## Task 3: Add plan storage methods

**Files:**
- Modify: `server/storage.ts`

- [ ] **Step 1: Add plan-related query methods to DatabaseStorage**

```typescript
async countActiveUsersInOrg(orgId: number): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.organizationId, orgId), isNull(users.deletedAt)));
  return Number(result?.count ?? 0);
}

async countRequestsThisMonth(orgId: number, resetDate: Date | null): Promise<number> {
  const since = resetDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(requests)
    .where(and(
      eq(requests.organizationId, orgId),
      gte(requests.createdAt, since),
    ));
  return Number(result?.count ?? 0);
}

async getOrganizationByStripeCustomerId(customerId: string): Promise<Organization | undefined> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);
  return org;
}

async updateOrganizationPlan(orgId: number, updates: {
  plan?: string;
  planInterval?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  userLimit?: number | null;
  monthlyRequestLimit?: number | null;
  currentMonthRequestCount?: number;
  requestCountResetDate?: Date | null;
}): Promise<void> {
  await db
    .update(organizations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));
}
```

You'll need to import `sql` and `gte` from drizzle-orm and `requests` from the schema if not already imported.

- [ ] **Step 2: Add method signatures to IStorage interface**

```typescript
countActiveUsersInOrg(orgId: number): Promise<number>;
countRequestsThisMonth(orgId: number, resetDate: Date | null): Promise<number>;
getOrganizationByStripeCustomerId(customerId: string): Promise<Organization | undefined>;
updateOrganizationPlan(orgId: number, updates: Record<string, any>): Promise<void>;
```

- [ ] **Step 3: Commit**

```bash
git add server/storage.ts
git commit -m "feat: add plan and usage storage methods"
```

---

## Task 4: Create plan enforcement middleware

**Files:**
- Create: `server/middleware/planEnforcement.ts`

- [ ] **Step 1: Create the middleware file**

```typescript
import { Request, Response, NextFunction } from "express";
import { dbStorage } from "../storage";
import { PLAN_FEATURES, PLAN_CONFIGS, PlanType } from "@shared/schema";

// Use the same request type as the existing auth middleware.
// authMiddleware sets req.user from req.session.user.
// If the codebase uses a specific AuthenticatedRequest type, import and use that instead.
interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string; organizationId?: number };
  session: any;
}

export function checkUserLimit() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user?.organizationId) return next();

    const org = await dbStorage.getOrganization(user.organizationId);
    if (!org) return next();

    const limit = org.userLimit;
    if (limit === null) return next(); // unlimited

    const currentCount = await dbStorage.countActiveUsersInOrg(user.organizationId);
    if (currentCount >= limit) {
      return res.status(403).json({
        error: "User limit reached",
        message: `Your ${org.plan} plan allows up to ${limit} users. Upgrade to add more.`,
        upgradeRequired: true,
      });
    }

    next();
  };
}

export function checkRequestLimit() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user?.organizationId) return next();

    const org = await dbStorage.getOrganization(user.organizationId);
    if (!org) return next();

    const limit = org.monthlyRequestLimit;
    if (limit === null) return next(); // unlimited

    const count = await dbStorage.countRequestsThisMonth(
      user.organizationId,
      org.requestCountResetDate,
    );

    if (count >= limit) {
      return res.status(403).json({
        error: "Monthly request limit reached",
        message: `Your ${org.plan} plan allows ${limit} requests per month. Upgrade for more.`,
        upgradeRequired: true,
      });
    }

    next();
  };
}

export function requireFeature(featureName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user?.organizationId) return next();

    const org = await dbStorage.getOrganization(user.organizationId);
    if (!org) return next();

    const allowedPlans = PLAN_FEATURES[featureName];
    if (!allowedPlans) return next(); // feature not gated

    if (!allowedPlans.includes(org.plan as PlanType)) {
      return res.status(403).json({
        error: "Feature not available",
        message: `The ${featureName} feature requires a higher plan. Upgrade to access it.`,
        upgradeRequired: true,
        requiredPlan: allowedPlans[0],
      });
    }

    next();
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add server/middleware/planEnforcement.ts
git commit -m "feat: add plan enforcement middleware for limits and features"
```

---

## Task 5: Add Stripe routes (checkout, webhook, portal, billing status)

**Files:**
- Modify: `server/routes.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Add raw body parsing for Stripe webhooks**

In `server/index.ts`, BEFORE the `express.json()` middleware, add a raw body parser for the webhook route:

```typescript
// Must be before express.json() — Stripe needs raw body for signature verification
app.post("/api/billing/webhook", express.raw({ type: "application/json" }));
```

- [ ] **Step 2: Add billing routes to routes.ts**

Add these routes in `server/routes.ts`:

```typescript
// --- Stripe Billing Routes ---

app.post("/api/billing/create-checkout-session", authMiddleware, requireRole("admin"), async (req, res) => {
  const { plan, interval } = req.body;
  const user = req.session.user!;

  if (!plan || !interval) {
    return res.status(400).json({ error: "Plan and interval are required" });
  }

  const org = await dbStorage.getOrganization(user.organizationId!);
  if (!org) return res.status(404).json({ error: "Organization not found" });

  const { createCustomer, createCheckoutSession } = await import("./services/stripeService");

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    customerId = await createCustomer(user.email, org.name, org.id);
    await dbStorage.updateOrganizationPlan(org.id, { stripeCustomerId: customerId });
  }

  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
  const url = await createCheckoutSession(customerId, plan, interval, org.id, appUrl);

  res.json({ url });
});

app.post("/api/billing/create-setup-checkout", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const { createSetupFeeCheckout } = await import("./services/stripeService");
  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
  const url = await createSetupFeeCheckout(email, appUrl);

  res.json({ url });
});

app.get("/api/billing/portal", authMiddleware, requireRole("admin"), async (req, res) => {
  const user = req.session.user!;
  const org = await dbStorage.getOrganization(user.organizationId!);

  if (!org?.stripeCustomerId) {
    return res.status(400).json({ error: "No billing account found" });
  }

  const { createPortalSession } = await import("./services/stripeService");
  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
  const url = await createPortalSession(org.stripeCustomerId, appUrl);

  res.json({ url });
});

app.get("/api/billing/status", authMiddleware, async (req, res) => {
  const user = req.session.user!;
  if (!user.organizationId) return res.json({ plan: "free" });

  const org = await dbStorage.getOrganization(user.organizationId);
  if (!org) return res.json({ plan: "free" });

  const userCount = await dbStorage.countActiveUsersInOrg(user.organizationId);
  const requestCount = await dbStorage.countRequestsThisMonth(
    user.organizationId,
    org.requestCountResetDate,
  );

  res.json({
    plan: org.plan,
    planInterval: org.planInterval,
    userLimit: org.userLimit,
    monthlyRequestLimit: org.monthlyRequestLimit,
    currentUserCount: userCount,
    currentRequestCount: requestCount,
    stripeCustomerId: org.stripeCustomerId ? true : false,
  });
});

app.post("/api/billing/webhook", async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;
  if (!signature) return res.status(400).send("Missing signature");

  try {
    const { constructWebhookEvent } = await import("./services/stripeService");
    const event = await constructWebhookEvent(req.body, signature);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        if (session.mode === "subscription" && session.metadata?.organizationId) {
          const orgId = parseInt(session.metadata.organizationId);
          const plan = session.metadata.plan;
          const interval = session.metadata.interval;
          const planConfig = (await import("@shared/schema")).PLAN_CONFIGS;
          const config = planConfig[plan as keyof typeof planConfig];

          const resetDate = new Date();
          resetDate.setMonth(resetDate.getMonth() + 1);

          await dbStorage.updateOrganizationPlan(orgId, {
            plan,
            planInterval: interval,
            stripeSubscriptionId: session.subscription,
            userLimit: config?.userLimit ?? null,
            monthlyRequestLimit: config?.monthlyRequestLimit ?? null,
            currentMonthRequestCount: 0,
            requestCountResetDate: resetDate,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const org = await dbStorage.getOrganizationByStripeCustomerId(customerId);
        if (!org) break;

        // Map Stripe price ID back to plan tier
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const { PLAN_CONFIGS } = await import("@shared/schema");
        // Look up plan by matching price ID to env vars
        let newPlan = org.plan;
        let newInterval = org.planInterval;
        const priceMap: Record<string, { plan: string; interval: string }> = {
          [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || ""]: { plan: "starter", interval: "monthly" },
          [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || ""]: { plan: "starter", interval: "annual" },
          [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || ""]: { plan: "professional", interval: "monthly" },
          [process.env.STRIPE_PRO_ANNUAL_PRICE_ID || ""]: { plan: "professional", interval: "annual" },
          [process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || ""]: { plan: "premium", interval: "monthly" },
          [process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID || ""]: { plan: "premium", interval: "annual" },
        };
        const mapped = priceMap[priceId];
        if (mapped) {
          newPlan = mapped.plan;
          newInterval = mapped.interval;
        }
        const config = PLAN_CONFIGS[newPlan as keyof typeof PLAN_CONFIGS];
        await dbStorage.updateOrganizationPlan(org.id, {
          plan: newPlan,
          planInterval: newInterval,
          userLimit: config?.userLimit ?? null,
          monthlyRequestLimit: config?.monthlyRequestLimit ?? null,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const { PLAN_CONFIGS } = await import("@shared/schema");
        const org = await dbStorage.getOrganizationByStripeCustomerId(customerId);

        if (org) {
          await dbStorage.updateOrganizationPlan(org.id, {
            plan: "free",
            planInterval: null,
            stripeSubscriptionId: null,
            userLimit: PLAN_CONFIGS.free.userLimit,
            monthlyRequestLimit: PLAN_CONFIGS.free.monthlyRequestLimit,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;
        console.error(`Payment failed for customer ${customerId}`);

        // Send email to org admin about payment failure
        const org = await dbStorage.getOrganizationByStripeCustomerId(customerId);
        if (org) {
          // Find admin users in the org to notify
          const adminUsers = await db
            .select()
            .from(users)
            .where(and(
              eq(users.organizationId, org.id),
              eq(users.role, "admin"),
              isNull(users.deletedAt),
            ))
            .limit(5);

          const { sendEmail } = await import("./emailService");
          for (const admin of adminUsers) {
            if (admin.email) {
              try {
                await sendEmail({
                  to: admin.email,
                  subject: "RepairRequest: Payment Failed",
                  html: `<p>Your payment for RepairRequest has failed. Please update your payment method to avoid service interruption.</p><p>If not resolved within 7 days, your account will revert to the Free plan.</p>`,
                });
              } catch (err) {
                console.error("Failed to send payment failure email:", err);
              }
            }
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).send("Webhook Error");
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add server/routes.ts server/index.ts
git commit -m "feat: add Stripe billing routes (checkout, webhook, portal, status)"
```

---

## Task 6: Apply enforcement middleware to existing routes

**Files:**
- Modify: `server/routes.ts`

- [ ] **Step 1: Import the enforcement middleware**

At the top of routes.ts, add:

```typescript
import { checkUserLimit, checkRequestLimit, requireFeature } from "./middleware/planEnforcement";
```

- [ ] **Step 2: Add request limit check to request creation**

Find the `POST /api/requests` route handler. Add `checkRequestLimit()` middleware:

```typescript
app.post("/api/requests", authMiddleware, checkRequestLimit(), async (req, res) => {
```

- [ ] **Step 3: Add user limit check to invitation creation**

Find the `POST /api/invitations` route handler. Add `checkUserLimit()` middleware:

```typescript
app.post("/api/invitations", authMiddleware, requireRole("admin"), checkUserLimit(), async (req, res) => {
```

- [ ] **Step 4: Commit**

```bash
git add server/routes.ts
git commit -m "feat: apply plan enforcement middleware to routes"
```

---

## Task 7: Verify and test

- [ ] **Step 1: Verify TypeScript compiles**

```bash
cd /c/Users/jeffa/Documents/RepairRequest-Nov25
npx tsc --noEmit --project server/tsconfig.json 2>&1 | head -20
```

Fix any type errors introduced by our changes.

- [ ] **Step 2: Run database migration**

```bash
npx drizzle-kit push
```

This should add the plan-related columns (plan, stripeCustomerId, etc.) and the invitations table from sub-project 1.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type errors and run migration"
```
