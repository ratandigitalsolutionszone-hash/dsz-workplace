import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, Edit2 } from "lucide-react";

export default function MeetingsPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: meetings, refetch } = trpc.meetings.getAll.useQuery(undefined, {
    enabled: !!user,
  });

  const createMeetingMutation = trpc.meetings.create.useMutation({
    onSuccess: () => {
      toast.success("Meeting created successfully");
      setIsCreating(false);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error("Failed to create meeting");
    },
  });

  const updateMeetingMutation = trpc.meetings.update.useMutation({
    onSuccess: () => {
      toast.success("Meeting updated successfully");
      setEditingId(null);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error("Failed to update meeting");
    },
  });

  const deleteMeetingMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => {
      toast.success("Meeting deleted");
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete meeting");
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
    });
  };

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMeetingMutation.mutate({
        meetingId: editingId,
        title: formData.title,
        description: formData.description,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        location: formData.location,
      });
    } else {
      createMeetingMutation.mutate({
        title: formData.title,
        description: formData.description,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        location: formData.location,
      });
    }
  };

  const handleDelete = (meetingId: number) => {
    if (confirm("Are you sure you want to delete this meeting?")) {
      deleteMeetingMutation.mutate({ meetingId });
    }
  };

  const handleEdit = (meeting: any) => {
    setEditingId(meeting.id);
    setFormData({
      title: meeting.title,
      description: meeting.description || "",
      startTime: new Date(meeting.startTime).toISOString().slice(0, 16),
      endTime: new Date(meeting.endTime).toISOString().slice(0, 16),
      location: meeting.location || "",
    });
    setIsCreating(true);
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-screen">Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  const now = new Date();
  const upcomingMeetings = meetings?.filter(m => new Date(m.startTime) > now).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];
  const pastMeetings = meetings?.filter(m => new Date(m.startTime) <= now).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meetings</h1>
            <p className="text-muted-foreground mt-2">Schedule and manage meetings</p>
          </div>
          <Button onClick={() => {
            setEditingId(null);
            resetForm();
            setIsCreating(!isCreating);
          }}>
            {isCreating ? "Cancel" : "Schedule Meeting"}
          </Button>
        </div>

        {isCreating && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Edit Meeting" : "Schedule New Meeting"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Team Standup"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Meeting details..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Conference Room A"
                />
              </div>
              <Button type="submit" disabled={createMeetingMutation.isPending || updateMeetingMutation.isPending}>
                {editingId ? "Update Meeting" : "Schedule Meeting"}
              </Button>
            </form>
          </Card>
        )}

        {/* Upcoming Meetings */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Meetings</h2>
          <div className="space-y-4">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map(meeting => (
                <Card key={meeting.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{meeting.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(meeting.startTime).toLocaleString()}
                      </p>
                      {meeting.location && (
                        <p className="text-sm text-muted-foreground">
                          Location: {meeting.location}
                        </p>
                      )}
                      {meeting.description && (
                        <p className="text-sm mt-2">{meeting.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(meeting)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(meeting.id)}
                        disabled={deleteMeetingMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No upcoming meetings</p>
              </Card>
            )}
          </div>
        </div>

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Past Meetings</h2>
            <div className="space-y-4">
              {pastMeetings.map(meeting => (
                <Card key={meeting.id} className="p-6 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{meeting.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(meeting.startTime).toLocaleString()}
                      </p>
                      {meeting.location && (
                        <p className="text-sm text-muted-foreground">
                          Location: {meeting.location}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(meeting.id)}
                      disabled={deleteMeetingMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
