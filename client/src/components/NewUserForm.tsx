import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import type { User } from "@shared/schema";

type NewUserForm = z.infer<typeof insertUserSchema>;

interface UserFormProps {
  onSubmit: (data: NewUserForm) => void;
  onCancel: () => void;
  initialData?: User | null;
}

export function NewUserForm({ onSubmit, onCancel, initialData }: UserFormProps) {
  // Create separate schemas for create and edit modes
  const editModeSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    confirmPassword: z.string().optional(),
    isAdmin: z.boolean().default(false),
  }).refine((data) => {
    if (data.password || data.confirmPassword) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const form = useForm<NewUserForm>({
    resolver: zodResolver(initialData ? editModeSchema : insertUserSchema),
    defaultValues: {
      username: initialData?.username || "",
      email: initialData?.email || "",
      isAdmin: initialData?.isAdmin || false,
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (data: NewUserForm) => {
    try {
      // If editing and no password provided, remove password fields before submission
      if (initialData) {
        const { password, confirmPassword, ...restData } = data;
        if (!password) {
          await onSubmit(restData as NewUserForm);
        } else {
          await onSubmit(data);
        }
      } else {
        await onSubmit(data);
      }
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

        {/* Only show password fields if creating new user or explicitly editing password */}
        {(!initialData || form.watch('password')) && (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{initialData ? "New Password (optional)" : "Password"}</FormLabel>
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
                  <FormLabel>{initialData ? "Confirm New Password" : "Confirm Password"}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="isAdmin"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Administrator Access</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initialData ? "Update User" : "Create User"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}