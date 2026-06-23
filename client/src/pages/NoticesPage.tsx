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
import { Trash2 } from "lucide-react";

export default function NoticesPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);

  const { data: notices, refetch } = trpc.notices.getAll.useQuery(undefined, {
    enabled: !!user,
  });

  const createNoticeMutation = trpc.notices.create.useMutation({
    onSuccess: () => {
      toast.success("Notice posted successfully");
      setIsCreating(false);
      setFormData({ title: "", content: "", isPinned: false });
      refetch();
    },
    onError: () => {
      toast.error("Failed to post notice");
    },
  });

  const deleteNoticeMutation = trpc.notices.delete.useMutation({
    onSuccess: () => {
      toast.success("Notice deleted");
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete notice");
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPinned: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNoticeMutation.mutate(formData);
  };

  const handleDelete = (noticeId: number) => {
    if (confirm("Are you sure you want to delete this notice?")) {
      deleteNoticeMutation.mutate({ noticeId });
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-screen">Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const sortedNotices = notices ? [...notices].reverse() : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Company Notices</h1>
            <p className="text-muted-foreground mt-2">Important announcements and updates</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsCreating(!isCreating)}>
              {isCreating ? "Cancel" : "Post Notice"}
            </Button>
          )}
        </div>

        {isAdmin && isCreating && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Post New Notice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Notice title..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your notice here..."
                  rows={6}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isPinned" className="font-normal cursor-pointer">
                  Pin this notice to the top
                </Label>
              </div>
              <Button type="submit" disabled={createNoticeMutation.isPending}>
                {createNoticeMutation.isPending ? "Posting..." : "Post Notice"}
              </Button>
            </form>
          </Card>
        )}

        <div className="space-y-4">
          {sortedNotices.length > 0 ? (
            sortedNotices.map(notice => (
              <Card key={notice.id} className={`p-6 ${notice.isPinned ? "border-2 border-yellow-400" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{notice.title}</h3>
                      {notice.isPinned && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Posted on {new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notice.id)}
                      disabled={deleteNoticeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No notices yet</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
