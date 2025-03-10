import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: user } = useQuery<User>({
    queryKey: [`/api/admin/users/${userId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }
      return res.json();
    },
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p>Username: {user.username}</p>
            <p>Email: {user.email}</p>
            {/* Add more user details here */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 