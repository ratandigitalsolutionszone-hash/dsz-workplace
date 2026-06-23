import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

export function GmailConnector() {
  const [isLoading, setIsLoading] = useState(false);
  const gmailStatus = trpc.gmail.getStatus.useQuery();
  const disconnectMutation = trpc.gmail.disconnect.useMutation();
  const getAuthUrlQuery = trpc.gmail.getAuthUrl.useQuery(undefined, {
    enabled: false,
  });

  const handleConnectGmail = async () => {
    setIsLoading(true);
    try {
      const result = await getAuthUrlQuery.refetch();
      if (result.data?.authUrl) {
        window.location.href = result.data.authUrl;
      } else {
        toast.error("Failed to get Gmail authorization URL");
      }
    } catch (error) {
      toast.error("Failed to initiate Gmail connection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      toast.success("Gmail account disconnected");
      gmailStatus.refetch();
    } catch (error) {
      toast.error("Failed to disconnect Gmail account");
    }
  };

  if (gmailStatus.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Gmail Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="w-5 h-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = gmailStatus.data?.connected;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Gmail Integration
        </CardTitle>
        <CardDescription>
          Connect your Gmail account to send task reports directly from DSZ Workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Gmail Connected</p>
                <p className="text-sm text-green-700">{gmailStatus.data?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="w-full"
            >
              {disconnectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect Gmail"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your Gmail account is not connected. Connect it to enable sending task reports via email.
            </p>
            <Button
              onClick={handleConnectGmail}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Connect Gmail Account
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
