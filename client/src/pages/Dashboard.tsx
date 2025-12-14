import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import StatsCard from "@/components/dashboard/StatsCard";
import RequestCard from "@/components/requests/RequestCard";
import { format } from "date-fns";



export default function Dashboard() {
  const { user } = useAuth();
  console.log(user);
  
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const { data: recentRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/requests/recent"],
  });

  const { data: assignedRequests, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ["/api/requests/assigned"],
    enabled: user?.role === 'maintenance',
  });

  const { data: buildingsData, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ["/api/buildings"],
  });
  
  return (
    <div className="py-6">
      <Helmet>
        <title>Dashboard - RepairRequest</title>
        <meta name="description" content="View your facilities management dashboard with request statistics, recent activity, and quick access to maintenance operations." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-heading font-bold text-gray-900">Dashboard</h1>
        
        {/* Stats Overview */}
        {/* Statistics Cards - Show for admins only */}
        {user && user.role === 'admin' && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isLoadingStats ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white animate-pulse h-24 rounded-lg"></div>
                ))}
              </>
            ) : (
              <>
                <StatsCard 
                  title="Total Requests" 
                  value={statsData?.total || 0} 
                  className="bg-white" 
                />
                <StatsCard 
                  title="Pending" 
                  value={statsData?.pending || 0} 
                  className="bg-white text-status-pending" 
                />
                <StatsCard 
                  title="In Progress" 
                  value={statsData?.inProgress || 0} 
                  className="bg-white text-status-inprogress" 
                />
                <StatsCard 
                  title="Completed" 
                  value={statsData?.completed || 0} 
                  className="bg-white text-status-completed" 
                />
              </>
            )}
          </div>
        )}
        
        {/* Assigned Requests - Show for maintenance users */}
        {user && user.role === 'maintenance' && (
          <div className="mt-8">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-heading font-medium text-gray-900">Assigned to Me</h2>
              <Link to="/assigned-requests" className="text-sm text-primary hover:text-primary-light font-medium">
                View all
              </Link>
            </div>
            
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              {isLoadingAssigned ? (
                <div className="p-4 space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse h-20 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : assignedRequests && assignedRequests.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {assignedRequests.slice(0, 3).map((request: any) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No requests assigned to you</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Super Admin Actions */}
        {user && user.role === 'super_admin' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-lg font-heading font-medium text-gray-900">Administrative Tools</h2>
            
            {/* Manage Organizations */}
            <div className="bg-white rounded-lg shadow p-6">
              <Link to="/admin/organizations">
                <a className="block hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Organizations</h3>
                      <p className="text-gray-600">Create, edit, and manage organizations within the system</p>
                    </div>
                  </div>
                </a>
              </Link>
            </div>

            {/* Buildings & Facilities */}
            <div className="bg-white rounded-lg shadow p-6">
              <Link to="/admin/buildings-facilities">
                <span className="block hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-4" >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Buildings & Facilities</h3>
                      <p className="text-gray-600">Configure buildings and facilities for all organizations</p>
                    </div>
                  </div>
                </span>
              </Link>
            </div>

            {/* User Management */}
            <div className="bg-white rounded-lg shadow p-6">
              <Link to="/admin/users">
                <a className="block hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                      <p className="text-gray-600">Manage user roles and organization assignments across the system</p>
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          </div>
        )}

        {/* Request Actions - Show for regular users and maintenance */}
        {user && user.role !== 'admin' && user.role !== 'super_admin' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-lg font-heading font-medium text-gray-900">Submit a Request</h2>
            
            {/* Building Maintenance Request */}
            <div className="bg-white rounded-lg shadow p-6">
              <Link to="/new-building-request">
                <a className="block hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Repair Request</h3>
                      <p className="text-gray-600">Use this if there is a situation somewhere on site that needs to be addressed</p>
                    </div>
                  </div>
                </a>
              </Link>
            </div>

            {/* Facilities Request */}
            <div className="bg-white rounded-lg shadow p-6">
              <Link to="/new-facilities-request">
                <a className="block hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Labor Request</h3>
                      <p className="text-gray-600">Use this if there is an event where you will need maintenance to assist with labor</p>
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          </div>
        )}

        {/* Request Status Sections - Show for admins only */}
        {user && user.role === 'admin' && (
          <div className="mt-8 space-y-8">
            {/* Open Requests */}
            <div>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-heading font-medium text-gray-900">Open Requests</h2>
                <Link to="/manage">
                  <a className="text-sm text-primary hover:text-primary-light font-medium">View all</a>
                </Link>
              </div>
              
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                {isLoadingRequests ? (
                  <div className="p-4 space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse h-20 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                ) : (() => {
                    const openRequests = recentRequests?.filter((request: any) => 
                      ['pending', 'approved', 'in-progress'].includes(request.status)
                    ) || [];
                    
                    return openRequests.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {openRequests.slice(0, 3).map((request: any) => (
                          <RequestCard key={request.id} request={request} />
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-gray-500">No open requests found</p>
                      </div>
                    );
                  })()}
              </div>
            </div>

            {/* Completed Requests */}
            <div>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-heading font-medium text-gray-900">Completed Requests</h2>
                <Link to="/manage">
                  <a className="text-sm text-primary hover:text-primary-light font-medium">View all</a>
                </Link>
              </div>
              
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                {isLoadingRequests ? (
                  <div className="p-4 space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse h-20 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                ) : (() => {
                    const completedRequests = recentRequests?.filter((request: any) => 
                      request.status === 'completed'
                    ) || [];
                    
                    return completedRequests.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {completedRequests.slice(0, 3).map((request: any) => (
                          <RequestCard key={request.id} request={request} />
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-gray-500">No completed requests found</p>
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>
        )}
        
        {/* Buildings */}
        <div className="mt-8">
          <h2 className="text-lg font-heading font-medium text-gray-900">Buildings</h2>
          <div className="mt-4 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingBuildings ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>
                ))}
              </>
            ) : buildingsData && buildingsData.length > 0 ? (
              buildingsData.slice(0, 6).map((building: any) => (
                <div key={building.id} className="relative rounded-lg overflow-hidden h-48 shadow-md" data-testid={`card-building-${building.id}`}>
                  {building.imageUrl ? (
                    <img 
                      src={building.imageUrl} 
                      alt={building.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <h3 className="text-white font-heading font-medium">{building.name}</h3>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No buildings found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}