import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

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
  const navigate = useNavigate();

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
      <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-600">
        Loading room details...
      </div>
    );
  }

  const prettyAmenity = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 via-white to-indigo-50 px-6 py-12 md:px-20 lg:px-36">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14">
        {/* Image Carousel Section */}
        <div className="h-96 lg:h-auto rounded-l-3xl overflow-hidden shadow-inner border-r border-gray-100">
          {room.images.length > 0 ? (
            <Carousel
              showThumbs={true}
              showStatus={false}
              infiniteLoop
              useKeyboardArrows
              autoPlay={false}
              dynamicHeight={false}
              emulateTouch
              className="rounded-l-3xl"
              thumbWidth={80}
              thumbHeight={56}
              swipeScrollTolerance={5}
            >
              {room.images.map((url, index) => (
                <div key={index} className="h-96 lg:h-auto">
                  <img
                    src={url}
                    alt={`Room image ${index + 1}`}
                    className="object-cover w-full h-96 lg:h-auto"
                    loading="lazy"
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <img
              src="https://via.placeholder.com/800x600"
              alt="Placeholder"
              className="w-full h-96 object-cover rounded-l-3xl"
            />
          )}
        </div>

        {/* Details Section */}
        <div className="p-12 flex flex-col justify-between">
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-5 tracking-tight drop-shadow-sm">
              {room.title}
            </h1>
            <p className="text-indigo-600 text-lg font-semibold mb-6 tracking-wide">
              {room.location}
            </p>

            <div className="flex items-baseline space-x-3 mb-5">
              <span className="text-4xl font-extrabold text-indigo-700 drop-shadow">
                ₹{room.rent.toLocaleString("en-IN")}
              </span>
              <span className="text-lg font-semibold text-gray-600">
                / month
              </span>
            </div>
            <p className="text-gray-600 font-medium mb-12">
              Deposit: ₹{room.deposit.toLocaleString("en-IN")}
            </p>

            <p className="text-gray-800 leading-relaxed mb-14 whitespace-pre-line">
              {room.description}
            </p>

            <div className="space-y-4 text-gray-700 text-sm">
              <p>
                <span className="font-semibold text-gray-800">
                  Available From:
                </span>{" "}
                <time dateTime={room.availableFrom}>
                  {new Date(room.availableFrom).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </p>
              <p>
                <span className="font-semibold text-gray-800">Room Type:</span>{" "}
                <span className="capitalize">{room.roomType}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-800">Amenities:</span>{" "}
                {Object.entries(room.amenities)
                  .filter(([_, val]) => val)
                  .map(([key]) => prettyAmenity(key))
                  .join(", ") || "None"}
              </p>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-gray-200 text-gray-700 text-sm flex flex-col items-start gap-4">
            <p className="mb-1 font-medium">
              Posted by: <span className="font-normal">{room.email}</span>
            </p>
            <button
              onClick={() => navigate({ to: `/chat/${room._id}` })}
              className="w-full md:w-auto px-10 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-transform transform hover:scale-[1.05]"
              aria-label="Contact room owner"
            >
              Contact Owner
            </button>
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
