"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, LogOut, Mail } from "lucide-react";

export function VerificationPending() {
  const [isNotificationSent, setIsNotificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: implement this
  const handleNotifyAdmin = async () => {
    setIsLoading(true);

    try {
      // Simulate API call to notify admin
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsNotificationSent(true);
    } catch (error) {
      console.error("Failed to notify admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">
            Account Pending Verification
          </CardTitle>
          <CardDescription>
            Your account has been created successfully, but it needs to be
            verified by an administrator before you can access the full
            application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isNotificationSent ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Admin has been notified! You should hear back within 24 hours.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center">
                Need faster verification? Let our admin team know you&apos;re
                waiting.
              </p>
              <div className="flex items-center justify-center space-x-5">
                <Button
                  onClick={handleNotifyAdmin}
                  disabled={isLoading}
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? "Sending..." : "Notify Admin"}
                </Button>
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
