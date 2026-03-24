import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Clock, Shield, Mail, Building2, Settings, BarChart3, Calendar, FileText, Smartphone, Wrench, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CalendlyWidget from "@/components/CalendlyWidget";
import ContactForm from "@/components/ContactForm";

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
    icon: Settings,
    title: "Request Templates",
    description: "Create pre-filled request templates for common issues so staff can submit consistent, detailed requests in seconds."
  },
  {
    icon: FileText,
    title: "Maintenance History & Asset Records",
    description: "Maintain long-term records of repairs and service history to support audits, compliance, and capital planning."
  },
  {
    icon: Smartphone,
    title: "Webhooks & Integrations",
    description: "Connect RepairRequest to your existing tools with webhooks and API access for custom workflows and automation."
  }
];


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>RepairRequest - School Maintenance & Facilities Management Software</title>
        <meta name="description" content="Maintenance and facilities management software built for schools. Streamline repair requests, work orders, and operations across your campus." />
        <link rel="canonical" href="https://www.repairrequest.org/" />
        <meta property="og:title" content="RepairRequest - School Maintenance Management" />
        <meta property="og:description" content="Maintenance management built for schools. Streamline repair requests, work orders, and campus operations in one simple platform." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.repairrequest.org/" />
        <meta name="twitter:title" content="RepairRequest - School Maintenance Software" />
        <meta name="twitter:description" content="Maintenance management built for schools and campus operations." />
      </Helmet>
      
      <PublicHeader currentPage="home" />

      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Streamline Maintenance & Work Requests for Your School
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                RepairRequest gives schools one simple platform to capture issues, assign tasks, track progress, and keep teachers, staff, and facilities teams aligned.
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
              Built for schools, facilities teams, and the administrators who keep campuses running.
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

      {/* Built for Schools Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Maintenance Requests, Without the Chaos.
            </h2>
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
            {schoolsAddOns.map((addon, index) => (
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
                Book a call with our team to discuss your school's needs and explore our solutions.
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
                Ready to transform your school's operations? Send us a message and we'll get back to you promptly.
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
