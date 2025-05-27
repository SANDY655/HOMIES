import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Wifi, Car, Home, CheckCircle, Snowflake } from "lucide-react";
import { createRoute, Link, redirect, RootRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "@/hooks/useDebounce";

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
}

function RoomCard({ room }: { room: Room }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % (room.images.length || 1));
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [room.images.length]);

  return (
    <Link to={`/rooms/${room._id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-lg border hover:shadow-xl overflow-hidden"
      >
        <img
          src={
            room.images.length > 0
              ? room.images[currentImageIndex]
              : "https://via.placeholder.com/300x200?text=Room"
          }
          alt={room.title}
          className="w-full h-48 object-cover transition-opacity duration-500"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold">{room.title}</h3>
          <p className="text-sm text-gray-500">{room.location}</p>
          <p className="text-blue-600 font-bold text-sm mt-1">
            ₹{room.rent} / month
          </p>
          <p className="text-xs text-gray-500">
            Available: {format(new Date(room.availableFrom), "dd MMM yyyy")}
          </p>
          <p className="text-xs capitalize text-gray-600">{room.roomType}</p>
          <p className="text-xs mt-1 text-gray-500">
            {Object.entries(room.amenities)
              .filter(([_, val]) => val)
              .map(([key]) => key)
              .join(", ") || "No amenities"}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

export function SearchRoom() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { ref, inView } = useInView();

  const fetchRooms = async ({ pageParam }: { pageParam: number }) => {
    const params = new URLSearchParams();
    const email = localStorage.getItem("email");
    params.append("_page", pageParam.toString());
    params.append("_limit", "10");
    if (searchQuery) params.append("searchQuery", searchQuery);
    if (priceFilter !== "all") params.append("priceFilter", priceFilter);
    if (roomTypeFilter !== "all")
      params.append("roomTypeFilter", roomTypeFilter);
    if (availableFrom) params.append("availableFrom", availableFrom);
    if (email) params.append("email", email);
    amenityFilters.forEach((amenity) => params.append("amenities", amenity));

    const res = await fetch(
      `http://localhost:5000/api/room/searchroom?${params.toString()}`
    );
    const json = await res.json();
    return json.data;
  };

  const {
    data,
    status,
    error,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      "rooms",
      debouncedSearchQuery,
      priceFilter,
      roomTypeFilter,
      amenityFilters,
      availableFrom,
    ],
    queryFn: fetchRooms,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length ? allPages.length + 1 : undefined,
  });

  useEffect(() => {
    refetch();
  }, [priceFilter, roomTypeFilter, amenityFilters, availableFrom]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "error") return <p>Error: {error.message}</p>;

  const toggleAmenity = (amenity: string) => {
    setAmenityFilters((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-4 mb-6 flex justify-start">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
            aria-label="Go to Dashboard"
          >
            <Home size={20} />
            Dashboard
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow p-4 lg:sticky top-6 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Filters</h2>

          <input
            type="text"
            placeholder="Search by title or location..."
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Prices</option>
            <option value="2500">Under ₹2500</option>
            <option value="4000">Under ₹4000</option>
            <option value="6000">Under ₹6000</option>
          </select>

          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Room Types</option>
            <option value="single">Single</option>
            <option value="shared">Shared</option>
            <option value="apartment">Apartment</option>
          </select>

          <input
            type="date"
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
          />

          <div className="text-sm font-medium mb-2">Amenities:</div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "wifi", icon: <Wifi size={16} /> },
              { key: "ac", icon: <Snowflake size={16} /> },
              { key: "parking", icon: <Car size={16} /> },
              { key: "furnished", icon: <Home size={16} /> },
              { key: "washingMachine", icon: <CheckCircle size={16} /> },
            ].map(({ key, icon }) => (
              <button
                key={key}
                className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 ${
                  amenityFilters.includes(key)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => toggleAmenity(key)}
              >
                {icon}
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            Available Rooms
          </h1>

          {data?.pages.flat().length === 0 ? (
            <div className="text-gray-500">No rooms found.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {data?.pages.flat().map((room) => (
                  <RoomCard key={room._id} room={room} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          ref={ref}
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={() => fetchNextPage()}
          className={`px-6 py-2 text-white font-semibold rounded-lg ${
            isFetchingNextPage
              ? "bg-gray-400"
              : hasNextPage
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {isFetchingNextPage
            ? "Loading more..."
            : hasNextPage
            ? "Load More"
            : "No more rooms"}
        </button>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/search-rooms",
    component: SearchRoom,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
