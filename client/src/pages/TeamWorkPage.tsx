import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TeamWorkPage() {
  const { user } = useAuth();
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

  // Queries
  const { data: teams, refetch: refetchTeams } = trpc.teams.getAll.useQuery();
  const { data: teamMembers } = trpc.teams.getMembers.useQuery(
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
  // Mutations
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

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);
  const isTeamLeader = selectedTeam && user && selectedTeam.teamLeaderId === user.id;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Team Work</h1>
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
                  {teamMembers?.map((member: any) => (
                    <SelectItem key={member.userId} value={member.userId.toString()}>
                      {member.userName} {member.userDepartment ? `(${member.userDepartment})` : ''} {member.userPosition ? `- ${member.userPosition}` : ''}
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
    </div>
  );
}
