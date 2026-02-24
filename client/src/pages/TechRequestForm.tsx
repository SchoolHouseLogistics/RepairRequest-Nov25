import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

const techRequestSchema = z.object({
  category: z.enum(["hardware", "software", "network", "other"], {
    required_error: "Category is required",
  }),
  deviceType: z.enum(["computer", "printer", "projector", "phone", "other"]).optional(),
  deviceLocation: z.string().min(1, "Device location is required"),
  assetTag: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  errorMessage: z.string().optional(),
  stepsToReproduce: z.string().optional(),
  urgencyReason: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

type TechRequestFormValues = z.infer<typeof techRequestSchema>;

export default function TechRequestForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TechRequestFormValues>({
    resolver: zodResolver(techRequestSchema),
    defaultValues: {
      category: undefined,
      deviceType: undefined,
      deviceLocation: "",
      assetTag: "",
      description: "",
      errorMessage: "",
      stepsToReproduce: "",
      urgencyReason: "",
      priority: "medium",
    },
  });

  async function onSubmit(data: TechRequestFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tech-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: data.category,
          deviceType: data.deviceType || null,
          deviceLocation: data.deviceLocation,
          assetTag: data.assetTag || null,
          description: data.description,
          errorMessage: data.errorMessage || null,
          stepsToReproduce: data.stepsToReproduce || null,
          urgencyReason: data.urgencyReason || null,
          priority: data.priority,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed: ${response.status}`);
      }

      toast({
        title: "Tech Request Submitted",
        description: "Your tech support request has been submitted successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
      navigate("/dashboard");
    } catch (error) {
      console.error("Tech request submission error:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Your request could not be submitted. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="py-6">
      <Helmet>
        <title>New Tech Request - RepairRequest</title>
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" className="mr-3 text-primary p-2" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-heading font-bold text-gray-900">New Tech Support Request</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tech Support Request Form</CardTitle>
            <CardDescription>
              Describe your technology issue and we'll get someone to help as soon as possible.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hardware">Hardware</SelectItem>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="network">Network / Connectivity</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Device Type */}
                  <FormField
                    control={form.control}
                    name="deviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select device type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="computer">Computer / Laptop</SelectItem>
                            <SelectItem value="printer">Printer</SelectItem>
                            <SelectItem value="projector">Projector</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Device Location */}
                  <FormField
                    control={form.control}
                    name="deviceLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Location <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Room 204, Library, Office" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Asset Tag */}
                  <FormField
                    control={form.control}
                    name="assetTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Tag / Serial Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Priority */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Urgency Reason */}
                  <FormField
                    control={form.control}
                    name="urgencyReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency Reason</FormLabel>
                        <FormControl>
                          <Input placeholder="Why is this urgent? (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the issue in detail..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Error Message */}
                <FormField
                  control={form.control}
                  name="errorMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Error Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste any error messages you see (optional)"
                          className="min-h-[80px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Steps to Reproduce */}
                <FormField
                  control={form.control}
                  name="stepsToReproduce"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steps to Reproduce</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What steps lead to the issue? (optional)"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Tech Request"}
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
