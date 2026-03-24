import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrgSetupStepProps {
  onNext: () => void;
}

export default function BuildingSetupStep({ onNext }: OrgSetupStepProps) {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<{ name: string; address: string }[]>([
    { name: "", address: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const addBuilding = () => {
    setBuildings([...buildings, { name: "", address: "" }]);
  };

  const removeBuilding = (index: number) => {
    setBuildings(buildings.filter((_, i) => i !== index));
  };

  const updateBuilding = (index: number, field: "name" | "address", value: string) => {
    const updated = [...buildings];
    updated[index][field] = value;
    setBuildings(updated);
  };

  const handleSave = async () => {
    const validBuildings = buildings.filter((b) => b.name.trim());
    if (validBuildings.length === 0) {
      toast({ title: "Add at least one building", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      for (const building of validBuildings) {
        const res = await fetch("/api/admin/buildings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: building.name, address: building.address }),
        });
        if (!res.ok) throw new Error("Failed to create building");
      }
      onNext();
    } catch {
      toast({ title: "Error saving buildings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add Your Buildings</h2>
          <p className="text-gray-500">List the buildings on your campus. You can always add more later.</p>
        </div>
      </div>

      <div className="space-y-4">
        {buildings.map((building, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Building name (e.g. Main Building)"
                value={building.name}
                onChange={(e) => updateBuilding(index, "name", e.target.value)}
              />
              <Input
                placeholder="Address (optional)"
                value={building.address}
                onChange={(e) => updateBuilding(index, "address", e.target.value)}
              />
            </div>
            {buildings.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeBuilding(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}

        <Button variant="outline" onClick={addBuilding} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Another Building
        </Button>
      </div>
    </div>
  );
}
