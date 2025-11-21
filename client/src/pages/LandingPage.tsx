import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Users, Clock, Shield, Mail, Building2, Settings, BarChart3, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import luxuryCondoPath from "@assets/generated_images/Luxury_condo_building_exterior_4205c12c.png";
import ScrollToTop from "@/components/ScrollToTop";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>RepairRequest - Property & Facilities Management Software</title>
        <meta name="description" content="Comprehensive facilities management software for schools, commercial buildings, residential communities & property managers. Streamline maintenance requests, scheduling & operations. Free 30-day trial." />
        <meta property="og:title" content="RepairRequest - Facilities Management Software" />
        <meta property="og:description" content="Transform facility management across all industries with our comprehensive platform for maintenance requests, scheduling, and operations. Trusted by schools, commercial & residential properties." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <PublicHeader currentPage="home" />

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
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
                Trusted by Teams Across Every Industry
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Streamline Maintenance & Work Requests for Your Entire Organization
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                RepairRequest gives businesses one simple platform to capture issues, assign tasks, track progress, and keep teams aligned—no matter what type of facilities you manage.
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
                    Schedule Call
                  </Button>
                </a>
              </div>
            </div>
            
            {/* Right Video */}
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl shadow-2xl overflow-hidden">
                {/* Placeholder for video - you can replace this with actual video component */}
                <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <svg className="w-8 h-8 ml-1 hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">See RepairRequest in Action</h3>
                    <p className="text-gray-300 text-sm">Watch how easy it is to manage maintenance requests</p>
                  </div>
                  
                  {/* Video overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-indigo-200 rounded-full opacity-20"></div>
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
              Designed for property managers, facility teams, and organizations across all industries - from schools to commercial real estate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Building2 className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Multi-Building Support</CardTitle>
                <CardDescription>
                  Manage maintenance across multiple buildings and facilities from a single platform.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Users className="h-6 w-6 text-green-600 hover:text-green-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Secure access controls for requesters, maintenance staff, and administrators.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Clock className="h-6 w-6 text-purple-600 hover:text-purple-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Real-Time Tracking</CardTitle>
                <CardDescription>
                  Track request status, assignments, and completion times in real-time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Mail className="h-6 w-6 text-orange-600 hover:text-orange-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Automated email updates keep everyone informed throughout the repair process.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <Shield className="h-6 w-6 text-red-600 hover:text-red-700 hover:animate-bounce transition-colors duration-300" />
                </div>
                <CardTitle>Priority Management</CardTitle>
                <CardDescription>
                  Set and manage priority levels to ensure critical issues are addressed first.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 hover:shadow-md hover:scale-110 transition-all duration-300">
                  <BarChart3 className="h-6 w-6 text-indigo-600 hover:text-indigo-700 hover:animate-bounce transition-colors duration-300" />
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

      {/* Industries Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted Across Industries
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              RepairRequest serves diverse property management needs across multiple sectors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-lg hover:scale-110 transition-all duration-300">
                  <Building2 className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:animate-pulse transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Educational Institutions</h3>
                <p className="text-gray-600 text-sm">Schools, universities, and educational facilities</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-lg hover:scale-110 transition-all duration-300">
                  <BarChart3 className="h-8 w-8 text-green-600 hover:text-green-700 hover:animate-pulse transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Commercial Real Estate</h3>
                <p className="text-gray-600 text-sm">Office buildings, retail spaces, and commercial properties</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-lg hover:scale-110 transition-all duration-300">
                  <Users className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:animate-pulse transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Residential Communities</h3>
                <p className="text-gray-600 text-sm">HOAs, apartment complexes, and residential properties</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-lg hover:scale-110 transition-all duration-300">
                  <Shield className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:animate-pulse transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Management</h3>
                <p className="text-gray-600 text-sm">Professional property management companies</p>
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
                Built for Modern Property Management
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                RepairRequest understands the unique challenges of maintaining facilities across different industries. Our platform adapts to your specific needs while ensuring efficient operations.
              </p>
              
              <div className="space-y-4">
                {[
                  "Reduce response times for critical repairs",
                  "Improve communication between staff and maintenance",
                  "Maintain detailed records for compliance and reporting",
                  "Streamline budget planning with comprehensive analytics",
                  "Enhance safety through proactive maintenance tracking"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 hover:text-green-700 hover:scale-125 hover:drop-shadow-md transition-all duration-300" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-2xl shadow-xl overflow-hidden">
              <img 
                src={luxuryCondoPath} 
                alt="Modern luxury residential condominium" 
                className="w-full h-full object-cover"
              />
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
                Book a call with our team to discuss your organization's needs and explore our solutions.
              </p>
              
              {/* Calendly Embed */}
              <div className="calendly-inline-widget" data-url="https://calendly.com/schoolhouselogistics/30min" style={{minWidth: '320px', height: '630px'}}></div>
              <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
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
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Left Column - Logo & Social */}
            <div className="lg:col-span-3">
              <div className="flex items-center mb-6">
                <img src={logoPath} alt="RepairRequest" className="h-8 w-auto mr-3 bg-white p-1 rounded" />
                <span className="text-xl font-bold">RepairRequest</span>
              </div>
              <p className="text-gray-300 mb-6 text-sm">
                Streamlining maintenance management for property managers and organizations across all industries.
              </p>
              <div className="flex space-x-3">
                <a href="https://x.com/SHouseLogistics" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/schoolhouse-logistics/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://www.facebook.com/people/SchoolHouse-Logistics/61576281818643/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/schoolhouselogistics/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.917 4.917 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.903 4.903 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Products Column */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold mb-6 uppercase tracking-wide">Products</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/support" className="text-gray-300 hover:text-white transition-colors">Support</Link></li>
                <li><Link to="/features" className="text-gray-300 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold mb-6 uppercase tracking-wide">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
                <li><a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">Book A Demo</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">YouTube Channel</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold mb-6 uppercase tracking-wide">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Data Security</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 SchoolHouse Logistics. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      <ScrollToTop />
    </div>
  );
}