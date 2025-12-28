import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Clock, Shield, Mail, Building2, Settings, BarChart3, Calendar, GraduationCap, Home, FileText, QrCode, Smartphone, Wrench, ClipboardCheck, DollarSign, TrendingUp, Scale, Eye, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CalendlyWidget from "@/components/CalendlyWidget";
import ContactForm from "@/components/ContactForm";

type AudienceType = "schools" | "property-managers";

const schoolsAddOns = [
  {
    icon: BarChart3,
    title: "Advanced Reporting & Analytics",
    description: "Gain insight into maintenance activity with resolution times, recurring issue tracking, and exportable reports to support planning and budgeting."
  },
  {
    icon: Building2,
    title: "Multi-Campus / District Management",
    description: "Manage multiple campuses under one account with campus-level dashboards, district-wide visibility, and role-based access controls."
  },
  {
    icon: Wrench,
    title: "Vendor & Contractor Access",
    description: "Assign work orders to external service providers while maintaining full visibility into progress and completion."
  },
  {
    icon: Smartphone,
    title: "Mobile Technician Tools",
    description: "Enable facilities teams to update work orders, upload photos, and manage requests directly from their phones."
  },
  {
    icon: QrCode,
    title: "QR Code Room & Asset Tagging",
    description: "Allow staff to scan a QR code in any room or on equipment to instantly submit a pre-filled maintenance request."
  },
  {
    icon: Settings,
    title: "Custom Forms & Workflow Rules",
    description: "Customize intake forms and approval workflows to match internal policies and department-specific needs."
  },
  {
    icon: FileText,
    title: "Maintenance History & Asset Records",
    description: "Maintain long-term records of repairs and service history to support audits, compliance, and capital planning."
  },
  {
    icon: DollarSign,
    title: "Stripe Payments & Chargebacks",
    description: "Enable secure online payments for billable maintenance, damage charges, or after-hours work. Payments tie directly to work orders with receipts and tracking."
  }
];

const propertyManagerAddOns = [
  {
    icon: Users,
    title: "Tenant Maintenance Portal",
    description: "Let tenants submit maintenance requests with photos and unit selection, reducing calls, texts, and confusion."
  },
  {
    icon: FileText,
    title: "Lease-Aware Request Rules",
    description: "Flag billable vs non-billable issues and document responsibility to reduce disputes and enforce lease policies."
  },
  {
    icon: DollarSign,
    title: "Cost Tracking & Chargebacks",
    description: "Track labor and materials per unit and generate clean records for reimbursements and tenant chargebacks."
  },
  {
    icon: Building2,
    title: "Multi-Property Portfolio Management",
    description: "Manage multiple properties with property-level dashboards, portfolio reporting, and role-based access for managers."
  },
  {
    icon: ClipboardCheck,
    title: "Inspection & Turnover Tools",
    description: "Move-in and move-out inspection checklists with photos that automatically generate repair tasks and timelines."
  },
  {
    icon: Clock,
    title: "SLA & Response-Time Tracking",
    description: "Measure response and resolution performance, separate emergency vs routine issues, and stay compliant."
  },
  {
    icon: Wrench,
    title: "Vendor Dispatch & Invoicing",
    description: "Assign vendors, confirm completion, and upload/approve invoices with a clear maintenance paper trail."
  },
  {
    icon: TrendingUp,
    title: "Property Health Analytics",
    description: "Spot high-cost units, recurring issues, and preventative maintenance opportunities to protect asset value."
  },
  {
    icon: Scale,
    title: "Legal & Compliance Documentation",
    description: "Timestamped logs, photos, and communication history for audits, disputes, and insurance claims."
  },
  {
    icon: DollarSign,
    title: "Stripe Payments & Chargebacks",
    description: "Collect tenant payments for billable repairs or damages directly from work orders with automatic receipts and payment tracking."
  }
];

