import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/schema";

export function ReferralCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: userData } = useQuery<User>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user,
  });

  const generateReferralCode = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/referral-code`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to generate referral code");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      toast({
        title: "Referral Code Generated",
        description: "Your referral code is ready to be shared!",
      });
    },
  });

  const copyReferralLink = async () => {
    if (!userData?.referralCode) return;
    
    const referralLink = `${window.location.origin}/signup?ref=${userData.referralCode}`;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Refer Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your referral code with friends. When they sign up, you'll both receive bonus credits!
        </p>
        {userData?.referralCode ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-sm">
                {userData.referralCode}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyReferralLink}
                className="h-8"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => generateReferralCode.mutate()}
            disabled={generateReferralCode.isPending}
          >
            Generate Referral Code
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
