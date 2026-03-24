import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrgSetupStepProps {
  onNext: () => void;
}

export default function OrgSetupStep({ onNext }: OrgSetupStepProps) {
  const { toast } = useToast();
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!orgName.trim()) {
      toast({ title: "Please enter your school name", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      if (!res.ok) throw new Error("Failed to update organization");
      onNext();
    } catch {
      toast({ title: "Error saving organization", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Name Your School</h2>
          <p className="text-gray-500">This is how your organization will appear in RepairRequest.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="orgName">School / Organization Name *</Label>
          <Input
            id="orgName"
            placeholder="e.g. Lincoln Academy"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div>
          <Label htmlFor="orgLogo">School Logo (optional)</Label>
          <Input
            id="orgLogo"
            type="file"
            accept="image/*"
            className="cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-1">You can add or change this later in settings.</p>
        </div>
      </div>
    </div>
  );
}
