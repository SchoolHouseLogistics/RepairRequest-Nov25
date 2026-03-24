import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Cookie Policy - RepairRequest</title>
        <meta name="description" content="RepairRequest cookie policy. Learn about the cookies we use, why we use them, and how you can manage your cookie preferences." />
        <link rel="canonical" href="https://www.repairrequest.org/cookie-policy" />
        <meta property="og:title" content="RepairRequest Cookie Policy" />
        <meta property="og:description" content="Information about how RepairRequest uses cookies and tracking technologies." />
        <meta property="og:url" content="https://www.repairrequest.org/cookie-policy" />
        <meta name="twitter:title" content="RepairRequest Cookie Policy" />
        <meta name="twitter:description" content="Our cookie policy and how we use tracking technologies." />
      </Helmet>
      
      <PublicHeader currentPage="" />

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Cookie
            <span className="text-blue-600 block">Policy</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            This policy explains how RepairRequest uses cookies and similar technologies.
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
                <CardTitle>What Are Cookies?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and provide information to the website owners. Cookies allow websites to remember your preferences and recognize you on return visits.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  RepairRequest uses cookies for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>To keep you signed in to your account</li>
                  <li>To remember your preferences and settings</li>
                  <li>To ensure the security of your session</li>
                  <li>To understand how you use our platform</li>
                  <li>To improve our services based on usage patterns</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Types of Cookies We Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Essential Cookies</h4>
                  <p className="text-gray-600">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies as the website cannot function properly without them.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li><strong>Session cookies:</strong> Maintain your login state and session security</li>
                    <li><strong>Authentication cookies:</strong> Remember that you are logged in</li>
                    <li><strong>Security cookies:</strong> Protect against unauthorized access</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Functional Cookies</h4>
                  <p className="text-gray-600">
                    These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
                    <li><strong>Language cookies:</strong> Remember your language selection</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h4>
                  <p className="text-gray-600">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our services.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li><strong>Usage analytics:</strong> Track page views and navigation patterns</li>
                    <li><strong>Performance monitoring:</strong> Help us identify and fix issues</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Third-Party Cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Some cookies on our website are set by third-party services. These include:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Google:</strong> For authentication via Google OAuth</li>
                  <li><strong>Calendly:</strong> For scheduling functionality on our support pages</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  These third parties have their own privacy and cookie policies. We encourage you to review their policies for more information about how they use cookies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookie Duration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Session Cookies</h4>
                  <p className="text-gray-600">
                    These temporary cookies are erased when you close your browser. They are used to maintain your session while you navigate through the website.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Persistent Cookies</h4>
                  <p className="text-gray-600">
                    These cookies remain on your device for a set period or until you delete them. They are used to remember your preferences for future visits.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Managing Your Cookie Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  You can control and manage cookies in several ways:
                </p>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Browser Settings</h4>
                  <p className="text-gray-600">
                    Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies, delete existing cookies, or alert you when cookies are being sent. Please note that disabling cookies may affect the functionality of our website.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">How to Manage Cookies in Popular Browsers:</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li><strong>Chrome:</strong> Settings &gt; Privacy and security &gt; Cookies and other site data</li>
                    <li><strong>Firefox:</strong> Options &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                    <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
                    <li><strong>Edge:</strong> Settings &gt; Cookies and site permissions &gt; Cookies and site data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact of Disabling Cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  If you choose to disable cookies, please be aware that:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>You may not be able to log in to your RepairRequest account</li>
                  <li>Some features of the website may not function properly</li>
                  <li>Your preferences and settings will not be remembered</li>
                  <li>You may need to manually enter information on each visit</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Updates to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to periodically review this page for the latest information on our cookie practices.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  If you have any questions about our use of cookies, please contact us:
                </p>
                <div className="mt-4 text-gray-600">
                  <p>Email: info@schoolhouselogistics.com</p>
                  <p>Phone: (407) 494-5230</p>
                </div>
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
