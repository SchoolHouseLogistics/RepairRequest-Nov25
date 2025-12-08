import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import RequestCard from "@/components/requests/RequestCard";

export default function AssignedRequests() {
  const navigate = useNavigate();
  const { user, isLoading: isLoadingAuth } = useAuth();
  
  // Redirect if not admin or maintenance
  if (!isLoadingAuth && user && user.role !== 'admin' && user.role !== 'maintenance') {
    navigate("/dashboard");
    return null;
  }
  
  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/requests/assigned"],
  });
  
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">Requests Assigned to Me</h1>
        
        <Card>
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : requests?.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {requests.map((request:any) => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  showRequestor={true} 
                />
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No requests are currently assigned to you</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
