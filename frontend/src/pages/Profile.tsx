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
import {
  Pencil,
  Check,
  X,
  ArrowLeft,
  SunIcon, // Import SunIcon for light mode
  MoonIcon, // Import MoonIcon for dark mode
} from "lucide-react";
import { Link } from "@tanstack/react-router"; // assuming react-router-like usage for Link

// Function to apply or remove dark class on body based on theme
const applyTheme = (theme: "light" | "dark") => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

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

  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  // Apply theme on initial load and when theme changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle between light and dark theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

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
    <div className="max-w-4xl mx-auto px-6 py-12 dark:bg-gray-900 dark:text-gray-100">
      {/* Theme Toggle Icon */}
      <div className="flex justify-between items-center mb-6">
        <nav className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-600"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </nav>
        <div className="flex justify-end mb-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <MoonIcon size={20} /> : <SunIcon size={20} />}
          </button>
        </div>
      </div>
      {/* Back to Dashboard Navigation */}

      {/* User Profile Card */}
      <Card className="shadow-lg rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            User Profile
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          <div>
            <Label className="dark:text-gray-300">Username</Label>
            <div className="flex items-center gap-2">
              <Input
                value={editMode ? newUsername : user?.username || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewUsername(value);
                  handleUsernameCheck(value);
                }}
                disabled={!editMode}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
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
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Save username"
                  >
                    <Check />
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setNewUsername(user?.username || "");
                      setIsUnique(false); // Reset unique check on cancel
                      setIsChecking(false);
                    }}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
                    aria-label="Cancel username edit"
                  >
                    <X />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"
                  aria-label="Edit username"
                >
                  <Pencil />
                </button>
              )}
            </div>
            {editMode && newUsername && newUsername !== user?.username && (
              <p
                className={`text-sm mt-1 ${
                  isUnique ? "text-green-600" : "text-red-600"
                } dark:text-green-400 dark:text-red-400`}
              >
                {isChecking ? "Checking..." : isUnique ? "Available" : "Taken"}
              </p>
            )}
          </div>
          <div>
            <Label className="dark:text-gray-300">Email</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
            />
          </div>
          {/* Empty div for layout spacing on larger screens */}
          <div className="hidden md:block"></div>
        </CardContent>
      </Card>

      <Separator className="my-10 dark:bg-gray-700" />

      {/* Change Password Card */}
      <Card className="shadow-lg rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Change Password
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Update your password securely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <div className="flex-grow">
              <Label className="dark:text-gray-300">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setIsVerified(false);
                }}
                disabled={isVerified || isVerifying || isChanging}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>
            <Button
              onClick={handleVerifyCurrentPassword}
              disabled={isVerifying || !currentPassword || isVerified}
              className="mt-4 md:mt-6 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying
                ? "Verifying..."
                : isVerified
                ? "Verified"
                : "Verify"}
            </Button>
          </div>

          <div>
            <Label className="dark:text-gray-300">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={!isVerified || isChanging}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <Label className="dark:text-gray-300">Retype New Password</Label>
            <Input
              type="password"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              disabled={!isVerified || isChanging}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
            />
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleChangePassword}
            disabled={
              isChanging ||
              !isVerified ||
              !newPassword ||
              !retypePassword ||
              newPassword !== retypePassword
            }
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
