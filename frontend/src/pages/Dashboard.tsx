import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";

export function Dashboard() {
  const [email] = useState(JSON.parse(localStorage.getItem("email") || "{}"));
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/user/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        navigate({ to: "/" });
      } else {
        alert(result.message || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Something went wrong!");
    }
  };

  const handleRoomPosting = () => {
    navigate({ to: "/post-room" });
  };

  const handleFindRoommates = () => {
    navigate({ to: "/find-roommates" });
  };

  const handleSearchRooms = () => {
    navigate({ to: "/search-rooms" });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <Heading as="h1" size="2xl" className="font-bold text-gray-900">
            Welcome to Your Dashboard
          </Heading>
          <p className="text-gray-500 text-base">
            Hello, {email || "User"}! Here's your account overview.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Card */}
          <Card className="rounded-lg bg-white shadow-md">
            <CardHeader className="flex flex-col items-center py-6">
              <Avatar
                src={email?.avatar || "/img2.png"}
                alt="User Avatar"
                className="w-24 h-24 mb-4 border-2 border-gray-300"
              />
              <CardTitle className="text-lg text-gray-800">
                {email || "User"}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {email}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Quick Actions Card */}
          <Card className="rounded-lg bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Manage your account quickly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button size="lg" className="w-full">
                View Profile
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full text-gray-800 hover:bg-gray-200"
              >
                Settings
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="w-full bg-red-600 text-white hover:bg-red-700"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Room Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Post Room Card */}
          <Card className="rounded-lg bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">
                Post a Room
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Post a room available for rent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleRoomPosting}
              >
                Post Room
              </Button>
            </CardContent>
          </Card>

          {/* Search Rooms Card */}
          <Card className="rounded-lg bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">
                Search Rooms
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Search available rooms for rent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
                onClick={handleSearchRooms}
              >
                Search Rooms
              </Button>
            </CardContent>
          </Card>

          {/* Find Roommates Card */}
          <Card className="rounded-lg bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">
                Find Roommates
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Search for potential roommates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full bg-green-600 text-white hover:bg-green-700"
                onClick={handleFindRoommates}
              >
                Find Roommates
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Overview Section */}
        <Card className="rounded-lg bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">
              Dashboard Overview
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Track your progress, view recent activity, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mt-2">
              This section can include metrics, recent activity, or other useful
              insights.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
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
