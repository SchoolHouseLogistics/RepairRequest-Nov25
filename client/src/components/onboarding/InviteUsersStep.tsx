import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrgSetupStepProps {
  onNext: () => void;
}

interface InviteRow {
  email: string;
  role: string;
}

export default function InviteUsersStep({ onNext }: OrgSetupStepProps) {
  const { toast } = useToast();
  const [invites, setInvites] = useState<InviteRow[]>([{ email: "", role: "requester" }]);
  const [sending, setSending] = useState(false);

  const addInvite = () => {
    setInvites([...invites, { email: "", role: "requester" }]);
  };

  const removeInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const updateInvite = (index: number, field: "email" | "role", value: string) => {
    const updated = [...invites];
    updated[index][field] = value;
    setInvites(updated);
  };

  const handleSend = async () => {
    const validInvites = invites.filter((inv) => inv.email.trim());
    if (validInvites.length === 0) return;

    setSending(true);
    let successCount = 0;

    try {
      for (const invite of validInvites) {
        const res = await fetch("/api/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: invite.email, role: invite.role }),
        });
        if (res.ok) successCount++;
      }

      if (successCount > 0) {
        toast({ title: `${successCount} invitation${successCount > 1 ? "s" : ""} sent!` });
      }
    } catch {
      toast({ title: "Error sending invitations", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
          <Users className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invite Your Team</h2>
          <p className="text-gray-500">Send email invitations to teachers, staff, and maintenance team members.</p>
        </div>
      </div>

      <div className="space-y-3">
        {invites.map((invite, index) => (
          <div key={index} className="flex gap-3 items-center">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="email@school.edu"
                value={invite.email}
                onChange={(e) => updateInvite(index, "email", e.target.value)}
              />
            </div>
            <select
              value={invite.role}
              onChange={(e) => updateInvite(index, "role", e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="requester">Requester</option>
              <option value="maintenance">Maintenance</option>
              <option value="tech">Tech</option>
              <option value="admin">Admin</option>
            </select>
            {invites.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeInvite(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}

        <Button variant="outline" onClick={addInvite} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Another
        </Button>
      </div>

      {invites.some((inv) => inv.email.trim()) && (
        <div className="mt-4">
          <Button onClick={handleSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
            <Mail className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : "Send Invitations"}
          </Button>
        </div>
      )}
    </div>
  );
}
