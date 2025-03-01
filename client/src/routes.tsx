import { Route, Switch } from "wouter";
import DashboardPage from "@/pages/dashboard-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import AdminApplicationsPage from "@/pages/admin-applications-page";
import JobsPage from "@/pages/jobs-page";
import LoginPage from "@/pages/login-page";
import SignupPage from "@/pages/signup-page";
import ProfilePage from "@/pages/profile-page";
import ApplicationsPage from "@/pages/applications-page";
import NotFoundPage from "@/pages/not-found-page";

export function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/jobs" component={JobsPage} />
      <Route path="/applications" component={ApplicationsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/applications/:username" component={AdminApplicationsPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
} 