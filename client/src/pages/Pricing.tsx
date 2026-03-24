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

const CALENDLY_URL = "https://calendly.com/repairrequest";

type Interval = "monthly" | "annual";

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  users: string;
  requests: string;
  cta: string;
  ctaVariant: "default" | "outline";
  highlighted: boolean;
  free: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: null,
    annualPrice: null,
    users: "100 users",
    requests: "500 req/mo",
    cta: "Get Started Free",
    ctaVariant: "outline",
    highlighted: false,
    free: true,
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 59.99,
    annualPrice: 50.99,
    users: "250 users",
    requests: "2,000 req/mo",
    cta: "Start Starter",
    ctaVariant: "outline",
    highlighted: false,
    free: false,
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 99.99,
    annualPrice: 84.99,
    users: "500 users",
    requests: "5,000 req/mo",
    cta: "Start Professional",
    ctaVariant: "default",
    highlighted: true,
    free: false,
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 199.99,
    annualPrice: 169.99,
    users: "Unlimited users",
    requests: "10,000 req/mo",
    cta: "Start Premium",
    ctaVariant: "outline",
    highlighted: false,
    free: false,
  },
];

interface FeatureRow {
  label: string;
  free: boolean | string;
  starter: boolean | string;
  professional: boolean | string;
  premium: boolean | string;
}

const featureRows: FeatureRow[] = [
  { label: "Core requests & tracking",    free: true,  starter: true,  professional: true,  premium: true },
  { label: "Photo attachments",           free: true,  starter: true,  professional: true,  premium: true },
  { label: "Email notifications",         free: true,  starter: true,  professional: true,  premium: true },
  { label: "Priority management",         free: true,  starter: true,  professional: true,  premium: true },
  { label: "Google OAuth",                free: true,  starter: true,  professional: true,  premium: true },
  { label: "Role-based access (4 roles)", free: true,  starter: true,  professional: true,  premium: true },
  { label: "Multi-building support",      free: false, starter: true,  professional: true,  premium: true },
  { label: "Request templates",           free: false, starter: true,  professional: true,  premium: true },
  { label: "Analytics & reporting",       free: false, starter: false, professional: true,  premium: true },
  { label: "Messaging threads",           free: false, starter: false, professional: true,  premium: true },
  { label: "API access & webhooks",       free: false, starter: false, professional: false, premium: true },
  { label: "Audit logging",               free: false, starter: false, professional: false, premium: true },
  { label: "User limit",                  free: "100", starter: "250", professional: "500", premium: "Unlimited" },
  { label: "Monthly requests",            free: "500", starter: "2,000", professional: "5,000", premium: "10,000" },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-gray-700 font-medium">{value}</span>;
  }
  return value ? (
    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
  ) : (
    <X className="h-5 w-5 text-gray-300 mx-auto" />
  );
}

async function handleCheckout(plan: string, interval: Interval) {
  try {
    const res = await fetch("/api/billing/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (err) {
    console.error("Checkout error:", err);
  }
}

export default function Pricing() {
  const [interval, setInterval] = useState<Interval>("monthly");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Pricing - RepairRequest Facilities Management Plans</title>
        <meta
          name="description"
          content="Simple, predictable pricing for school facility management. Free plan available for small schools. Paid plans from $50.99/mo. No hidden fees."
        />
        <link rel="canonical" href="https://www.repairrequest.org/pricing" />
        <meta property="og:title" content="RepairRequest Pricing - Transparent School Facilities Management" />
        <meta
          property="og:description"
          content="Free for small schools. Transparent, tiered pricing for comprehensive school facility management software."
        />
        <meta property="og:url" content="https://www.repairrequest.org/pricing" />
        <meta name="twitter:title" content="RepairRequest Pricing" />
        <meta name="twitter:description" content="Free for small schools. Simple, transparent pricing for facility management." />
      </Helmet>

      <PublicHeader currentPage="pricing" />

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple, Predictable Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Free for small schools. Upgrade as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="pb-8 px-4">
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${interval === "monthly" ? "text-gray-900" : "text-gray-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setInterval(interval === "monthly" ? "annual" : "monthly")}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              interval === "annual" ? "bg-blue-600" : "bg-gray-300"
            }`}
            aria-label="Toggle billing interval"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                interval === "annual" ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${interval === "annual" ? "text-gray-900" : "text-gray-500"}`}>
            Annual
          </span>
          {interval === "annual" && (
            <Badge className="bg-green-100 text-green-700 border-green-200">Save 15%</Badge>
          )}
        </div>
      </section>

      {/* Plan Cards */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price =
              plan.free
                ? null
                : interval === "annual"
                ? plan.annualPrice
                : plan.monthlyPrice;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? "border-2 border-blue-600 shadow-xl"
                    : "border border-gray-200"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    {plan.free ? (
                      <>
                        <span className="text-4xl font-bold text-gray-900">$0</span>
                        <span className="text-gray-500 text-sm block mt-1">forever free</span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900">
                          ${price?.toFixed(2)}
                        </span>
                        <span className="text-gray-500 text-sm">/mo</span>
                        {interval === "annual" && (
                          <p className="text-xs text-green-600 mt-1">billed annually</p>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {plan.users}
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {plan.requests}
                    </p>
                  </div>

                  <div className="mt-auto pt-4">
                    {plan.free ? (
                      <Link to="/signup" className="block">
                        <Button
                          variant={plan.ctaVariant}
                          className="w-full"
                        >
                          {plan.cta}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant={plan.ctaVariant}
                        className={`w-full ${
                          plan.highlighted
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : ""
                        }`}
                        onClick={() => handleCheckout(plan.id, interval)}
                      >
                        {plan.cta}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Setup Fee Callout */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Want us to set it up for you?
            </h3>
            <p className="text-amber-800 text-sm mb-4">
              For a one-time $50 setup fee, our team will configure your account, import your buildings and users, and get you up and running fast.
            </p>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-amber-400 text-amber-900 hover:bg-amber-100">
                Book a Setup Call
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Feature Comparison</h2>
            <p className="text-gray-600">See exactly what's included in each plan.</p>
          </div>

          <Card className="border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left font-semibold text-gray-700 w-1/2">Feature</th>
                      {plans.map((p) => (
                        <th
                          key={p.id}
                          className={`px-4 py-4 text-center font-semibold ${
                            p.highlighted ? "text-blue-600" : "text-gray-700"
                          }`}
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureRows.map((row, i) => (
                      <tr
                        key={row.label}
                        className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <td className="px-6 py-3 text-gray-700">{row.label}</td>
                        <td className="px-4 py-3 text-center">
                          <FeatureCell value={row.free} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <FeatureCell value={row.starter} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <FeatureCell value={row.professional} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <FeatureCell value={row.premium} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-10">
            <Mail className="h-10 w-10 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Enterprise</h2>
            <p className="text-gray-600 mb-6">
              Running a district or large campus? We offer custom pricing, dedicated support, SSO integrations, and tailored onboarding for enterprise customers.
            </p>
            <p className="text-2xl font-bold text-gray-900 mb-8">Custom Pricing</p>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Contact Sales
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
      <ScrollToTopButton />
      <ScrollToTop />
    </div>
  );
}
