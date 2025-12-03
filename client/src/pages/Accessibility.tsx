import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Accessibility Statement - RepairRequest</title>
        <meta name="description" content="RepairRequest is committed to digital accessibility. Learn about our accessibility features and how we strive to make our platform usable for everyone." />
        <link rel="canonical" href="https://www.repairrequest.org/accessibility" />
        <meta property="og:title" content="RepairRequest Accessibility Statement" />
        <meta property="og:description" content="Our commitment to making RepairRequest accessible to all users." />
        <meta property="og:url" content="https://www.repairrequest.org/accessibility" />
        <meta name="twitter:title" content="RepairRequest Accessibility Statement" />
        <meta name="twitter:description" content="Our commitment to digital accessibility for all users." />
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
            Accessibility
            <span className="text-blue-600 block">Statement</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            RepairRequest is committed to ensuring digital accessibility for people with disabilities.
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
                <CardTitle>Our Commitment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  SchoolHouse Logistics is committed to ensuring that RepairRequest is accessible to all users, including those with disabilities. We continually work to improve the user experience for everyone and apply relevant accessibility standards to ensure we provide equal access to all users.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accessibility Standards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. These guidelines explain how to make web content more accessible to people with a wide range of disabilities, including:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Visual impairments</li>
                  <li>Hearing impairments</li>
                  <li>Motor impairments</li>
                  <li>Cognitive impairments</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accessibility Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 mb-4">
                  RepairRequest includes the following accessibility features:
                </p>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Navigation and Structure</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Consistent navigation throughout the platform</li>
                    <li>Clear page structure with proper heading hierarchy</li>
                    <li>Skip navigation links for keyboard users</li>
                    <li>Descriptive link text</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Visual Accessibility</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Sufficient color contrast for text and interactive elements</li>
                    <li>Text can be resized up to 200% without loss of functionality</li>
                    <li>Visual indicators for focus states</li>
                    <li>Alternative text for images</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Keyboard Accessibility</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>All functionality available via keyboard</li>
                    <li>Visible focus indicators on interactive elements</li>
                    <li>Logical tab order</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Screen Reader Compatibility</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Semantic HTML structure</li>
                    <li>ARIA labels where appropriate</li>
                    <li>Form labels and error messages</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Known Limitations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  While we strive to adhere to accepted guidelines and standards for accessibility, it is not always possible to do so in all areas of the platform. We are continually seeking solutions that will bring all areas of our platform up to the same level of accessibility. Known limitations include:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Some older PDF documents may not be fully accessible</li>
                  <li>Third-party content and widgets may have varying levels of accessibility</li>
                  <li>Some interactive charts and graphs may require alternative data tables</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assistive Technology</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  RepairRequest is designed to be compatible with the following assistive technologies:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Screen readers (NVDA, JAWS, VoiceOver)</li>
                  <li>Screen magnification software</li>
                  <li>Speech recognition software</li>
                  <li>Keyboard-only navigation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browser Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  RepairRequest is designed to work with the latest versions of the following browsers:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Google Chrome</li>
                  <li>Mozilla Firefox</li>
                  <li>Microsoft Edge</li>
                  <li>Apple Safari</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback and Assistance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  We welcome your feedback on the accessibility of RepairRequest. If you encounter accessibility barriers or have suggestions for improvement, please contact us:
                </p>
                <div className="mt-4 text-gray-600">
                  <p>Email: info@schoolhouselogistics.com</p>
                  <p>Phone: (407) 494-5230</p>
                </div>
                <p className="text-gray-600 mt-4">
                  We try to respond to accessibility feedback within 5 business days and will work with you to identify and implement solutions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Continuous Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We are committed to continuously improving the accessibility of RepairRequest. We regularly review our platform against current accessibility standards and best practices, and we implement improvements as part of our ongoing development process.
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
