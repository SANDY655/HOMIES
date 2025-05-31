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
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you have a Skeleton component

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

// Skeleton loader component
const RoomCardSkeleton = () => (
  <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-md dark:shadow-lg rounded-2xl overflow-hidden">
    <CardContent className="p-6">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-4" />
      <Skeleton className="h-4 w-1/2 mb-1" />
      <Skeleton className="h-4 w-1/3 mb-1" />
      <Skeleton className="h-4 w-2/5 mb-1" />
      <Skeleton className="h-4 w-1/2 mb-1" />
      <Skeleton className="h-4 w-1/4 mb-1" />
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-16 w-full mb-4" />
      <div className="flex gap-3 mt-6">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
  </Card>
);

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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white mb-4 sm:mb-0 text-center sm:text-left">
            My Posted Rooms
          </h1>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-zinc-900 dark:focus:ring-gray-400"
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
              className="flex items-center space-x-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              <DashboardIcon />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
          </div>
        ) : isError ? (
          <p className="text-red-500 text-center text-lg">
            Failed to load rooms. Please try again.
          </p>
        ) : rooms?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60">
            <p className="text-gray-600 dark:text-gray-400 text-center text-xl mb-4">
              You haven't posted any rooms yet.
            </p>
            <Button
              onClick={() => navigate({ to: "/post-room" })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Post Your First Room
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room: any) => (
              <motion.div
                key={room._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col h-full" // Ensure cards take full height
              >
                <Card className="flex flex-col h-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-md dark:shadow-lg rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="flex flex-col flex-grow p-6">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-2 truncate">
                      {room.title}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                      {room.description}
                    </p>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 flex-grow">
                      <p>
                        <strong>Location:</strong> {room.location}
                      </p>
                      <p>
                        <strong>Rent:</strong> ₹
                        {room.rent?.toLocaleString("en-IN")}
                      </p>
                      <p>
                        <strong>Deposit:</strong> ₹
                        {room.deposit?.toLocaleString("en-IN")}
                      </p>
                      <p>
                        <strong>Available From:</strong>{" "}
                        {new Date(room.availableFrom).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Room Type:</strong> {room.roomType}
                      </p>
                    </div>

                    {Object.values(room.amenities).some((val) => val) && (
                      <div className="mt-4">
                        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1 text-sm">
                          Amenities:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-xs space-y-1 grid grid-cols-2 gap-1">
                          {Object.entries(room.amenities).map(([key, value]) =>
                            value ? (
                              <li key={key} className="capitalize truncate">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </li>
                            ) : null
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Display all images */}
                    {room.images?.length > 0 && (
                      <div className="mt-4">
                        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2 text-sm">
                          Images:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {room.images.map((img: string, idx: number) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Room image ${idx + 1}`}
                              className="h-20 w-full object-cover rounded-md"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate({ to: `/edit-room/${room._id}` })
                        }
                        className="w-full sm:flex-1 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full sm:flex-1"
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="dark:bg-zinc-800 dark:text-white rounded-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-semibold dark:text-white">
                              Are you sure you want to delete this room?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(room._id)}
                              disabled={deleteMutation.isLoading}
                              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
