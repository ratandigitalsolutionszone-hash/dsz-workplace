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
import SendReportDialog from "@/components/SendReportDialog";

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);

  const { data: reports, refetch } = trpc.reports.list.useQuery(undefined, {
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
      hoursWorked: formData.hoursWorked ? parseFloat(formData.hoursWorked) : undefined,
      notes: formData.notes,
    });
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-screen">Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  const sortedReports = reports ? [...reports].reverse() : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Daily Work Reports</h1>
            <p className="text-muted-foreground mt-2">Track your daily tasks and progress</p>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? "Cancel" : "New Report"}
          </Button>
        </div>

        {isCreating && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Submit Daily Report</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reportDate">Report Date</Label>
                <Input
                  id="reportDate"
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tasksCompleted">Tasks Completed</Label>
                <Textarea
                  id="tasksCompleted"
                  value={formData.tasksCompleted}
                  onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
                  placeholder="List the tasks you completed today..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hoursWorked">Hours Worked</Label>
                <Input
                  id="hoursWorked"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hoursWorked}
                  onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                  placeholder="e.g., 8.5"
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={createReportMutation.isPending}>
                {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </Card>
        )}

        <div className="space-y-4">
          {sortedReports.length > 0 ? (
            sortedReports.map(report => (
              <Card key={report.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">
                      {new Date(report.reportDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    {report.hoursWorked && (
                      <p className="text-sm text-muted-foreground">
                        Hours Worked: {report.hoursWorked}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <SendReportDialog
                      reportId={report.id}
                      reportDate={new Date(report.reportDate).toLocaleDateString()}
                      tasksCompleted={String(report.tasksCompleted)}
                      hoursWorked={report.hoursWorked ? parseFloat(String(report.hoursWorked)) : undefined}
                      notes={report.notes ? String(report.notes) : undefined}
                    />
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Tasks Completed:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.tasksCompleted}
                  </p>
                </div>
                {report.notes && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Notes:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {report.notes}
                    </p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No reports submitted yet</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
