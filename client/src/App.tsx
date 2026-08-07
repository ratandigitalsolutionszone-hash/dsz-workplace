import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import ReportsPage from "./pages/ReportsPage";
import NoticesPage from "./pages/NoticesPage";
import MeetingsPage from "./pages/MeetingsPage";
import TasksPage from "./pages/TasksPage";
import DirectoryPage from "./pages/DirectoryPage";
import AdminReportsDashboard from "./pages/AdminReportsDashboard";
import { RolePermissionsPage } from "./pages/RolePermissionsPage";
import LoginDisabled from "./pages/LoginDisabled";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/profile"} component={ProfilePage} />
      <Route path={"/reports"} component={ReportsPage} />
      <Route path={"/notices"} component={NoticesPage} />
      <Route path={"/meetings"} component={MeetingsPage} />
      <Route path={"/tasks"} component={TasksPage} />
      <Route path={"/directory"} component={DirectoryPage} />
      <Route path={"/admin-reports"} component={AdminReportsDashboard} />
      <Route path={"/role-permissions"} component={RolePermissionsPage} />
      <Route path={"/login-disabled"} component={LoginDisabled} />

      <Route path={"404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
