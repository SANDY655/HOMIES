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
import { Pencil, Check, X } from "lucide-react";

export const Profile = () => {
  const [user, setUser] = useState<{
    email: string;
    userId: string;
    username: string;
  } | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isUnique, setIsUnique] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("email");
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");

    if (email && userId && username) {
      setUser({ email, userId, username });
      setNewUsername(username);
    }
  }, []);

  const handleUsernameCheck = async (name: string) => {
    if (!name || name === user?.username) {
      setIsUnique(false);
      return;
    }

    setIsChecking(true);
    try {
      const res = await fetch(`http://localhost:5000/api/user/check-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });
      const data = await res.json();

      setIsUnique(data.available);
      if (!data.available) {
        toast.error("Username already taken");
      }
    } catch (err) {
      toast.error("Error checking username");
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameSave = async () => {
    if (!newUsername || newUsername === user?.username || !isUnique) return;

    try {
      const cleanEmail = user?.email.replace(/^"|"$/g, "");
      const response = await fetch(
        "http://localhost:5000/api/user/update-username",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, newUsername }),
        }
      );
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Failed to update username");

      setUser((prev) => (prev ? { ...prev, username: newUsername } : prev));
      localStorage.setItem("username", newUsername);
      toast.success("Username updated successfully");
      setEditMode(false);
    } catch (err: any) {
      toast.error(err.message || "Error updating username");
    }
  };

  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) return toast.error("Enter current password");

    setIsVerifying(true);
    try {
      const cleanEmail = user?.email.replace(/^"|"$/g, "");
      const response = await fetch(
        "http://localhost:5000/api/user/verify-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, currentPassword }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Verification failed");

      toast.success("Password verified");
      setIsVerified(true);
    } catch (error: any) {
      toast.error(error.message || "Incorrect password");
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !retypePassword) {
      return toast.error("Fill all fields");
    }
    if (!isVerified) return toast.error("Verify current password first");
    if (newPassword !== retypePassword)
      return toast.error("Passwords do not match");

    setIsChanging(true);
    try {
      const cleanEmail = user?.email.replace(/^"|"$/g, "");
      const response = await fetch(
        "http://localhost:5000/api/user/change-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, newPassword }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to change password");

      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setRetypePassword("");
      setIsVerified(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Card className="shadow-lg rounded-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-gray-900">
            User Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          <div>
            <Label>Username</Label>
            <div className="flex items-center gap-2">
              <Input
                value={editMode ? newUsername : user?.username || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewUsername(value);
                  handleUsernameCheck(value);
                }}
                disabled={!editMode}
              />
              {editMode ? (
                <>
                  <button
                    onClick={handleUsernameSave}
                    disabled={
                      !newUsername ||
                      newUsername === user?.username ||
                      !isUnique ||
                      isChecking
                    }
                    className="text-green-600"
                  >
                    <Check />
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setNewUsername(user?.username || "");
                    }}
                    className="text-red-600"
                  >
                    <X />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-blue-600"
                >
                  <Pencil />
                </button>
              )}
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div>
            <Label>User ID</Label>
            <Input value={user?.userId || ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Separator className="my-10" />

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password securely</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <div className="flex-grow">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setIsVerified(false);
                }}
                disabled={isVerified}
              />
            </div>
            <Button
              onClick={handleVerifyCurrentPassword}
              disabled={isVerifying || !currentPassword || isVerified}
              className="mt-4 md:mt-6"
            >
              {isVerifying
                ? "Verifying..."
                : isVerified
                ? "Verified"
                : "Verify"}
            </Button>
          </div>

          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={!isVerified}
            />
          </div>

          <div>
            <Label>Retype New Password</Label>
            <Input
              type="password"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              disabled={!isVerified}
            />
          </div>

          <Button
            className="w-full"
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
