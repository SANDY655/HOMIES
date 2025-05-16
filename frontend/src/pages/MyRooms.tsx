import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export function MyRooms() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

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
                  <CardHeader className="p-0">
                    <img
                      src={
                        room.images?.[0] ||
                        "https://via.placeholder.com/600x400"
                      }
                      alt={room.title}
                      className="w-full h-48 object-cover rounded-t-2xl"
                    />
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
                      {room.title}
                    </CardTitle>
                    <p className="text-gray-600 mb-1">
                      <strong>Location:</strong> {room.location}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Rent:</strong> ₹
                      {room.rent?.toLocaleString("en-IN") || "N/A"} / month
                    </p>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {room.description}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate({ to: `/chat/${room._id}` })}
                    >
                      View Chats
                    </Button>
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
