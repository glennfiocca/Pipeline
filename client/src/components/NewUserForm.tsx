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
import { Loader2 } from "lucide-react";

type NewUserForm = z.infer<typeof insertUserSchema>;

interface UserFormProps {
  onSubmit: (data: NewUserForm) => void;
  onCancel: () => void;
  initialData?: User | null;
}

export function NewUserForm({ onSubmit, onCancel, initialData }: UserFormProps) {
  // Base schema for both create and edit modes
  const baseSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    isAdmin: z.boolean(),
  });

  // Schema for creating new users (requires password)
  const createSchema = baseSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  // Schema for editing users (password is optional)
  const editSchema = baseSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    confirmPassword: z.string().optional()
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
    resolver: zodResolver(initialData ? editSchema : createSchema),
    defaultValues: {
      username: initialData?.username || "",
      email: initialData?.email || "",
      isAdmin: Boolean(initialData?.isAdmin) || false,
      password: "",
      confirmPassword: "",
    },
  });

  console.log("Form values:", form.watch()); // Debug log

  const handleSubmit = async (data: NewUserForm) => {
    try {
      console.log("Form submitted with data:", data); // Debug log

      const formData = {
        ...data,
        isAdmin: Boolean(data.isAdmin),
      };
      console.log("Processed form data:", formData); // Debug log

      if (initialData) {
        // When editing, always include isAdmin in the update
        const { password, confirmPassword, ...rest } = formData;
        const updateData = {
          ...rest,
          isAdmin: formData.isAdmin
        };

        if (password) {
          updateData.password = password;
        }

        console.log("Update data being sent:", updateData); // Debug log
        await onSubmit(updateData as NewUserForm);
      } else {
        console.log("Create data being sent:", formData); // Debug log
        await onSubmit(formData);
      }
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
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Administrator Access</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Grant administrative privileges to this user
                </p>
              </div>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Updating..." : "Creating..."}
              </>
            ) : (
              initialData ? "Update User" : "Create User"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}