import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
export default function Pricing() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Pricing - RepairRequest Facilities Management Plans</title>
        <meta name="description" content="Simple, predictable pricing for RepairRequest facilities management. Professional plans from $1,000-$12,000/year based on organization size. Enterprise custom quotes available." />
        <meta property="og:title" content="RepairRequest Pricing - Transparent Facilities Management" />
        <meta property="og:description" content="No hidden fees. Transparent pricing for comprehensive facility management software based on your organization size." />
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
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple, Predictable Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            No hidden fees. No setup costs. Just powerful facility and operations management built for your organization.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Professional Plan */}
            <Card className="border-2 border-blue-600 relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription>For small-medium organizations</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$1,000 – $12,000</span>
                  <span className="text-gray-600 block">/year</span>
                  <p className="text-sm text-gray-500 mt-2">(Price adjusts based on organization size)</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Complete onboarding & setup</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>12 months of support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Unlimited tickets, repairs, and requests</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Email + SMS notifications</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Photo/file attachments</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Multi-building management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Role-based access control</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Reporting & analytics dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Regular updates & new features</span>
                  </li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 border-gray-200 relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For larger organizations with advanced needs</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom Quote</span>
                  <p className="text-sm text-gray-500 mt-2">Contact us for pricing</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-3 rounded mb-4">
                  <p className="text-sm font-semibold text-gray-900">Includes everything in Professional, plus:</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Unlimited members & buildings</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Advanced analytics + forecasting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>API & SSO options</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>White-label & branding</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Custom onboarding & workflow setup</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline" data-testid="button-contact-sales">
                  Contact Sales
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Bands Table */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Size-Based Pricing Bands
            </h2>
            <p className="text-xl text-gray-600">
              What determines your price?
            </p>
            <p className="text-gray-600 mt-2">
              Your annual subscription is based only on organization size — so you never overpay.
            </p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <th className="px-6 py-4 text-left font-semibold text-gray-900">Organization Size</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900">Annual Price Range</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">Small</td>
                      <td className="px-6 py-4 text-gray-600">$1,000 – $2,500</td>
                      <td className="px-6 py-4 text-gray-600">Single building, small staff, fewer workflows</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">Medium</td>
                      <td className="px-6 py-4 text-gray-600">$2,500 – $6,000</td>
                      <td className="px-6 py-4 text-gray-600">Multi-department teams, multiple buildings</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">Large</td>
                      <td className="px-6 py-4 text-gray-600">$6,000 – $12,000</td>
                      <td className="px-6 py-4 text-gray-600">Districts, large campuses, enterprise ops</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <Mail className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Get In Touch</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Have questions about our pricing or need a custom quote? Contact our sales team and we'll get back to you promptly.
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
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      <PublicFooter />
      <ScrollToTopButton />
      <ScrollToTop />
    </div>
  );
}
