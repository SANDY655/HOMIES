import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Wifi, AirConditioner, Car, Home, CheckCircle } from "lucide-react";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";

type Room = {
  id: string;
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
};

export function SearchRoom() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState("");

  const dummyRooms: Room[] = [
    {
      id: "1",
      title: "Cozy Single Room",
      description: "A nice and cozy room in the city center.",
      location: "Chennai",
      rent: 3000,
      deposit: 5000,
      availableFrom: "2025-05-10",
      roomType: "single",
      images: ["https://via.placeholder.com/300x200?text=Room+1"],
      amenities: {
        wifi: true,
        ac: false,
        parking: true,
        furnished: true,
        washingMachine: false,
      },
    },
    {
      id: "2",
      title: "Shared Room near University",
      description: "Perfect for students.",
      location: "Coimbatore",
      rent: 2500,
      deposit: 4000,
      availableFrom: "2025-05-15",
      roomType: "shared",
      images: ["https://via.placeholder.com/300x200?text=Room+2"],
      amenities: {
        wifi: true,
        ac: true,
        parking: false,
        furnished: true,
        washingMachine: true,
      },
    },
    {
      id: "3",
      title: "Furnished Apartment",
      description: "Fully furnished 2BHK apartment.",
      location: "Bangalore",
      rent: 6000,
      deposit: 10000,
      availableFrom: "2025-06-01",
      roomType: "apartment",
      images: ["https://via.placeholder.com/300x200?text=Room+3"],
      amenities: {
        wifi: true,
        ac: true,
        parking: true,
        furnished: true,
        washingMachine: true,
      },
    },
  ];

  useEffect(() => {
    setRooms(dummyRooms);
    setFilteredRooms(dummyRooms);
  }, []);

  useEffect(() => {
    let filtered = rooms.filter(
      (room) =>
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (priceFilter !== "all") {
      const max = parseInt(priceFilter);
      filtered = filtered.filter((room) => room.rent <= max);
    }

    if (roomTypeFilter !== "all") {
      filtered = filtered.filter((room) => room.roomType === roomTypeFilter);
    }

    if (availableFrom) {
      filtered = filtered.filter(
        (room) => new Date(room.availableFrom) >= new Date(availableFrom)
      );
    }

    if (amenityFilters.length > 0) {
      filtered = filtered.filter((room) =>
        amenityFilters.every(
          (amenity) => room.amenities[amenity as keyof Room["amenities"]]
        )
      );
    }

    setFilteredRooms(filtered);
  }, [
    searchQuery,
    priceFilter,
    roomTypeFilter,
    amenityFilters,
    availableFrom,
    rooms,
  ]);

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
        {/* Filters Sidebar */}
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
            {["wifi", "ac", "parking", "furnished", "washingMachine"].map(
              (amenity) => (
                <button
                  key={amenity}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    amenityFilters.includes(amenity)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity === "wifi" && <Wifi size={16} />}
                  {amenity === "ac" && <AirConditioner size={16} />}
                  {amenity === "parking" && <Car size={16} />}
                  {amenity === "furnished" && <Home size={16} />}
                  {amenity === "washingMachine" && <CheckCircle size={16} />}
                  {amenity}
                </button>
              )
            )}
          </div>
        </div>

        {/* Room Listings */}
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            Available Rooms
          </h1>

          {filteredRooms.length === 0 ? (
            <div className="text-gray-500">No rooms found.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl shadow-lg border hover:shadow-xl overflow-hidden"
                  >
                    <img
                      src={room.images[0]}
                      alt={room.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{room.title}</h3>
                      <p className="text-sm text-gray-500">{room.location}</p>
                      <p className="text-blue-600 font-bold text-sm mt-1">
                        ₹{room.rent} / month
                      </p>
                      <p className="text-xs text-gray-500">
                        Available:{" "}
                        {format(new Date(room.availableFrom), "dd MMM yyyy")}
                      </p>
                      <p className="text-xs capitalize text-gray-600">
                        {room.roomType}
                      </p>
                      <p className="text-xs mt-1 text-gray-500">
                        {Object.entries(room.amenities)
                          .filter(([_, val]) => val)
                          .map(([key]) => key)
                          .join(", ") || "No amenities"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
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
