# Self-Service Signup & Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow new users to self-service signup, create their own organization as admin, and walk through a 4-step onboarding wizard to set up their school.

**Architecture:** New signup flow creates an organization per user (instead of assigning to default org). After signup, users are routed to an onboarding wizard with 4 steps: name org, add buildings, add rooms, invite users. The wizard state is tracked via `onboardingCompleted` on the organizations table. An invitations table and email-based invite flow let admins bring in their team.

**Tech Stack:** React, TypeScript, Tailwind CSS, Express, Drizzle ORM, PostgreSQL, ZeptoMail (email), shadcn/ui components

**Spec:** `docs/superpowers/specs/2026-03-24-pricing-overhaul-design.md` (Section 2)

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `shared/schema.ts` (modify) | Add `onboardingCompleted` to orgs, add `invitations` table |
| `server/routes.ts` (modify) | Change signup to create org + admin, add invitation routes, add onboarding completion route |
| `server/storage.ts` (modify) | Add invitation CRUD, update createOrganization, update signup logic |
| `server/constants.ts` (modify) | Add `tech` to USER_ROLES |
| `client/src/pages/OnboardingWizard.tsx` | 4-step wizard page with step navigation |
| `client/src/components/onboarding/OrgSetupStep.tsx` | Step 1: Organization name + logo |
| `client/src/components/onboarding/BuildingSetupStep.tsx` | Step 2: Add buildings |
| `client/src/components/onboarding/RoomSetupStep.tsx` | Step 3: Add rooms to buildings |
| `client/src/components/onboarding/InviteUsersStep.tsx` | Step 4: Email invitations |
| `client/src/App.tsx` (modify) | Add `/onboarding` route, redirect logic for incomplete onboarding |
| `client/src/pages/SignupPage.tsx` (modify) | Redirect to `/onboarding` after signup |

---

## Task 1: Add `onboardingCompleted` column to organizations table

**Files:**
- Modify: `shared/schema.ts:29-47`

- [ ] **Step 1: Add the column to the organizations table definition**

In `shared/schema.ts`, add `onboardingCompleted` to the organizations table:

```typescript
// Inside the organizations pgTable definition, after the deletedAt field:
onboardingCompleted: boolean("onboarding_completed").default(false),
```

- [ ] **Step 2: Run the database migration**

```bash
cd /c/Users/jeffa/Documents/RepairRequest-Nov25
npx drizzle-kit push
```

Expected: Migration applies successfully, `onboarding_completed` column added to `organizations` table.

- [ ] **Step 3: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add onboardingCompleted column to organizations table"
```

---

## Task 2: Add invitations table to schema

**Files:**
- Modify: `shared/schema.ts`

- [ ] **Step 1: Add the invitations table definition**

Add after the existing tables in `shared/schema.ts`:

```typescript
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  role: varchar("role").notNull().default("requester"),
  invitedById: varchar("invited_by_id").references(() => users.id).notNull(),
  token: varchar("token").notNull().unique(),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

- [ ] **Step 2: Add the insert/select types**

Add near the other type exports:

```typescript
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;
```

- [ ] **Step 3: Run the database migration**

```bash
cd /c/Users/jeffa/Documents/RepairRequest-Nov25
npx drizzle-kit push
```

Expected: Migration applies, `invitations` table created.

- [ ] **Step 4: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add invitations table to schema"
```

---

## Task 3: Add `tech` role to USER_ROLES constant

**Files:**
- Modify: `server/constants.ts`

- [ ] **Step 1: Add tech to USER_ROLES**

In `server/constants.ts`, find the `USER_ROLES` object (around line 14) and add `tech`:

```typescript
export const USER_ROLES = {
  REQUESTER: "requester",
  MAINTENANCE: "maintenance",
  TECH: "tech",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add server/constants.ts
git commit -m "fix: add tech role to USER_ROLES constant"
```

---

## Task 4: Add invitation storage methods

**Files:**
- Modify: `server/storage.ts`

- [ ] **Step 1: Import the invitations table**

At the top of `server/storage.ts`, add `invitations` to the schema imports:

```typescript
import { ..., invitations, Invitation, InsertInvitation } from "@shared/schema";
```

- [ ] **Step 2: Add invitation CRUD methods to the DatabaseStorage class**

Add these methods to the `DatabaseStorage` class:

```typescript
async createInvitation(data: InsertInvitation): Promise<Invitation> {
  const [invitation] = await db.insert(invitations).values(data).returning();
  return invitation;
}

async getInvitationByToken(token: string): Promise<Invitation | undefined> {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.token, token), isNull(invitations.acceptedAt)))
    .limit(1);
  return invitation;
}

