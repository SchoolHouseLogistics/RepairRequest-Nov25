import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
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
  eventDate: z.string().min(1, "Date reported is required"),
  dateNeeded: z.string().min(1, "Date needed is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  setupTimeHour: z.string().optional(),
  setupTimeMinute: z.string().optional(),
  setupTimePeriod: z.string().optional(),
  startTimeHour: z.string().optional(),
  startTimeMinute: z.string().optional(),
  startTimePeriod: z.string().optional(),
  endTimeHour: z.string().optional(),
  endTimeMinute: z.string().optional(),
  endTimePeriod: z.string().optional(),
  selectedItems: z.array(z.string()).default([]),
  otherNeeds: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

// Helper function to format time from separate fields
function formatTime(hour: string | undefined, minute: string | undefined, period: string | undefined): string {
  if (!hour || !minute || !period) return "";
  return `${hour}:${minute} ${period}`;
}

// Time picker component
function TimePicker({ 
  hourValue, 
  minuteValue, 
  periodValue, 
  onHourChange, 
  onMinuteChange, 
  onPeriodChange,
  label 
}: {
  hourValue: string;
  minuteValue: string;
  periodValue: string;
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
  label: string;
}) {
  const hours = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">{label}</label>
      <div className="flex gap-2">
        <Select value={hourValue} onValueChange={onHourChange}>
          <SelectTrigger className="w-[70px]">
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-50">
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour}>{hour}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="flex items-center text-lg font-medium">:</span>
        <Select value={minuteValue} onValueChange={onMinuteChange}>
          <SelectTrigger className="w-[70px]">
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-50">
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute}>{minute}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodValue} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[75px]">
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-50">
            {periods.map((period) => (
              <SelectItem key={period} value={period}>{period}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

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
      dateNeeded: "",
      priority: "medium",
      setupTimeHour: "",
      setupTimeMinute: "",
      setupTimePeriod: "",
      startTimeHour: "",
      startTimeMinute: "",
      startTimePeriod: "",
      endTimeHour: "",
      endTimeMinute: "",
      endTimePeriod: "",
      selectedItems: [],
      otherNeeds: "",
    }
  });
  
  async function onSubmit(data: RequestFormValues) {
    setIsSubmitting(true);
    try {
      // Format time fields for submission
      const formattedData = {
        ...data,
        setupTime: formatTime(data.setupTimeHour, data.setupTimeMinute, data.setupTimePeriod),
        startTime: formatTime(data.startTimeHour, data.startTimeMinute, data.startTimePeriod),
        endTime: formatTime(data.endTimeHour, data.endTimeMinute, data.endTimePeriod),
      };
      
      const res = await apiRequest("POST", "/api/requests", formattedData);
      const newRequest = await res.json();
      
      toast({
        title: "Request Submitted",
        description: "Your labor request has been submitted successfully.",
      });
      
      navigate("/dashboard");
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
      <Helmet>
        <title>New Facility Request - RepairRequest</title>
        <meta name="description" content="Submit a new facility or event request. Specify dates, times, equipment needs, and priority level." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" className="mr-3 text-primary p-2" onClick={() => navigate("/dashboard")}>
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
                        <FormLabel>Building</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedFacility(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a building" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper" className="z-50">
                            {facilitiesLoading ? (
                              <SelectItem value="loading" disabled>Loading buildings...</SelectItem>
                            ) : facilitiesError ? (
                              <SelectItem value="error" disabled>
                                {facilitiesError.message.includes('401') ? 'You must be logged in to view buildings.' : 'Error loading buildings'}
                              </SelectItem>
                            ) : facilities && Array.isArray(facilities) && facilities.length > 0 ? (
                              facilities.map((facility: any) => (
                                <SelectItem key={facility.id} value={facility.name}>
                                  {facility.name}
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
                    name="event"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-event-title" />
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
                        <FormLabel>Date Reported</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled className="bg-gray-100 cursor-not-allowed" data-testid="input-date-reported" />
                        </FormControl>
                        <FormDescription>Automatically set to today's date</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateNeeded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Needed</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} min={today} data-testid="input-date-needed" />
                        </FormControl>
                        <FormDescription>When do you need this completed?</FormDescription>
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
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper" className="z-50">
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
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <TimePicker
                    label="Setup Time"
                    hourValue={form.watch("setupTimeHour") || ""}
                    minuteValue={form.watch("setupTimeMinute") || ""}
                    periodValue={form.watch("setupTimePeriod") || ""}
                    onHourChange={(value) => form.setValue("setupTimeHour", value)}
                    onMinuteChange={(value) => form.setValue("setupTimeMinute", value)}
                    onPeriodChange={(value) => form.setValue("setupTimePeriod", value)}
                  />
                  
                  <TimePicker
                    label="Start Time"
                    hourValue={form.watch("startTimeHour") || ""}
                    minuteValue={form.watch("startTimeMinute") || ""}
                    periodValue={form.watch("startTimePeriod") || ""}
                    onHourChange={(value) => form.setValue("startTimeHour", value)}
                    onMinuteChange={(value) => form.setValue("startTimeMinute", value)}
                    onPeriodChange={(value) => form.setValue("startTimePeriod", value)}
                  />
                  
                  <TimePicker
                    label="End Time"
                    hourValue={form.watch("endTimeHour") || ""}
                    minuteValue={form.watch("endTimeMinute") || ""}
                    periodValue={form.watch("endTimePeriod") || ""}
                    onHourChange={(value) => form.setValue("endTimeHour", value)}
                    onMinuteChange={(value) => form.setValue("endTimeMinute", value)}
                    onPeriodChange={(value) => form.setValue("endTimePeriod", value)}
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
                                data-testid={`checkbox-item-${index}`}
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
                    ""
                  )}
                
                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="otherNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            rows={4} 
                            placeholder="Please describe any specific items or services needed for this event..." 
                            {...field} 
                            data-testid="textarea-other-needs"
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
                      onClick={() => navigate("/dashboard")}
                      className="mr-3"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      data-testid="button-submit"
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
