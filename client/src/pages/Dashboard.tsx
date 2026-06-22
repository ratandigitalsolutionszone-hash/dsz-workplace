import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: reports } = trpc.reports.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: notices } = trpc.notices.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: meetings } = trpc.meetings.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: tasks } = trpc.tasks.list.useQuery(undefined, {
    enabled: !!user,
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const recentReports = reports?.slice(-3) || [];
  const recentNotices = notices?.slice(-3) || [];
  const upcomingMeetings = meetings?.filter(m => new Date(m.startTime) > new Date()).slice(0, 3) || [];
  const activeTasks = tasks?.filter(t => t.status !== "completed").slice(0, 3) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, Digital Solutions Zone!</h1>
          <p className="text-muted-foreground mt-2">Here's your workspace overview</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Total Reports</div>
            <div className="text-2xl font-bold mt-2">{reports?.length || 0}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Company Notices</div>
            <div className="text-2xl font-bold mt-2">{notices?.length || 0}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Upcoming Meetings</div>
            <div className="text-2xl font-bold mt-2">{upcomingMeetings.length}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Active Tasks</div>
            <div className="text-2xl font-bold mt-2">{activeTasks.length}</div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reports */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Reports</h2>
            <div className="space-y-3">
              {recentReports.length > 0 ? (
                recentReports.map(report => (
                  <div key={report.id} className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">
                      {new Date(report.reportDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {report.tasksCompleted?.substring(0, 100)}...
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reports yet</p>
              )}
            </div>
          </Card>

          {/* Upcoming Meetings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Meetings</h2>
            <div className="space-y-3">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">{meeting.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(meeting.startTime).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming meetings</p>
              )}
            </div>
          </Card>

          {/* Recent Notices */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Latest Notices</h2>
            <div className="space-y-3">
              {recentNotices.length > 0 ? (
                recentNotices.map(notice => (
                  <div key={notice.id} className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">{notice.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notices</p>
              )}
            </div>
          </Card>

          {/* Active Tasks */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Active Tasks</h2>
            <div className="space-y-3">
              {activeTasks.length > 0 ? (
                activeTasks.map(task => (
                  <div key={task.id} className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Client: {task.clientName}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No active tasks</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
