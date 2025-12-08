import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import RequestCard from "@/components/requests/RequestCard";
import { format } from "date-fns";

export default function RoomHistory() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({
    start: undefined,
    end: undefined
  });
  
  // Get list of all buildings
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery<string[]>({
    queryKey: ["/api/room-buildings"],
    enabled: isAuthenticated,
  });

  // Get all requests for the selected building/room
  const { data: requests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/room-history", selectedBuilding, selectedRoom === "all" ? undefined : selectedRoom],
    queryFn: async () => {
      if (!selectedBuilding) return [];
      
      const params = new URLSearchParams({ building: selectedBuilding });
      if (selectedRoom && selectedRoom !== "all") {
        params.append("roomNumber", selectedRoom);
      }
      
      const response = await fetch(`/api/room-history?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch room history: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!selectedBuilding,
  });

  // Filter requests based on search term and date range
  const filteredRequests = requests.filter((request: any) => {
    // Filter by search term if provided
    const matchesSearch = !searchTerm || 
      request.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by date range if provided
    const requestDate = new Date(request.eventDate);
    const matchesDateRange = 
      (!dateRange.start || requestDate >= new Date(dateRange.start)) &&
      (!dateRange.end || requestDate <= new Date(dateRange.end));
    
    return matchesSearch && matchesDateRange;
  });

  // When building changes, reset room selection
  useEffect(() => {
    setSelectedRoom("all");
  }, [selectedBuilding]);

  // Get unique room numbers for the selected building
  const rooms = requests.reduce((acc: string[], request: any) => {
    if (
      request.buildingDetails?.roomNumber && 
      !acc.includes(request.buildingDetails.roomNumber)
    ) {
      acc.push(request.buildingDetails.roomNumber);
    }
    return acc;
  }, []);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" className="mr-3 text-primary p-2" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Room Maintenance History</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                <Select
                  value={selectedBuilding}
                  onValueChange={setSelectedBuilding}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildingsLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      buildings.map((building: string) => (
                        <SelectItem key={building} value={building}>
                          {building}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <Select
                  value={selectedRoom}
                  onValueChange={setSelectedRoom}
                  disabled={!selectedBuilding || !rooms?.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedBuilding ? "Select building first" : "All rooms"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {rooms && rooms.map((room: string) => (
                      <SelectItem key={room} value={room}>
                        {room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex flex-row gap-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    placeholder="Start date"
                    className="w-full"
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    placeholder="End date"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by keywords"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedBuilding ? 
                `Maintenance History: ${selectedBuilding}${selectedRoom ? ` - Room ${selectedRoom}` : ''}` : 
                'Select a building to view history'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="text-center py-8">Loading request history...</div>
            ) : filteredRequests?.length > 0 ? (
              <div className="space-y-4">
                {filteredRequests.map((request: any) => (
                  <RequestCard key={request.id} request={request} showRequestor={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {selectedBuilding ? 
                  `No repair requests found for ${selectedBuilding}${selectedRoom ? ` - Room ${selectedRoom}` : ''}` :
                  'Select a building to view maintenance history'
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}