export default function LandingPage() {
  const [audience, setAudience] = useState<AudienceType>("schools");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>RepairRequest - Property & Facilities Management Software</title>
        <meta name="description" content="Comprehensive facilities management software for schools, commercial buildings, residential communities & property managers. Streamline maintenance requests, scheduling & operations. Free 30-day trial." />
        <link rel="canonical" href="https://www.repairrequest.org/" />
        <meta property="og:title" content="RepairRequest - Facilities Management Software" />
        <meta property="og:description" content="Transform facility management across all industries with our comprehensive platform for maintenance requests, scheduling, and operations. Trusted by schools, commercial & residential properties." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.repairrequest.org/" />
        <meta name="twitter:title" content="RepairRequest - Facilities Management Software" />
        <meta name="twitter:description" content="Comprehensive facilities management for all organizations." />
      </Helmet>
      
      <PublicHeader currentPage="home" />

      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm sm:text-base font-medium text-left">
                Try RepairRequest Free for 30 Days! 
                <span className="hidden sm:inline ml-2">No credit card required. Full access to all features. Cancel anytime.</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <a href="/api/login" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center">
                Start Free Trial
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <button className="text-white hover:text-blue-100 transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Streamline Maintenance & Work Requests for Your Entire Organization
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                RepairRequest gives businesses one simple platform to capture issues, assign tasks, track progress, and keep teams aligned no matter what type of facilities you manage.
              </p>
              <div className="space-y-3 mb-8 max-w-2xl mx-auto lg:mx-0">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Submit requests in seconds with photos, categories & priority</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Auto-assign tasks to the right team and track status in real time</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Reduce downtime & keep operations running smoothly</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/login">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Get Started Today
                  </Button>
                </Link>
                <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline">
                    Learn What's Possible
                  </Button>
                </a>
              </div>
            </div>
            
            {/* Right Video */}
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl shadow-2xl overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/7aViuHFvP38?si=d8CfK23meqoBij0t&rel=0"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-indigo-200 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Why Choose RepairRequest */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose RepairRequest?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Designed for property managers, facility teams, and organizations across all industries - from schools to commercial real estate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Multi-Building Support</CardTitle>
                <CardDescription>
                  Manage maintenance across multiple buildings and facilities from a single platform.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Secure access controls for requesters, maintenance staff, and administrators.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Real-Time Tracking</CardTitle>
                <CardDescription>
                  Track request status, assignments, and completion times in real-time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Automated email updates keep everyone informed throughout the repair process.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Priority Management</CardTitle>
                <CardDescription>
                  Set and manage priority levels to ensure critical issues are addressed first.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Analytics & Reporting</CardTitle>
                <CardDescription>
                  Comprehensive reporting tools to track performance and identify trends.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Audience Toggle Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Your Industry
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              See how RepairRequest fits your specific needs
            </p>
            
            {/* Audience Toggle */}
            <div 
              className="inline-flex bg-white rounded-lg p-1 shadow-md border"
              role="tablist"
              aria-label="Select your industry"
            >
              <button
                role="tab"
                aria-selected={audience === "schools"}
                aria-controls="schools-content"
                id="schools-tab"
                onClick={() => setAudience("schools")}
                className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                  audience === "schools"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                data-testid="toggle-schools"
              >
                <GraduationCap className="h-5 w-5" />
                Schools
              </button>
              <button
                role="tab"
                aria-selected={audience === "property-managers"}
                aria-controls="property-managers-content"
                id="property-managers-tab"
                onClick={() => setAudience("property-managers")}
                className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                  audience === "property-managers"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                data-testid="toggle-property-managers"
              >
                <Home className="h-5 w-5" />
                Property Managers
              </button>
            </div>
          </div>

          {/* Audience-Specific Content */}
          <div 
            id={`${audience}-content`}
            role="tabpanel"
            aria-labelledby={`${audience}-tab`}
            className="max-w-4xl mx-auto"
          >
            {audience === "schools" ? (
              <div className="text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Maintenance Requests, Without the Chaos.
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  RepairRequest helps schools submit, prioritize, and track work orders—without emails, paper forms, or PDF backups.
                </p>
                <div className="space-y-4 max-w-md mx-auto text-left mb-8">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Submit requests in seconds</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Track status from request to completion</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Keep teachers, admins, and facilities teams aligned</span>
                  </div>
                </div>
                <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Learn What's Possible
                  </Button>
                </a>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Work Orders That Keep Tenants and Teams Aligned.
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  RepairRequest helps landlords and property managers capture issues fast, assign work, track progress, and document everything—across units and properties.
                </p>
                <div className="space-y-4 max-w-md mx-auto text-left mb-8">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Tenant-friendly issue reporting</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Portfolio-wide visibility</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Clear documentation for chargebacks and compliance</span>
                  </div>
                </div>
                <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Learn What's Possible
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Optional Add-Ons Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Optional Add-Ons
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              RepairRequest is intentionally simple from day one. Add these upgrades only when you need more scale, visibility, and control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(audience === "schools" ? schoolsAddOns : propertyManagerAddOns).map((addon, index) => (
              <Card key={index} className="border shadow-md relative" data-testid={`addon-card-${index}`}>
                <CardHeader>
                  <Badge className="absolute top-4 right-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    Optional Add-On
                  </Badge>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <addon.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg pr-24">{addon.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {addon.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* CTA Below Add-Ons */}
          <div className="text-center mt-16">
            <p className="text-xl text-gray-700 mb-6 font-medium">
              Start simple. Add power when you're ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Get Started Today
                </Button>
              </Link>
              <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">
                  Learn What's Possible
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact and Calendly Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Schedule a Meeting - Calendly Widget */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Schedule a Meeting</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Book a call with our team to discuss your organization's needs and explore our solutions.
              </p>
              
              {/* Calendly Embed */}
              <CalendlyWidget />
            </div>

            {/* Get In Touch - Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <Mail className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Get In Touch</h2>
              </div>
              <p className="text-gray-600 mb-6">
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
