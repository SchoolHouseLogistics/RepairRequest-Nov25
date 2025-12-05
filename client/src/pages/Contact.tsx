import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Clock, MonitorPlay, Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import ScrollToTop from "@/components/ScrollToTop";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import CalendlyWidget from "@/components/CalendlyWidget";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
    organizationType: "",
    inquiry: "",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.organization || !formData.message) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setIsSubmitted(true);
      toast({
        title: "Message Sent",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        organization: "",
        organizationType: "",
        inquiry: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Contact Us - RepairRequest Sales & Support</title>
        <meta name="description" content="Contact RepairRequest for sales inquiries, demos, or support. Reach our team via email, phone, or schedule a personalized consultation." />
        <link rel="canonical" href="https://www.repairrequest.org/contact" />
        <meta property="og:title" content="Contact RepairRequest - Get in Touch" />
        <meta property="og:description" content="Ready to transform your maintenance management? Contact us for a demo or to discuss your facility needs." />
        <meta property="og:url" content="https://www.repairrequest.org/contact" />
        <meta name="twitter:title" content="Contact RepairRequest" />
        <meta name="twitter:description" content="Get in touch with our sales and support team." />
      </Helmet>
      
      <PublicHeader currentPage="contact" />

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
            Get in
            <span className="text-blue-600 block">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Ready to transform your maintenance management? We'd love to hear from you and discuss how RepairRequest can help your organization.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">info@schoolhouselogistics.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <p className="text-gray-600">(407) 494-5230</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Business Hours</h3>
                    <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                    <p className="text-gray-600">Saturday: 10:00 AM - 2:00 PM EST</p>
                    <p className="text-gray-600">Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Need Immediate Support?</h3>
                <p className="text-gray-600 mb-4">
                  If you're an existing customer with an urgent issue, please log into your portal and use the live chat feature for fastest response.
                </p>
                <Link to="/login">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Access Portal
                  </Button>
                </Link>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent Successfully</h3>
                      <p className="text-gray-600 mb-4">
                        Thank you for reaching out. We'll get back to you within 24 hours.
                      </p>
                      <Button 
                        onClick={() => setIsSubmitted(false)}
                        variant="outline"
                        data-testid="button-send-another"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input 
                            id="firstName" 
                            placeholder="John" 
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required 
                            data-testid="input-first-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input 
                            id="lastName" 
                            placeholder="Doe" 
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required 
                            data-testid="input-last-name"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@example.com" 
                          value={formData.email}
                          onChange={handleInputChange}
                          required 
                          data-testid="input-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="(555) 123-4567" 
                          value={formData.phone}
                          onChange={handleInputChange}
                          data-testid="input-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="organization">Organization *</Label>
                        <Input 
                          id="organization" 
                          placeholder="Your organization name" 
                          value={formData.organization}
                          onChange={handleInputChange}
                          required 
                          data-testid="input-organization"
                        />
                      </div>
                      <div>
                        <Label htmlFor="organizationType">Organization Type</Label>
                        <select 
                          id="organizationType"
                          value={formData.organizationType}
                          onChange={handleInputChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          data-testid="select-organization-type"
                        >
                          <option value="">Select an organization type</option>
                          <option value="Education">Education</option>
                          <option value="Commercial Real Estate">Commercial Real Estate</option>
                          <option value="Residential Communities">Residential Communities</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Government">Government</option>
                          <option value="Hospitality">Hospitality</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="inquiry">Inquiry Type</Label>
                        <select 
                          id="inquiry"
                          value={formData.inquiry}
                          onChange={handleInputChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          data-testid="select-inquiry-type"
                        >
                          <option value="">Select an option</option>
                          <option value="Sales Inquiry">Sales Inquiry</option>
                          <option value="Request Demo">Request Demo</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="message">Message *</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Please describe how we can help you..."
                          rows={5}
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          data-testid="textarea-message"
                        />
                      </div>
                      <Button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isSubmitting}
                        data-testid="button-submit-contact"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Message"
                        )}
                      </Button>
                      <p className="text-sm text-gray-500 text-center">
                        * Required fields
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Sales Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Talk to Our Sales Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Schedule a personalized demo and see how RepairRequest can transform your maintenance operations
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <Card>
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule a Call</h3>
                  <p className="text-gray-600 text-sm">
                    Book a 30-minute consultation with our sales team
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MonitorPlay className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Demo</h3>
                  <p className="text-gray-600 text-sm">
                    See RepairRequest in action with a personalized demonstration
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Quote</h3>
                  <p className="text-gray-600 text-sm">
                    Get a tailored pricing proposal for your organization
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
      <ScrollToTopButton />
      <ScrollToTop />
    </div>
  );
}