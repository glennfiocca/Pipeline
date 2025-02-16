import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import HomePage from "@/pages/home-page";
import JobsPage from "@/pages/jobs-page";
import ProfilePage from "@/pages/profile-page";
import DashboardPage from "@/pages/dashboard-page";
import LoginPage from "@/pages/login-page";
import RegisterPage from "@/pages/register-page";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/" component={HomePage} />
      <Route path="/jobs" component={JobsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          <NavBar />
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;