import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";

export const Profile = () => {
  const [user, setUser] = useState<{
    email: string;
    userId: string;
    username: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  // New states
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("email");
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");

    if (email && userId && username) {
      setUser({ email, userId, username });
    }
  }, []);

  // Verify current password
  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password to verify");
      return;
    }

    setIsVerifying(true);
    try {
      // Clean email to remove surrounding quotes if any
      const cleanEmail = user?.email.replace(/^"|"$/g, "");
      const response = await fetch(
        "http://localhost:5000/api/user/verify-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: cleanEmail, currentPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      toast.success(
        "Current password verified! You can now change your password."
      );
      setIsVerified(true);
    } catch (error: any) {
      toast.error(error.message || "Incorrect current password");
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !retypePassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isVerified) {
      toast.error("Please verify your current password first.");
      return;
    }

    if (newPassword !== retypePassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChanging(true);

    try {
      const cleanEmail = user?.email.replace(/^"|"$/g, "");

      const response = await fetch(
        "http://localhost:5000/api/user/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setRetypePassword("");
      setIsVerified(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Card className="shadow-lg rounded-lg border border-gray-200">
        <CardHeader className="border-b border-gray-300">
          <CardTitle className="text-3xl font-semibold text-gray-900">
            User Profile
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          <div>
            <Label className="text-gray-700 font-medium mb-1 block">
              Username
            </Label>
            <Input
              value={user?.username || ""}
              disabled
              className="bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="text-gray-700 font-medium mb-1 block">
              Email
            </Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="text-gray-700 font-medium mb-1 block">
              User ID
            </Label>
            <Input
              value={user?.userId || ""}
              disabled
              className="bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>
        </CardContent>
      </Card>

      <Separator className="my-10" />

      <Card className="shadow-lg rounded-lg border border-gray-200">
        <CardHeader className="border-b border-gray-300">
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Change Password
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Update your password securely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <div className="flex-grow">
              <Label
                htmlFor="current"
                className="text-gray-700 font-medium mb-1 block"
              >
                Current Password
              </Label>
              <Input
                id="current"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setIsVerified(false); // reset verify status on change
                }}
                className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isVerified} // Disable if verified
              />
            </div>
            <Button
              onClick={handleVerifyCurrentPassword}
              disabled={isVerifying || !currentPassword || isVerified} // Disable verify button if verified
              className="mt-6 h-10"
            >
              {isVerifying
                ? "Verifying..."
                : isVerified
                ? "Verified"
                : "Verify"}
            </Button>
          </div>

          <div>
            <Label
              htmlFor="new"
              className="text-gray-700 font-medium mb-1 block"
            >
              New Password
            </Label>
            <Input
              id="new"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!isVerified}
            />
          </div>

          <div>
            <Label
              htmlFor="retype"
              className="text-gray-700 font-medium mb-1 block"
            >
              Retype New Password
            </Label>
            <Input
              id="retype"
              type="password"
              placeholder="Retype new password"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!isVerified}
            />
          </div>

          <Button
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleChangePassword}
            disabled={isChanging}
          >
            {isChanging ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
};

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/profile/$userId",
    component: Profile,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
