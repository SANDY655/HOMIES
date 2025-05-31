import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
  Link, // Import Link from tanstack/react-router
} from "@tanstack/react-router";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "leaflet/dist/leaflet.css";
import { getCurrentUserIdFromToken } from "@/lib/getCurrentUserIdFromToken";
import { ArrowLeft, SunIcon, MoonIcon } from "lucide-react"; // Import icons

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
  userId: string; // Assuming userId is available on the room object
}

// Function to apply or remove dark class on body based on theme
const applyTheme = (theme: "light" | "dark") => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export function Room() {
  const currentUserId = getCurrentUserIdFromToken();
  const { roomId } = useParams({ strict: false }) as { roomId: string };
  const [room, setRoom] = useState<Room | null>(null);
  const navigate = useNavigate();
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]); // Route polyline coords
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

  // Fetch room details
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

  // Fetch coordinates of room location from LocationIQ
  useEffect(() => {
    if (room?.location) {
      const fetchCoordinates = async () => {
        setLoadingCoords(true);
        try {
          const response = await fetch(
            `https://us1.locationiq.com/v1/search?key=pk.156347b797adf47f459dbb3d2c9ffabd&q=${encodeURIComponent(
              room.location
            )}&format=json`
          );
          const data = await response.json();
          if (data && data.length > 0) {
            setCoordinates({
              lat: parseFloat(data[0].lat),
              lon: parseFloat(data[0].lon),
            });
          }
        } catch (error) {
          console.error("Failed to fetch coordinates:", error);
        } finally {
          setLoadingCoords(false);
        }
      };

      fetchCoordinates();
    }
  }, [room?.location]);

  // Get user's current geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  }, []);

  // Fetch route between userLocation and room location from OpenRouteService
  useEffect(() => {
    async function fetchRoute(
      userLoc: { lat: number; lon: number },
      roomLoc: { lat: number; lon: number }
    ) {
      try {
        const response = await fetch(
          "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "5b3ce3597851110001cf6248864dc0922459441f9b022ef3c8bd7602", // <-- Replace with your OpenRouteService API key
            },
            body: JSON.stringify({
              coordinates: [
                [userLoc.lon, userLoc.lat], // Note: ORS expects [lon, lat]
                [roomLoc.lon, roomLoc.lat],
              ],
            }),
          }
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const coords = data.features[0].geometry.coordinates;
          // Flip [lon, lat] to [lat, lon] for Leaflet
          const latLngs = coords.map(([lon, lat]: [number, number]) => [
            lat,
            lon,
          ]);
          setRouteCoords(latLngs);
        }
      } catch (err) {
        console.error("Error fetching route:", err);
      }
    }

    if (userLocation && coordinates) {
      fetchRoute(userLocation, coordinates);
    }
  }, [userLocation, coordinates]);

  if (!room) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-600 dark:text-gray-300">
        Loading room details...
      </div>
    );
  }

  const prettyAmenity = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  const handleContactOwner = async () => {
    if (!currentUserId) {
      // If user is not logged in, redirect to home and open login modal
      navigate({
        to: "/",
        search: { modal: "login", search: { modal: "login" } },
      });
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:5000/api/chatroom/createOrGet",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId1: currentUserId,
            userId2: room.userId, // Use room owner's user ID
            roomId: room._id,
          }),
        }
      );

      const data = await res.json();
      if (data._id) {
        navigate({
          to: "/chatwithsidebar",
          search: { chatRoomId: data._id },
        });
      } else {
        alert("Failed to open chat room");
      }
    } catch (err) {
      console.error("Error opening chat:", err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-tr items-center from-indigo-50 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-6 py-6 md:px-20 lg:px-36 overflow-hidden">
      {/* Header with Back Navigation and Theme Toggle */}
      <div className="mb-4 max-w-7xl mx-auto flex justify-between items-center w-full">
        <Link
          to="/search-rooms" // Link back to the search rooms page
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition dark:text-gray-400 dark:hover:text-blue-400"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
        {/* Theme Toggle Icon */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <MoonIcon size={20} /> : <SunIcon size={20} />}
        </button>
      </div>

      <div className="flex-grow bg-white items-center justify-center dark:bg-gray-700 rounded-3xl shadow-2xl overflow-hidden max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="h-full rounded-l-3xl overflow-hidden shadow-inner border-r border-gray-100 dark:border-gray-600">
          {room.images.length > 0 ? (
            <Carousel
              showThumbs={true}
              showStatus={false}
              infiniteLoop
              useKeyboardArrows
              autoPlay={false}
              dynamicHeight={false}
              emulateTouch
              className="rounded-l-3xl h-full flex flex-col"
              thumbWidth={80}
              thumbHeight={56}
              swipeScrollTolerance={5}
            >
              {room.images.map((url, index) => (
                <div
                  key={index}
                  className="h-full flex justify-center items-center"
                >
                  <img
                    src={url}
                    alt={`Room image ${index + 1}`}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <img
              src="https://via.placeholder.com/800x600"
              alt="Placeholder"
              className="w-full h-full object-cover rounded-l-3xl"
            />
          )}
        </div>

        <div className="p-8 flex flex-col justify-between overflow-y-auto no-scrollbar">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight drop-shadow-sm">
              {room.title}
            </h1>
            <p className="text-indigo-600 dark:text-indigo-400 text-base font-semibold mb-4 tracking-wide">
              {room.location}
            </p>
            <div className="flex items-baseline space-x-2 mb-3">
              <span className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 drop-shadow">
                ₹{room.rent.toLocaleString("en-IN")}
              </span>
              <span className="text-base font-semibold text-gray-600 dark:text-gray-300">
                / month
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">
              Deposit: ₹{room.deposit.toLocaleString("en-IN")}
            </p>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-4 text-sm whitespace-pre-line">
              {room.description}
            </p>
            <div className="space-y-2 text-gray-700 dark:text-gray-300 text-xs">
              <p>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
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
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  Room Type:
                </span>{" "}
                <span className="capitalize">{room.roomType}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  Amenities:
                </span>{" "}
                {Object.entries(room.amenities)
                  .filter(([_, val]) => val)
                  .map(([key]) => prettyAmenity(key))
                  .join(", ") || "None"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm flex flex-col items-start gap-3">
            <p className="mb-0 font-medium text-xs">
              Posted by: <span className="font-normal">{room.email}</span>
            </p>

            <div className="mt-4 w-full">
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                Location Map
              </h2>
              {loadingCoords && (
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Loading map...
                </p>
              )}
              {!loadingCoords &&
              coordinates &&
              typeof coordinates.lat === "number" &&
              typeof coordinates.lon === "number" ? (
                <MapContainer
                  center={[coordinates.lat, coordinates.lon]}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{
                    height: "200px",
                    borderRadius: "0.75rem",
                    width: "100%",
                  }}
                >
                  <TileLayer
                    url={
                      theme === "light"
                        ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        : "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png"
                    }
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[coordinates.lat, coordinates.lon]}>
                    <Popup>{room.location}</Popup>
                  </Marker>
                  {userLocation && (
                    <>
                      <Marker position={[userLocation.lat, userLocation.lon]}>
                        <Popup>Your Location</Popup>
                      </Marker>
                      {routeCoords.length > 0 && (
                        <Polyline
                          positions={routeCoords}
                          pathOptions={{
                            color: theme === "light" ? "blue" : "cyan",
                            weight: 5,
                            opacity: 0.8,
                          }}
                        />
                      )}
                    </>
                  )}
                </MapContainer>
              ) : (
                !loadingCoords &&
                !coordinates && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Location not found on map.
                  </p>
                )
              )}
            </div>

            {room.userId !== currentUserId && ( // Only show if not the owner
              <button
                onClick={handleContactOwner}
                className="w-full md:w-auto px-8 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-transform transform hover:scale-[1.03] dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:focus:ring-indigo-800 text-sm"
                aria-label="Contact room owner"
              >
                Contact Owner
              </button>
            )}
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
  });
