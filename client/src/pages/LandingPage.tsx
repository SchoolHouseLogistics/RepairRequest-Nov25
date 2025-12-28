import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Clock, Shield, Mail, Building2, BarChart3, Calendar, GraduationCap, Home, Smartphone, QrCode, FileText, History, CreditCard, ClipboardCheck, Wrench, TrendingUp, Scale, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import luxuryCondoPath from "@assets/generated_images/Luxury_condo_building_exterior_4205c12c.png";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CalendlyWidget from "@/components/CalendlyWidget";
import ContactForm from "@/components/ContactForm";

type AudienceType = "schools" | "property";

const heroContent = {
  schools: {
    headline: "Maintenance Requests, Without the Chaos.",
    subheadline: "RepairRequest helps schools submit, prioritize, and track work orders—without emails, paper forms, or PDF backups.",
    bullets: [
      "Submit requests in seconds",
      "Track status from request to completion",
      "Keep teachers, admins, and facilities teams aligned"
    ],
    builtFor: "Built for K-12 Schools, Districts & Universities"
  },
  property: {
    headline: "Work Orders That Keep Tenants and Teams Aligned.",
    subheadline: "RepairRequest helps landlords and property managers capture issues fast, assign work, track progress, and document everything—across units and properties.",
    bullets: [
      "Tenant-friendly issue reporting",
      "Portfolio-wide visibility",
      "Clear documentation for chargebacks and compliance"
    ],
    builtFor: "Built for Landlords, Property Managers & HOAs"
  }
};

const addOnsSchools = [
  {
    icon: BarChart3,
    name: "Advanced Reporting & Analytics",
    description: "Gain insight into maintenance activity with resolution times, recurring issue tracking, and exportable reports to support planning and budgeting."
  },
  {
    icon: Building2,
    name: "Multi-Campus / District Management",
    description: "Manage multiple campuses under one account with campus-level dashboards, district-wide visibility, and role-based access controls."
  },
  {
    icon: Users,
    name: "Vendor & Contractor Access",
    description: "Assign work orders to external service providers while maintaining full visibility into progress and completion."
  },
  {
    icon: Smartphone,
    name: "Mobile Technician Tools",
    description: "Enable facilities teams to update work orders, upload photos, and manage requests directly from their phones."
  },
  {
    icon: QrCode,
    name: "QR Code Room & Asset Tagging",
    description: "Allow staff to scan a QR code in any room or on equipment to instantly submit a pre-filled maintenance request."
  },
  {
    icon: FileText,
    name: "Custom Forms & Workflow Rules",
    description: "Customize intake forms and approval workflows to match internal policies and department-specific needs."
  },
  {
    icon: History,
    name: "Maintenance History & Asset Records",
    description: "Maintain long-term records of repairs and service history to support audits, compliance, and capital planning."
  },
  {
    icon: CreditCard,
    name: "Stripe Payments & Chargebacks",
    description: "Enable secure online payments for billable maintenance, damage charges, or after-hours work. Payments tie directly to work orders with receipts and tracking."
  }
];

const addOnsProperty = [
  {
    icon: Home,
    name: "Tenant Maintenance Portal",
    description: "Let tenants submit maintenance requests with photos and unit selection, reducing calls, texts, and confusion."
  },
  {
    icon: FileCheck,
    name: "Lease-Aware Request Rules",
    description: "Flag billable vs non-billable issues and document responsibility to reduce disputes and enforce lease policies."
  },
  {
    icon: CreditCard,
    name: "Cost Tracking & Chargebacks",
    description: "Track labor and materials per unit and generate clean records for reimbursements and tenant chargebacks."
  },
  {
    icon: Building2,
    name: "Multi-Property Portfolio Management",
    description: "Manage multiple properties with property-level dashboards, portfolio reporting, and role-based access for managers."
  },
  {
    icon: ClipboardCheck,
    name: "Inspection & Turnover Tools",
    description: "Move-in and move-out inspection checklists with photos that automatically generate repair tasks and timelines."
  },
  {
    icon: Clock,
    name: "SLA & Response-Time Tracking",
    description: "Measure response and resolution performance, separate emergency vs routine issues, and stay compliant."
  },
  {
    icon: Wrench,
    name: "Vendor Dispatch & Invoicing",
    description: "Assign vendors, confirm completion, and upload/approve invoices with a clear maintenance paper trail."
  },
  {
    icon: TrendingUp,
    name: "Property Health Analytics",
    description: "Spot high-cost units, recurring issues, and preventative maintenance opportunities to protect asset value."
  },
  {
    icon: Scale,
    name: "Legal & Compliance Documentation",
    description: "Timestamped logs, photos, and communication history for audits, disputes, and insurance claims."
  },
  {
    icon: CreditCard,
    name: "Stripe Payments & Chargebacks",
    description: "Collect tenant payments for billable repairs or damages directly from work orders with automatic receipts and payment tracking."
  }
];

