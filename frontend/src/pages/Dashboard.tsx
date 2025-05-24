import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Home, DoorOpen, Settings, LogOut } from "lucide-react";
import { useState } from "react";
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
        className="bg-white rounded-xl p-6 w-[90%] max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-3">Confirm Logout</h3>
        <p className="mb-5 text-gray-600">Are you sure you want to log out?</p>
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

export function Dashboard() {
  const [email] = useState(JSON.parse(localStorage.getItem("email") || "{}"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

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
    } catch (err) {
      console.warn("Logout API failed. Proceeding with local logout.");
    }

    if (socket.connected) {
      socket.disconnect();
    }

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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-4">
            <Button
      variant="ghost"
      className="gap-2 text-sm text-gray-700"
      onClick={() => navigate({ to: "/chatwithsidebar" })}
      aria-label="Open Chat"
      title="Open Chat"
    >
      <MessageSquare size={18} />
      Chat
    </Button>
          <Avatar
            src={email?.avatar || "/img2.png"}
            alt="User Avatar"
            title={email?.email || ""}
            className="w-10 h-10 border"
          />
          <Button variant="ghost" className="gap-2 text-sm text-gray-700">
            <Settings size={18} /> Settings
          </Button>
          <Button
            variant="destructive"
            className="gap-2 text-sm"
            onClick={onLogoutClick}
          >
            <LogOut size={18} /> Logout
          </Button>
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
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 mt-1">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          size="lg"
          className={`w-full mt-4 rounded-xl text-white font-medium ${color}`}
          onClick={onClick}
        >
          {title}
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
