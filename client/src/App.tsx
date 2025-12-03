import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import RequestForm from "@/pages/RequestForm";
import BuildingRequestForm from "@/pages/BuildingRequestForm";
import RequestDetail from "@/pages/RequestDetail";
import MyRequests from "@/pages/MyRequests";
import AssignedRequests from "@/pages/AssignedRequests";
import ManageRequests from "@/pages/ManageRequests";
import Reports from "@/pages/Reports";
import RoomHistory from "@/pages/RoomHistory";
import AdminOrganizations from "@/pages/AdminOrganizations";
import AdminBuildingsFacilities from "@/pages/AdminBuildingsFacilities";
import AdminUsers from "@/pages/AdminUsers";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Support from "@/pages/Support";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import FAQ from "@/pages/FAQ";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import ScrollToTop from "@/components/ScrollToTop";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import { BrowserRouter, Outlet, Route, Routes, useParams } from "react-router-dom";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

function RequestDetailWrapper() {
  const { id } = useParams();
  return <RequestDetail id={id!} />;
}

function ProtectedLayout() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar toggleMobileSidebar={toggleMobileSidebar} user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
          user={user}
        />
        <main className="flex-1 relative z-0 overflow-y-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
      <MobileNav user={user} />
    </div>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Get organization name for dynamic branding
  let organizationName = 'RepairRequest';
  if (user && typeof user === 'object') {
    if ('role' in user && user.role === 'super_admin') {
      organizationName = 'SchoolHouse Logistics';
    } else if ('organizationName' in user && typeof user.organizationName === 'string') {
      organizationName = user.organizationName;
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{organizationName} - Facilities Management System</title>
        <meta name="description" content={`${organizationName}'s comprehensive facilities management system for repair requests and facility scheduling.`} />
      </Helmet>

      <Routes>
        {/* Public routes - always available */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/support" element={<Support />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected routes */}
        {isAuthenticated && (
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-facilities-request" element={<RequestForm />} />
            <Route path="/new-building-request" element={<BuildingRequestForm />} />
            <Route path="/requests/:id" element={<RequestDetailWrapper />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/assigned-requests" element={<AssignedRequests />} />
            <Route path="/manage-requests" element={<ManageRequests />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/room-history" element={<RoomHistory />} />
            <Route path="/admin/organizations" element={<AdminOrganizations />} />
            <Route path="/admin/buildings-facilities" element={<AdminBuildingsFacilities />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        )}

        {/* Fallback for unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <ScrollToTop />
          <AppContent />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
