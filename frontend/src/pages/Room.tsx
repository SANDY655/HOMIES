import { createRoute, redirect, RootRoute } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface Room {
  _id: string;
  title: string;
  description: string;
  location: string;
  rent: number;
  deposit: number;
  availableFrom: string;
  roomType: "single" | "shared" | "apartment";
  images: string[];
  amenities: {
    wifi: boolean;
    ac: boolean;
    parking: boolean;
    furnished: boolean;
    washingMachine: boolean;
  };
  email: string;
}

export function Room() {
  const { roomId } = useParams({ strict: false }) as { roomId: string };
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/room/${roomId}`);
        const data = await res.json();
        if (data.success) {
          setRoom(data.data);
        }
      } catch (error) {
        console.error("Error fetching room:", error);
      }
    };

    fetchRoom();
  }, [roomId]);

  if (!room) {
    return (
      <div className="p-8 text-center text-lg">Loading room details...</div>
    );
  }

  return (
    <div className="w-full min-h-screen px-6 py-10 md:px-12 lg:px-24 bg-gray-50">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {" "}
          {/* Increased gap */}
          {/* Image Section */}
          <div className="h-full">
            <img
              src={room.images[0] || "https://via.placeholder.com/800x600"}
              alt={room.title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Details Section */}
          <div className="p-8 flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
                {/* Increased margin */}
                {room.title}
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                {/* Increased margin */}
                {room.location}
              </p>

              <div className="text-2xl text-blue-700 font-bold mb-2">
                {/* Increased margin */}₹{room.rent.toLocaleString("en-IN")}{" "}
                <span className="text-base font-normal">/ month</span>
              </div>
              <p className="text-gray-600 text-sm mb-8">
                {/* Increased margin */}
                Deposit: ₹{room.deposit.toLocaleString("en-IN")}
              </p>

              <p className="text-gray-700 mb-8">
                {/* Increased margin */}
                {room.description}
              </p>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Available From:</span>{" "}
                  {new Date(room.availableFrom).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Room Type:</span>{" "}
                  <span className="capitalize">{room.roomType}</span>
                </p>
                <p>
                  <span className="font-medium">Amenities:</span>{" "}
                  {Object.entries(room.amenities)
                    .filter(([_, val]) => val)
                    .map(([key]) => key)
                    .join(", ") || "None"}
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t text-sm text-gray-600">
              {" "}
              {/* Increased margin and padding */}
              <p className="mb-2">
                {/* Increased margin */}
                <span className="font-medium">Posted by:</span> {room.email}
              </p>
              <a
                href={`mailto:${room.email}`}
                className="text-blue-600 hover:underline"
              >
                Contact via Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/rooms/$roomId",
    component: Room,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
