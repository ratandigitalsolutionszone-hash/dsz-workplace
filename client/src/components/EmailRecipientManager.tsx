import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Star, Plus, Edit2 } from "lucide-react";

interface EmailRecipientManagerProps {
  onRecipientSelected?: (recipients: string[]) => void;
}

export default function EmailRecipientManager({ onRecipientSelected }: EmailRecipientManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);

  const { data: recipients, refetch } = trpc.emailRecipients.getAll.useQuery();
  const addMutation = trpc.emailRecipients.add.useMutation({
    onSuccess: () => {
      toast.success("Recipient added successfully");
      setNewName("");
      setNewEmail("");
      setIsAdding(false);
      refetch();
    },
    onError: () => {
      toast.error("Failed to add recipient");
    },
  });

  const updateMutation = trpc.emailRecipients.update.useMutation({
    onSuccess: () => {
      toast.success("Recipient updated successfully");
      setNewName("");
      setNewEmail("");
      setEditingId(null);
      setIsAdding(false);
      refetch();
    },
    onError: () => {
      toast.error("Failed to update recipient");
    },
  });

  const deleteMutation = trpc.emailRecipients.delete.useMutation({
    onSuccess: () => {
      toast.success("Recipient deleted");
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete recipient");
    },
  });

  const markFrequentMutation = trpc.emailRecipients.markFrequent.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast.error("Failed to update recipient");
    },
  });

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      toast.error("Please fill in all fields");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ recipientId: editingId, name: newName, email: newEmail });
    } else {
      addMutation.mutate({ name: newName, email: newEmail });
    }
  };

  const handleEditRecipient = (recipient: any) => {
    setEditingId(recipient.id);
    setNewName(recipient.recipientName);
    setNewEmail(recipient.recipientEmail);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewName("");
    setNewEmail("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Email Recipients</h3>
        <Button
          size="sm"
          variant={isAdding ? "cancel" : "default"}
          onClick={() => {
            if (isAdding) {
              handleCancel();
            } else {
              setIsAdding(true);
            }
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? "Cancel" : "Add Recipient"}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 bg-[#f5f0f7] border-[#e8dff5]">
          <form onSubmit={handleAddRecipient} className="space-y-3">
            <div>
              <Label htmlFor="recipientName" className="text-[#500151] font-semibold">Name</Label>
              <Input
                id="recipientName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., John Manager"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="recipientEmail" className="text-[#500151] font-semibold">Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g., john@example.com"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={addMutation.isPending || updateMutation.isPending} 
                className="flex-1 bg-[#500151] hover:bg-[#6b1a6b]"
              >
                {updateMutation.isPending ? "Updating..." : addMutation.isPending ? "Adding..." : editingId ? "Update Recipient" : "Add Recipient"}
              </Button>
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {recipients && recipients.length > 0 ? (
          recipients.map((recipient) => (
            <Card key={recipient.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(recipient.id)}
                  onChange={() => {
                    const newSelected = selectedRecipients.includes(recipient.id)
                      ? selectedRecipients.filter(id => id !== recipient.id)
                      : [...selectedRecipients, recipient.id];
                    
                    setSelectedRecipients(newSelected);
                    
                    if (onRecipientSelected) {
                      const selectedEmails = recipients
                        ?.filter(r => newSelected.includes(r.id))
                        .map(r => r.recipientEmail) || [];
                      onRecipientSelected(selectedEmails);
                    }
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{recipient.recipientName}</p>
                  <p className="text-xs text-muted-foreground">{recipient.recipientEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditRecipient(recipient)}
                  className="text-green-700 hover:text-green-900"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    markFrequentMutation.mutate({
                      recipientId: recipient.id,
                    })
                  }
                  className={recipient.isFrequent ? "text-yellow-500" : "text-gray-400"}
                >
                  <Star className="w-4 h-4" fill={recipient.isFrequent ? "currentColor" : "none"} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate({ recipientId: recipient.id })}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No recipients added yet</p>
        )}
      </div>
    </div>
  );
}
