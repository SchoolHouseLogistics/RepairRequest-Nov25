import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, CheckCircle } from "lucide-react";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  organizationType: string;
  inquiry: string;
  message: string;
}

interface ContactFormProps {
  showOrganizationType?: boolean;
}

export default function ContactForm({ showOrganizationType = true }: ContactFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
    organizationType: "",
    inquiry: "",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("[ContactForm] Submit triggered", formData);
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.organization || !formData.message) {
      console.log("[ContactForm] Validation failed - missing fields");
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("[ContactForm] Sending request to /api/contact");
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      console.log("[ContactForm] Response status:", response.status);
      const data = await response.json();
      console.log("[ContactForm] Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit form");
      }

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        organization: "",
        organizationType: "",
        inquiry: "",
        message: "",
      });
      
      setIsSubmitted(true);
      
      toast({
        title: "Message Sent Successfully",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
    } catch (error) {
      console.error("[ContactForm] Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-600 mb-4">
          Thank you for reaching out. We'll get back to you within 24 hours.
        </p>
        <Button 
          onClick={() => setIsSubmitted(false)} 
          variant="outline"
          data-testid="button-send-another"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input 
            name="firstName"
            placeholder="First Name *" 
            value={formData.firstName}
            onChange={handleInputChange}
            required 
            disabled={isSubmitting}
            data-testid="input-firstName"
          />
        </div>
        <div>
          <Input 
            name="lastName"
            placeholder="Last Name *" 
            value={formData.lastName}
            onChange={handleInputChange}
            required 
            disabled={isSubmitting}
            data-testid="input-lastName"
          />
        </div>
      </div>
      <div>
        <Input 
          type="email" 
          name="email"
          placeholder="Email Address *" 
          value={formData.email}
          onChange={handleInputChange}
          required 
          disabled={isSubmitting}
          data-testid="input-email"
        />
      </div>
      <div>
        <Input 
          name="organization"
          placeholder="Organization/Company *" 
          value={formData.organization}
          onChange={handleInputChange}
          required
          disabled={isSubmitting}
          data-testid="input-organization"
        />
      </div>
      {showOrganizationType && (
        <div>
          <select 
            name="organizationType"
            value={formData.organizationType}
            onChange={handleInputChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            style={{color: formData.organizationType ? 'inherit' : 'hsl(25, 5.3%, 44.7%)'}}
            disabled={isSubmitting}
            data-testid="select-organizationType"
          >
            <option value="">Select organization type</option>
            <option value="independent-school">Independent School</option>
            <option value="charter-school">Charter School</option>
            <option value="k12-public-school">K-12 Public School</option>
            <option value="other">Other Organization</option>
          </select>
        </div>
      )}
      <div>
        <Textarea 
          name="message"
          placeholder="Message *" 
          value={formData.message}
          onChange={handleInputChange}
          rows={4}
          required
          disabled={isSubmitting}
          data-testid="textarea-message"
        />
      </div>
      <Button 
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isSubmitting}
        data-testid="button-submit-contact"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}
