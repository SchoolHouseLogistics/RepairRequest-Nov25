import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const requestFormSchema = z.object({
  requestType: z.literal("facilities"),
  facility: z.string().min(1, "Facility is required"),
  event: z.string().min(1, "Event title is required"),
  eventDate: z.string().min(1, "Event date is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  setupTime: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  selectedItems: z.array(z.string()).default([]),
  otherNeeds: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RequestForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>("");

  // Fetch organization facilities
  const { data: facilities, isLoading: facilitiesLoading, error: facilitiesError } = useQuery({
    queryKey: ["/api/facilities"],
    queryFn: async () => {
      const res = await fetch(`/api/facilities`, { credentials: "include" });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText}`);
      }
      return res.json();
    },
  });

  
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      requestType: "facilities",
      facility: "",
      event: "",
      eventDate: new Date().toISOString().split('T')[0],
      priority: "medium",
      setupTime: "",
      startTime: "",
      endTime: "",
      selectedItems: [],
      otherNeeds: "",
    }
  });
  
  async function onSubmit(data: RequestFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/requests", data);
      const newRequest = await res.json();
      
      toast({
        title: "Request Submitted",
        description: "Your labor request has been submitted successfully.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" className="mr-3 text-primary p-2" onClick={() => navigate("/")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-heading font-bold text-gray-900">New Labor Request</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Labor Request Form</CardTitle>
            <CardDescription>Please fill out all required information for your labor request.</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            setSelectedFacility(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a facility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {facilitiesLoading ? (
                              <SelectItem value="loading" disabled>Loading facilities...</SelectItem>
                            ) : facilitiesError ? (
                              <SelectItem value="error" disabled>
                                {facilitiesError.message.includes('401') ? 'You must be logged in to view facilities.' : 'Error loading facilities'}
                              </SelectItem>
                            ) : facilities && Array.isArray(facilities) && facilities.length > 0 ? (
                              facilities.map((facility: any) => (
                                <SelectItem key={facility.id} value={facility.name}>
                                  {facility.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No facilities available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="event"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Event</FormLabel>
                        <FormControl>
                          <Input type="date" min={today} {...field} />
                        </FormControl>
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
                          Select the urgency level of this request
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="setupTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-heading font-medium text-gray-900 mb-4">Items Needed for Event</h3>
                  
                  {selectedFacility && facilities && Array.isArray(facilities) ? (
                    <div className="space-y-4">
                      {(() => {
                        const facility = facilities.find((f: any) => f.name === selectedFacility);
                        if (!facility || !facility.availableItems || !Array.isArray(facility.availableItems)) {
                          return (
                            <p className="text-gray-500">No items available for this facility</p>
                          );
                        }
                        
                        return facility.availableItems.map((item: any, index: number) => {
                          const isSelected = form.watch("selectedItems").includes(item.name);
                          return (
                            <div key={item.name || index} className="flex items-center space-x-3 p-3 border rounded-md">
                              <Checkbox 
                                id={`item-${index}`}
                                className="flex-shrink-0"
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const currentItems = form.getValues("selectedItems");
                                  if (checked) {
                                    form.setValue("selectedItems", [...currentItems, item.name]);
                                  } else {
                                    form.setValue("selectedItems", currentItems.filter(i => i !== item.name));
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <label 
                                  htmlFor={`item-${index}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {item.name}
                                </label>
                                {item.description && (
                                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                )}
                                {item.category && (
                                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    // <p className="text-gray-500">Please select a facility to see available items</p>
                    ""
                  )}
                
                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="otherNeeds"
                    render={({ field }) => (
                      <FormItem>
                        {/* <FormLabel>Additional Notes or Special Requirements</FormLabel> */}
                        <FormControl>
                          <Textarea 
                            rows={4} 
                            placeholder="Please describe any specific items or services needed for this event..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                </div>
                
                <div className="border-t border-gray-200 pt-5">
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/")}
                      className="mr-3"
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
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
