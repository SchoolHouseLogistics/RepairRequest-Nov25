import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DoorOpen, Plus, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrgSetupStepProps {
  onNext: () => void;
}

interface Building {
  id: number;
  name: string;
  roomNumbers: string[];
}

export default function RoomSetupStep({ onNext }: OrgSetupStepProps) {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/buildings")
      .then((res) => res.json())
      .then((data) => {
        setBuildings(data);
        const initialRooms: Record<number, string[]> = {};
        data.forEach((b: Building) => {
          initialRooms[b.id] = b.roomNumbers?.length ? b.roomNumbers : [""];
        });
        setRooms(initialRooms);
      })
      .finally(() => setLoading(false));
  }, []);

  const addRoom = (buildingId: number) => {
    setRooms({ ...rooms, [buildingId]: [...(rooms[buildingId] || []), ""] });
  };

  const removeRoom = (buildingId: number, index: number) => {
    const updated = [...(rooms[buildingId] || [])];
    updated.splice(index, 1);
    setRooms({ ...rooms, [buildingId]: updated });
  };

  const updateRoom = (buildingId: number, index: number, value: string) => {
    const updated = [...(rooms[buildingId] || [])];
    updated[index] = value;
    setRooms({ ...rooms, [buildingId]: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const building of buildings) {
        const roomList = (rooms[building.id] || []).filter((r) => r.trim());
        await fetch(`/api/admin/buildings/${building.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomNumbers: roomList }),
        });
      }
      onNext();
    } catch {
      toast({ title: "Error saving rooms", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading buildings...</div>;

  if (buildings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">No buildings added yet.</p>
        <p className="text-sm text-gray-400">Go back and add buildings first, or skip this step.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <DoorOpen className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add Rooms & Areas</h2>
          <p className="text-gray-500">Add rooms, offices, or areas to each building. You can add more later.</p>
        </div>
      </div>

      <div className="space-y-6">
        {buildings.map((building) => (
          <div key={building.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">{building.name}</h3>
            </div>
            <div className="space-y-2">
              {(rooms[building.id] || []).map((room, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Room name or number (e.g. Room 101, Gym, Cafeteria)"
                    value={room}
                    onChange={(e) => updateRoom(building.id, index, e.target.value)}
                  />
                  {(rooms[building.id] || []).length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeRoom(building.id, index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addRoom(building.id)}>
                <Plus className="w-4 h-4 mr-1" /> Add Room
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
