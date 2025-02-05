import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function useLoginMutation() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (credentials: Pick<InsertUser, "username" | "password">) => {
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Login failed");
        }

        return data.user;
      } catch (error: any) {
        throw new Error(error.message || "Login failed");
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], { user });
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useLogoutMutation() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/logout");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Logout failed");
        }
      } catch (error: any) {
        throw new Error(error.message || "Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], { user: null });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useRegisterMutation() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (userData: InsertUser) => {
      try {
        // Validate the data first
        const validated = insertUserSchema.parse(userData);

        // Make the API request with proper headers
        const res = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validated),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.details || "Registration failed");
        }

        return data.user;
      } catch (error: any) {
        // Handle both Zod validation errors and API errors
        if (error.errors || error.details) {
          throw new Error(error.errors || error.details);
        }
        throw new Error(error.message || "Registration failed");
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], { user });
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: userData,
    error,
    isLoading,
  } = useQuery<{ user: User | null }>({
    queryKey: ["/api/user"],
    retry: false,
  });

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const registerMutation = useRegisterMutation();

  return (
    <AuthContext.Provider
      value={{
        user: userData?.user ?? null,
        isLoading,
        error: error as Error | null,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}