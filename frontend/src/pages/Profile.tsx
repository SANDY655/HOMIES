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
import { motion } from "framer-motion"; // Import motion for animations

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
      const res = await fetch(
        `https://homies-oqpt.onrender.com/api/user/check-username`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: name }),
        }
      );
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
        "https://homies-oqpt.onrender.com/api/user/update-username",
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
        "https://homies-oqpt.onrender.com/api/user/verify-password",
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
        "https://homies-oqpt.onrender.com/api/user/change-password",
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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-900 py-6 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          {/* Back to Dashboard Navigation */}
          <Link
            to="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-600 transition-colors text-sm sm:text-base"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="mr-1 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Back</span>
            <span className="inline sm:hidden">Dashboard</span>
          </Link>

          {/* Theme Toggle Icon */}
          <button
            onClick={toggleTheme}
            className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-zinc-900 dark:focus:ring-gray-400"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <MoonIcon size={16} className="sm:size-5" />
            ) : (
              <SunIcon size={16} className="sm:size-5" />
            )}
          </button>
        </div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-shrink-0 mb-6"
        >
          <Card className="shadow-lg rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                User Profile
              </CardTitle>
              <CardDescription className="text-sm dark:text-gray-400">
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label
                  htmlFor="username"
                  className="text-sm dark:text-gray-300"
                >
                  Username
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="username"
                    value={editMode ? newUsername : user?.username || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewUsername(value);
                      handleUsernameCheck(value);
                    }}
                    disabled={!editMode}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 text-sm"
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
                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-green-600 dark:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Save username"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setNewUsername(user?.username || "");
                          setIsUnique(false); // Reset unique check on cancel
                          setIsChecking(false);
                        }}
                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 transition-colors"
                        aria-label="Cancel username edit"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 transition-colors"
                      aria-label="Edit username"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                </div>
                {editMode && newUsername && newUsername !== user?.username && (
                  <p
                    className={`text-xs mt-1 ${
                      isUnique
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isChecking
                      ? "Checking..."
                      : isUnique
                      ? "Available"
                      : "Taken"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="text-sm dark:text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Separator className="my-6 dark:bg-gray-700 flex-shrink-0" />

        {/* Change Password Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-grow" // Allow this card to grow
        >
          <Card className="shadow-lg rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Change Password
              </CardTitle>
              <CardDescription className="text-sm dark:text-gray-400">
                Update your password securely
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-0 flex-grow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
                  <div className="flex-grow">
                    <Label
                      htmlFor="current-password"
                      className="text-sm dark:text-gray-300"
                    >
                      Current Password
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setIsVerified(false);
                      }}
                      disabled={isVerified || isVerifying || isChanging}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div className="mt-2 md:mt-0">
                    <Button
                      onClick={handleVerifyCurrentPassword}
                      disabled={isVerifying || !currentPassword || isVerified}
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm py-2 px-3 h-auto"
                    >
                      {isVerifying
                        ? "Verifying..."
                        : isVerified
                        ? "Verified"
                        : "Verify"}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="new-password"
                    className="text-sm dark:text-gray-300"
                  >
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={!isVerified || isChanging}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 text-sm"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="retype-password"
                    className="text-sm dark:text-gray-300"
                  >
                    Retype New Password
                  </Label>
                  <Input
                    id="retype-password"
                    type="password"
                    value={retypePassword}
                    onChange={(e) => setRetypePassword(e.target.value)}
                    disabled={!isVerified || isChanging}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 text-sm"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm py-2 px-4"
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
        </motion.div>
      </div>

      <Toaster richColors position="top-right" closeButton />
    </div>
  );
};

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/profile/$userId",
    component: Profile,
    getParentRoute: () => parentRoute,
    beforeLoad: (ctx) => {
      // Access auth and location from ctx as provided by TanStack Router
      const auth = (ctx as any).context?.auth;
      const location = (ctx as any).location;
      if (!auth?.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location?.href } });
      }
    },
  });
