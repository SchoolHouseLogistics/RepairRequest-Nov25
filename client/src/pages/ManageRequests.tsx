import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RequestCard from "@/components/requests/RequestCard";

export default function ManageRequests() {
  const navigate = useNavigate();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Redirect if not admin, maintenance, or super admin
  if (!isLoadingAuth && user && user.role !== 'admin' && user.role !== 'maintenance' && user.role !== 'super_admin') {
    navigate("/");
    return null;
  }

  // Fetch organizations for super admin
  const { data: organizations } = useQuery({
    queryKey: ["/api/admin/organizations"],
    enabled: isSuperAdmin,
  });
  
  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/requests/all", activeTab !== "all" ? activeTab : undefined, selectedOrganization],
    queryFn: async () => {
      let url = `/api/requests/all`;
      const params = new URLSearchParams();
      
      if (activeTab !== "all") {
        params.append("status", activeTab);
      }
      
      if (isSuperAdmin && selectedOrganization) {
        params.append("organizationId", selectedOrganization);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch requests");
      return res.json();
    },
    enabled: !isSuperAdmin || !!selectedOrganization, // For super admin, only fetch when org is selected
  });
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  if (isLoadingAuth) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse h-8 w-64 bg-gray-200 rounded mb-6"></div>
          <div className="animate-pulse h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <Helmet>
        <title>Manage Requests - RepairRequest</title>
        <meta name="description" content="View and manage all maintenance and facility requests. Filter by status, assign staff, and track progress." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">
          {isSuperAdmin ? "Manage Organization Requests" : "Manage All Requests"}
        </h1>
        
        {isSuperAdmin && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Organization
            </label>
            <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Choose an organization to view requests" />
              </SelectTrigger>
              <SelectContent>
                {organizations && Array.isArray(organizations) ? (
                  organizations.map((org: any) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No organizations available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            <Card>
              {isSuperAdmin && !selectedOrganization ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Please select an organization to view requests</p>
                </div>
              ) : isLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-20 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : requests?.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {requests.map((request: any) => (
                    <RequestCard 
                      key={request.id} 
                      request={request} 
                      showRequestor={true} 
                    />
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">
                    No {activeTab !== "all" ? activeTab : ""} requests found
                    {isSuperAdmin && selectedOrganization && organizations ? 
                      ` for ${organizations.find((org: any) => org.id.toString() === selectedOrganization)?.name}` : 
                      ""
                    }
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
