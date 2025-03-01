import { useEffect } from "react";
import { useLocation } from "wouter";
import { ApplicationsManagement } from "@/components/ApplicationsManagement";
import { useAuth } from "@/hooks/use-auth";

export default function AdminApplicationsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-admin users
  useEffect(() => {
    if (!user?.isAdmin) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Applications</h1>
      </div>
      <ApplicationsManagement />
    </div>
  );
} 