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
import { Clock, Users, FileText, TrendingUp, BarChart3 } from "lucide-react";
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
        <Card className="p-8 max-w-md text-center bg-red-50 border-l-4 border-l-red-500">
          <h2 className="text-xl font-semibold mb-2 text-red-900">Error Loading Reports</h2>
          <p className="text-red-700">
            Failed to load reports data. Please try again later.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 bg-gradient-to-b from-[#d946ef] to-[#a855f7] rounded-full"></div>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#d946ef] to-[#a855f7] bg-clip-text text-transparent">Reports Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and review all employee daily work reports
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-transparent hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Total Reports</p>
              <p className="text-3xl font-black text-blue-700 mt-2">{allReports?.length || 0}</p>
            </div>
            <FileText className="h-10 w-10 text-blue-400" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-transparent hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Employees Reporting</p>
              <p className="text-3xl font-black text-green-700 mt-2">{uniqueEmployees.length}</p>
            </div>
            <Users className="h-10 w-10 text-green-400" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-transparent hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Avg Reports/Employee</p>
              <p className="text-3xl font-black text-purple-700 mt-2">
                {uniqueEmployees.length > 0 
                  ? (allReports?.length || 0 / uniqueEmployees.length).toFixed(1) 
                  : 0}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-400" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-transparent hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Last Report</p>
              <p className="text-lg font-black text-orange-700 mt-2">
                {allReports && allReports.length > 0
                  ? format(new Date(allReports[0].createdAt), "MMM dd")
                  : "N/A"}
              </p>
            </div>
            <Clock className="h-10 w-10 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 bg-gradient-to-r from-purple-50 to-transparent p-4 rounded-lg border border-purple-200">
        <Input
          placeholder="Search by employee name, email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border-purple-200 focus:border-purple-500"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedEmployee === null ? "default" : "outline"}
            onClick={() => setSelectedEmployee(null)}
            size="sm"
            className={selectedEmployee === null ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            All Employees
          </Button>
          {uniqueEmployees.map((emp) => (
            <Button
              key={emp.userId}
              variant={selectedEmployee === emp.userId ? "default" : "outline"}
              onClick={() => setSelectedEmployee(emp.userId)}
              size="sm"
              className={selectedEmployee === emp.userId ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {emp.userName}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <Card className="p-6 border-l-4 border-l-purple-500 overflow-x-auto">
        <h2 className="text-xl font-bold mb-4 text-purple-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Reports List
        </h2>
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-purple-50 to-transparent border-b-2 border-b-purple-300">
              <TableHead className="font-black text-purple-900">Employee</TableHead>
              <TableHead className="font-black text-purple-900">Email</TableHead>
              <TableHead className="font-black text-purple-900">Department</TableHead>
              <TableHead className="font-black text-purple-900">Date</TableHead>
              <TableHead className="font-black text-purple-900">Hours</TableHead>
              <TableHead className="font-black text-purple-900">Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length > 0 ? (
              filteredReports.map((report, idx) => (
                <TableRow 
                  key={`${report.userId}-${idx}`}
                  className="hover:bg-purple-50 transition-colors border-b border-purple-100"
                >
                  <TableCell className="font-semibold text-gray-900">{report.userName}</TableCell>
                  <TableCell className="text-blue-600 hover:underline">{report.userEmail}</TableCell>
                  <TableCell>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {report.department || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 font-medium">
                    {format(new Date(report.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      {report.hoursWorked || 0}h
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm max-w-xs truncate">
                    {report.tasksCompleted || "No tasks"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-purple-200 mb-2" />
                    <p className="text-gray-600 font-semibold">No reports found</p>
                    <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Summary Footer */}
      {filteredReports.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-transparent border-t-2 border-t-purple-500">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-purple-700">{filteredReports.length}</span> report{filteredReports.length !== 1 ? 's' : ''} displayed
            {selectedEmployee && <span className="text-gray-600"> from selected employee</span>}
          </p>
        </Card>
      )}
    </div>
  );
}

export default function AdminReportsDashboard() {
  return (
    <DashboardLayout>
      <AdminReportsDashboardContent />
    </DashboardLayout>
  );
}
