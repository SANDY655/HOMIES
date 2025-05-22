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

export function MyRooms() {
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    <div className="min-h-screen bg-gray-50 py-10 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-10">
          My Posted Rooms
        </h1>

        {isLoading ? (
          <p className="text-gray-500 text-center">Loading your rooms...</p>
        ) : isError ? (
          <p className="text-red-500 text-center">
            Failed to load rooms. Please try again.
          </p>
        ) : rooms?.length === 0 ? (
          <p className="text-gray-600 text-center">
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
                <Card className="bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
                      {room.title}
                    </CardTitle>
                    <p className="text-gray-600 mb-4">{room.description}</p>
                    <p className="text-gray-600 mb-1">
                      <strong>Location:</strong> {room.location}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Rent:</strong> ₹{room.rent?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Deposit:</strong> ₹{room.deposit?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Available From:</strong>{" "}
                      {new Date(room.availableFrom).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Room Type:</strong> {room.roomType}
                    </p>

                    <div className="mt-2 mb-2">
                      <p className="font-semibold text-gray-700 mb-1">
                        Amenities:
                      </p>
                      <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                        {Object.entries(room.amenities).map(([key, value]) =>
                          value ? (
                            <li key={key} className="capitalize">
                              {key}
                            </li>
                          ) : null
                        )}
                      </ul>
                    </div>

                    {room.images?.length > 1 && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {room.images.slice(1).map((img, idx) => (
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
                        onClick={() => navigate({ to: `/edit-room/${room._id}` })}
                      >
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure you want to delete this room?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(room._id)}
                              disabled={deleteMutation.isLoading}
                            >
                              {deleteMutation.isLoading ? "Deleting..." : "Confirm Delete"}
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
