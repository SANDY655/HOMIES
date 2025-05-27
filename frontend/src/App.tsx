import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { FaUserCircle, FaSignInAlt, FaUserPlus, FaTimes, FaHome } from "react-icons/fa";
import { LoginForm } from "./components/login-form";
import { RegisterForm } from "./components/register-form";

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
      <style>{`
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
      `}</style>
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
        className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow-lg hover:from-primary-dark hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition"
      >
        <FaUserCircle className="mr-2 text-xl" />
        Account
        <svg className="-mr-1 ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem("email");
    if (isLoggedIn) {
      navigate({ to: "/dashboard" });
    }
    fetchRooms();
  }, []);

  // Open modal if URL query ?modal=login or ?modal=register
  useEffect(() => {
    if (search.modal === "login" || search.modal === "register") {
      setModalType(search.modal);
      // After opening modal, replace URL to '/' without query parameters or modal query,
      // so URL does not show the modal query anymore.
    }
    navigate({
      to: "/",          // <-- Change pathname to '/' explicitly
      search: {},       // <-- Clear all search params
      replace: true,    // <-- replace so back button doesn't go back to modal URL
    });
  }, [search.modal, navigate]);

  async function fetchRooms() {
    try {
      const res = await fetch("http://localhost:5000/api/room/all");
      const data = await res.json();
      setRooms(data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  }

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
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate({ to: "/" })}>
          <FaHome className="text-primary text-3xl" />
          <h1 className="text-2xl font-extrabold text-primary">RoomFinder</h1>
        </div>
        <Dropdown onSelect={(type) => setModalType(type)} />
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-primary">Available Rooms</h2>

        {loading ? (
          <p className="text-gray-600 text-lg animate-pulse">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p className="text-gray-600 text-lg">No rooms available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {rooms.map((room) => {
              const currentImageIndex = imageIndexes[room._id] || 0;
              const currentImage = room.images?.[currentImageIndex] || "/placeholder.png";

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
                    <p className="text-sm text-gray-600 capitalize">Type: {room.roomType}</p>
                    <p className="text-sm text-gray-600">Location: {room.location}</p>
                    <p className="text-sm text-gray-600">Rent: ₹{room.rent}</p>
                    <div className="text-sm text-gray-600">
                      <p className="font-semibold">Amenities:</p>
                      <ul className="list-disc ml-5">
                        {Object.entries(room.amenities)
                          .filter(([_, value]) => value)
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
