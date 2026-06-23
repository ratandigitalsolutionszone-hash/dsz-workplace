import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Clock, Users, FileText, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";

function AdminReportsDashboardContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  const { data: allReports, isLoading: reportsLoading, error: reportsError } =
    trpc.adminReports.getAllReports.useQuery();

  const filteredReports = useMemo(() => {
    if (!allReports) return [];

    return allReports.filter((report) => {
      const matchesSearch =
        !searchQuery ||
        report.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEmployee =
        !selectedEmployee || report.userId === selectedEmployee;

      return matchesSearch && matchesEmployee;
    });
  }, [allReports, searchQuery, selectedEmployee]);

  const uniqueEmployees = useMemo(() => {
    if (!allReports) return [];
    const seen = new Set<number>();
    return allReports.filter((r) => {
      if (seen.has(r.userId)) return false;
      seen.add(r.userId);
      return true;
    });
  }, [allReports]);

  if (reportsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (reportsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Reports</h2>
          <p className="text-muted-foreground">
            Failed to load reports data. Please try again later.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and review all employee daily work reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-2xl font-bold mt-2">{allReports?.length || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Employees Reporting</p>
              <p className="text-2xl font-bold mt-2">
                {new Set(allReports?.map((r: any) => r.userId)).size || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours Logged</p>
              <p className="text-2xl font-bold mt-2">
                {allReports?.reduce((sum: number, r: any) => sum + (parseFloat(r.hoursWorked) || 0), 0).toFixed(1) || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Hours/Report</p>
              <p className="text-2xl font-bold mt-2">
                {allReports && allReports.length > 0
                  ? (allReports.reduce((sum: number, r: any) => sum + (parseFloat(r.hoursWorked) || 0), 0) / allReports.length).toFixed(1)
                  : 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <Input
          placeholder="Search by employee name, email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedEmployee === null ? "default" : "outline"}
            onClick={() => setSelectedEmployee(null)}
            size="sm"
          >
            All Employees
          </Button>
          {uniqueEmployees.slice(0, 5).map((emp) => (
            <Button
              key={emp.userId}
              variant={selectedEmployee === emp.userId ? "default" : "outline"}
              onClick={() => setSelectedEmployee(emp.userId)}
              size="sm"
            >
              {emp.userName || "Unknown"}
            </Button>
          ))}
          {uniqueEmployees.length > 5 && (
            <span className="text-xs text-muted-foreground px-2 py-1">
              +{uniqueEmployees.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Report Date</TableHead>
                <TableHead>Tasks Completed</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{report.userName || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.userEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{report.department || "—"}</TableCell>
                    <TableCell>
                      {report.reportDate
                        ? format(new Date(report.reportDate), "MMM dd, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {report.tasksCompleted || "—"}
                    </TableCell>
                    <TableCell>{report.hoursWorked || "—"} hrs</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {report.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No reports found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredReports.length} of {allReports?.length || 0} reports
      </div>
    </div>
  );
}

export default function AdminReportsDashboard() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only administrators can access the reports dashboard.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AdminReportsDashboardContent />
    </DashboardLayout>
  );
}
