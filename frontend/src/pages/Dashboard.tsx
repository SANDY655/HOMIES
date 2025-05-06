import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Avatar } from "@/components/ui/avatar";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
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
        navigate({ to: "/" }); // Redirect to login
      } else {
        alert(result.message || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <Heading
            as="h1"
            size="xl"
            className="text-3xl font-bold text-primary"
          >
            Welcome to Your Dashboard
          </Heading>
          <p className="text-muted-foreground text-lg">
            Hello, {user?.name || "User"}! Here's your account overview.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="flex flex-col items-center p-8">
              <Avatar
                src={user?.avatar || "/default-avatar.jpg"}
                alt="User Avatar"
                className="w-24 h-24 mb-4"
              />
              <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-lg">
            <CardContent className="flex flex-col p-8">
              <h3 className="text-2xl font-semibold">Quick Actions</h3>
              <div className="space-y-4 mt-4">
                <Button size="lg" className="w-full">
                  View Profile
                </Button>
                <Button variant="secondary" size="lg" className="w-full">
                  Settings
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-6">
              <Heading as="h2" size="lg" className="font-semibold text-primary">
                Dashboard Overview
              </Heading>
              <p className="mt-4 text-muted-foreground">
                Here you can track your progress, view recent activity, and
                more.
              </p>
            </CardContent>
          </Card>
        </div>
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
