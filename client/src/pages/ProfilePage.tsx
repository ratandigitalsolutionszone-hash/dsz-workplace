import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { GmailConnector } from "@/components/GmailConnector";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const uploadPhotoMutation = trpc.profile.uploadPhoto.useMutation({
    onSuccess: () => {
      toast.success("Profile photo uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload profile photo");
    },
  });

  const [formData, setFormData] = useState({
    employeeId: "",
    position: "",
    department: "",
    phoneNumber: "",
    bio: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (profile) {
      setFormData({
        employeeId: profile.employeeId || "",
        position: profile.position || "",
        department: profile.department || "",
        phoneNumber: profile.phoneNumber || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload photo
    setIsUploadingPhoto(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve((reader.result as string).split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      await uploadPhotoMutation.mutateAsync({
        photoBase64: base64,
        fileName: file.name,
      });
    } catch (error) {
      console.error("Photo upload error:", error);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (loading || profileLoading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-screen">Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your employee information</p>
        </div>

        {/* Section 1: Personal Information */}
        <Card className="p-0 overflow-hidden border-l-4 border-l-[#500151] shadow-lg">
          <div className="bg-gradient-to-r from-[#500151] to-[#6b1a6b] px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Personal Information
            </h2>
          </div>
          <div className="p-6">
            {!isEditing ? (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.profilePhotoUrl || photoPreview || undefined} />
                    <AvatarFallback className="text-lg font-bold">
                      {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#500151] text-white rounded-lg hover:bg-[#6b1a6b] transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>{isUploadingPhoto ? "Uploading..." : "Upload Photo"}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#f5f0f7] rounded-lg p-4 border border-[#e8dff5]">
                    <Label className="text-[#500151] font-semibold text-sm">Name</Label>
                    <p className="text-lg font-bold text-[#500151] mt-2">{user.name}</p>
                  </div>
                  <div className="bg-[#f5f0f7] rounded-lg p-4 border border-[#e8dff5]">
                    <Label className="text-[#500151] font-semibold text-sm">Email</Label>
                    <p className="text-lg font-bold text-[#500151] mt-2">{user.email}</p>
                  </div>
                  <div className="bg-[#f5f0f7] rounded-lg p-4 border border-[#e8dff5]">
                    <Label className="text-[#500151] font-semibold text-sm">Role</Label>
                    <p className="text-lg font-bold text-[#500151] mt-2 capitalize">
                      {user.role?.replace(/_/g, ' ') || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground italic">Name and email cannot be edited</p>
              </div>
            )}
          </div>
        </Card>

        {/* Section 2: Professional Details */}
        <Card className="p-0 overflow-hidden border-l-4 border-l-[#FF0000] shadow-lg">
          <div className="bg-gradient-to-r from-[#FF0000] to-[#cc0000] px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">💼</span>
              Professional Details
            </h2>
            <Button
              variant={isEditing ? "cancel" : "default"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>
          <div className="p-6">
            {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#ffe6e6] rounded-lg p-4 border border-[#ffcccc]">
                    <Label className="text-[#FF0000] font-semibold text-sm">Employee ID</Label>
                    <p className="text-lg font-bold text-[#FF0000] mt-2">{profile?.employeeId || "Not set"}</p>
                  </div>
                  <div className="bg-[#ffe6e6] rounded-lg p-4 border border-[#ffcccc]">
                    <Label className="text-[#FF0000] font-semibold text-sm">Position</Label>
                    <p className="text-lg font-bold text-[#FF0000] mt-2">{profile?.position || "Not set"}</p>
                  </div>
                  <div className="bg-[#ffe6e6] rounded-lg p-4 border border-[#ffcccc]">
                    <Label className="text-[#FF0000] font-semibold text-sm">Department</Label>
                    <p className="text-lg font-bold text-[#FF0000] mt-2">{profile?.department || "Not set"}</p>
                  </div>
                  <div className="bg-[#ffe6e6] rounded-lg p-4 border border-[#ffcccc]">
                    <Label className="text-[#FF0000] font-semibold text-sm">Phone Number</Label>
                    <p className="text-lg font-bold text-[#FF0000] mt-2">{profile?.phoneNumber || "Not set"}</p>
                  </div>
                  <div className="bg-[#ffe6e6] rounded-lg p-4 border border-[#ffcccc] md:col-span-2">
                    <Label className="text-[#FF0000] font-semibold text-sm">Bio</Label>
                    <p className="text-base text-[#FF0000] mt-2 line-clamp-3">{profile?.bio || "Not set"}</p>
                  </div>
                </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="employeeId" className="text-[#FF0000] font-semibold">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="e.g., EMP-001"
                    className="mt-2 border-[#ffcccc] focus:border-[#FF0000]"
                  />
                </div>
                <div>
                  <Label htmlFor="position" className="text-[#FF0000] font-semibold">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g., Senior Developer"
                    className="mt-2 border-[#ffcccc] focus:border-[#FF0000]"
                  />
                </div>
                <div>
                  <Label htmlFor="department" className="text-[#FF0000] font-semibold">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Engineering"
                    className="mt-2 border-[#ffcccc] focus:border-[#FF0000]"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber" className="text-[#FF0000] font-semibold">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="e.g., +1 (555) 123-4567"
                    className="mt-2 border-[#ffcccc] focus:border-[#FF0000]"
                  />
                </div>
                <div>
                  <Label htmlFor="bio" className="text-[#FF0000] font-semibold">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="mt-2 border-[#ffcccc] focus:border-[#FF0000]"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="bg-[#FF0000] hover:bg-[#cc0000] text-white"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </div>
        </Card>

        {/* Section 3: Gmail Integration */}
        <GmailConnector />
      </div>
    </DashboardLayout>
  );
}
