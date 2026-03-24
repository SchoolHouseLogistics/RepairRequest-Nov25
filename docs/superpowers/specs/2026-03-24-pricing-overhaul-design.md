# Pricing Overhaul Design Spec

## Overview

Redesign RepairRequest's pricing model from a flat annual quote-based system to a self-service tiered subscription model with Stripe integration. Includes self-service signup with onboarding wizard, usage-based limits, and a redesigned pricing page.

## Sub-Projects

This work decomposes into 3 sequential sub-projects:

1. **Self-service signup + onboarding walkthrough**
2. **Stripe integration + tiered pricing enforcement**
3. **Pricing page redesign**

---

## 1. Tier Structure & Limits

### Free Tier
- **Users:** 100
- **Requests:** 500/month
- **Price:** $0/month
- **Optional:** $50 one-time setup fee (SchoolHouse Logistics sets up the account)
- **Features:** Core requests & tracking, photo attachments, email notifications, priority management, Google OAuth, 4 user-facing roles (Requester, Maintenance, Tech, Admin)

### Starter — $59.99/mo | $50.99/mo annual (15% discount)
- **Users:** 250
- **Requests:** 2,000/month
- **Features:** Everything in Free + multi-building support, request templates

### Professional — $99.99/mo | $84.99/mo annual (15% discount)
- **Users:** 500
- **Requests:** 5,000/month
- **Features:** Everything in Starter + analytics & reporting, messaging threads

### Premium — $199.99/mo | $169.99/mo annual (15% discount)
- **Users:** Unlimited
- **Requests:** 10,000/month
- **Features:** Everything in Professional + API access & webhooks, audit logging

### Enterprise — Custom Pricing
- **Users:** Custom
- **Requests:** Custom
- **Features:** Everything in Premium + priority support, custom onboarding, custom SLAs
- **Sales:** Contact sales flow (Calendly + contact form)

### Annual Pricing Summary

| Tier | Monthly | Annual/mo | Annual Total |
|------|---------|-----------|--------------|
| Free | $0 | $0 | $0 |
| Starter | $59.99 | $50.99 | $611.88 |
| Professional | $99.99 | $84.99 | $1,019.88 |
| Premium | $199.99 | $169.99 | $2,039.88 |
| Enterprise | Custom | Custom | Custom |

### Feature Gating Matrix

| Feature | Free | Starter | Pro | Premium |
|---------|------|---------|-----|---------|
| Core requests & tracking | x | x | x | x |
| Photo attachments | x | x | x | x |
| Email notifications | x | x | x | x |
| Priority management | x | x | x | x |
| Google OAuth | x | x | x | x |
| Role-based access (4 roles) | x | x | x | x |
| Multi-building support | - | x | x | x |
| Request templates | - | x | x | x |
| Analytics & reporting | - | - | x | x |
| Messaging threads | - | - | x | x |
| API access & webhooks | - | - | - | x |
| Audit logging | - | - | - | x |

### Roles

4 user-facing roles available on all tiers:
- **Requester** — submits repair/maintenance requests
- **Maintenance** — assigned to work orders, updates status
- **Tech** — handles tech-specific requests
- **Admin** — manages users, buildings, settings for their org

**Super Admin** is internal only (SchoolHouse Logistics staff), not available to customers.

---

## 2. Self-Service Signup & Onboarding

### Current State
- New users are assigned to a default organization via environment variable
- No self-service organization creation
- No onboarding wizard
- Admin creates organizations manually

### Default Organization Migration
The current `DEFAULT_ORGANIZATION_ID` env var behavior is removed. After this change:
- New signups always create a new organization (see flow below)
- Existing users already assigned to the default org remain there unchanged
- The default org itself becomes a normal org on the Free tier like all others

### New Flow

1. User signs up via Google OAuth or email/password
2. System creates a **new organization** and assigns user as **Admin**
4. Organization starts on **Free tier** by default
5. User enters a **4-step onboarding wizard:**
   - **Step 1:** Name your organization, upload logo (optional)
   - **Step 2:** Add your buildings
   - **Step 3:** Add rooms/areas to each building
   - **Step 4:** Invite your first users (via email)
6. Wizard can be skipped at any step and returned to later (track completion state)
7. After wizard (or skip), user lands on the admin dashboard

### $50 Setup Option
- Offered on the pricing page and during signup
- "Want us to set it up for you? $50 one-time fee"
- Handled via Stripe Checkout (one-time payment)
- Stripe Checkout success page redirects to a confirmation page with embedded Calendly booking link

### Existing User Signup (Invited Users)
- When an admin invites a user via email, the invited user signs up and is automatically assigned to the inviting admin's organization
- Invited users skip the onboarding wizard (org already configured)
- Invited users get the role specified by the admin during invitation

---

## 3. Stripe Integration

### Dependencies
- `stripe` npm package (server)
- `@stripe/stripe-js` + `@stripe/react-stripe-js` (client, for Checkout)
- Stripe account with Products and Prices configured

