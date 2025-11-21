import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Calendar, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CalendlyWidget from "@/components/CalendlyWidget";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Pricing - RepairRequest Facilities Management Plans</title>
        <meta name="description" content="Choose the perfect RepairRequest plan for your organization. Starter at $99/month, Professional at $299/month, Enterprise custom pricing. Serves schools, commercial & residential properties. 30-day free trial." />
        <meta property="og:title" content="RepairRequest Pricing - Affordable Facilities Management" />
        <meta property="og:description" content="Transparent pricing for comprehensive facility management software. Plans starting at $99/month serving schools, commercial real estate, residential communities & property managers." />
      </Helmet>
      
      <PublicHeader currentPage="pricing" />

      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm sm:text-base font-medium text-left">
                🎉 Try RepairRequest Free for 30 Days! 
                <span className="hidden sm:inline ml-2">• No credit card required • Full access to all features • Cancel anytime</span>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple, Transparent
            <span className="text-blue-600 block">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the plan that fits your organization's needs. All plans include unlimited requests and 24/7 support.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Starter Plan */}
            <Card className="border-2 border-gray-200 relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>Perfect for small organizations</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Up to 5 buildings</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Up to 50 users</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Unlimited requests</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Email notifications</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Basic reporting</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-5 w-5 text-gray-400 mr-3 hover:text-red-500 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span className="text-gray-400">Advanced analytics</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-2 border-blue-600 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                Most Popular
              </Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription>Ideal for growing organizations</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$399</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Up to 10 buildings</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Up to 125 users</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Unlimited requests</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Email & SMS notifications</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Advanced reporting</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 border-gray-200 relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Unlimited buildings</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Unlimited users</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>Dedicated support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>SLA guarantee</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span>On-premise deployment</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Can I change plans at any time?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.
                </p>
              </CardContent>
            </Card>

            
            <Card>
              <CardHeader>
                <CardTitle>What kind of support do you provide?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  All plans include email support. Professional and Enterprise plans receive priority support with faster response times. Enterprise customers get dedicated support representatives.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Can I integrate RepairRequest with other systems?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Professional plans include standard integrations via API. Enterprise plans include custom integrations and dedicated technical support for implementation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Is my data secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We use enterprise-grade security with 256-bit encryption, regular security audits, and comply with industry standards. Enterprise plans can opt for on-premise deployment for additional security.
                </p>
              </CardContent>
            </Card>
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
                Book a call with our team to discuss your organization's needs and explore our solutions.
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
                Ready to transform your operations? Send us a message and we'll get back to you promptly.
              </p>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input placeholder="First Name *" required />
                  </div>
                  <div>
                    <Input placeholder="Last Name *" required />
                  </div>
                </div>
                <div>
                  <Input type="email" placeholder="Email Address *" required />
                </div>
                <div>
                  <Input placeholder="Organization/Company" />
                </div>
                <div>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{color: 'hsl(25, 5.3%, 44.7%)'}}
                    required
                  >
                    <option value="">Select organization type *</option>
                    <option value="education">Education</option>
                    <option value="commercial-real-estate">Commercial Real Estate</option>
                    <option value="residential-communities">Residential Communities</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="government">Government</option>
                    <option value="hospitality">Hospitality</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Textarea 
                    placeholder="Message" 
                    rows={4}
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Mail className="h-4 w-4 mr-2 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
      
      <ScrollToTop />
    </div>
  );
}