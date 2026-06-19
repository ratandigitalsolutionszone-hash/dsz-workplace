import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { getLoginUrl } from "@/const";
import { Card } from "@/components/ui/card";
import { CheckCircle, Users, FileText, Bell, Calendar, Briefcase } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DSZ</span>
            </div>
            <span className="text-xl font-bold text-white">DSZ Workspace</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Your Workspace,
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent"> Unified</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Manage daily reports, company notices, meetings, and client tasks all in one place. Built for teams that work together.
          </p>
          <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
            <a href={getLoginUrl()}>Get Started</a>
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <Card className="p-6 bg-slate-800 border-slate-700 hover:border-blue-500 transition">
            <FileText className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Daily Reports</h3>
            <p className="text-slate-300">Track your daily tasks, hours worked, and progress with ease.</p>
          </Card>

          <Card className="p-6 bg-slate-800 border-slate-700 hover:border-blue-500 transition">
            <Bell className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Company Notices</h3>
            <p className="text-slate-300">Stay informed with important announcements from leadership.</p>
          </Card>

          <Card className="p-6 bg-slate-800 border-slate-700 hover:border-blue-500 transition">
            <Calendar className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Meeting Management</h3>
            <p className="text-slate-300">Schedule, organize, and manage all your meetings in one place.</p>
          </Card>

          <Card className="p-6 bg-slate-800 border-slate-700 hover:border-blue-500 transition">
            <Briefcase className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Client Tasks</h3>
            <p className="text-slate-300">Track and manage client requests with priority and status updates.</p>
          </Card>

          <Card className="p-6 bg-slate-800 border-slate-700 hover:border-blue-500 transition">
            <Users className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Employee Profiles</h3>
            <p className="text-slate-300">Manage your professional profile and team information.</p>
          </Card>

          <Card className="p-6 bg-slate-800 border-slate-700 hover:border-blue-500 transition">
            <CheckCircle className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Role-Based Access</h3>
            <p className="text-slate-300">Admin and employee roles with appropriate permissions.</p>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-slate-800 rounded-lg p-12 border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Choose DSZ Workspace?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Centralized Hub</h3>
                <p className="text-slate-300">All your work communication and task management in one unified platform.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Easy Collaboration</h3>
                <p className="text-slate-300">Share updates, notices, and tasks with your entire team effortlessly.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart Organization</h3>
                <p className="text-slate-300">Track everything with status updates, priorities, and due dates.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Professional Design</h3>
                <p className="text-slate-300">Clean, intuitive interface designed for productivity and efficiency.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to streamline your workspace?</h2>
          <p className="text-lg text-blue-100 mb-8">Join your team and start managing everything in one place.</p>
          <Button size="lg" variant="secondary" asChild>
            <a href={getLoginUrl()}>Sign In Now</a>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>&copy; 2026 DSZ Workspace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
