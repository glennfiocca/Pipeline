import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";

export default function AuthPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search] = useSearch();
  const { loginMutation, registerMutation, user, logoutMutation } = useAuth();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showReferralWarning, setShowReferralWarning] = useState(false);

  const searchParams = new URLSearchParams(search);
  const referredBy = searchParams.get('ref');

  // Initialize forms early so they can be used in useEffect
  const loginForm = useForm({
    defaultValues: {
      username: "",
      password: "",
    }
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      isAdmin: false,
      referredBy: referredBy || undefined
    }
  });

  const resetPasswordForm = useForm({
    defaultValues: {
      email: ""
    }
  });

  // Always show register tab when there's a referral
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(referredBy ? 'register' : 'login');

  // Check if user is trying to use a referral link while already logged in
  useEffect(() => {
    if (user && referredBy) {
      console.log("Warning: User already logged in while using referral link", user.username);
      setShowReferralWarning(true);
    }
  }, [user, referredBy]);

  // Effect to switch to register tab when referral code is present
  useEffect(() => {
    if (referredBy) {
      setActiveTab('register');
      
      // Explicitly set the referredBy value in the form
      registerForm.setValue('referredBy', referredBy);
      
      // Debug information
      console.log("Referral code detected:", referredBy);
      console.log("Form values after setting referredBy:", registerForm.getValues());
    }
  }, [referredBy, registerForm]);

  async function onSubmit(values: InsertUser) {
    try {
      // Make sure referredBy is explicitly included in the request payload
      console.log("Registering with values:", values);
      console.log("Referral code:", values.referredBy);
      
      // Ensure referredBy is included in the registration data
      await registerMutation.mutateAsync({
        ...values,
        referredBy: values.referredBy // Explicitly pass the referredBy parameter
      });
      
      toast({
        title: "Account created",
        description: "You can now log in with your credentials.",
      });
      setLocation("/");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    }
  }

  async function onLogin(values: { username: string; password: string }) {
    try {
      await loginMutation.mutateAsync(values);
      toast({
        title: "Success",
        description: "Successfully logged in",
      });
      setLocation("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
  }

  async function onForgotPassword(values: { email: string }) {
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error("Failed to process password reset request");
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions."
      });
      setIsResettingPassword(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
        variant: "destructive"
      });
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen">
      {showReferralWarning && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 p-3 z-50">
          <div className="container flex items-center justify-between">
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">
                ⚠️ You're already logged in as {user?.username}. To properly use this referral link:
              </p>
              <ul className="text-sm list-disc pl-5 mt-1 text-yellow-700">
                <li>Open this link in an incognito/private browser window</li>
                <li>Log out first before signing up a new user</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-yellow-800 bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                onClick={async () => {
                  try {
                    await logoutMutation.mutateAsync();
                    toast({
                      title: "Logged out",
                      description: "You can now create a new account with this referral link.",
                    });
                    setShowReferralWarning(false);
                    window.location.reload(); // Reload to clear the UI state
                  } catch (error) {
                    console.error("Logout error:", error);
                    toast({
                      title: "Error",
                      description: "Could not log out. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Log Out Now
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-yellow-300 text-yellow-800"
                onClick={() => setShowReferralWarning(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Left column with welcome message */}
        <div className="flex flex-col justify-center space-y-6">
          {referredBy ? (
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter text-primary">
                Welcome to Pipeline!
              </h1>
              <p className="text-xl">
                <span className="font-semibold text-primary">{referredBy}</span> thinks we can help make your job search easier!
              </p>
              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <p className="font-medium">Special Referral Offer:</p>
                <p className="text-muted-foreground">
                  Create your account now and receive 5 bonus application credits to get started!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter">
                Welcome to Pipeline
              </h1>
              <p className="text-muted-foreground">
                Your career journey starts here. Access the best jobs in tech and finance with one-click applications.
              </p>
            </div>
          )}
        </div>

        {/* Right column with auth form */}
        <Card>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="space-y-4">
                {!isResettingPassword ? (
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>

                      <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={() => setIsResettingPassword(true)}
                      >
                        Forgot password?
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                      <FormField
                        control={resetPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full">
                        Reset Password
                      </Button>

                      <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={() => setIsResettingPassword(false)}
                      >
                        Back to login
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hidden field for referral code */}
                    <FormField
                      control={registerForm.control}
                      name="referredBy"
                      render={({ field }) => (
                        <input type="hidden" {...field} />
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}