import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

interface TaskReport {
  reportId: number;
  employeeName: string | null;
  employeeId: string | null;
  employeeEmail: string | null;
  teamName: string | null;
  reportDate: Date;
  tasksCompleted: string | null;
  hoursWorked: string | null;
  notes: string | null;
  submittedAt: Date;
  lastEditedAt: Date | null;
}

interface TaskReportsViewerProps {
  teamId?: number;
}

export function TaskReportsViewer({ teamId }: TaskReportsViewerProps) {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(teamId);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'employee'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<TaskReport | null>(null);
  const itemsPerPage = 10;

  // Fetch teams for filter
  const { data: teams } = trpc.teams.getAll.useQuery();

  // Fetch task reports
  const { data: reports, isLoading, error } = trpc.teams.getTaskReports.useQuery(
    {
      teamId: selectedTeamId,
      userId: selectedEmployeeId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      searchQuery: searchQuery || undefined,
    },
    {
      enabled: user?.role === 'admin' || !!selectedTeamId,
    }
  );

  // Get unique employees from reports for filter
  const uniqueEmployees = useMemo(() => {
    if (!reports) return [];
    const employees = new Map();
    reports.forEach(report => {
      if (report.employeeName && !employees.has(report.employeeName)) {
        employees.set(report.employeeName, report);
      }
    });
    return Array.from(employees.values());
  }, [reports]);

  // Sort reports
  const sortedReports = useMemo(() => {
    if (!reports) return [];
    const sorted = [...reports];
    if (sortBy === 'date') {
      sorted.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
    } else {
      sorted.sort((a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''));
    }
    return sorted;
  }, [reports, sortBy]);

  // Paginate reports
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedReports.slice(start, start + itemsPerPage);
  }, [sortedReports, currentPage]);

  const totalPages = Math.ceil((sortedReports.length || 0) / itemsPerPage);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Task Reports</CardTitle>
          <CardDescription>View and filter task reports from team members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Team Filter (Admin only or for Team Leaders) */}
            {user?.role === 'admin' && (
              <div>
                <label className="text-sm font-medium">Team</label>
                <Select value={selectedTeamId?.toString() || 'all'} onValueChange={(value) => {
                  setSelectedTeamId(value === 'all' ? undefined : parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All teams</SelectItem>
                    {teams?.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Employee Filter */}
            <div>
              <label className="text-sm font-medium">Employee</label>
              <Select value={selectedEmployeeId?.toString() || 'all'} onValueChange={(value) => {
                setSelectedEmployeeId(value === 'all' ? undefined : parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {uniqueEmployees.map(emp => (
                    <SelectItem key={emp.reportId} value={emp.reportId?.toString() || 'unknown'}>
                      {emp.employeeName} ({emp.employeeId || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by employee name, ID, or tasks..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="employee">Sort by Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Reports ({sortedReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-red-500 py-4">Error loading reports</div>
          ) : sortedReports.length === 0 ? (
            <div className="text-gray-500 py-4">No reports found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Report Date</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReports.map((report) => {
                      const statusColors: Record<string, string> = {
                        draft: 'bg-gray-100 text-gray-800',
                        submitted: 'bg-blue-100 text-blue-800',
                        reviewed: 'bg-yellow-100 text-yellow-800',
                        approved: 'bg-green-100 text-green-800',
                      };
                      return (
                        <TableRow key={report.reportId}>
                          <TableCell className="font-medium">{report.employeeName || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.employeeId || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>{report.teamName || '-'}</TableCell>
                          <TableCell>{format(new Date(report.reportDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{report.hoursWorked || '-'}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[report.reportStatus || 'draft']}>
                              {(report.reportStatus || 'draft').charAt(0).toUpperCase() + (report.reportStatus || 'draft').slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              View Details
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {format(new Date(report.submittedAt), 'MMM dd, HH:mm')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Task Report Details</CardTitle>
                  <CardDescription>
                    {selectedReport?.employeeName} • {selectedReport && selectedReport.reportDate ? format(new Date(selectedReport.reportDate as Date), 'MMM dd, yyyy') : 'N/A'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Employee Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{selectedReport?.employeeName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Employee ID:</span>
                    <p className="font-medium">{selectedReport?.employeeId || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Team:</span>
                    <p className="font-medium">{selectedReport?.teamName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Report Date:</span>
                    <p className="font-medium">{format(new Date(selectedReport?.reportDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Tasks Completed</h4>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {selectedReport?.tasksCompleted || 'No tasks recorded'}
                </div>
              </div>

              {selectedReport?.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {selectedReport?.notes}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Hours Worked:</span>
                  <p className="font-medium">{selectedReport?.hoursWorked || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Submitted:</span>
                  <p className="font-medium">{selectedReport && selectedReport.submittedAt ? format(new Date(selectedReport.submittedAt), 'MMM dd, HH:mm') : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
