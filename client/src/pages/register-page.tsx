import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect, useState } from "react";

interface ReferralInfo {
  username: string;
}

export default function RegisterPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { registerMutation } = useAuth();
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const referralCode = searchParams.get('ref');

  // Fetch referral info if code is present
  const { data: referralInfo } = useQuery<ReferralInfo>({
    queryKey: [`/api/referral/${referralCode}`],
    queryFn: getQueryFn({ on401: "returnUndefined" }),
    enabled: !!referralCode
  });

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      referredBy: referralCode || undefined
    }
  });

  async function onSubmit(values: InsertUser) {
    try {
      await registerMutation.mutateAsync(values);
      setLocation("/");
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.message || "Failed to create account";
      if (error.errors) {
        toast({
          title: "Validation Error",
          description: error.errors,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <div className="grid lg:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter">
              Join Pipeline Today
            </h1>
            <p className="text-muted-foreground">
              Create your account to start your job search journey with one-click applications and personalized job matches.
            </p>
          </div>

          {referralInfo && (
            <Alert className="bg-primary/10 border-primary text-primary">
              <AlertDescription className="text-lg">
                You've been referred by {referralInfo.username}! 
                Sign up now and you'll both receive 5 bonus credits! 🎉
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Login here
              </Link>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <FormField
                  control={form.control}
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}