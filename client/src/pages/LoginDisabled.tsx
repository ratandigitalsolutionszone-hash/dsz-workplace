import { AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginDisabled() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-slate-800 border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="bg-red-500/20 p-4 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-white">
          Authentication Disabled
        </h1>

        <p className="text-center text-slate-300 mb-6">
          OAuth authentication is not configured for this environment.
        </p>

        <div className="bg-slate-900 rounded-lg p-4 mb-6 border border-slate-700">
          <h2 className="flex items-center gap-2 font-semibold text-slate-200 mb-3">
            <Settings className="w-4 h-4" />
            Configuration Required
          </h2>

          <p className="text-sm text-slate-400 mb-4">
            To enable authentication, set the following environment variables:
          </p>

          <div className="space-y-2 font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800">
            <div>
              <span className="text-blue-400">VITE_APP_ID</span>
              <span className="text-slate-500">=your_app_id</span>
            </div>
            <div>
              <span className="text-blue-400">VITE_OAUTH_PORTAL_URL</span>
              <span className="text-slate-500">=https://app.manus.im</span>
            </div>
            <div>
              <span className="text-blue-400">OAUTH_SERVER_URL</span>
              <span className="text-slate-500">=https://api.manus.im</span>
            </div>
            <div>
              <span className="text-blue-400">JWT_SECRET</span>
              <span className="text-slate-500">=your-secret-key</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-300">
            <strong>For Local Development:</strong> Create a <code className="bg-slate-900 px-2 py-1 rounded text-xs">.env.local</code> file with the required variables. See <code className="bg-slate-900 px-2 py-1 rounded text-xs">.env.example</code> for reference.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
          <p className="text-xs text-center text-slate-400">
            After configuring environment variables, restart your development server and try again.
          </p>
        </div>
      </Card>
    </div>
  );
}
