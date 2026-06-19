import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { Mail, MapPin, Briefcase } from "lucide-react";
import { useState, useMemo } from "react";

export default function DirectoryPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const { data: employees, isLoading } = trpc.directory.list.useQuery();

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
        <p className="text-muted-foreground mt-2">
          Browse and view profiles of all company employees
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <Input
          placeholder="Search by name, email, position, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedDepartment === null ? "default" : "outline"}
            onClick={() => setSelectedDepartment(null)}
            size="sm"
          >
            All Departments
          </Button>
          {departments.map((dept) => (
            <Button
              key={dept}
              variant={selectedDepartment === dept ? "default" : "outline"}
              onClick={() => setSelectedDepartment(dept)}
              size="sm"
            >
              {dept || "Unassigned"}
            </Button>
          ))}
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => (
            <Card key={emp.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Avatar */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {emp.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  {emp.id === user?.id && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <h3 className="font-semibold text-lg">{emp.name || "Unknown"}</h3>
                  {emp.position && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Briefcase className="h-4 w-4" />
                      {emp.position}
                    </div>
                  )}
                </div>

                {/* Department */}
                {emp.department && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {emp.department}
                  </div>
                )}

                {/* Email */}
                <div className="flex items-center gap-2 text-sm break-all">
                  <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <a
                    href={`mailto:${emp.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {emp.email || "No email"}
                  </a>
                </div>

                {/* Bio */}
                {emp.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {emp.bio}
                  </p>
                )}

                {/* Contact Button */}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    if (emp.email) {
                      window.location.href = `mailto:${emp.email}`;
                    }
                  }}
                >
                  Send Email
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No employees found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredEmployees.length} of {employees?.length || 0} employees
      </div>
    </div>
  );
}
