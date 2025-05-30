import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "@tanstack/react-router";
import { SunIcon, MoonIcon } from "lucide-react"; // Import icons

// Function to apply or remove dark class on body based on theme
const applyTheme = (theme: "light" | "dark") => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

function DashboardIcon() {
  // Simple home/dashboard SVG icon
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 inline-block mr-2"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-9 6h3m-6 0h.01M4 12v7a1 1 0 001 1h3m10-8v8a1 1 0 01-1 1h-3m-4 0h4"
      />
    </svg>
  );
}

export function MyRooms() {
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const {
    data: rooms,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["myRooms", userId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/room/user/${userId}`);
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch rooms");
      return data.rooms;
    },
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`http://localhost:5000/api/room/${roomId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Delete failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRooms", userId] });
    },
    onError: (error: any) => {
      alert(`Delete failed: ${error.message}`);
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-10 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">
            My Posted Rooms
          </h1>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <MoonIcon size={20} />
              ) : (
                <SunIcon size={20} />
              )}
            </button>

            <Button
              variant="outline"
              className="flex items-center space-x-1"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              <DashboardIcon />
              <span>Dashboard</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-300 text-center">
            Loading your rooms...
          </p>
        ) : isError ? (
          <p className="text-red-500 text-center">
            Failed to load rooms. Please try again.
          </p>
        ) : rooms?.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center">
            You haven't posted any rooms yet.
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {rooms.map((room) => (
              <motion.div
                key={room._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-md dark:shadow-lg rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      {room.title}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {room.description}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-1">
                      <strong>Location:</strong> {room.location}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-1">
                      <strong>Rent:</strong> ₹
                      {room.rent?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-1">
                      <strong>Deposit:</strong> ₹
                      {room.deposit?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-1">
                      <strong>Available From:</strong>{" "}
                      {new Date(room.availableFrom).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-1">
                      <strong>Room Type:</strong> {room.roomType}
                    </p>

                    <div className="mt-2 mb-2">
                      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                        Amenities:
                      </p>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-sm space-y-1">
                        {Object.entries(room.amenities).map(([key, value]) =>
                          value ? (
                            <li key={key} className="capitalize">
                              {key}
                            </li>
                          ) : null
                        )}
                      </ul>
                    </div>

                    {room.images?.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {room.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Room image ${idx + 2}`}
                            className="h-24 w-full object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate({ to: `/edit-room/${room._id}` })
                        }
                        className="dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="dark:bg-zinc-800 dark:text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="dark:text-white">
                              Are you sure you want to delete this room?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="dark:text-gray-400">
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(room._id)}
                              disabled={deleteMutation.isLoading}
                              className="dark:bg-red-600 dark:hover:bg-red-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleteMutation.isLoading
                                ? "Deleting..."
                                : "Confirm Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/my-rooms",
    getParentRoute: () => parentRoute,
    component: MyRooms,
    beforeLoad: () => {
      const isLoggedIn = !!localStorage.getItem("email");
      if (!isLoggedIn) {
        throw redirect({ to: "/login" });
      }
    },
  });
