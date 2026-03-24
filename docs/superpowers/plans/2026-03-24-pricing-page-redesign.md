# Pricing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 2-card pricing page with a tiered pricing page featuring Free, Starter, Professional, Premium plans with monthly/annual toggle, plus Enterprise section and feature comparison table.

**Architecture:** Complete rewrite of `Pricing.tsx`. Uses PLAN_CONFIGS from shared schema for consistency. Billing toggle switches displayed prices between monthly and annual (15% discount). CTAs link to Stripe checkout (paid tiers) or signup (free tier). Feature comparison table at the bottom shows all features across all tiers.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-24-pricing-overhaul-design.md` (Section 4)

---

## File Structure

| File | Changes |
|------|---------|
| `client/src/pages/Pricing.tsx` | Complete rewrite — new tiered layout |

---

## Task 1: Rewrite the Pricing page

**Files:**
- Modify: `client/src/pages/Pricing.tsx` (complete rewrite)

- [ ] **Step 1: Replace Pricing.tsx with the new tiered pricing page**

Replace the entire contents of `client/src/pages/Pricing.tsx` with:

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CalendlyWidget from "@/components/CalendlyWidget";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Get started with the basics",
    userLimit: "100 users",
    requestLimit: "500 requests/mo",
    cta: "Get Started Free",
    ctaLink: "/signup",
    highlighted: false,
    features: [
      "Core requests & tracking",
      "Photo attachments",
      "Email notifications",
      "Priority management",
      "Google OAuth",
      "4 user roles",
    ],
  },
  {
    name: "Starter",
    monthlyPrice: 59.99,
    annualPrice: 50.99,
    description: "For growing schools",
    userLimit: "250 users",
    requestLimit: "2,000 requests/mo",
    cta: "Start with Starter",
    ctaVariant: "default" as const,
    highlighted: false,
    stripePlan: "starter",
    features: [
      "Everything in Free",
      "Multi-building support",
      "Request templates",
    ],
  },
  {
    name: "Professional",
    monthlyPrice: 99.99,
    annualPrice: 84.99,
    description: "For established campuses",
    userLimit: "500 users",
    requestLimit: "5,000 requests/mo",
    cta: "Go Professional",
    ctaVariant: "default" as const,
    highlighted: true,
    stripePlan: "professional",
    features: [
      "Everything in Starter",
      "Analytics & reporting",
      "Messaging threads",
    ],
  },
  {
    name: "Premium",
    monthlyPrice: 199.99,
    annualPrice: 169.99,
    description: "For large schools & networks",
    userLimit: "Unlimited users",
    requestLimit: "10,000 requests/mo",
    cta: "Go Premium",
    ctaVariant: "default" as const,
    highlighted: false,
    stripePlan: "premium",
    features: [
      "Everything in Professional",
      "API access & webhooks",
      "Audit logging",
    ],
  },
];

const featureComparisonRows = [
  { feature: "Core requests & tracking", free: true, starter: true, pro: true, premium: true },
  { feature: "Photo attachments", free: true, starter: true, pro: true, premium: true },
  { feature: "Email notifications", free: true, starter: true, pro: true, premium: true },
  { feature: "Priority management", free: true, starter: true, pro: true, premium: true },
  { feature: "Google OAuth", free: true, starter: true, pro: true, premium: true },
  { feature: "Role-based access (4 roles)", free: true, starter: true, pro: true, premium: true },
  { feature: "Multi-building support", free: false, starter: true, pro: true, premium: true },
  { feature: "Request templates", free: false, starter: true, pro: true, premium: true },
  { feature: "Analytics & reporting", free: false, starter: false, pro: true, premium: true },
  { feature: "Messaging threads", free: false, starter: false, pro: true, premium: true },
  { feature: "API access & webhooks", free: false, starter: false, pro: false, premium: true },
  { feature: "Audit logging", free: false, starter: false, pro: false, premium: true },
  { feature: "User limit", free: "100", starter: "250", pro: "500", premium: "Unlimited" },
  { feature: "Monthly requests", free: "500", starter: "2,000", pro: "5,000", premium: "10,000" },
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const handleCheckout = async (plan: string) => {
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          interval: isAnnual ? "annual" : "monthly",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Pricing - RepairRequest School Maintenance Plans</title>
        <meta name="description" content="Simple pricing for school maintenance management. Free for up to 100 users. Paid plans from $59.99/month with annual discounts. No hidden fees." />
        <link rel="canonical" href="https://www.repairrequest.org/pricing" />
        <meta property="og:title" content="RepairRequest Pricing - School Maintenance Plans" />
        <meta property="og:description" content="Free for up to 100 users. Paid plans from $59.99/month. Built for schools." />
        <meta property="og:url" content="https://www.repairrequest.org/pricing" />
        <meta name="twitter:title" content="RepairRequest Pricing" />
        <meta name="twitter:description" content="Simple, transparent pricing for school maintenance management." />
      </Helmet>

      <PublicHeader currentPage="pricing" />

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple, Predictable Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Free for small schools. Affordable plans that grow with your campus. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md border mb-4">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isAnnual ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isAnnual ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
            </button>
          </div>
          {isAnnual && (
            <p className="text-sm text-green-600 font-medium">Save 15% with annual billing</p>
          )}
        </div>
      </section>

      {/* Plan Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.highlighted
                      ? "border-2 border-blue-600 shadow-xl scale-[1.02]"
                      : "border border-gray-200 shadow-lg"
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                    <div className="mt-4">
                      {price === 0 ? (
                        <span className="text-4xl font-bold">Free</span>
                      ) : (
                        <>
                          <span className="text-4xl font-bold">${price}</span>
                          <span className="text-gray-500">/mo</span>
                        </>
                      )}
                      {isAnnual && price > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          ${(price * 12).toFixed(2)}/year
                        </p>
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-gray-500">{plan.userLimit}</p>
                      <p className="text-xs text-gray-500">{plan.requestLimit}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.ctaLink ? (
                      <Link to={plan.ctaLink}>
                        <Button
                          className={`w-full ${
                            plan.highlighted
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : ""
                          }`}
                          variant={plan.highlighted ? "default" : "outline"}
                        >
                          {plan.cta}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className={`w-full ${
                          plan.highlighted
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : ""
                        }`}
                        variant={plan.highlighted ? "default" : "outline"}
                        onClick={() => plan.stripePlan && handleCheckout(plan.stripePlan)}
                      >
                        {plan.cta}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Setup Fee Callout */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-blue-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Want us to set it up for you?
            </h3>
            <p className="text-gray-600 mb-4">
              For a one-time $50 fee, our team will configure your buildings, rooms, and user accounts so you can start using RepairRequest right away.
            </p>
            <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                Book Setup Call
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Enterprise
          </h2>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Custom solutions for large schools and multi-campus networks. Priority support, custom onboarding, and flexible limits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Contact Sales
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Compare Plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-1/3">Feature</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Free</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Starter</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-blue-600">Professional</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Premium</th>
                </tr>
              </thead>
              <tbody>
                {featureComparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{row.feature}</td>
                    {(["free", "starter", "pro", "premium"] as const).map((tier) => (
                      <td key={tier} className="px-4 py-3 text-center">
                        {typeof row[tier] === "boolean" ? (
                          row[tier] ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-gray-700">{row[tier]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <PublicFooter />
      <ScrollToTopButton />
      <ScrollToTop />
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

```bash
cd /c/Users/jeffa/Documents/RepairRequest-Nov25
npm run dev
```

Open the pricing page in a browser and verify:
1. Monthly/Annual toggle works and prices switch
2. All 4 plan cards display correctly
3. "Most Popular" badge on Professional
4. Feature comparison table renders
5. Enterprise section shows
6. $50 setup callout shows
7. Free tier links to /signup, paid tiers call checkout

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Pricing.tsx
git commit -m "feat: redesign pricing page with tiered plans and billing toggle"
```

---

## Task 2: Update pricing-related meta descriptions on other pages

**Files:**
- Modify: `client/src/pages/LandingPage.tsx`
- Modify: `client/src/pages/FAQ.tsx`

- [ ] **Step 1: Update the FAQ pricing answer**

In `client/src/pages/FAQ.tsx`, find the FAQ about pricing or getting started. If there's a question like "How do we get started?" update the answer to mention the free tier:

Change the "How do we get started?" answer to:
```
"Getting started is free. Sign up, set up your buildings and rooms, and start accepting repair requests immediately. Upgrade anytime for more users, requests, and features."
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/FAQ.tsx
git commit -m "feat: update FAQ with free tier messaging"
```
