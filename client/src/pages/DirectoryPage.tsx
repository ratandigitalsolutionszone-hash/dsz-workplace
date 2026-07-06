import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Mail, MapPin, Briefcase, Users, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

function DirectoryPageContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [employeeToRemove, setEmployeeToRemove] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data: employees, isLoading, refetch } = trpc.directory.getAllEmployees.useQuery();
  const removeEmployeeMutation = trpc.directory.removeEmployee.useMutation({
    onSuccess: () => {
      toast.success("Employee removed successfully");
      setEmployeeToRemove(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove employee");
    },
  });

  const handleRemoveEmployee = async () => {
    if (!employeeToRemove) return;
    setIsRemoving(true);
    try {
      await removeEmployeeMutation.mutateAsync({ userId: employeeToRemove.id });
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];

    return employees.filter((emp) => {
      const matchesSearch =
        !searchQuery ||
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment =
        !selectedDepartment || emp.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchQuery, selectedDepartment]);

  const departments = useMemo(() => {
    if (!employees) return [];
    const depts = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [employees]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div>
        <h1 className="text-4xl font-bold text-black">Employee Directory</h1>
        <p className="text-muted-foreground mt-2">
          Browse and view profiles of all company employees
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-200">
        <Input
          placeholder="Search by name, email, position, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border-blue-200 focus:border-blue-500"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedDepartment === null ? "default" : "outline"}
            onClick={() => setSelectedDepartment(null)}
            size="sm"
            className={selectedDepartment === null ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            All Departments
          </Button>
          {departments.map((dept) => (
            <Button
              key={dept}
              variant={selectedDepartment === dept ? "default" : "outline"}
              onClick={() => setSelectedDepartment(dept)}
              size="sm"
              className={selectedDepartment === dept ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {dept || "Unassigned"}
            </Button>
          ))}
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => (
            <Card key={emp.id} className="p-6 hover:shadow-xl transition-all border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-transparent">
              <div className="space-y-4">
                {/* Avatar and Name */}
                <div className="flex items-start justify-between">
                  <Avatar className="h-14 w-14 shadow-lg">
                    <AvatarImage src={emp.profilePhotoUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">
                      {emp.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {emp.position || "Employee"}
                    </p>
                  </div>
                </div>

                {/* Name and Title */}
                <div className="border-b border-blue-200 pb-3">
                  <h3 className="text-lg font-bold text-gray-900">{emp.name}</h3>
                  {emp.position && (
                    <p className="text-sm font-semibold text-blue-700 flex items-center gap-1 mt-1">
                      <Briefcase className="w-4 h-4" />
                      {emp.position}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  {emp.email && (
                    <a
                      href={`mailto:${emp.email}`}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
                    >
                      <Mail className="w-4 h-4" />
                      {emp.email}
                    </a>
                  )}
                  {emp.department && (
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">{emp.department}</span>
                    </div>
                  )}
                </div>

                {/* Summary Footer */}
                <div className="bg-white rounded border border-blue-100 p-3 mt-3 space-y-2">
                  {emp.employeeId && (
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">Employee ID:</span> {emp.employeeId}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">System ID:</span> {emp.id}
                  </p>
                </div>

                {/* Admin Actions */}
                {user?.role === 'admin' && (
                  <div className="pt-3 border-t border-blue-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEmployeeToRemove(emp)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Employee
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card className="p-12 text-center bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-l-blue-300">
              <Users className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold text-lg">No employees found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter criteria</p>
            </Card>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {filteredEmployees.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-transparent border-t-2 border-t-blue-500">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-blue-700">{filteredEmployees.length}</span> employee{filteredEmployees.length !== 1 ? 's' : ''} found
            {selectedDepartment && <span className="text-gray-600"> in {selectedDepartment}</span>}
          </p>
        </Card>
      )}

      {/* Remove Employee Confirmation Dialog */}
      <Dialog open={!!employeeToRemove} onOpenChange={(open) => !open && setEmployeeToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to remove <span className="font-bold">{employeeToRemove?.name}</span>? This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">
                <span className="font-semibold">What will happen:</span>
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                <li>Employee will be removed from all teams</li>
                <li>Employee will be unable to log in</li>
                <li>Historical reports and data will be preserved</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmployeeToRemove(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveEmployee}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? "Removing..." : "Remove Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <DashboardLayout>
      <DirectoryPageContent />
    </DashboardLayout>
  );
}
