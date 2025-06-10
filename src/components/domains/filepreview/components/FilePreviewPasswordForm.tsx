import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

interface FilePreviewPasswordFormProps {
  password: string;
  passwordLoading: boolean;
  onPasswordChange: (password: string) => void;
  onPasswordSubmit: (e: React.FormEvent) => Promise<void>;
}

export function FilePreviewPasswordForm({ 
  password, 
  passwordLoading, 
  onPasswordChange, 
  onPasswordSubmit 
}: FilePreviewPasswordFormProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-6 w-6 text-amber-600" />
            <CardTitle>Password Required</CardTitle>
          </div>
          <CardDescription>
            This file is password protected. Please enter the password to view
            and download.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              disabled={passwordLoading}
              autoFocus
            />
            <Button
              type="submit"
              className="w-full"
              disabled={passwordLoading || !password.trim()}
            >
              {passwordLoading ? "Verifying..." : "Access File"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
