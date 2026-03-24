import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Users,
  Clock,
  Shield,
  Mail,
  Building2,
  Settings,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";

export default function HeroLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>RepairRequest - Work Order & Maintenance Management</title>
        <meta
          name="description"
          content="Transform your school's maintenance operations with RepairRequest. Easy request submission, automated workflows, and real-time tracking built for schools."
        />
        <link rel="canonical" href="https://www.repairrequest.org/landing" />
        <meta
          property="og:title"
          content="RepairRequest - Maintenance Management Made Simple"
        />
        <meta
          property="og:description"
          content="Streamline work requests, assign tasks, and track progress in one platform."
        />
        <meta
          property="og:url"
          content="https://www.repairrequest.org/landing"
        />
        <meta
          name="twitter:title"
          content="RepairRequest - Maintenance Management"
        />
        <meta
          name="twitter:description"
          content="Streamline work requests and maintenance operations."
        />
      </Helmet>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img
                src={logoPath}
                alt="RepairRequest Logo"
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  RepairRequest
                </h1>
                <p className="text-sm text-gray-600">
                  by SchoolHouse Logistics
                </p>
              </div>
            </div>
            <Link to="/login">
              <Button variant="outline">Login to Portal</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Built for Schools
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            One Central System for School Maintenance & Work Requests
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            RepairRequest replaces emails, paper forms, and verbal requests with one simple platform for submitting, assigning, and tracking maintenance and work requests—so nothing gets missed and your campus stays safe and functional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Request a Demo
              </Button>
            </a>
          </div>

          {/* Universal Benefits Checkmarks */}
          <div className="space-y-6 max-w-2xl mx-auto text-left sm:text-center">
            <div className="flex items-start sm:items-center sm:justify-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="text-lg font-semibold text-gray-900 block">
                  Submit requests in seconds
                </span>
                <span className="text-base text-gray-600">
                  Add photos, locations, categories, and priority from any device
                </span>
              </div>
            </div>
            <div className="flex items-start sm:items-center sm:justify-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="text-lg font-semibold text-gray-900 block">
                  Route work automatically
                </span>
                <span className="text-base text-gray-600">
                  Assign requests to the right staff, team, or vendor and track progress in real time
                </span>
              </div>
            </div>
            <div className="flex items-start sm:items-center sm:justify-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="text-lg font-semibold text-gray-900 block">
                  Stay organized and accountable
                </span>
                <span className="text-base text-gray-600">
                  See open, in-progress, and completed work at a glance
                </span>
              </div>
            </div>
          </div>

          {/* Demo Video */}
          <div className="mt-16 max-w-4xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* Features Section */}
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
                  Manage maintenance across multiple buildings and facilities
                  from a single platform.
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
                  Secure access controls for requesters, maintenance staff, and
                  administrators.
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
                  Track request status, assignments, and completion times in
                  real-time.
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
                  Automated email updates keep everyone informed throughout the
                  repair process.
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
                  Set and manage priority levels to ensure critical issues are
                  addressed first.
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
                  Comprehensive reporting tools to track performance and
                  identify trends.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Schools of Every Kind
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              RepairRequest serves schools and organizations that manage facilities and shared spaces
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Independent Schools
                </h3>
                <p className="text-gray-600 text-sm">
                  Private and independent K-12 campuses
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Charter Schools
                </h3>
                <p className="text-gray-600 text-sm">
                  Charter networks and standalone campuses
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  K-12 Schools
                </h3>
                <p className="text-gray-600 text-sm">
                  Public school buildings and district facilities
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Other Organizations
                </h3>
                <p className="text-gray-600 text-sm">
                  Churches, community centers, and other facilities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Built for Modern School Operations
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                RepairRequest understands the unique challenges of maintaining
                school facilities. Our platform adapts to your campus needs
                while keeping operations efficient and accountable.
              </p>

              <div className="space-y-4">
                {[
                  "Reduce response times for critical repairs",
                  "Improve communication between staff and maintenance",
                  "Maintain detailed records for compliance and reporting",
                  "Streamline budget planning with comprehensive analytics",
                  "Enhance safety through proactive maintenance tracking",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 mb-6">
                Join schools already using RepairRequest to streamline
                their maintenance operations.
              </p>
              <Link to="/signup">
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Access Your Portal
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Contact your administrator for access credentials
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={logoPath}
                  alt="RepairRequest Logo"
                  className="w-8 h-8"
                />
                <div>
                  <h3 className="text-lg font-bold">RepairRequest</h3>
                  <p className="text-sm text-gray-400">
                    by SchoolHouse Logistics
                  </p>
                </div>
              </div>
              <p className="text-gray-400">
                Streamlining maintenance management for schools and
                organizations that manage facilities.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-white transition-colors"
                  >
                    Portal Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support"
                    className="hover:text-white transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-white transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 RepairRequest by SchoolHouse Logistics. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