async getInvitationsByOrganization(orgId: number): Promise<Invitation[]> {
  return db
    .select()
    .from(invitations)
    .where(eq(invitations.organizationId, orgId))
    .orderBy(desc(invitations.createdAt));
}

async markInvitationAccepted(id: number): Promise<void> {
  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, id));
}
```

- [ ] **Step 3: Add the method signatures to the IStorage interface**

Find the `IStorage` interface and add:

```typescript
createInvitation(data: InsertInvitation): Promise<Invitation>;
getInvitationByToken(token: string): Promise<Invitation | undefined>;
getInvitationsByOrganization(orgId: number): Promise<Invitation[]>;
markInvitationAccepted(id: number): Promise<void>;
```

- [ ] **Step 4: Verify the server starts without errors**

```bash
cd /c/Users/jeffa/Documents/RepairRequest-Nov25
npx tsx server/index.ts &
# Wait a few seconds, then kill it
kill %1
```

Expected: Server starts without TypeScript compilation errors.

- [ ] **Step 5: Commit**

```bash
git add server/storage.ts
git commit -m "feat: add invitation storage methods"
```

---

## Task 5: Modify signup route to create new organization

**Files:**
- Modify: `server/routes.ts:2459-2528` (email/password signup)

- [ ] **Step 1: Update the email/password signup handler**

Find the signup route handler (around line 2459, `app.post("/api/auth/signup", ...)`). Replace the section that gets the default organization ID with logic to create a new organization:

```typescript
// REPLACE the getDefaultOrganizationId() call with:
const crypto = await import("crypto");
const slug = `org-${crypto.randomUUID().slice(0, 8)}`;
const newOrg = await storage.createOrganization({
  name: `${firstName}'s School`,
  slug,
  settings: {},
});
const organizationId = newOrg.id;
```

- [ ] **Step 2: Change the default role from "requester" to "admin"**

In the same signup handler, find where the user is created with `role: "requester"` and change it to:

```typescript
role: "admin",
```

- [ ] **Step 3: Update the Google OAuth callback handler similarly**

Find the Google OAuth callback handler (around line 370). In the section where a new user is created (the `if (!existingUser)` branch), apply the same changes:

1. Create a new organization instead of using `getDefaultOrganizationId()`
2. Set role to `"admin"` instead of `"requester"`

But KEEP the existing user path unchanged — if a user already exists (returning login), just log them in as before.

- [ ] **Step 4: Handle invited user signup**

In BOTH signup handlers (email/password and Google OAuth), BEFORE creating a new org, check if the user was invited:

```typescript
// Check for invitation token in query params or session
const inviteToken = req.query.invite as string | undefined;
let organizationId: number | undefined;
let role = "admin";

if (inviteToken) {
  const invitation = await storage.getInvitationByToken(inviteToken);
  if (invitation && invitation.expiresAt > new Date()) {
    organizationId = invitation.organizationId;
    role = invitation.role;
    await storage.markInvitationAccepted(invitation.id);
  }
}

