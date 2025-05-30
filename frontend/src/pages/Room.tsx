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
import { ArrowLeft } from "lucide-react"; // Import ArrowLeft icon

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
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };

    window.addEventListener("storage", handleStorageChange);

    // Initial theme application based on localStorage
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [theme]); // Dependency on theme ensures the effect reruns if theme state changes

  // Apply theme class to documentElement on initial load and theme change
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

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
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-6 py-12 md:px-20 lg:px-36">
      {/* Back Navigation Link */}
      <div className="mb-6 max-w-7xl mx-auto">
        <Link
          to="/search-rooms" // Link back to the search rooms page
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition dark:text-gray-400 dark:hover:text-blue-400"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-3xl shadow-2xl overflow-hidden max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14">
        <div className="h-96 lg:h-auto rounded-l-3xl overflow-hidden shadow-inner border-r border-gray-100 dark:border-gray-600">
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

        <div className="p-12 flex flex-col justify-between">
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-5 tracking-tight drop-shadow-sm">
              {room.title}
            </h1>
            <p className="text-indigo-600 dark:text-indigo-400 text-lg font-semibold mb-6 tracking-wide">
              {room.location}
            </p>
            <div className="flex items-baseline space-x-3 mb-5">
              <span className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-300 drop-shadow">
                ₹{room.rent.toLocaleString("en-IN")}
              </span>
              <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                / month
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-12">
              Deposit: ₹{room.deposit.toLocaleString("en-IN")}
            </p>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-14 whitespace-pre-line">
              {room.description}
            </p>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
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

          <div className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm flex flex-col items-start gap-4">
            <p className="mb-1 font-medium">
              Posted by: <span className="font-normal">{room.email}</span>
            </p>

            <div className="mt-12 w-full">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Location Map
              </h2>
              {loadingCoords && <p>Loading map...</p>}
              {!loadingCoords &&
              coordinates &&
              typeof coordinates.lat === "number" &&
              typeof coordinates.lon === "number" ? (
                <MapContainer
                  center={[coordinates.lat, coordinates.lon]}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{
                    height: "300px",
                    borderRadius: "1rem",
                    width: "100%",
                  }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                            color: "blue",
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
                  <p className="text-gray-600 dark:text-gray-300">
                    Location not found on map.
                  </p>
                )
              )}
            </div>

            <button
              onClick={handleContactOwner}
              className="w-full md:w-auto px-10 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-transform transform hover:scale-[1.05] dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:focus:ring-indigo-800"
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
  });
