import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function DataSecurity() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Data Security - RepairRequest Security Practices</title>
        <meta name="description" content="Learn about RepairRequest's comprehensive data security measures, encryption standards, and how we protect your organization's information." />
        <link rel="canonical" href="https://www.repairrequest.org/data-security" />
        <meta property="og:title" content="RepairRequest Data Security" />
        <meta property="og:description" content="Our commitment to protecting your data with enterprise-grade security measures." />
        <meta property="og:url" content="https://www.repairrequest.org/data-security" />
        <meta name="twitter:title" content="RepairRequest Data Security" />
        <meta name="twitter:description" content="Enterprise-grade security for your facilities management data." />
      </Helmet>
      
      <PublicHeader currentPage="" />

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm sm:text-base font-medium text-left">
                Try RepairRequest Free for 30 Days! 
                <span className="hidden sm:inline ml-2">No credit card required. Full access to all features. Cancel anytime.</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <a href="/api/login" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center" data-testid="link-start-trial">
                Start Free Trial
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <button className="text-white hover:text-blue-100 transition-colors p-1" data-testid="button-close-banner">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Data
            <span className="text-blue-600 block">Security</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your data security is our top priority. Learn how we protect your organization's information.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: December 2024
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            
            <Card>
              <CardHeader>
                <CardTitle>Our Security Commitment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  At SchoolHouse Logistics, we understand that your facilities management data is sensitive and critical to your operations. We have implemented comprehensive security measures to protect your information and maintain the trust you place in our platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Encryption</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Encryption in Transit</h4>
                  <p className="text-gray-600">
                    All data transmitted between your browser and our servers is encrypted using TLS 1.3, the latest and most secure transport layer security protocol. This ensures that your data cannot be intercepted or read by unauthorized parties during transmission.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Encryption at Rest</h4>
                  <p className="text-gray-600">
                    All data stored in our databases is encrypted using AES-256 encryption, an industry-standard encryption algorithm used by financial institutions and government agencies worldwide.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Cloud Infrastructure</h4>
                  <p className="text-gray-600">
                    RepairRequest is hosted on enterprise-grade cloud infrastructure with SOC 2 Type II certification. Our hosting providers maintain strict physical and logical security controls.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Network Security</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Firewall protection with intrusion detection systems</li>
                    <li>DDoS protection and mitigation</li>
                    <li>Regular vulnerability scanning</li>
                    <li>Network segmentation and access controls</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Authentication</h4>
                  <p className="text-gray-600">
                    We use secure authentication methods including Google OAuth 2.0 and encrypted password storage with bcrypt hashing. Session tokens are securely generated and managed.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Role-Based Access Control</h4>
                  <p className="text-gray-600">
                    Our platform implements granular role-based access control (RBAC) to ensure users only have access to the data and features appropriate to their role within the organization.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Multi-Tenant Isolation</h4>
                  <p className="text-gray-600">
                    Each organization's data is logically isolated from other organizations. Strict access controls prevent unauthorized cross-tenant data access.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Backup and Recovery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Automated Backups</h4>
                  <p className="text-gray-600">
                    We perform automated daily backups of all data with point-in-time recovery capabilities. Backups are encrypted and stored in geographically separate locations.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Disaster Recovery</h4>
                  <p className="text-gray-600">
                    Our disaster recovery plan ensures business continuity with defined recovery time objectives (RTO) and recovery point objectives (RPO) to minimize data loss and downtime.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>24/7 system monitoring and alerting</li>
                  <li>Security event logging and analysis</li>
                  <li>Anomaly detection for suspicious activities</li>
                  <li>Regular security audits and assessments</li>
                  <li>Incident response procedures</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employee Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Our team members undergo security training and follow strict protocols:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Background checks for all employees</li>
                  <li>Regular security awareness training</li>
                  <li>Principle of least privilege access</li>
                  <li>Confidentiality agreements</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  We maintain compliance with relevant data protection regulations and industry standards:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>GDPR (General Data Protection Regulation)</li>
                  <li>CCPA (California Consumer Privacy Act)</li>
                  <li>FERPA (Family Educational Rights and Privacy Act) for educational institutions</li>
                  <li>Industry best practices for data security</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reporting Security Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  If you discover a security vulnerability or have concerns about data security, please contact us immediately:
                </p>
                <div className="mt-4 text-gray-600">
                  <p>Email: info@schoolhouselogistics.com</p>
                  <p>Phone: (407) 494-5230</p>
                </div>
                <p className="text-gray-600 mt-4">
                  We take all security reports seriously and will investigate promptly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <PublicFooter />
      <ScrollToTopButton />
      <ScrollToTop />
    </div>
  );
}
