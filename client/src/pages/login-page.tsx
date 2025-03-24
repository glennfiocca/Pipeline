import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { PageTransition, TransitionChild } from "@/components/PageTransition";

export default function LoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { loginMutation } = useAuth();
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const form = useForm<Pick<InsertUser, "username" | "password">>({
    defaultValues: {
      username: "",
      password: "",
    }
  });

  const resetPasswordForm = useForm({
    defaultValues: {
      email: ""
    }
  });

  async function onLogin(values: Pick<InsertUser, "username" | "password">) {
    try {
      await loginMutation.mutateAsync(values);
      setLocation("/");
    } catch (error) {
      console.error("Login error:", error);
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
    <PageTransition isAuth>
      <div className="container flex items-center justify-center min-h-screen">
        <div className="grid lg:grid-cols-2 gap-8 w-full max-w-4xl">
          <TransitionChild delay={0.1} className="flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tighter">
                Welcome back to Pipeline
              </h1>
              <p className="text-muted-foreground">
                Sign in to your account to continue your job search journey.
              </p>
            </div>
          </TransitionChild>

          <TransitionChild delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Login to Pipeline</CardTitle>
                <CardDescription>
                  Don't have an account?{" "}
                  <Link href="/auth/register" className="text-primary hover:underline">
                    Sign up here
                  </Link>
                </CardDescription>
              </CardHeader>

              <CardContent>
                {!isResettingPassword ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
              </CardContent>
            </Card>
          </TransitionChild>
        </div>
      </div>
    </PageTransition>
  );
}