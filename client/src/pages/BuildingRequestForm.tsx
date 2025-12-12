import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { PhotoUpload } from "@/components/ui/PhotoUpload";

const buildingRequestSchema = z.object({
  requestType: z.literal("building"),
  facility: z.string().min(1, "Building is required"),
  event: z.string().min(1, "Request title is required"),
  eventDate: z.string().min(1, "Date is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  photos: z.any().optional(), // Multiple file upload field

  // Building request specific fields
  building: z.object({
    roomNumber: z.string().min(1, "Room number is required"),
    description: z.string().min(1, "Description is required"),
  })
});

type BuildingRequestFormValues = z.infer<typeof buildingRequestSchema>;

export default function BuildingRequestForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch organization buildings
  const { data: buildings, isLoading: buildingsLoading, error: buildingsError } = useQuery({
    queryKey: ["/api/buildings"],
  });

  // Debug logging
  console.log("Buildings data:", buildings);
  console.log("Buildings loading:", buildingsLoading);
  console.log("Buildings error:", buildingsError);

  // State for selected building and its rooms
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);

  // Update available rooms when building changes
  useEffect(() => {
    if (selectedBuilding && buildings && Array.isArray(buildings)) {
      const building = buildings.find((b: any) => b.name === selectedBuilding);
      if (building && building.roomNumbers) {
        setAvailableRooms(building.roomNumbers);
      } else {
        setAvailableRooms([]);
      }
    } else {
      setAvailableRooms([]);
    }
  }, [selectedBuilding, buildings]);

  const form = useForm<BuildingRequestFormValues>({
    resolver: zodResolver(buildingRequestSchema),
    defaultValues: {
      requestType: "building",
      facility: "",
      event: "",
      eventDate: new Date().toISOString().split('T')[0],
      priority: "medium",
      photos: undefined,
      building: {
        roomNumber: "",
        description: "",
      }
    }
  });

  async function onSubmit(data: BuildingRequestFormValues) {
    try {
      // Print detailed form information for debugging
      console.log("FORM SUBMIT - Form data:", JSON.stringify(data));
      setIsSubmitting(true);

      // Create FormData object for multipart form submission
      const formData = new FormData();

      // Basic request info
      formData.append("requestType", "building");
      formData.append("facility", data.facility);
      formData.append("event", data.event);
      formData.append("eventDate", data.eventDate);
      formData.append("priority", data.priority);

      // Building specific info
      formData.append("building.roomNumber", data.building.roomNumber);
      formData.append("building.description", data.building.description);
      // Use the facility as the building name
      formData.append("building.building", data.facility);

      // Handle multiple photo uploads if present
      if (data.photos) {
        const files = Array.isArray(data.photos) ? data.photos : [data.photos];

        files.forEach((file: File, index: number) => {
          if (file instanceof File) {
            console.log(`FORM SUBMIT - Photo ${index + 1} being attached:`, file.name, file.type, file.size + "bytes");
            formData.append("photos", file);
          }
        });
      }

      // Log form data entries for debugging
      console.log("FORM SUBMIT - FormData contents:");
      Array.from(formData.entries()).forEach(pair => {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      });

      console.log("FORM SUBMIT - Sending to /api/building-requests");

      // Submit the form data to the API endpoint
      const response = await fetch("/api/building-requests", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      console.log("FORM SUBMIT - Response received:", response.status, response.statusText);

      // Handle errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error("FORM SUBMIT - Error response:", errorText);
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      // Parse the response
      const result = await response.json();
      console.log("FORM SUBMIT - Success response:", result);

      // Show success message
      toast({
        title: "Request Submitted Successfully",
        description: "Your building repair request has been sent to administrators.",
      });

      // Update any cached data
      queryClient.invalidateQueries({queryKey: ["/api/requests/my"]});

      // Navigate back to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("FORM SUBMIT - Error:", error);
      toast({
        title: "Submission Failed",
        description: "Your request could not be submitted. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" className="mr-3 text-primary p-2" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-heading font-bold text-gray-900">New Building Repair Request</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Building Repair Request Form</CardTitle>
            <CardDescription>Please provide the details about the building repair issue that needs to be addressed.</CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" encType="multipart/form-data">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="facility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facility</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedBuilding(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a facility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildingsLoading ? (
                              <SelectItem value="loading" disabled>Loading buildings...</SelectItem>
                            ) : buildings && Array.isArray(buildings) ? (
                              buildings
                                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                                .map((building: any) => (
                                  <SelectItem key={building.id} value={building.name}>
                                    {building.name}
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="none" disabled>No buildings available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="building.roomNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Number</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!form.getValues("facility")}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder={!form.getValues("facility") ? "Select a building first" : "Select a room"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper" className="max-h-[300px] overflow-y-auto z-50">
                            {availableRooms.length > 0 ? (
                              availableRooms.map((room: string) => (
                                <SelectItem key={room} value={room}>
                                  {room}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                {selectedBuilding ? "No rooms available" : "Select a building first"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="event"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Brief description of the issue" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Reported</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled className="bg-gray-100 cursor-not-allowed" />
                      </FormControl>
                      <FormDescription>Automatically set to today's date</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the urgency level of this repair request
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Photo Upload */}
                <PhotoUpload 
                  form={form} 
                  name="photos" 
                  label="Upload Photos of Issue" 
                  description="Upload photos of the repair request (optional, max 5MB each)"
                  multiple={true}
                  maxPhotos={5}
                />

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="building.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description of Issue</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide a detailed description of the repair request" 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/dashboard")}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}