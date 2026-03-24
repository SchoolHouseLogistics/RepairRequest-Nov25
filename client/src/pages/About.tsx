import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Heart, Award, Calendar, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet-async";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CalendlyWidget from "@/components/CalendlyWidget";
import ContactForm from "@/components/ContactForm";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>About Us - RepairRequest by SchoolHouse Logistics</title>
        <meta name="description" content="Learn about RepairRequest and SchoolHouse Logistics. Born from real experience in education, now serving organizations of all types with practical software solutions." />
        <link rel="canonical" href="https://www.repairrequest.org/about" />
        <meta property="og:title" content="About RepairRequest - Our Story and Mission" />
        <meta property="og:description" content="Discover how we went from solving real educational challenges to building software solutions for organizations worldwide." />
        <meta property="og:url" content="https://www.repairrequest.org/about" />
        <meta name="twitter:title" content="About RepairRequest" />
        <meta name="twitter:description" content="Learn about our mission to revolutionize facilities management." />
      </Helmet>
      
      <PublicHeader currentPage="about" />

      {/* Promotional Banner */}
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Our Story
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Built from Classroom Frustration. Growing Through Innovation.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              SchoolHouse Logistics was founded out of a simple, persistent frustration: schools were overwhelmed with paperwork, confusing workflows, and disconnected systems. As a teacher trying to manage courses, activities, communication, and daily responsibilities, I saw firsthand how much valuable time was being lost to tasks that should have been streamlined or automated.
            </p>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Facilities and maintenance quickly became another major source of friction. Broken equipment, damaged classrooms, and safety concerns were often reported through emails, sticky notes, or word of mouth. Requests were lost, duplicated, or delayed, leaving staff frustrated and issues unresolved longer than necessary.
            </p>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Tired of the clutter, I began experimenting with VibeCoding and other AI assisted tools. My original goal was not to start a company. It was simply to solve the problems happening in my own school environment. Early on, that work led to the creation of what would become RepairRequest, a centralized system designed to help schools submit, track, and manage maintenance and repair requests with clarity and accountability.
            </p>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              As I shared these early tools with other teachers and administrators, I quickly realized something: many schools were fighting the exact same battles, and these challenges could be solved much more easily than anyone expected.
            </p>
            
            <p className="text-xl text-gray-900 font-semibold mb-6">
              That realization became the spark for SchoolHouse Logistics.
            </p>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              What started as small, experimental solutions grew into a clear and larger vision. As more educators expressed the need for tools like RepairRequest and others beyond it, SchoolHouse Logistics took shape as a company dedicated to improving the way schools operate. Our work is grounded in real classroom experience, real educator feedback, and a commitment to designing tools that make school life easier.
            </p>
            
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Today, SchoolHouse Logistics is building a dedicated internal development team made up of engineers, designers, and product thinkers who work closely with educators to create dependable and thoughtfully designed applications within the SchoolOS ecosystem. RepairRequest is one of those applications, focused specifically on improving facilities communication, reducing downtime, and helping schools maintain safe and functional learning environments.
            </p>
            
            {/* Mission Callout */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-6 my-8 rounded-r-lg">
              <p className="text-lg font-semibold text-gray-900 mb-2">Our mission remains consistent:</p>
              <p className="text-xl text-blue-600 font-bold">Remove unnecessary complexity so educators can focus on students, not paperwork.</p>
            </div>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              SchoolHouse Logistics began in a classroom with a simple idea.
            </p>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              Now it is evolving into a team driven organization committed to transforming school operations one workflow at a time.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>User-Centric</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We design every feature with our users in mind, prioritizing simplicity and effectiveness.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Target className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Results-Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We measure success by the efficiency gains and improved outcomes our customers achieve.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Heart className="h-12 w-12 mx-auto text-red-600 mb-4" />
                <CardTitle>Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our platform is built for dependability, ensuring your maintenance operations never skip a beat.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Award className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <CardTitle>Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We continuously improve our platform and service to exceed expectations.
                </p>
              </CardContent>
            </Card>
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
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Schedule a Meeting</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Book a call with our team to discuss your school's needs and explore our solutions.
              </p>
              
              {/* Calendly Embed */}
              <CalendlyWidget />
            </div>

            {/* Get In Touch - Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <Mail className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Get In Touch</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Ready to transform your operations? Send us a message and we'll get back to you promptly.
              </p>
              
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
