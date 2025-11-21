import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CalendlyWidget from "@/components/CalendlyWidget";

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>FAQ - RepairRequest Facilities Management Questions</title>
        <meta name="description" content="Get answers to frequently asked questions about RepairRequest facilities management software, implementation, pricing, support, and features." />
        <meta property="og:title" content="RepairRequest FAQ - Common Questions Answered" />
        <meta property="og:description" content="Find answers to common questions about our facilities management platform, from setup to advanced features." />
      </Helmet>

      <PublicHeader currentPage="faq" />

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

      {/* FAQ Content */}
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Frequently Asked Questions</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get Your Questions Answered
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about RepairRequest and learn how to make the most of our facilities management platform.
            </p>
          </div>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Getting Started</CardTitle>
                <CardDescription>Basic questions about accessing and using RepairRequest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">How do I get access to RepairRequest?</h3>
                  <p className="text-gray-600">Contact your organization's administrator to get access credentials. They can create an account for you and assign the appropriate role.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What do I need to sign in?</h3>
                  <p className="text-gray-600">RepairRequest uses Google OAuth for secure authentication. You'll need a Google account with an email address that's been authorized by your organization.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Request Management</CardTitle>
                <CardDescription>Managing and tracking your facility requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">What's the difference between Facility and Building requests?</h3>
                  <p className="text-gray-600">Facility requests are for scheduling events, room bookings, and equipment needs. Building requests are for maintenance issues, repairs, and building-related problems.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">How do I track the status of my request?</h3>
                  <p className="text-gray-600">All your requests are visible in 'My Requests' section. You'll see real-time status updates and receive email notifications for status changes.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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
                  <Textarea 
                    placeholder="Message *" 
                    rows={4}
                    required
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <img src={logoPath} alt="RepairRequest" className="h-8 w-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Streamlining facilities management for educational institutions with innovative technology and dedicated support.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link to="/features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
                <li><Link to="/support" className="text-gray-400 hover:text-white">Support</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 RepairRequest by SchoolHouse Logistics. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      <ScrollToTop />
    </div>
  );
}