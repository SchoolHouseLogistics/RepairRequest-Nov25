import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>FAQ - RepairRequest Facilities Management Questions</title>
        <meta name="description" content="Get answers to frequently asked questions about RepairRequest facilities management software, implementation, pricing, support, and features." />
        <link rel="canonical" href="https://www.repairrequest.org/faq" />
        <meta property="og:title" content="RepairRequest FAQ - Common Questions Answered" />
        <meta property="og:description" content="Find answers to common questions about our facilities management platform, from setup to advanced features." />
        <meta property="og:url" content="https://www.repairrequest.org/faq" />
        <meta name="twitter:title" content="RepairRequest FAQ" />
        <meta name="twitter:description" content="Answers to common questions about facilities management." />
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

      <PublicFooter />
      <ScrollToTopButton />
      <ScrollToTop />
    </div>
  );
}