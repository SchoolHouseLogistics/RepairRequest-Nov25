import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "What is RepairRequest?",
    answer: "RepairRequest is a simple, centralized system for submitting, tracking, and managing maintenance and repair requests across your organization. It replaces emails, paper forms, and hallway conversations with one clear, organized workflow."
  },
  {
    question: "Who is RepairRequest for?",
    answer: "RepairRequest is built for any organization that manages facilities or shared spaces, including schools and school districts, churches and religious organizations, office buildings, athletic facilities, nonprofits, and community organizations. If people report issues and someone needs to fix them, RepairRequest fits."
  },
  {
    question: "How do users submit a repair request?",
    answer: "Users submit requests through a simple online form. They can include the issue or problem, location or facility, priority level, and optional notes or photos. Once submitted, the request is instantly logged in the system."
  },
  {
    question: "Do users need an account to submit a repair request?",
    answer: "This depends on how your organization is set up. Admins can allow logged-in staff only, public or shared form access, or role-based access for staff and maintenance teams. You control who can submit and who can manage requests."
  },
  {
    question: "How are requests tracked?",
    answer: "Each request has a clear status, such as New, In Progress, Waiting on Parts, or Completed. Admins and maintenance teams can update statuses, add internal notes, and keep everything documented in one place."
  },
  {
    question: "Does RepairRequest notify people when something changes?",
    answer: "Yes. RepairRequest can send automatic notifications when a request is submitted, a status is updated, or a request is completed. This keeps everyone informed without back-and-forth emails."
  },
  {
    question: "Can multiple people manage requests?",
    answer: "Yes. RepairRequest supports multiple admins and maintenance staff so work can be shared across a team. Everyone sees the same up-to-date information."
  },
  {
    question: "Can we organize requests by building or location?",
    answer: "Yes. Requests can be organized by facility, building, and room or area. This makes it easy to spot recurring issues or manage large campuses."
  },
  {
    question: "Is RepairRequest mobile-friendly?",
    answer: "Yes. RepairRequest works on phones, tablets, and desktops so requests can be submitted or updated from anywhere."
  },
  {
    question: "How long does setup take?",
    answer: "Most organizations are up and running in less than a day. Setup is intentionally simple, and we help configure the system to match your workflow."
  },
  {
    question: "Can RepairRequest scale as we grow?",
    answer: "Absolutely. RepairRequest works just as well for a single building as it does for multi-facility organizations."
  },
  {
    question: "Is our data secure?",
    answer: "Yes. We take data security seriously and use modern best practices to protect your information."
  },
  {
    question: "What kind of support do you offer?",
    answer: "We provide onboarding support, ongoing customer support, and help with configuration and best practices. You are not left to figure it out on your own."
  },
  {
    question: "How do we get started?",
    answer: "Getting started is easy. Request access, set up your facilities and users, and start accepting repair requests immediately."
  }
];

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
                Try RepairRequest Free for 30 Days! 
                <span className="hidden sm:inline ml-2">No credit card required. Full access to all features. Cancel anytime.</span>
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
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-4">
            FAQs
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Everything you need to know before getting started with RepairRequest.
          </p>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg border shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="px-6"
                  data-testid={`faq-item-${index}`}
                >
                  <AccordionTrigger 
                    className="text-left text-base font-medium hover:no-underline text-gray-900"
                    data-testid={`faq-trigger-${index}`}
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <p className="text-xl text-gray-600 mb-4">
              Still have questions?
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700" data-testid="button-contact-support">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
      <ScrollToTopButton />
      <ScrollToTop />
    </div>
  );
}