### Stripe Products & Prices
Create in Stripe Dashboard (or via API during setup):
- **Starter Monthly:** $59.99/mo
- **Starter Annual:** $611.88/yr
- **Professional Monthly:** $99.99/mo
- **Professional Annual:** $1,019.88/yr
- **Premium Monthly:** $199.99/mo
- **Premium Annual:** $2,039.88/yr
- **Setup Fee:** $50 one-time

### Database Changes

**Organizations table — add columns:**
- `plan` — enum: `free`, `starter`, `professional`, `premium`, `enterprise` (default: `free`)
- `planInterval` — enum: `monthly`, `annual`, `null` (null for free/enterprise)
- `stripeCustomerId` — string, nullable
- `stripeSubscriptionId` — string, nullable
- `userLimit` — integer, nullable (default derived from plan: 100/250/500/null; stored as column to allow per-org overrides for Enterprise)
- `monthlyRequestLimit` — integer, nullable (default derived from plan: 500/2000/5000/10000; stored as column to allow per-org overrides for Enterprise)
- `currentMonthRequestCount` — integer (default: 0)
- `requestCountResetDate` — timestamp (advances monthly from subscription start date; e.g., subscribed March 15 → resets April 15, May 15, etc.)
- `onboardingCompleted` — boolean (default: false)

### Server Endpoints

**Subscription management:**
- `POST /api/billing/create-checkout-session` — create Stripe Checkout for subscription
- `POST /api/billing/create-setup-checkout` — create Stripe Checkout for $50 setup fee
- `POST /api/billing/webhook` — Stripe webhook handler
- `GET /api/billing/portal` — redirect to Stripe Customer Portal
- `GET /api/billing/status` — return current plan, limits, usage

**Webhook events to handle:**
- `checkout.session.completed` — activate subscription, update plan
- `customer.subscription.updated` — plan changes (upgrade/downgrade)
- `customer.subscription.deleted` — revert to free tier (see Downgrade Behavior)
- `invoice.payment_failed` — 7-day grace period, email admin on each retry; after grace period expires, revert to free tier

### Limit Enforcement

**User limits:**
- On user creation/invite: check `userCount < userLimit`
- If at limit: return 403 with upgrade prompt
- Warn at 80% capacity

**Request limits:**
- On request submission: check `currentMonthRequestCount < monthlyRequestLimit`
- If at limit: return 403 with upgrade prompt
- Warn at 80% capacity
- Reset `currentMonthRequestCount` to 0 on `requestCountResetDate`
- Reset date advances monthly from subscription start

**Feature gating:**
- Middleware checks `organization.plan` against feature requirements
- Features not in the org's plan return 403 with upgrade prompt
- Client hides/disables gated features with upgrade badges
- The existing `organizationFeatures` table (feature toggles like `techRequestsEnabled`) is kept as an override layer on top of plan-based gating. Plan gating is the baseline; `organizationFeatures` can further restrict features within a plan but cannot grant features above the plan tier.

### Downgrade Behavior

When an organization downgrades (or reverts to free after payment failure):
- **Users over limit:** Existing users are NOT deleted. The org cannot add new users until they are under the new limit. Admin sees a banner: "You have X users but your plan allows Y. Remove users or upgrade to add more."
- **Requests over limit:** Monthly request count is unchanged. If already over the new limit for the current month, no new requests can be submitted until the next billing cycle resets the count (or they upgrade).
- **Gated features:** Features above the org's new tier become read-only. Existing data (analytics, templates, audit logs, messages) remains accessible for viewing but new creation/usage is blocked. Client shows upgrade badges on locked features.

### Existing Organization Migration

All existing organizations at launch will be set to **Free tier** with a grace period:
- Existing orgs keep access to all features they currently use for 30 days after launch
- During the 30-day window, admins see a banner explaining the new tiers and prompting them to choose a plan
- After 30 days, feature gating and limits are enforced per the Free tier
- User/request limits follow the same soft-lock behavior as downgrades (no data deleted, new creation blocked if over limit)

---

## 4. Pricing Page Redesign

### Layout
- **Header:** "Simple, Predictable Pricing" with school-focused subtitle
- **Billing toggle:** Monthly / Annual (show "Save 15%" badge on annual)
- **4 plan cards** side by side: Free, Starter, Professional (highlighted), Premium
- **Enterprise section** below cards with "Contact Sales" CTA
- **Feature comparison table** at bottom with all features x tiers
- **FAQ section** with pricing-specific questions

### Card CTAs
- Free → "Get Started Free"
- Starter/Professional/Premium → Stripe Checkout
- Enterprise → "Contact Sales" (Calendly link)

### Each card shows:
- Tier name
- Price (switches with billing toggle)
- User limit
- Request limit
- Key features (3-5 bullets)
- CTA button

---

## Success Criteria

1. New users can self-service signup and create their own organization
2. Onboarding wizard guides new admins through initial setup
3. Stripe handles all subscription billing (monthly and annual)
4. Plan limits (users, requests) are enforced server-side
5. Features are gated by plan tier (server-side + client-side)
6. Admins can upgrade/downgrade via Stripe Customer Portal
7. Pricing page accurately reflects tiers and links to Stripe Checkout
8. $50 setup fee works as a one-time Stripe payment
9. Super Admin role remains internal only
