import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit, Building, Wrench, X, Upload, ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Helper to get image URL - proxies S3 URLs through the server
function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  // If it's an S3 URL, proxy it through the server
  if (imageUrl.includes('.s3.') && imageUrl.includes('.amazonaws.com')) {
    return `/api/s3-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}

const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  address: z.string().optional(),
  description: z.string().optional(),
  roomNumbers: z.array(z.string()).default([]),
});

const facilitySchema = z.object({
  name: z.string().min(1, "Facility name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  availableItems: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
  })).default([]),
  sortOrder: z.number().default(0),
});

type BuildingFormValues = z.infer<typeof buildingSchema>;
type FacilityFormValues = z.infer<typeof facilitySchema>;

export default function AdminBuildingsFacilities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOrganization, setSelectedOrganization] = useState<number | null>(null);

  // Only super admins can access this page
  if (user?.role !== 'super_admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-500">
              Only super administrators can manage buildings and facilities.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any>(null);
  const [editingFacility, setEditingFacility] = useState<any>(null);

  // Room management for buildings
  const [newRoom, setNewRoom] = useState("");
  const [facilityItems, setFacilityItems] = useState<Array<{name: string, description?: string, category?: string}>>([]);
  const [newItem, setNewItem] = useState({name: "", description: "", category: ""});

  // Fetch organizations
  const { data: organizations, isLoading: organizationsLoading, error: organizationsError } = useQuery({
    queryKey: ["/api/admin/organizations"],
  });

  // Debug logging
  console.log("Organizations data:", organizations);
  console.log("Organizations loading:", organizationsLoading);
  console.log("Organizations error:", organizationsError);

  // Fetch buildings for selected organization
  const { data: buildings, refetch: refetchBuildings } = useQuery({
    queryKey: [`/api/admin/buildings/${selectedOrganization}`],
    enabled: !!selectedOrganization,
  });

  // Fetch facilities for selected organization
  const { data: facilities, refetch: refetchFacilities } = useQuery({
    queryKey: [`/api/admin/facilities/${selectedOrganization}`],
    enabled: !!selectedOrganization,
  });

  const buildingForm = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
      roomNumbers: [],
    },
  });

  const facilityForm = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      availableItems: [],
      sortOrder: 0,
    },
  });

  // Building mutations
  const createBuildingMutation = useMutation({
    mutationFn: (data: BuildingFormValues) => 
      apiRequest("POST", "/api/admin/buildings", { ...data, organizationId: selectedOrganization }),
    onSuccess: () => {
      toast({ title: "Building created successfully" });
      setBuildingDialogOpen(false);
      buildingForm.reset();
      refetchBuildings();
    },
  });

  const updateBuildingMutation = useMutation({
    mutationFn: (data: BuildingFormValues) => 
      apiRequest("PATCH", `/api/admin/buildings/${editingBuilding.id}`, data),
    onSuccess: () => {
      toast({ title: "Building updated successfully" });
      setBuildingDialogOpen(false);
      buildingForm.reset();
      setEditingBuilding(null);
      refetchBuildings();
    },
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/admin/buildings/${id}`),
    onSuccess: () => {
      toast({ title: "Building deleted successfully" });
      refetchBuildings();
    },
  });

  // Facility mutations
  const createFacilityMutation = useMutation({
    mutationFn: (data: FacilityFormValues) => 
      apiRequest("POST", "/api/admin/facilities", { ...data, organizationId: selectedOrganization }),
    onSuccess: () => {
      toast({ title: "Facility created successfully" });
      setFacilityDialogOpen(false);
      facilityForm.reset();
      setFacilityItems([]);
      refetchFacilities();
    },
  });

  const updateFacilityMutation = useMutation({
    mutationFn: (data: FacilityFormValues) => 
      apiRequest("PATCH", `/api/admin/facilities/${editingFacility.id}`, data),
    onSuccess: () => {
      toast({ title: "Facility updated successfully" });
      setFacilityDialogOpen(false);
      facilityForm.reset();
      setEditingFacility(null);
      setFacilityItems([]);
      refetchFacilities();
    },
  });

  const deleteFacilityMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/admin/facilities/${id}`),
    onSuccess: () => {
      toast({ title: "Facility deleted successfully" });
      refetchFacilities();
    },
  });

  // Building image upload mutation
  const uploadBuildingImageMutation = useMutation({
    mutationFn: async ({ buildingId, file }: { buildingId: number; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/admin/buildings/${buildingId}/image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Building image uploaded successfully" });
      refetchBuildings();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to upload image", description: error.message, variant: "destructive" });
    },
  });

  const deleteBuildingImageMutation = useMutation({
    mutationFn: (buildingId: number) => 
      apiRequest("DELETE", `/api/admin/buildings/${buildingId}/image`),
    onSuccess: () => {
      toast({ title: "Building image removed" });
      refetchBuildings();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove image", description: error.message, variant: "destructive" });
    },
  });

  const handleImageUpload = (buildingId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadBuildingImageMutation.mutate({ buildingId, file });
      // Reset input so same file can be selected again
      event.target.value = '';
    }
  };

  const handleCreateBuilding = (data: BuildingFormValues) => {
    createBuildingMutation.mutate(data);
  };

  const handleUpdateBuilding = (data: BuildingFormValues) => {
    updateBuildingMutation.mutate(data);
  };

  const handleCreateFacility = (data: FacilityFormValues) => {
    const facilityData = {
      ...data,
      availableItems: facilityItems,
    };
    createFacilityMutation.mutate(facilityData);
  };

  const handleUpdateFacility = (data: FacilityFormValues) => {
    const facilityData = {
      ...data,
      availableItems: facilityItems,
    };
    updateFacilityMutation.mutate(facilityData);
  };

  const handleEditBuilding = (building: any) => {
    setEditingBuilding(building);
    buildingForm.reset({
      name: building.name,
      address: building.address || "",
      description: building.description || "",
      roomNumbers: building.roomNumbers || [],
    });
    setBuildingDialogOpen(true);
  };

  const handleEditFacility = (facility: any) => {
    setEditingFacility(facility);
    facilityForm.reset({
      name: facility.name,
      description: facility.description || "",
      category: facility.category || "",
      sortOrder: facility.sortOrder || 0,
    });
    setFacilityItems(facility.availableItems || []);
    setFacilityDialogOpen(true);
  };

  const addRoom = () => {
    if (newRoom.trim()) {
      const currentRooms = buildingForm.getValues("roomNumbers") || [];
      buildingForm.setValue("roomNumbers", [...currentRooms, newRoom.trim()]);
      setNewRoom("");
    }
  };

  const removeRoom = (index: number) => {
    const currentRooms = buildingForm.getValues("roomNumbers") || [];
    buildingForm.setValue("roomNumbers", currentRooms.filter((_, i) => i !== index));
  };

  const addFacilityItem = () => {
    if (newItem.name.trim()) {
      setFacilityItems([...facilityItems, { ...newItem }]);
      setNewItem({ name: "", description: "", category: "" });
    }
  };

  const removeFacilityItem = (index: number) => {
    setFacilityItems(facilityItems.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Buildings & Facilities Management</h1>
      </div>

      {/* Organization Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedOrganization?.toString() || ""}
            onValueChange={(value) => setSelectedOrganization(parseInt(value))}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Choose an organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations?.map((org: any) => (
                <SelectItem key={org.id} value={org.id.toString()}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedOrganization && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Buildings Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Buildings
              </CardTitle>
              <Dialog open={buildingDialogOpen} onOpenChange={setBuildingDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingBuilding(null);
                    buildingForm.reset();
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Building
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBuilding ? "Edit Building" : "Add New Building"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...buildingForm}>
                    <form onSubmit={buildingForm.handleSubmit(editingBuilding ? handleUpdateBuilding : handleCreateBuilding)} className="space-y-4">
                      <FormField
                        control={buildingForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Building Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Main Building" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={buildingForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Building address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={buildingForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Building description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Room Numbers Management */}
                      <div>
                        <FormLabel>Room Numbers</FormLabel>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={newRoom}
                            onChange={(e) => setNewRoom(e.target.value)}
                            placeholder="Add room number"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addRoom();
                              }
                            }}
                          />
                          <Button type="button" onClick={addRoom}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {buildingForm.watch("roomNumbers")?.map((room: string, index: number) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {room}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeRoom(index)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setBuildingDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingBuilding ? "Update" : "Create"} Building
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {buildings?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No buildings configured. Add your first building to get started.
                  </p>
                ) : (
                  buildings?.map((building: any) => (
                    <div key={building.id} className="border rounded-lg overflow-hidden" data-testid={`building-card-${building.id}`}>
                      {/* Building Image Section */}
                      <div className="relative h-32 bg-gray-100">
                        {building.imageUrl ? (
                          <>
                            <img 
                              src={getImageUrl(building.imageUrl) || ''} 
                              alt={building.name}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => deleteBuildingImageMutation.mutate(building.id)}
                              data-testid={`button-remove-image-${building.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon className="h-8 w-8 mb-2" />
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(building.id, e)}
                                data-testid={`input-upload-image-${building.id}`}
                              />
                              <span className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                <Upload className="h-4 w-4" />
                                Upload Photo
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{building.name}</h3>
                          <div className="flex gap-2">
                            {building.imageUrl && (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(building.id, e)}
                                />
                                <Button variant="outline" size="sm" asChild>
                                  <span><Upload className="h-4 w-4" /></span>
                                </Button>
                              </label>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBuilding(building)}
                              data-testid={`button-edit-building-${building.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteBuildingMutation.mutate(building.id)}
                              data-testid={`button-delete-building-${building.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {building.address && (
                          <p className="text-sm text-gray-600 mb-2">{building.address}</p>
                        )}
                        {building.description && (
                          <p className="text-sm text-gray-600 mb-2">{building.description}</p>
                        )}
                        {building.roomNumbers && building.roomNumbers.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Rooms:</p>
                            <div className="flex flex-wrap gap-1">
                              {building.roomNumbers.map((room: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {room}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Facilities Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Facilities
              </CardTitle>
              <Dialog open={facilityDialogOpen} onOpenChange={setFacilityDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingFacility(null);
                    facilityForm.reset();
                    setFacilityItems([]);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Facility
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingFacility ? "Edit Facility" : "Add New Facility"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...facilityForm}>
                    <form onSubmit={facilityForm.handleSubmit(editingFacility ? handleUpdateFacility : handleCreateFacility)} className="space-y-4">
                      <FormField
                        control={facilityForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facility Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Performing Arts Center" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={facilityForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Academic, Athletic, Special Events" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={facilityForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Facility description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={facilityForm.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort Order</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Available Items Management */}
                      <div>
                        <FormLabel>Available Items</FormLabel>
                        <div className="space-y-2 mt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={newItem.name}
                              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                              placeholder="Item name"
                            />
                            <Input
                              value={newItem.category}
                              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                              placeholder="Category"
                            />
                          </div>
                          <Input
                            value={newItem.description}
                            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                            placeholder="Item description"
                          />
                          <Button type="button" onClick={addFacilityItem} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                        <div className="space-y-2 mt-4">
                          {facilityItems.map((item, index) => (
                            <div key={index} className="border rounded p-3 flex justify-between items-start">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.category && (
                                  <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>
                                )}
                                {item.description && (
                                  <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFacilityItem(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFacilityDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingFacility ? "Update" : "Create"} Facility
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {facilities?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No facilities configured. Add your first facility to get started.
                  </p>
                ) : (
                  facilities?.map((facility: any) => (
                    <div key={facility.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{facility.name}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditFacility(facility)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteFacilityMutation.mutate(facility.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {facility.category && (
                        <Badge variant="secondary" className="mb-2">{facility.category}</Badge>
                      )}
                      {facility.description && (
                        <p className="text-sm text-gray-600 mb-2">{facility.description}</p>
                      )}
                      {facility.availableItems && facility.availableItems.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Available Items:</p>
                          <div className="space-y-1">
                            {facility.availableItems.map((item: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{item.name}</span>
                                {item.category && (
                                  <Badge variant="outline" className="ml-2 text-xs">{item.category}</Badge>
                                )}
                                {item.description && (
                                  <div className="text-gray-600 ml-4">{item.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}