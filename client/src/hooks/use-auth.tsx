import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Import User type from schema but extend it with referralCode
import type { User as BaseUser } from "@shared/schema";

// Extend the base User type with the referralCode property
export type User = BaseUser & {
  referralCode?: string | null;
};

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
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
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
        // Create an AbortController to cancel any pending requests
        const controller = new AbortController();
        
        // First cancel any in-flight requests by invalidating queries
        queryClient.cancelQueries();
        
        // Perform the logout request with the controller signal
        const res = await apiRequest("POST", "/api/logout", undefined, controller.signal);
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Logout failed");
        }
        
        return res.json();
      } catch (error) {
        // Check if it's an AbortError, which we can safely ignore
        if (error instanceof DOMException && error.name === "AbortError") {
          console.log("Logout request was aborted - this is expected behavior");
          return { aborted: true };
        }
        
        console.error("Logout error:", error);
        throw error;
      } finally {
        // Always clear cache regardless of outcome with a small delay
        // to ensure UI components have time to detach from data
        setTimeout(() => {
          queryClient.setQueryData(["/api/user"], null);
          queryClient.clear();
        }, 10);
      }
    },
    onSuccess: (result) => {
      // Skip toast if it was an aborted request
      if (result && 'aborted' in result) return;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Use a reasonable delay before redirect to allow for state cleanup
      // This helps prevent React component unmounting errors
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 150);
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      
      toast({
        title: "Logout issue",
        description: "You have been logged out but there was an issue with the server.",
        variant: "destructive",
      });
      
      // Still redirect to login page, but with a slight delay
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 150);
    },
  });
}

function useRegisterMutation() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (userData: InsertUser) => {
      try {
        // Log registration data for debugging
        console.log("Registration data:", userData);
        console.log("Referral code from form:", userData.referredBy);
        
        // Validate data
        const validated = insertUserSchema.parse(userData);
        
        // Log data after validation
        console.log("Validated data:", validated);
        console.log("Validated referral code:", validated.referredBy);
        
        // Make API request with validated data
        const res = await apiRequest("POST", "/api/auth/register", validated);

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || error.details || "Registration failed");
        }

        // Get the user data from the response
        const user = await res.json();
        console.log("Registration successful, user data:", user);
        
        // Perform automatic login after successful registration
        try {
          console.log("Attempting automatic login with credentials");
          const loginRes = await apiRequest("POST", "/api/login", {
            username: validated.username,
            password: validated.password
          });
          
          if (loginRes.ok) {
            const loggedInUser = await loginRes.json();
            console.log("Auto-login successful:", loggedInUser);
            return loggedInUser;
          } else {
            console.warn("Auto-login failed, returning registration data");
            return user; // Return registration data if auto-login fails
          }
        } catch (loginError) {
          console.error("Auto-login error:", loginError);
          return user; // Return registration data if auto-login fails
        }
      } catch (error: any) {
        console.error("Registration error:", error);
        throw new Error(error.message || "Registration failed");
      }
    },
    onSuccess: (user) => {
      // Update the user data in the cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Invalidate the query to force a fresh fetch of user data (to get credits)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }, 1000);
      
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
    },
    onError: (error: Error) => {
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
    data: user,
    error,
    isLoading,
  } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const registerMutation = useRegisterMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
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