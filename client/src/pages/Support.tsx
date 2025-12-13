import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Calendar, BookOpen, Video, MessageCircle, HelpCircle, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CalendlyWidget from "@/components/CalendlyWidget";
import ContactForm from "@/components/ContactForm";

export default function Support() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Support - RepairRequest Customer Help Center</title>
        <meta name="description" content="Get help with RepairRequest facilities management software. Access customer support, documentation, training resources, and contact our team for assistance." />
        <link rel="canonical" href="https://www.repairrequest.org/support" />
        <meta property="og:title" content="RepairRequest Support - Help Center" />
        <meta property="og:description" content="Access customer support, documentation, and training resources for RepairRequest facilities management platform." />
        <meta property="og:url" content="https://www.repairrequest.org/support" />
        <meta name="twitter:title" content="RepairRequest Support - Help Center" />
        <meta name="twitter:description" content="Get help with RepairRequest facilities management software." />
      </Helmet>
      
      <PublicHeader currentPage="support" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How Can We Help?
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Get the support you need to streamline your maintenance operations. Our team is here to help you succeed.
          </p>
        </div>
      </section>

      {/* Quick Contact Bar */}
      <section className="bg-white border-b py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Email Us</p>
                <a href="mailto:info@schoolhouselogistics.com" className="font-medium text-gray-900 hover:text-blue-600">
                  info@schoolhouselogistics.com
                </a>
              </div>
            </div>
            <div className="hidden md:block h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Call Us</p>
                <a href="tel:+14074945230" className="font-medium text-gray-900 hover:text-blue-600">
                  (407) 494-5230
                </a>
              </div>
            </div>
            <div className="hidden md:block h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Schedule a Call</p>
                <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-blue-600">
                  Book a Demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Resources */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Support Resources</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers quickly with our comprehensive help resources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Step-by-step guides and detailed documentation for all RepairRequest features.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/faq">View Documentation</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="h-7 w-7 text-green-600" />
                </div>
                <CardTitle className="text-xl">Video Tutorials</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Watch our training videos to learn how to use RepairRequest effectively.
                </p>
                <Button variant="outline" className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="h-7 w-7 text-purple-600" />
                </div>
                <CardTitle className="text-xl">FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Find quick answers to the most commonly asked questions.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/faq">View FAQ</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Common Questions */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">
              Quick answers to help you get started
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                How do I submit a maintenance request?
              </h3>
              <p className="text-gray-600 pl-7">
                Log into your dashboard, click "New Request," select your building and room, describe the issue, optionally attach photos, and submit. You'll receive confirmation and can track progress in "My Requests."
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                How do I add users to my organization?
              </h3>
              <p className="text-gray-600 pl-7">
                Administrators can add users through the Admin Users page. Users with matching email domains are automatically assigned to your organization when they sign up.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                How do I track my request status?
              </h3>
              <p className="text-gray-600 pl-7">
                View all your requests and their current status in the "My Requests" section. You'll also receive email notifications when your request status changes.
              </p>
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link to="/faq">View All FAQs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule a Demo & Contact Form */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Schedule a personalized demo or send us a message
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendly Widget */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Schedule a Meeting</h3>
                  <p className="text-sm text-gray-500">Book a 30-minute call with our team</p>
                </div>
              </div>
              <CalendlyWidget />
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Send a Message</h3>
                  <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                </div>
              </div>
              <ContactForm showOrganizationType={false} />
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
      <ScrollToTopButton />
    </div>
  );
}
