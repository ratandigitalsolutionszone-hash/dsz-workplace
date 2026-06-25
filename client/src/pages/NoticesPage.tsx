import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, AlertCircle, Info, Megaphone, CheckCircle } from "lucide-react";

type NoticeType = "information" | "important" | "announcement" | "urgent";

interface NoticeWithType {
  id: number;
  title: string;
  content: string;
  isPinned: boolean | null;
  createdAt: Date;
  type?: NoticeType;
}

const noticeTypeConfig: Record<NoticeType, { icon: React.ReactNode; bgColor: string; borderColor: string; textColor: string; badgeBg: string; badgeText: string }> = {
  information: {
    icon: <Info className="w-5 h-5" />,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    textColor: "text-blue-900",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
  },
  important: {
    icon: <AlertCircle className="w-5 h-5" />,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    textColor: "text-orange-900",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-800",
  },
  announcement: {
    icon: <Megaphone className="w-5 h-5" />,
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    textColor: "text-purple-900",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
  },
  urgent: {
    icon: <AlertCircle className="w-5 h-5" />,
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    textColor: "text-red-900",
    badgeBg: "bg-red-100",
    badgeText: "text-red-800",
  },
};

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
      setFormData({ title: "", content: "", isPinned: false, type: "information" });
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
    type: "information" as NoticeType,
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNoticeMutation.mutate({
      title: formData.title,
      content: formData.content,
      isPinned: formData.isPinned,
    });
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

  // Assign notice types based on keywords in title/content
  const noticesWithTypes: NoticeWithType[] = sortedNotices.map(notice => {
    let type: NoticeType = "information";
    const text = (notice.title + " " + notice.content).toLowerCase();
    
    if (text.includes("urgent") || text.includes("critical")) {
      type = "urgent";
    } else if (text.includes("important") || text.includes("must")) {
      type = "important";
    } else if (text.includes("announce") || text.includes("launch") || text.includes("new")) {
      type = "announcement";
    }
    
    return { ...notice, type };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#500151]">Company Notices</h1>
            <p className="text-muted-foreground mt-2">Important announcements and updates for all employees</p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsCreating(!isCreating)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? "Cancel" : "Post Notice"}
            </Button>
          )}
        </div>

        {/* Create Notice Form */}
        {isAdmin && isCreating && (
          <Card className="p-6 border-2 border-[#500151] bg-gradient-to-br from-[#f5f0f7] to-white">
            <h2 className="text-xl font-semibold mb-4 text-[#500151]">Post New Notice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-[#500151] font-semibold">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Notice title..."
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-[#500151] font-semibold">Notice Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as NoticeType })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select notice type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="information">ℹ️ Information</SelectItem>
                    <SelectItem value="important">⚠️ Important Update</SelectItem>
                    <SelectItem value="announcement">📢 Announcement</SelectItem>
                    <SelectItem value="urgent">🚨 Urgent Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content" className="text-[#500151] font-semibold">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your notice here..."
                  rows={6}
                  required
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-white rounded border border-[#500151]">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isPinned" className="font-normal cursor-pointer text-[#500151]">
                  📌 Pin this notice to the top (appears first for all employees)
                </Label>
              </div>

              <Button 
                type="submit" 
                disabled={createNoticeMutation.isPending}
                className="bg-[#500151] hover:bg-[#6b1a6b] w-full"
              >
                {createNoticeMutation.isPending ? "Posting..." : "Post Notice"}
              </Button>
            </form>
          </Card>
        )}

        {/* Notices List */}
        <div className="space-y-4">
          {noticesWithTypes.length > 0 ? (
            noticesWithTypes.map(notice => {
              const config = noticeTypeConfig[notice.type || "information"];
              return (
                <Card 
                  key={notice.id} 
                  className={`overflow-hidden border-2 transition-all hover:shadow-lg ${
                    notice.isPinned ? "border-yellow-400 bg-yellow-50" : `border-l-4 ${config.borderColor} ${config.bgColor}`
                  }`}
                >
                  {/* Notice Header */}
                  <div className={`px-6 py-4 ${notice.isPinned ? "bg-yellow-100" : "bg-gradient-to-r from-[#500151] to-[#6b1a6b]"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={notice.isPinned ? "text-yellow-600" : "text-white"}>
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-lg font-bold ${notice.isPinned ? "text-yellow-900" : "text-white"}`}>
                              {notice.title}
                            </h3>
                            {notice.isPinned && (
                              <span className="text-xs bg-yellow-300 text-yellow-900 px-3 py-1 rounded-full font-semibold">
                                📌 PINNED
                              </span>
                            )}
                            {!notice.isPinned && (
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${config.badgeBg} ${config.badgeText}`}>
                                {notice.type?.toUpperCase() || "INFORMATION"}
                              </span>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notice.id)}
                            disabled={deleteNoticeMutation.isPending}
                            className={notice.isPinned ? "text-yellow-700 hover:bg-yellow-200" : "text-white hover:bg-white/20"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm mt-2 ${notice.isPinned ? "text-yellow-800" : "text-white/80"}`}>
                      Posted on {new Date(notice.createdAt).toLocaleDateString()} at {new Date(notice.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Notice Content */}
                  <div className="px-6 py-4">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${config.textColor}`}>
                      {notice.content}
                    </p>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center border-2 border-dashed border-gray-300">
              <p className="text-muted-foreground text-lg">No notices yet</p>
              <p className="text-muted-foreground text-sm mt-2">Check back later for important updates</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
