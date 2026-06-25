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
import { Trash2, Edit2, Calendar, MapPin, Clock } from "lucide-react";

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
      toast.success("Meeting deleted successfully");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      updateMeetingMutation.mutate({
        meetingId: editingId,
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      } as any);
    } else {
      createMeetingMutation.mutate({
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      } as any);
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

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-black">Meetings</h1>
            <p className="text-muted-foreground mt-2">Schedule and manage your meetings</p>
          </div>
          <Button 
            onClick={() => {
              setEditingId(null);
              resetForm();
              setIsCreating(!isCreating);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? "Cancel" : "Schedule Meeting"}
          </Button>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="p-6 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50 to-transparent">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">
              {editingId ? "Edit Meeting" : "Schedule New Meeting"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-blue-900 font-semibold">Meeting Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Team Standup"
                  required
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-blue-900 font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Meeting details..."
                  rows={3}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-blue-900 font-semibold">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime" className="text-blue-900 font-semibold">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location" className="text-blue-900 font-semibold">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Conference Room A"
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createMeetingMutation.isPending || updateMeetingMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingId ? "Update Meeting" : "Create Meeting"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Upcoming Meetings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-bold text-blue-900">Upcoming Meetings</h2>
          </div>
          <div className="space-y-4">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map(meeting => (
                <Card 
                  key={meeting.id} 
                  className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow bg-gradient-to-r from-green-50 to-transparent"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{meeting.title}</h3>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold">{formatTime(meeting.startTime)}</span>
                        </div>
                        
                        {meeting.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="w-4 h-4 text-red-600" />
                            <span className="font-semibold">{meeting.location}</span>
                          </div>
                        )}
                      </div>

                      {meeting.description && (
                        <p className="text-sm text-gray-600 mt-3 p-3 bg-white rounded border border-gray-200">
                          {meeting.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(meeting)}
                        className="text-blue-600 hover:bg-blue-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(meeting.id)}
                        disabled={deleteMeetingMutation.isPending}
                        className="text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-l-blue-300">
                <Calendar className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold">No upcoming meetings scheduled</p>
              </Card>
            )}
          </div>
        </div>

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-600">Past Meetings</h2>
            </div>
            <div className="space-y-4">
              {pastMeetings.map(meeting => (
                <Card 
                  key={meeting.id} 
                  className="p-6 border-l-4 border-l-gray-300 opacity-75 hover:opacity-100 transition-opacity bg-gradient-to-r from-gray-50 to-transparent"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-700">{meeting.title}</h3>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatTime(meeting.startTime)}</span>
                        </div>
                        
                        {meeting.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{meeting.location}</span>
                          </div>
                        )}
                      </div>

                      {meeting.description && (
                        <p className="text-sm text-gray-500 mt-3 p-3 bg-white rounded border border-gray-200">
                          {meeting.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(meeting)}
                        className="text-gray-400 hover:bg-gray-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(meeting.id)}
                        disabled={deleteMeetingMutation.isPending}
                        className="text-gray-400 hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
