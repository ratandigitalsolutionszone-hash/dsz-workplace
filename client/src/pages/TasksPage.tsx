import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, Edit2, CheckCircle2, Clock, AlertCircle, Briefcase } from "lucide-react";

export default function TasksPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: tasks, refetch } = trpc.tasks.getAll.useQuery(undefined, {
    enabled: !!user,
  });

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully");
      setIsCreating(false);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      setEditingId(null);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted");
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });

  const [formData, setFormData] = useState({
    clientName: "",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
  });

  const resetForm = () => {
    setFormData({
      clientName: "",
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
    });
  };

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateTaskMutation.mutate({
        taskId: editingId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      });
    } else {
      createTaskMutation.mutate({
        clientName: formData.clientName,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      } as any);
    }
  };

  const handleDelete = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate({ taskId });
    }
  };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setFormData({
      clientName: task.clientName,
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    });
    setIsCreating(true);
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      status: newStatus as "pending" | "in_progress" | "completed" | "cancelled",
    });
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-screen">Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  const filteredTasks = tasks?.filter(task => {
    if (filterStatus === "all") return true;
    return task.status === filterStatus;
  }) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-l-4 border-red-500";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500";
      case "low":
        return "bg-green-100 text-green-800 border-l-4 border-green-500";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "pending":
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      case "cancelled":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-l-4 border-l-green-500";
      case "in_progress":
        return "bg-blue-50 border-l-4 border-l-blue-500";
      case "pending":
        return "bg-gray-50 border-l-4 border-l-gray-400";
      case "cancelled":
        return "bg-red-50 border-l-4 border-l-red-500";
      default:
        return "bg-white";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-black">Client Tasks</h1>
            <p className="text-muted-foreground mt-2">Track and manage client requests and deliverables</p>
          </div>
          <Button 
            onClick={() => {
              setEditingId(null);
              resetForm();
              setIsCreating(!isCreating);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isCreating ? "Cancel" : "New Task"}
          </Button>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="p-6 border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-50 to-transparent">
            <h2 className="text-xl font-semibold mb-4 text-purple-900">
              {editingId ? "Edit Task" : "Create New Task"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="clientName" className="text-purple-900 font-semibold">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="e.g., Acme Corporation"
                  required
                  disabled={!!editingId}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="title" className="text-purple-900 font-semibold">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Website Redesign"
                  required
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-purple-900 font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task details..."
                  rows={4}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority" className="text-purple-900 font-semibold">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                    <SelectTrigger className="border-purple-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate" className="text-purple-900 font-semibold">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {editingId ? "Update Task" : "Create Task"}
              </Button>
            </form>
          </Card>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            className={filterStatus === "all" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            All Tasks
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            onClick={() => setFilterStatus("pending")}
            className={filterStatus === "pending" ? "bg-gray-600 hover:bg-gray-700" : ""}
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === "in_progress" ? "default" : "outline"}
            onClick={() => setFilterStatus("in_progress")}
            className={filterStatus === "in_progress" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            In Progress
          </Button>
          <Button
            variant={filterStatus === "completed" ? "default" : "outline"}
            onClick={() => setFilterStatus("completed")}
            className={filterStatus === "completed" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Completed
          </Button>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <Card 
                key={task.id} 
                className={`p-6 hover:shadow-lg transition-shadow ${getStatusColor(task.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(task.status)}
                      <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-700">{task.clientName}</span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-700 p-3 bg-white rounded border border-gray-200 mt-2">
                          {task.description}
                        </p>
                      )}
                      
                      {task.dueDate && (
                        <div className="text-sm text-gray-600 mt-2">
                          <span className="font-semibold">Due:</span> {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Select value={task.status} onValueChange={(value) => handleStatusChange(task.id, value)}>
                      <SelectTrigger className="w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(task)}
                      className="text-purple-600 hover:bg-purple-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(task.id)}
                      disabled={deleteTaskMutation.isPending}
                      className="text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center bg-gradient-to-r from-purple-50 to-transparent border-l-4 border-l-purple-300">
              <Briefcase className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold">No tasks found</p>
              <p className="text-gray-500 text-sm mt-1">Create a new task to get started</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