export default function LandingPage() {
  const [audience, setAudience] = useState<AudienceType>("schools");
  const content = heroContent[audience];
  const addOns = audience === "schools" ? addOnsSchools : addOnsProperty;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Helmet>
        <title>RepairRequest - Work Order & Maintenance Management Software</title>
        <meta name="description" content="Simple maintenance request and work order tracking for schools, landlords, and property managers. Submit requests in seconds, track status, and keep teams aligned." />
        <link rel="canonical" href="https://www.repairrequest.org/" />
        <meta property="og:title" content="RepairRequest - Work Orders Made Simple" />
        <meta property="og:description" content="Maintenance requests without the chaos. Submit, prioritize, and track work orders for schools and property managers." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.repairrequest.org/" />
        <meta name="twitter:title" content="RepairRequest - Work Orders Made Simple" />
        <meta name="twitter:description" content="Simple maintenance request and work order tracking." />
      </Helmet>
      
      <PublicHeader currentPage="home" />

      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Audience Toggle */}
          <div className="flex justify-center mb-10">
            <div 
              className="inline-flex rounded-lg bg-white dark:bg-gray-800 p-1 shadow-md"
              role="tablist"
              aria-label="Select your organization type"
            >
              <button
                role="tab"
                aria-selected={audience === "schools"}
                aria-controls="hero-content"
                id="tab-schools"
                onClick={() => setAudience("schools")}
                className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  audience === "schools"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                data-testid="toggle-schools"
              >
                <GraduationCap className="h-4 w-4" />
                For Schools
              </button>
              <button
                role="tab"
                aria-selected={audience === "property"}
                aria-controls="hero-content"
                id="tab-property"
                onClick={() => setAudience("property")}
                className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  audience === "property"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                data-testid="toggle-property"
              >
                <Home className="h-4 w-4" />
                For Property Managers
              </button>
            </div>
          </div>

          <div 
            id="hero-content"
            role="tabpanel"
            aria-labelledby={audience === "schools" ? "tab-schools" : "tab-property"}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 no-default-hover-elevate no-default-active-elevate">
                {content.builtFor}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                {content.headline}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                {content.subheadline}
              </p>
              <div className="space-y-3 mb-8 max-w-2xl mx-auto lg:mx-0">
                {content.bullets.map((bullet, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{bullet}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" data-testid="button-learn-more">
                    Learn What's Possible
                  </Button>
                </a>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-get-started">
                    Get Started Today
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right Video */}
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl shadow-2xl overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">See RepairRequest in Action</h3>
                    <p className="text-gray-300 text-sm">Watch how easy it is to manage maintenance requests</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-indigo-200 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple by Design. Powerful When You Need It.
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              RepairRequest is a simple maintenance request and work order tracking system that just works.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Quick Request Submission</CardTitle>
                <CardDescription>
                  Submit maintenance requests in seconds from any device with photos, categories, and priority levels.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Location & Unit Selection</CardTitle>
                <CardDescription>
                  Organize requests by building, floor, room, or unit for easy routing and tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Priority Ranking</CardTitle>
                <CardDescription>
                  Flag urgent issues and ensure critical repairs get addressed first.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Assignment & Status Tracking</CardTitle>
                <CardDescription>
                  Assign work to the right person and track progress from open to complete.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Keep everyone in the loop with automatic email updates on status changes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>History & Logs</CardTitle>
                <CardDescription>
                  Complete audit trail of every request, update, and communication.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Optional Add-Ons Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Optional Add-Ons
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              RepairRequest is intentionally simple from day one. Add these upgrades only when you need more scale, visibility, and control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addOns.map((addOn, index) => (
              <Card key={index} className="border-0 shadow-lg relative">
                <Badge className="absolute top-4 right-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs no-default-hover-elevate no-default-active-elevate">
                  Optional Add-On
                </Badge>
                <CardHeader className="pt-6">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
                    <addOn.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg pr-20">{addOn.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {addOn.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* CTA Below Add-Ons */}
          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 font-medium">
              Start simple. Add power when you're ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" data-testid="button-learn-addons">
                  {audience === "schools" ? "Talk to Our Schools Team" : "Talk to Our Property Team"}
                </Button>
              </a>
              <Link to="/pricing">
                <Button size="lg" variant="outline" data-testid="button-view-pricing">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {audience === "schools" 
                  ? "Built for How Schools Actually Work"
                  : "Built for Modern Property Management"
                }
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                {audience === "schools"
                  ? "From classroom repairs to campus-wide maintenance projects, RepairRequest keeps facilities teams organized and teachers informed."
                  : "Whether you manage one building or a portfolio, RepairRequest gives you the visibility and control you need to keep properties in top shape."
                }
              </p>
              
              <div className="space-y-4">
                {(audience === "schools" ? [
                  "Replace paper forms and email chains",
                  "Give teachers visibility into request status",
                  "Keep maintenance logs for audits and compliance",
                  "Reduce response times for urgent repairs",
                  "Plan maintenance budgets with better data"
                ] : [
                  "Reduce tenant calls and follow-up texts",
                  "Document everything for lease disputes",
                  "Track costs and bill back accurately",
                  "Stay ahead of maintenance issues",
                  "Keep vendors accountable with clear records"
                ]).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-2xl shadow-xl overflow-hidden">
              <img 
                src={luxuryCondoPath} 
                alt="Modern building exterior" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact and Calendly Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Schedule a Meeting - Calendly Widget */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule a Meeting</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Book a call with our team to discuss your organization's needs and explore our solutions.
              </p>
              
              <CalendlyWidget />
            </div>

            {/* Get In Touch - Contact Form */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get In Touch</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Ready to transform your operations? Send us a message and we'll get back to you promptly.
              </p>
              
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
      <ScrollToTopButton />
    </div>
  );
}