if (!organizationId) {
  // Create new org (existing code from step 1)
  const crypto = await import("crypto");
  const slug = `org-${crypto.randomUUID().slice(0, 8)}`;
  const newOrg = await storage.createOrganization({
    name: `${firstName}'s School`,
    slug,
    settings: {},
  });
  organizationId = newOrg.id;
}
```

- [ ] **Step 5: Verify signup creates a new org**

Start the server, sign up with a test account, and verify:
1. A new organization was created in the database
2. The user was assigned to that new org with role `admin`

```bash
cd /c/Users/jeffa/Documents/RepairRequest-Nov25
npm run dev
```

Test manually via the signup page, then check the database.

- [ ] **Step 6: Commit**

```bash
git add server/routes.ts
git commit -m "feat: signup creates new org and assigns admin role"
```

---

## Task 6: Add invitation API routes

**Files:**
- Modify: `server/routes.ts`

- [ ] **Step 1: Add POST /api/invitations route**

Add a new route for creating invitations (near the other API routes):

```typescript
app.post("/api/invitations", authMiddleware, requireRole("admin"), async (req, res) => {
  const { email, role } = req.body;
  const user = req.session.user!;

  if (!email || !role) {
    return res.status(400).json({ error: "Email and role are required" });
  }

  const validRoles = ["requester", "maintenance", "tech", "admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const crypto = await import("crypto");
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

  const invitation = await storage.createInvitation({
    email,
    organizationId: user.organizationId!,
    role,
    invitedById: user.id,
    token,
    expiresAt,
  });

  // Send invitation email
  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
  const inviteLink = `${appUrl}/signup?invite=${token}`;

  try {
    const { sendEmail } = await import("./emailService");
    await sendEmail({
      to: email,
      subject: `You've been invited to join RepairRequest`,
      html: `
        <p>You've been invited to join an organization on RepairRequest.</p>
        <p>Click the link below to create your account:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>This invitation expires in 7 days.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send invitation email:", err);
  }

  res.json({ invitation });
});
```

- [ ] **Step 2: Add GET /api/invitations route**

```typescript
app.get("/api/invitations", authMiddleware, requireRole("admin"), async (req, res) => {
  const user = req.session.user!;
  const invitations = await storage.getInvitationsByOrganization(user.organizationId!);
  res.json(invitations);
});
```

- [ ] **Step 2.5: Add storage methods for onboarding status**

Add to `server/storage.ts` (DatabaseStorage class):

```typescript
async markOnboardingCompleted(orgId: number): Promise<void> {
  await db
    .update(organizations)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));
}

async getOnboardingStatus(orgId: number): Promise<boolean> {
  const [org] = await db
    .select({ onboardingCompleted: organizations.onboardingCompleted })
    .from(organizations)
    .where(eq(organizations.id, orgId));
  return org?.onboardingCompleted ?? false;
}

async updateOrganizationName(orgId: number, name: string): Promise<void> {
  await db
    .update(organizations)
    .set({ name, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));
}
```

Add to the `IStorage` interface:

```typescript
markOnboardingCompleted(orgId: number): Promise<void>;
getOnboardingStatus(orgId: number): Promise<boolean>;
updateOrganizationName(orgId: number, name: string): Promise<void>;
```

- [ ] **Step 3: Add POST /api/onboarding/complete route**

```typescript
app.post("/api/onboarding/complete", authMiddleware, requireRole("admin"), async (req, res) => {
  const user = req.session.user!;
  await storage.markOnboardingCompleted(user.organizationId!);
  res.json({ success: true });
});
```

- [ ] **Step 4: Add GET /api/onboarding/status route**

```typescript
app.get("/api/onboarding/status", authMiddleware, async (req, res) => {
  const user = req.session.user!;
  if (!user.organizationId) {
    return res.json({ completed: false });
  }
  const completed = await storage.getOnboardingStatus(user.organizationId);
  res.json({ completed });
});
```

- [ ] **Step 5: Commit**

```bash
git add server/routes.ts
git commit -m "feat: add invitation and onboarding API routes"
```

---

## Task 7: Create the onboarding wizard page

**Files:**
- Create: `client/src/pages/OnboardingWizard.tsx`

- [ ] **Step 1: Create the wizard page with step navigation**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import OrgSetupStep from "@/components/onboarding/OrgSetupStep";
import BuildingSetupStep from "@/components/onboarding/BuildingSetupStep";
import RoomSetupStep from "@/components/onboarding/RoomSetupStep";
import InviteUsersStep from "@/components/onboarding/InviteUsersStep";

const steps = [
  { label: "Organization", component: OrgSetupStep },
  { label: "Buildings", component: BuildingSetupStep },
  { label: "Rooms", component: RoomSetupStep },
  { label: "Invite Team", component: InviteUsersStep },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await fetch("/api/onboarding/complete", { method: "POST" });
    navigate("/dashboard");
  };

  const handleFinish = async () => {
    await fetch("/api/onboarding/complete", { method: "POST" });
    navigate("/dashboard");
  };

  const StepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentStep
                  ? "bg-green-500 text-white"
                  : index === currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${
                index === currentStep ? "font-medium text-gray-900" : "text-gray-500"
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-3 ${
                  index < currentStep ? "bg-green-500" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <StepComponent onNext={handleNext} />

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              ) : (
                <Button onClick={handleFinish} className="bg-blue-600 hover:bg-blue-700">
                  Finish Setup
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/OnboardingWizard.tsx
git commit -m "feat: create onboarding wizard page with step navigation"
```

---

## Task 8: Create Step 1 — Organization Setup component

**Files:**
- Create: `client/src/components/onboarding/OrgSetupStep.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrgSetupStepProps {
  onNext: () => void;
}

export default function OrgSetupStep({ onNext }: OrgSetupStepProps) {
  const { toast } = useToast();
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!orgName.trim()) {
      toast({ title: "Please enter your school name", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      if (!res.ok) throw new Error("Failed to update organization");
      onNext();
    } catch {
      toast({ title: "Error saving organization", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Name Your School</h2>
          <p className="text-gray-500">This is how your organization will appear in RepairRequest.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="orgName">School / Organization Name *</Label>
          <Input
            id="orgName"
            placeholder="e.g. Lincoln Academy"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div>
          <Label htmlFor="orgLogo">School Logo (optional)</Label>
          <Input
            id="orgLogo"
            type="file"
            accept="image/*"
            className="cursor-pointer"
            onChange={(e) => {
              // Logo upload is optional — store file for upload during save
              // Uses existing photo upload infrastructure if available
            }}
          />
          <p className="text-xs text-gray-400 mt-1">You can add or change this later in settings.</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the PATCH /api/user/organization route on the server**

In `server/routes.ts`, add:

```typescript
app.patch("/api/user/organization", authMiddleware, requireRole("admin"), async (req, res) => {
  const user = req.session.user!;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Organization name is required" });
  }

  await storage.updateOrganizationName(user.organizationId!, name.trim());
  res.json({ success: true });
});
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/onboarding/OrgSetupStep.tsx server/routes.ts
git commit -m "feat: add organization setup step for onboarding"
```

---

## Task 9: Update building routes to allow org admins + Create Step 2 component

**Files:**
- Modify: `server/routes.ts` (building CRUD routes)
- Create: `client/src/components/onboarding/BuildingSetupStep.tsx`

- [ ] **Step 0: Update building routes to allow org admin access**

The existing building CRUD routes (`POST /api/admin/buildings`, `PATCH /api/admin/buildings/:id`) currently require super_admin. Update these route handlers in `server/routes.ts` to also allow `admin` role, scoped to their own organization. Find the `requireRole("super_admin")` middleware on these routes and change to `requireRole("admin", "super_admin")`. Ensure the route handler filters by the user's `organizationId` so admins can only manage their own org's buildings.

- [ ] **Step 1: Create the component**

This step uses the existing `POST /api/admin/buildings` endpoint to add buildings.

```typescript
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrgSetupStepProps {
  onNext: () => void;
}

export default function BuildingSetupStep({ onNext }: OrgSetupStepProps) {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<{ name: string; address: string }[]>([
    { name: "", address: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const addBuilding = () => {
    setBuildings([...buildings, { name: "", address: "" }]);
  };

  const removeBuilding = (index: number) => {
    setBuildings(buildings.filter((_, i) => i !== index));
  };

  const updateBuilding = (index: number, field: "name" | "address", value: string) => {
    const updated = [...buildings];
    updated[index][field] = value;
    setBuildings(updated);
  };

  const handleSave = async () => {
    const validBuildings = buildings.filter((b) => b.name.trim());
    if (validBuildings.length === 0) {
      toast({ title: "Add at least one building", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      for (const building of validBuildings) {
        const res = await fetch("/api/admin/buildings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: building.name, address: building.address }),
        });
        if (!res.ok) throw new Error("Failed to create building");
      }
      onNext();
    } catch {
      toast({ title: "Error saving buildings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add Your Buildings</h2>
          <p className="text-gray-500">List the buildings on your campus. You can always add more later.</p>
        </div>
      </div>

      <div className="space-y-4">
        {buildings.map((building, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Building name (e.g. Main Building)"
                value={building.name}
                onChange={(e) => updateBuilding(index, "name", e.target.value)}
              />
              <Input
                placeholder="Address (optional)"
                value={building.address}
                onChange={(e) => updateBuilding(index, "address", e.target.value)}
              />
            </div>
            {buildings.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeBuilding(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}

        <Button variant="outline" onClick={addBuilding} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Another Building
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/onboarding/BuildingSetupStep.tsx
git commit -m "feat: add building setup step for onboarding"
```

---

## Task 10: Create Step 3 — Room Setup component

**Files:**
- Create: `client/src/components/onboarding/RoomSetupStep.tsx`

- [ ] **Step 1: Create the component**

This step fetches the buildings created in Step 2 and lets the user add rooms to each one. Uses the existing buildings API which stores `roomNumbers` as a JSON array.

```typescript
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DoorOpen, Plus, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrgSetupStepProps {
  onNext: () => void;
}

interface Building {
  id: number;
  name: string;
  roomNumbers: string[];
}

export default function RoomSetupStep({ onNext }: OrgSetupStepProps) {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/buildings")
      .then((res) => res.json())
      .then((data) => {
        setBuildings(data);
        const initialRooms: Record<number, string[]> = {};
        data.forEach((b: Building) => {
          initialRooms[b.id] = b.roomNumbers?.length ? b.roomNumbers : [""];
        });
        setRooms(initialRooms);
      })
      .finally(() => setLoading(false));
  }, []);

  const addRoom = (buildingId: number) => {
    setRooms({ ...rooms, [buildingId]: [...(rooms[buildingId] || []), ""] });
  };

  const removeRoom = (buildingId: number, index: number) => {
    const updated = [...(rooms[buildingId] || [])];
    updated.splice(index, 1);
    setRooms({ ...rooms, [buildingId]: updated });
  };

  const updateRoom = (buildingId: number, index: number, value: string) => {
    const updated = [...(rooms[buildingId] || [])];
    updated[index] = value;
    setRooms({ ...rooms, [buildingId]: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const building of buildings) {
        const roomList = (rooms[building.id] || []).filter((r) => r.trim());
        await fetch(`/api/admin/buildings/${building.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomNumbers: roomList }),
        });
      }
      onNext();
    } catch {
      toast({ title: "Error saving rooms", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading buildings...</div>;

  if (buildings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">No buildings added yet.</p>
        <p className="text-sm text-gray-400">Go back and add buildings first, or skip this step.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <DoorOpen className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add Rooms & Areas</h2>
          <p className="text-gray-500">Add rooms, offices, or areas to each building. You can add more later.</p>
        </div>
      </div>

      <div className="space-y-6">
        {buildings.map((building) => (
          <div key={building.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">{building.name}</h3>
            </div>
            <div className="space-y-2">
              {(rooms[building.id] || []).map((room, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Room name or number (e.g. Room 101, Gym, Cafeteria)"
                    value={room}
                    onChange={(e) => updateRoom(building.id, index, e.target.value)}
                  />
                  {(rooms[building.id] || []).length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeRoom(building.id, index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addRoom(building.id)}>
                <Plus className="w-4 h-4 mr-1" /> Add Room
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/onboarding/RoomSetupStep.tsx
git commit -m "feat: add room setup step for onboarding"
```

---

## Task 11: Create Step 4 — Invite Users component

**Files:**
- Create: `client/src/components/onboarding/InviteUsersStep.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrgSetupStepProps {
  onNext: () => void;
}

interface InviteRow {
  email: string;
  role: string;
}

export default function InviteUsersStep({ onNext }: OrgSetupStepProps) {
  const { toast } = useToast();
  const [invites, setInvites] = useState<InviteRow[]>([{ email: "", role: "requester" }]);
  const [sending, setSending] = useState(false);

  const addInvite = () => {
    setInvites([...invites, { email: "", role: "requester" }]);
  };

  const removeInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const updateInvite = (index: number, field: "email" | "role", value: string) => {
    const updated = [...invites];
    updated[index][field] = value;
    setInvites(updated);
  };

  const handleSend = async () => {
    const validInvites = invites.filter((inv) => inv.email.trim());
    if (validInvites.length === 0) return;

    setSending(true);
    let successCount = 0;

    try {
      for (const invite of validInvites) {
        const res = await fetch("/api/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: invite.email, role: invite.role }),
        });
        if (res.ok) successCount++;
      }

      if (successCount > 0) {
        toast({ title: `${successCount} invitation${successCount > 1 ? "s" : ""} sent!` });
      }
    } catch {
      toast({ title: "Error sending invitations", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
          <Users className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invite Your Team</h2>
          <p className="text-gray-500">Send email invitations to teachers, staff, and maintenance team members.</p>
        </div>
      </div>

      <div className="space-y-3">
        {invites.map((invite, index) => (
          <div key={index} className="flex gap-3 items-center">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="email@school.edu"
                value={invite.email}
                onChange={(e) => updateInvite(index, "email", e.target.value)}
              />
            </div>
            <select
              value={invite.role}
              onChange={(e) => updateInvite(index, "role", e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="requester">Requester</option>
              <option value="maintenance">Maintenance</option>
              <option value="tech">Tech</option>
              <option value="admin">Admin</option>
            </select>
            {invites.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeInvite(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}

        <Button variant="outline" onClick={addInvite} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Another
        </Button>
      </div>

      {invites.some((inv) => inv.email.trim()) && (
        <div className="mt-4">
          <Button onClick={handleSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
            <Mail className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : "Send Invitations"}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/onboarding/InviteUsersStep.tsx
git commit -m "feat: add invite users step for onboarding"
```

---

## Task 12: Wire up routing and onboarding redirect

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/pages/SignupPage.tsx`

- [ ] **Step 1: Add the onboarding route to App.tsx**

In `client/src/App.tsx`, import OnboardingWizard and add the route inside the protected routes section:

```typescript
import OnboardingWizard from "@/pages/OnboardingWizard";
```

Add the route alongside the other protected routes (inside the `ProtectedLayout` routes):

```tsx
<Route path="/onboarding" element={<OnboardingWizard />} />
```

- [ ] **Step 2: Add onboarding redirect logic**

In the `ProtectedLayout` component (or wherever the auth check happens in App.tsx), add a check: if the user is an admin and onboarding is not completed, redirect to `/onboarding`.

Create a hook or add inline logic:

```typescript
// In the ProtectedLayout or equivalent wrapper:
const [onboardingChecked, setOnboardingChecked] = useState(false);
const [needsOnboarding, setNeedsOnboarding] = useState(false);

useEffect(() => {
  fetch("/api/onboarding/status")
    .then((res) => res.json())
    .then((data) => {
      setNeedsOnboarding(!data.completed);
      setOnboardingChecked(true);
    })
    .catch(() => setOnboardingChecked(true));
}, []);

// In the render, if needsOnboarding and current path is not /onboarding:
if (onboardingChecked && needsOnboarding && user?.role === "admin" && location.pathname !== "/onboarding") {
  return <Navigate to="/onboarding" replace />;
}
```

- [ ] **Step 3: Update SignupPage.tsx to redirect to /onboarding**

In `client/src/pages/SignupPage.tsx`, change the post-signup redirect from `/dashboard` to `/onboarding`:

Find the navigation after successful signup (around line 80) and change:

```typescript
// Change from:
navigate("/dashboard");
// To:
navigate("/onboarding");
```

- [ ] **Step 4: Update the signup page to accept invite tokens**

In `SignupPage.tsx`, read the `invite` query parameter and pass it to the signup API:

```typescript
import { useSearchParams } from "react-router-dom";

// Inside the component:
const [searchParams] = useSearchParams();
const inviteToken = searchParams.get("invite");

// In the signup fetch call, append the invite token:
const response = await fetch(`/api/auth/signup${inviteToken ? `?invite=${inviteToken}` : ""}`, {
  // ... existing options
});

// If invited user, skip onboarding — go straight to dashboard:
if (inviteToken) {
  navigate("/dashboard");
} else {
  navigate("/onboarding");
}
```

- [ ] **Step 5: Test the full flow manually**

```bash
cd /c/Users/jeffa/Documents/RepairRequest-Nov25
npm run dev
```

1. Sign up with a new email → should land on onboarding wizard
2. Complete all 4 steps → should land on dashboard
3. Log out and back in → should go to dashboard (not onboarding again)
4. Sign up via invite link → should go to dashboard (skip onboarding)

- [ ] **Step 6: Commit**

```bash
git add client/src/App.tsx client/src/pages/SignupPage.tsx
git commit -m "feat: wire up onboarding routing and redirect logic"
```

---

## Task 13: Clean up — remove DEFAULT_ORGANIZATION_ID fallback

**Files:**
- Modify: `server/routes.ts`

- [ ] **Step 1: Remove the getDefaultOrganizationId function**

Find the `getDefaultOrganizationId` function (around line 141-165 in routes.ts). Remove the entire function. It is no longer needed since signups create their own org.

- [ ] **Step 2: Remove any references to DEFAULT_ORGANIZATION_ID**

Search for any remaining references to `DEFAULT_ORGANIZATION_ID` or `getDefaultOrganizationId` in routes.ts and remove them.

- [ ] **Step 3: Verify server starts**

```bash
cd /c/Users/jeffa/Documents/RepairRequest-Nov25
npx tsx server/index.ts &
kill %1
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add server/routes.ts
git commit -m "refactor: remove DEFAULT_ORGANIZATION_ID fallback, signups create own org"
```
