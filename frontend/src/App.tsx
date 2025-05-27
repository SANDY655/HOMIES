import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  FaUserCircle,
  FaSignInAlt,
  FaUserPlus,
  FaTimes,
  FaHome,
} from "react-icons/fa";
import { LoginForm } from "./components/login-form";
import { RegisterForm } from "./components/register-form";
import { useDebounce } from "@/hooks/useDebounce";
import { Wifi, Car, Home, CheckCircle, Snowflake } from "lucide-react";

// Modal Component
function Modal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-transparent bg-opacity-20 backdrop-blur-xs z-40 transition-opacity"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-auto p-8 relative animate-fadeIn scale-up">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl"
          >
            <FaTimes />
          </button>
          {children}
        </div>
      </div>
      <style>
        {`
                    @keyframes fadeIn {
                        from {opacity: 0;}
                        to {opacity: 1;}
                    }
                    @keyframes scaleUp {
                        from {transform: scale(0.95);}
                        to {transform: scale(1);}
                    }
                    .animate-fadeIn {
                        animation: fadeIn 0.25s ease forwards;
                    }
                    .scale-up {
                        animation: scaleUp 0.25s ease forwards;
                    }
                `}
      </style>
    </>
  );
}

// Dropdown Component
function Dropdown({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow-lg"
      >
        <FaUserCircle className="mr-2 text-xl" /> Account
        <svg
          className="-mr-1 ml-2 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl shadow-xl bg-white z-50">
          <div className="py-2">
            <button
              onClick={() => {
                setOpen(false);
                onSelect("login");
              }}
              className="flex items-center gap-2 w-full px-5 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white rounded-t-xl transition"
            >
              <FaSignInAlt /> Login
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onSelect("register");
              }}
              className="flex items-center gap-2 w-full px-5 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white rounded-b-xl transition"
            >
              <FaUserPlus /> Sign Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App Component
function App() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/" });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null);
  const [imageIndexes, setImageIndexes] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [amenityFilters, setAmenityFilters] = useState([]);
  const [availableFrom, setAvailableFrom] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem("email");
    if (isLoggedIn) {
      navigate({ to: "/dashboard" });
    }
    fetchRooms();
  }, []);

  useEffect(() => {
    if (search.modal === "login" || search.modal === "register") {
      setModalType(search.modal);
      navigate({ to: "/", search: {}, replace: true });
    }
  }, [search.modal, navigate]);
  async function fetchRooms() {
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery)
        params.append("searchQuery", debouncedSearchQuery);
      if (priceFilter !== "all") params.append("priceFilter", priceFilter);
      if (roomTypeFilter !== "all")
        params.append("roomTypeFilter", roomTypeFilter);
      if (availableFrom) params.append("availableFrom", availableFrom);
      amenityFilters.forEach((amenity) => params.append("amenities", amenity));

      const res = await fetch(
        `http://localhost:5000/api/room/all?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        setRooms(data.data);
      } else {
        console.error("Server error:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchRooms();
  }, [
    debouncedSearchQuery,
    priceFilter,
    roomTypeFilter,
    amenityFilters,
    availableFrom,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndexes((prev) => {
        const updated = { ...prev };
        rooms.forEach((room) => {
          const total = room.images?.length || 1;
          const current = prev[room._id] || 0;
          updated[room._id] = (current + 1) % total;
        });
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [rooms]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col font-sans text-gray-900">
      <header className="bg-white shadow-lg px-8 py-5 flex justify-between items-center sticky top-0 z-50">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate({ to: "/" })}
        >
          <FaHome className="text-primary text-3xl" />
          <h1 className="text-2xl font-extrabold text-primary">RoomFinder</h1>
        </div>
        <Dropdown onSelect={(type) => setModalType(type)} />
      </header>
      <main className="flex-1 p-8 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-primary">
          Available Rooms
        </h2>
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Filters</h2>
          <input
            type="text"
            placeholder="Search by title or location..."
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg"
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
                onClick={() => {
                  setAmenityFilters((prev) =>
                    prev.includes(key)
                      ? prev.filter((a) => a !== key)
                      : [...prev, key]
                  );
                }}
              >
                {icon}
                {key}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <p className="text-gray-600 text-lg animate-pulse">
            Loading rooms...
          </p>
        ) : rooms.length === 0 ? (
          <p className="text-gray-600 text-lg">No rooms available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {rooms.map((room) => {
              const currentImageIndex = imageIndexes[room._id] || 0;
              const currentImage =
                room.images?.[currentImageIndex] || "/placeholder.png";
              return (
                <div
                  key={room._id}
                  className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition overflow-hidden cursor-pointer"
                  onClick={() => navigate({ to: `/rooms/${room._id}` })}
                >
                  <div className="h-56 overflow-hidden">
                    <img
                      src={currentImage}
                      alt={room.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-xl font-bold">{room.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      Type: {room.roomType}
                    </p>
                    <p className="text-sm text-gray-600">
                      Location: {room.location}
                    </p>
                    <p className="text-sm text-gray-600">Rent: ₹{room.rent}</p>
                    <div className="text-sm text-gray-600">
                      <p className="font-semibold">Amenities:</p>
                      <ul className="list-disc ml-5">
                        {Object.entries(room.amenities)
                          .filter(([, value]) => value)
                          .map(([key]) => (
                            <li key={key}>{key}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Modal open={modalType !== null} onClose={() => setModalType(null)}>
        {modalType === "login" && <LoginForm />}
        {modalType === "register" && <RegisterForm />}
      </Modal>
    </div>
  );
}

export default App;
