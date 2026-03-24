import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Clock, Shield, Mail, Building2, Settings, BarChart3, Smartphone, CloudRain, Wrench, Camera, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CalendlyWidget from "@/components/CalendlyWidget";
import ContactForm from "@/components/ContactForm";

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Features - RepairRequest Facilities Management Platform</title>
        <meta name="description" content="Discover RepairRequest's powerful features: photo uploads, real-time messaging, role-based access, mobile-first design, and comprehensive reporting for school facilities management." />
        <link rel="canonical" href="https://www.repairrequest.org/features" />
        <meta property="og:title" content="RepairRequest Features - Complete Facilities Management" />
        <meta property="og:description" content="Explore comprehensive features for school facility management including digital workflows, real-time communication, and detailed analytics." />
        <meta property="og:url" content="https://www.repairrequest.org/features" />
        <meta name="twitter:title" content="RepairRequest Features" />
        <meta name="twitter:description" content="Powerful features for comprehensive facility management." />
      </Helmet>
      
      <PublicHeader currentPage="features" />

      {/* Promotional Banner */}
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Comprehensive Feature Set
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Maintenance Management for Schools
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            RepairRequest brings structure to your facility operations with easy request submission, organized work orders, and transparent progress tracking.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Core Platform Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for schools, facilities teams, and the administrators who keep campuses running.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Building2 className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Multi-Building Support</CardTitle>
                <CardDescription>
                  Manage maintenance across multiple buildings and facilities from a single, unified platform with hierarchical organization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Users className="h-6 w-6 text-green-600 hover:text-green-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Role-Based Access Control</CardTitle>
                <CardDescription>
                  Secure access controls for requesters, maintenance staff, administrators, and super admins with customizable permissions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Clock className="h-6 w-6 text-purple-600 hover:text-purple-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Real-Time Status Tracking</CardTitle>
                <CardDescription>
                  Track request status, assignments, and completion times in real-time with instant updates and progress monitoring.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Mail className="h-6 w-6 text-orange-600 hover:text-orange-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Automated Notifications</CardTitle>
                <CardDescription>
                  Email notifications keep everyone informed throughout the repair process, from submission to completion.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Shield className="h-6 w-6 text-red-600 hover:text-red-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Priority Management</CardTitle>
                <CardDescription>
                  Set and manage priority levels (Low, Medium, High, Urgent) to ensure critical issues are addressed first.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <BarChart3 className="h-6 w-6 text-indigo-600 hover:text-indigo-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Analytics & Reporting</CardTitle>
                <CardDescription>
                  Comprehensive reporting tools to track performance, identify trends, and optimize maintenance operations.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Advanced Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional tools that scale with your organization's needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-lg hover:scale-110 transition-all duration-300">
                  <Camera className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:animate-pulse transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Photo Attachments</h3>
                <p className="text-gray-600 text-sm">Upload multiple photos with requests for better issue documentation and faster resolution.</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-lg hover:scale-110 transition-all duration-300">
                  <Smartphone className="h-8 w-8 text-green-600 hover:text-green-700 hover:animate-pulse transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile Responsive</h3>
                <p className="text-gray-600 text-sm">Access and manage requests from any device with our fully responsive web interface.</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-lg hover:scale-110 transition-all duration-300">
                  <FileText className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:animate-pulse transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Request History</h3>
                <p className="text-gray-600 text-sm">Complete audit trail and history tracking for all maintenance activities and decisions.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Integration Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
                Enterprise Ready
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Built for Scale and Security
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                RepairRequest provides enterprise-grade features that grow with your organization, ensuring security, compliance, and scalability.
              </p>
              
              <div className="space-y-4">
                {[
                  "Google OAuth integration for secure authentication",
                  "Multi-tenant architecture for organization isolation",
                  "Messaging and communication threads on every request",
                  "Comprehensive audit logging and compliance tracking",
                  "API keys and webhook integrations"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 hover:shadow-lg hover:scale-110 transition-all duration-300">
                    <Settings className="h-8 w-8 text-white hover:animate-spin hover:drop-shadow-md transition-all duration-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Customizable</h4>
                  <p className="text-sm text-gray-600">Adapt to your workflow</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 hover:shadow-lg hover:scale-110 transition-all duration-300">
                    <Shield className="h-8 w-8 text-white hover:animate-pulse hover:drop-shadow-md transition-all duration-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Secure</h4>
                  <p className="text-sm text-gray-600">Enterprise-grade security</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 hover:shadow-lg hover:scale-110 transition-all duration-300">
                    <CloudRain className="h-8 w-8 text-white hover:animate-bounce hover:drop-shadow-md transition-all duration-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Cloud-Based</h4>
                  <p className="text-sm text-gray-600">Always accessible</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 hover:shadow-lg hover:scale-110 transition-all duration-300">
                    <Wrench className="h-8 w-8 text-white hover:animate-pulse hover:drop-shadow-md transition-all duration-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Reliable</h4>
                  <p className="text-sm text-gray-600">99.9% uptime</p>
                </div>
              </div>
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
                <Calendar className="h-8 w-8 text-blue-600 mr-3 hover:text-blue-700 hover:scale-110 hover:drop-shadow-md transition-all duration-300" />
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
                <Mail className="h-8 w-8 text-blue-600 mr-3 hover:text-blue-700 hover:scale-110 hover:drop-shadow-md transition-all duration-300" />
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