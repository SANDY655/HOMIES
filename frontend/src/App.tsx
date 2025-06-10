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
import {
  Wifi,
  Car,
  Home,
  CheckCircle,
  Snowflake,
  Moon,
  Sun,
} from "lucide-react";

// Function to apply or remove dark class on body based on theme
const applyTheme = (theme: "light" | "dark") => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

// Modal Component
type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity bg-white/20 backdrop-blur-xs dark:bg-gray-900/20"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-auto p-8 relative animate-fadeIn scale-up dark:bg-black dark:text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl dark:text-gray-500 dark:hover:text-gray-300"
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
function Dropdown({ onSelect }: { onSelect: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
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
        className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow-lg dark:border-blue-700 dark:from-blue-800 dark:to-blue-900 dark:text-gray-200"
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
        <div className="absolute right-0 mt-2 w-44 rounded-xl shadow-xl bg-white z-50 dark:bg-gray-800">
          <div className="py-2">
            <button
              onClick={() => {
                setOpen(false);
                onSelect("login");
              }}
              className="flex items-center gap-2 w-full px-5 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white rounded-t-xl transition dark:text-gray-300 dark:hover:bg-blue-700 dark:hover:text-white"
            >
              <FaSignInAlt /> Login
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onSelect("register");
              }}
              className="flex items-center gap-2 w-full px-5 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white rounded-b-xl transition dark:text-gray-300 dark:hover:bg-blue-700 dark:hover:text-white"
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
type Room = {
  _id: string;
  title: string;
  roomType: string;
  location: string;
  rent: number;
  images: string[];
  amenities?: { [key: string]: boolean };
};

function App() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { modal?: "login" | "register" };
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"login" | "register" | null>(null);
  const [imageIndexes, setImageIndexes] = useState<{ [roomId: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    // Apply theme class to the documentElement
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

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
      // Consider using replace: true if you don't want the modal search param in history
      navigate({ to: "/", search: {}, replace: true });
    }
  }, [search.modal, navigate]);

  async function fetchRooms() {
    setLoading(true); // Set loading to true before fetching
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
        setRooms([]); // Set rooms to empty on error
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setRooms([]); // Set rooms to empty on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms();
    // Re-fetch rooms when filters or search query change
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
          // Ensure room.images is an array before accessing length
          const total = Array.isArray(room.images) ? room.images.length : 0;
          if (total > 0) {
            const current = prev[room._id] || 0;
            updated[room._id] = (current + 1) % total;
          } else {
            updated[room._id] = 0; // Reset index if no images
          }
        });
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [rooms]); // Depend on rooms state to update intervals correctly

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col font-sans text-gray-900 dark:from-gray-900 dark:to-gray-800 dark:text-gray-200">
      <header className="bg-white shadow-lg px-8 py-5 flex justify-between items-center sticky top-0 z-50 dark:bg-gray-800 dark:shadow-none">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate({ to: "/" })}
        >
          <FaHome className="text-primary text-3xl dark:text-blue-500" />
          <h1 className="text-2xl font-extrabold text-primary dark:text-blue-500">
            RoomFinder
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <Dropdown onSelect={(type) => setModalType(type as "login" | "register")} />
        </div>
      </header>
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-primary dark:text-blue-500">
          Available Rooms
        </h2>
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow px-6 py-4 mb-8 sticky top-20 z-40 dark:bg-gray-800 dark:shadow-none">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Search */}
            <input
              type="text"
              placeholder="Search title or location"
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 dark:focus:ring-blue-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Prices</option>
              <option value="2500">Under ₹2500</option>
              <option value="4000">Under ₹4000</option>
              <option value="6000">Under ₹6000</option>
            </select>

            {/* Room Type */}
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="shared">Shared</option>
              <option value="apartment">Apartment</option>
            </select>

            {/* Available From */}
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
            />

            {/* Amenities */}
            <div className="flex gap-1 flex-wrap">
              {[
                { key: "wifi", icon: <Wifi size={16} /> },
                { key: "ac", icon: <Snowflake size={16} /> },
                { key: "parking", icon: <Car size={16} /> },
                { key: "furnished", icon: <Home size={16} /> },
                { key: "washingMachine", icon: <CheckCircle size={16} /> },
              ].map(({ key, icon }) => (
                <button
                  key={key}
                  className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                    amenityFilters.includes(key)
                      ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-700 dark:border-blue-700"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
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
        </div>
        {loading ? (
          <p className="text-gray-600 text-lg animate-pulse dark:text-gray-400">
            Loading rooms...
          </p>
        ) : rooms.length === 0 ? (
          <p className="text-gray-600 text-lg dark:text-gray-400">
            No rooms available matching your criteria.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {rooms.map((room) => {
              const currentImageIndex = imageIndexes[room._id] || 0;
              const currentImage =
                Array.isArray(room.images) && room.images.length > 0
                  ? room.images[currentImageIndex]
                  : "/placeholder.png"; // Use placeholder if no images

              return (
                <div
                  key={room._id}
                  className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition overflow-hidden cursor-pointer dark:bg-gray-800 dark:shadow-lg dark:hover:shadow-xl"
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
                    <h3 className="text-xl font-bold dark:text-white">
                      {room.title}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize dark:text-gray-400">
                      Type: {room.roomType}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Location: {room.location}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Rent: ₹{room.rent}
                    </p>
                    {/* Render amenities more visually */}
                    {Object.entries(room.amenities || {}).some(
                      ([, value]) => value
                    ) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-semibold">Amenities:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(room.amenities || {})
                            .filter(([, value]) => value)
                            .map(([key]) => (
                              <span
                                key={key}
                                className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-xs dark:bg-gray-700 dark:text-gray-300"
                              >
                                {key === "wifi" && <Wifi size={14} />}
                                {key === "ac" && <Snowflake size={14} />}
                                {key === "parking" && <Car size={14} />}
                                {key === "furnished" && <Home size={14} />}
                                {key === "washingMachine" && (
                                  <CheckCircle size={14} />
                                )}
                                {key}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
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
