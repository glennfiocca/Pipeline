import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import HomePage from "@/pages/home-page";
import JobsPage from "@/pages/jobs-page";
import ProfilePage from "@/pages/profile-page";
import DashboardPage from "@/pages/dashboard-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/hooks/use-notifications";

function Router() {
  return (
    <Switch>
      <Route path="/auth/:tab" component={AuthPage} />
      <Route path="/" component={HomePage} />
      <Route path="/jobs" component={JobsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/admin/dashboard" component={AdminDashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
            <NavBar />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
            <Toaster />
          </div>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;