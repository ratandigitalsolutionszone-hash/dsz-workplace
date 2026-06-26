import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SendReportDialog from "@/components/SendReportDialog";
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle, Edit2, History } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [showEditHistory, setShowEditHistory] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    tasksCompleted: "",
    hoursWorked: "",
    notes: "",
  });

  const { data: reports, refetch } = trpc.reports.getAll.useQuery(undefined, {
    enabled: !!user,
  });

  const createReportMutation = trpc.reports.create.useMutation({
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setIsCreating(false);
      setFormData({
        reportDate: new Date().toISOString().split("T")[0],
        tasksCompleted: "",
        hoursWorked: "",
        notes: "",
      });
      refetch();
    },
    onError: () => {
      toast.error("Failed to submit report");
    },
  });

  const updateReportMutation = trpc.reports.update.useMutation({
    onSuccess: () => {
      toast.success("Report updated successfully");
      setEditingReportId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update report");
    },
  });

  const { data: editHistory } = trpc.reports.getEditHistory.useQuery(
    { reportId: showEditHistory || 0 },
    { enabled: !!showEditHistory }
  );

  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split("T")[0],
    tasksCompleted: "",
    hoursWorked: "",
    notes: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReportMutation.mutate({
      reportDate: new Date(formData.reportDate),
      tasksCompleted: formData.tasksCompleted,
      hoursWorked: formData.hoursWorked || undefined,
      notes: formData.notes,
    });
  };

  const handleEditClick = (report: any) => {
    setEditingReportId(report.id);
    setEditFormData({
      tasksCompleted: report.tasksCompleted || "",
      hoursWorked: report.hoursWorked || "",
      notes: report.notes || "",
    });
  };

  const handleEditSubmit = () => {
    if (!editingReportId) return;
    updateReportMutation.mutate({
      reportId: editingReportId,
      tasksCompleted: editFormData.tasksCompleted,
      hoursWorked: editFormData.hoursWorked || undefined,
      notes: editFormData.notes,
    });
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-screen">Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  const sortedReports = reports ? [...reports].reverse() : [];
  const currentReport = editingReportId ? reports?.find(r => r.id === editingReportId) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div>
            <div>
              <h1 className="text-4xl font-bold text-black">Daily Work Reports</h1>
              <p className="text-muted-foreground mt-2">Track your daily tasks and progress</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreating(!isCreating)}
            variant={isCreating ? "cancel" : "default"}
            className={isCreating ? "" : "bg-blue-600 hover:bg-blue-700"}
          >
            {isCreating ? "Cancel" : "New Report"}
          </Button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <Card className="p-6 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50 to-transparent">
            <h2 className="text-xl font-bold mb-4 text-blue-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Submit Daily Report
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reportDate" className="text-gray-900 font-semibold">Report Date</Label>
                <Input
                  id="reportDate"
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tasksCompleted" className="text-gray-900 font-semibold">Tasks Completed</Label>
                <Textarea
                  id="tasksCompleted"
                  placeholder="Describe all tasks you completed today..."
                  value={formData.tasksCompleted}
                  onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
                  required
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hoursWorked" className="text-gray-900 font-semibold">Hours Worked</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    step="0.5"
                    placeholder="e.g., 8"
                    value={formData.hoursWorked}
                    onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-gray-900 font-semibold">Additional Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Any additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={createReportMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 w-full"
              >
                {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </Card>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          {sortedReports.length > 0 ? (
            sortedReports.map((report) => (
              <Card 
                key={report.id} 
                className="p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-transparent hover:shadow-lg transition-shadow"
              >
                <div className="space-y-4">
                  {/* Header with Date and Actions */}
                  <div className="flex items-start justify-between border-b border-blue-200 pb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {format(new Date(report.reportDate), "EEEE, MMMM dd, yyyy")}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Submitted: {format(new Date(report.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                        {report.lastEditedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last edited: {format(new Date(report.lastEditedAt), "MMM dd, yyyy 'at' h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(report)}
                        className="text-green-700 border-green-700 hover:bg-green-50"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {report.lastEditedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowEditHistory(report.id)}
                          className="text-purple-600 border-purple-600 hover:bg-purple-50"
                        >
                          <History className="w-4 h-4 mr-1" />
                          History
                        </Button>
                      )}
                      <SendReportDialog reportId={report.id} reportDate={new Date(report.reportDate).toISOString().split('T')[0]} tasksCompleted={report.tasksCompleted || ""} />
                    </div>
                  </div>

                  {/* Tasks Completed */}
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Tasks Completed
                    </h4>
                    <div className="bg-white rounded border border-blue-200 p-4 text-gray-700 whitespace-pre-wrap">
                      {report.tasksCompleted}
                    </div>
                  </div>

                  {/* Hours and Notes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Hours Worked
                      </h4>
                      <div className="bg-blue-100 rounded px-4 py-2">
                        <p className="text-2xl font-black text-blue-700">
                          {report.hoursWorked || "0"} <span className="text-sm">hours</span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        Notes
                      </h4>
                      <div className="bg-orange-50 rounded border border-orange-200 px-4 py-2">
                        <p className="text-sm text-gray-700">
                          {report.notes || "No additional notes"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-l-blue-300">
              <FileText className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold text-lg">No reports submitted yet</p>
              <p className="text-gray-500 text-sm mt-2">Create your first daily report to get started</p>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingReportId} onOpenChange={(open) => !open && setEditingReportId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Daily Report</DialogTitle>
          </DialogHeader>
          {currentReport && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label className="text-gray-900 font-semibold">Report Date</Label>
                <Input
                  type="date"
                  value={new Date(currentReport.reportDate).toISOString().split('T')[0]}
                  disabled
                  className="mt-1 bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Report date cannot be changed</p>
              </div>
              <div>
                <Label className="text-gray-900 font-semibold">Tasks Completed</Label>
                <Textarea
                  value={editFormData.tasksCompleted}
                  onChange={(e) => setEditFormData({ ...editFormData, tasksCompleted: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900 font-semibold">Hours Worked</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editFormData.hoursWorked}
                    onChange={(e) => setEditFormData({ ...editFormData, hoursWorked: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-900 font-semibold">Additional Notes</Label>
                  <Input
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingReportId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateReportMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateReportMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit History Dialog */}
      <Dialog open={!!showEditHistory} onOpenChange={(open) => !open && setShowEditHistory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {editHistory && editHistory.length > 0 ? (
              editHistory.map((edit, index) => (
                <Card key={edit.id} className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">Edit #{editHistory.length - index}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(edit.editedAt), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {edit.tasksCompleted && (
                      <div>
                        <p className="font-semibold text-gray-700">Tasks Completed:</p>
                        <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">{edit.tasksCompleted}</p>
                      </div>
                    )}
                    {edit.hoursWorked && (
                      <p className="text-gray-600"><span className="font-semibold">Hours:</span> {edit.hoursWorked}</p>
                    )}
                    {edit.notes && (
                      <p className="text-gray-600"><span className="font-semibold">Notes:</span> {edit.notes}</p>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No edit history available</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditHistory(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
