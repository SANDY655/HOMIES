import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageSquare,
  User,
  Home,
  DoorOpen,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import socket from "../socket";
import { createRoute, redirect, useNavigate } from "@tanstack/react-router";
import type { RootRoute } from "@tanstack/react-router";

function ConfirmLogout({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-6 w-[90%] max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
          Confirm Logout
        </h3>
        <p className="mb-5 text-gray-600 dark:text-gray-300">
          Are you sure you want to log out?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

function useOutsideClick(
  ref: React.RefObject<HTMLDivElement>,
  callback: () => void
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export function Dashboard() {
  const [email] = useState(JSON.parse(localStorage.getItem("email") || "{}"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false));

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.classList.toggle(
        "dark",
        initialTheme === "dark"
      );
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("http://localhost:5000/api/user/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      console.warn("Logout API failed. Proceeding with local logout.");
    }

    if (socket.connected) socket.disconnect();

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");

    queryClient.clear();
    navigate({ to: "/" });
  };

  const onLogoutClick = () => setLogoutModalOpen(true);
  const onCancelLogout = () => setLogoutModalOpen(false);
  const onConfirmLogout = () => {
    setLogoutModalOpen(false);
    handleLogout();
  };

  const handleRoomPosting = () => navigate({ to: "/post-room" });
  const handleSearchRooms = () => navigate({ to: "/search-rooms" });
  const handleMyRooms = () => navigate({ to: "/my-rooms" });

   const goToProfile = () => {
  setProfileMenuOpen(false);
  const userId = localStorage.getItem("userId");
  if (userId) {
    navigate({ to: `/profile/${userId}` });
  }
};

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-900 shadow px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="gap-1 p-5 m-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800"
            onClick={() => navigate({ to: "/chatwithsidebar" })}
          >
            <MessageSquare size={20} />
            Chat
          </Button>

          {/* Profile Icon & Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen((open) => !open)}
              title={email || "User"}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-haspopup="true"
              aria-expanded={profileMenuOpen}
              aria-label="User menu"
            >
              <User size={20} />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                <button
                  onClick={goToProfile}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User size={18} />
                  Profile
                </button>

                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </button>

                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onLogoutClick();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ConfirmLogout
        isOpen={logoutModalOpen}
        onConfirm={onConfirmLogout}
        onCancel={onCancelLogout}
      />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Post a Room"
            description="Let others know about available rooms."
            icon={<Home size={20} />}
            onClick={handleRoomPosting}
            color="bg-blue-600 hover:bg-blue-700"
          />

          <DashboardCard
            title="Search Rooms"
            description="Explore rooms available for rent."
            icon={<Home size={20} />}
            onClick={handleSearchRooms}
            color="bg-yellow-500 hover:bg-yellow-600"
          />

          <DashboardCard
            title="My Rooms"
            description="Manage your posted rooms."
            icon={<DoorOpen size={20} />}
            onClick={handleMyRooms}
            color="bg-purple-600 hover:bg-purple-700"
          />
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  onClick,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}) {
  return (
    <Card className="rounded-2xl shadow-md border hover:shadow-lg transition">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          size="lg"
          className={`w-full mt-4 rounded-xl text-white font-medium ${color}`}
          onClick={onClick}
        >
          Go
        </Button>
      </CardContent>
    </Card>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/dashboard",
    component: Dashboard,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
