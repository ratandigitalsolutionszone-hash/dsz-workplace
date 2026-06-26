import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SendReportDialog from "@/components/SendReportDialog";
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle, Edit2, History, Users, Plus, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [showEditHistory, setShowEditHistory] = useState<number | null>(null);
  
  // Team Work state
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedLeaderId, setSelectedLeaderId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterUserId, setFilterUserId] = useState<number | null>(null);
  
  const [editFormData, setEditFormData] = useState({
    tasksCompleted: "",
    hoursWorked: "",
    notes: "",
  });

  const { data: reports, refetch } = trpc.reports.getAll.useQuery(undefined, {
    enabled: !!user,
  });

  // Team queries
  const { data: teams, refetch: refetchTeams } = trpc.teams.getAll.useQuery();
  const { data: allEmployees } = trpc.teams.getAllEmployees.useQuery();
  const { data: teamMembers } = trpc.teams.getMembers.useQuery(
    { teamId: selectedTeamId || 0 },
    { enabled: !!selectedTeamId }
  );
  const { data: eligibleEmployees } = trpc.teams.getEligibleMembers.useQuery(
    { teamId: selectedTeamId || 0 },
    { enabled: !!selectedTeamId }
  );
  const { data: teamReports } = trpc.teams.getReports.useQuery(
    { 
      teamId: selectedTeamId || 0,
      startDate: filterStartDate || undefined,
      endDate: filterEndDate || undefined,
      userId: filterUserId || undefined
    },
    { enabled: !!selectedTeamId && showReports }
  );

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

  // Team mutations
  const addMemberMutation = trpc.teams.addMember.useMutation({
    onSuccess: () => {
      toast.success('Team member added successfully');
      setShowAddMember(false);
      setSelectedMemberId(null);
      if (selectedTeamId) {
        trpc.useUtils().teams.getMembers.invalidate({ teamId: selectedTeamId });
      }
    },
    onError: () => {
      toast.error('Failed to add team member');
    },
  });

  const removeMemberMutation = trpc.teams.removeMember.useMutation({
    onSuccess: () => {
      toast.success('Team member removed successfully');
      if (selectedTeamId) {
        trpc.useUtils().teams.getMembers.invalidate({ teamId: selectedTeamId });
      }
    },
    onError: () => {
      toast.error('Failed to remove team member');
    },
  });

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success('Team created successfully');
      setShowCreateTeam(false);
      setTeamName('');
      setTeamDescription('');
      setSelectedLeaderId(null);
      refetchTeams();
    },
    onError: () => {
      toast.error('Failed to create team');
    },
  });

  const assignLeaderMutation = trpc.teams.assignLeader.useMutation({
    onSuccess: () => {
      toast.success('Team leader assigned successfully');
      if (selectedTeamId) {
        refetchTeams();
      }
    },
    onError: () => {
      toast.error('Failed to assign team leader');
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

  const handleAddMember = () => {
    if (!selectedTeamId || !selectedMemberId) return;
    addMemberMutation.mutate({ teamId: selectedTeamId, userId: selectedMemberId });
  };

  const handleRemoveMember = (memberId: number) => {
    if (!selectedTeamId) return;
    if (confirm('Are you sure you want to remove this member from the team?')) {
      removeMemberMutation.mutate({ teamId: selectedTeamId, userId: memberId });
    }
  };

  const handleCreateTeam = () => {
    if (!teamName || !selectedLeaderId) {
      toast.error('Please fill in all required fields');
      return;
    }
    createTeamMutation.mutate({
      name: teamName,
      description: teamDescription,
      teamLeaderId: selectedLeaderId,
    });
  };

  const handleAssignLeader = (teamId: number, userId: number) => {
    assignLeaderMutation.mutate({ teamId, userId });
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-screen">Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  const sortedReports = reports ? [...reports].reverse() : [];
  const currentReport = editingReportId ? reports?.find(r => r.id === editingReportId) : null;
  const selectedTeam = teams?.find(t => t.id === selectedTeamId);
  const isTeamLeader = selectedTeam && user && selectedTeam.teamLeaderId === user.id;
  const isAdmin = user?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-black">Daily Work Reports</h1>
          <p className="text-muted-foreground mt-2">Manage your daily reports and team work</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200">
            <TabsTrigger value="submit" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Submit Daily Reports
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Team Work
            </TabsTrigger>
          </TabsList>

          {/* Submit Daily Reports Tab */}
          <TabsContent value="submit" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black">Submit Daily Report</h2>
                <p className="text-gray-600 mt-1">Track your daily tasks and progress</p>
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
                <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Submit Daily Report
                </h3>
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
          </TabsContent>

          {/* Team Work Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black">Team Work Management</h2>
                <p className="text-gray-600 mt-1">Manage teams and monitor team reports</p>
              </div>
              {isAdmin && (
                <Button onClick={() => setShowCreateTeam(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              )}
            </div>

            {/* Teams List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams?.map(team => (
                <Card key={team.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedTeamId(team.id)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-green-600" />
                      <h3 className="font-bold text-lg text-black">{team.name}</h3>
                    </div>
                  </div>
                  {team.description && <p className="text-gray-600 mb-2">{team.description}</p>}
                  <div className="text-sm text-gray-500">
                    <p>Team Leader ID: {team.teamLeaderId}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Selected Team Details */}
            {selectedTeam && (
              <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-black">{selectedTeam.name}</h2>
                    <Button onClick={() => setShowReports(!showReports)} variant="outline" className="border-green-600 text-green-600">
                      <Eye className="w-4 h-4 mr-2" />
                      {showReports ? 'Hide' : 'View'} Reports
                    </Button>
                  </div>
                  {selectedTeam.description && <p className="text-gray-600 mb-4">{selectedTeam.description}</p>}
                  
                  {(isTeamLeader || isAdmin) && (
                    <Button onClick={() => setShowAddMember(true)} className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  )}
                </Card>

                {/* Team Members */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-black">Team Members ({teamMembers?.length || 0})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMembers?.map(member => (
                      <Card key={member.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-black">{member.userName}</p>
                            <p className="text-sm text-gray-500">{member.userEmail}</p>
                            <p className="text-xs text-gray-400 mt-1">Joined: {format(new Date(member.joinedAt), 'MMM dd, yyyy')}</p>
                          </div>
                          {(isTeamLeader || isAdmin) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveMember(member.userId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Team Reports */}
                {showReports && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-bold text-black mb-4">Filter Reports</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Start Date</Label>
                          <Input type="date" onChange={(e) => setFilterStartDate(e.target.value ? new Date(e.target.value) : null)} />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input type="date" onChange={(e) => setFilterEndDate(e.target.value ? new Date(e.target.value) : null)} />
                        </div>
                        <div>
                          <Label>Employee</Label>
                          <Select onValueChange={(value) => setFilterUserId(value ? parseInt(value) : null)}>
                            <SelectTrigger>
                              <SelectValue placeholder="All employees" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All employees</SelectItem>
                              {teamMembers?.map(member => (
                                <SelectItem key={member.userId} value={member.userId.toString()}>
                                  {member.userName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-black">Reports ({teamReports?.length || 0})</h3>
                      {teamReports?.map(report => (
                        <Card key={report.id} className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Employee</p>
                              <p className="font-semibold text-black">{report.userName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Report Date</p>
                              <p className="font-semibold text-black">{format(new Date(report.reportDate), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Tasks Completed</p>
                              <p className="text-black">{report.tasksCompleted}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Hours Worked</p>
                              <p className="text-black">{report.hoursWorked}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-gray-500">Notes</p>
                              <p className="text-black">{report.notes}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Create Team Dialog */}
            <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Team Name</Label>
                    <Input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Team Description</Label>
                    <Textarea
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      placeholder="Enter team description"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Team Leader</Label>
                    <Select onValueChange={(value) => setSelectedLeaderId(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team leader" />
                      </SelectTrigger>
                      <SelectContent>
                        {allEmployees?.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.name} {emp.department ? `(${emp.department})` : ''} {emp.position ? `- ${emp.position}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateTeam(false)}>Cancel</Button>
                  <Button onClick={handleCreateTeam} className="bg-green-600 hover:bg-green-700">Create Team</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Member Dialog */}
            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Employee</Label>
                    <Select onValueChange={(value) => setSelectedMemberId(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleEmployees?.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.name} ({emp.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
                  <Button onClick={handleAddMember} className="bg-green-600 hover:bg-green-700">Add Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
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
            <DialogTitle>Report Edit History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {editHistory?.map((entry: any, index: number) => (
              <Card key={index} className="p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-black">Version {editHistory.length - index}</p>
                    <p className="text-sm text-gray-600">
                      Edited by: {entry.lastEditedBy || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(entry.lastEditedAt), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 font-semibold">Tasks:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{entry.tasksCompleted}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Hours: {entry.hoursWorked}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Notes: {entry.notes}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEditHistory(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
