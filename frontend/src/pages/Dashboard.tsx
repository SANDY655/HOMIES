import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  MessageSquare,
  Home,
  Users,
  Settings,
  LogOut,
  DoorOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import socket from "../socket";
import { createRoute, redirect, useNavigate } from "@tanstack/react-router";
import type { RootRoute } from "@tanstack/react-router";

function ConfirmLogout({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg p-6 w-80 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
        <p className="mb-6 text-gray-700">Are you sure you want to logout?</p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [email] = useState(JSON.parse(localStorage.getItem("email") || "{}"));
  const userId = localStorage.getItem("userId");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"mine" | "others">("mine");

  // Confirmation modal open state
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const { data: chats, isLoading: loadingChats } = useQuery({
    queryKey: ["chats", userId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/chat/user/${userId}`);
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch Chat");
      return data.chats;
    },
    enabled: !!userId,
  });

  const { data: myRooms } = useQuery({
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

  const myRoomIds = myRooms?.map((room) => room._id.toString()) || [];

  const filteredChats =
    chats?.filter((chat) => {
      const roomId = chat.roomId?.toString() || "";
      const isMine = myRoomIds.includes(roomId);
      return activeTab === "mine" ? isMine : !isMine;
    }) || [];

  useEffect(() => {
    if (!userId) return;
    if (!socket.connected) socket.connect();
    chats?.forEach((chat) => socket.emit("join_chat", chat._id));

    const onNewMessage = () => {
      queryClient.invalidateQueries(["chats", userId]);
    };
    socket.on("receive_message", onNewMessage);

    return () => {
      socket.off("receive_message", onNewMessage);
    };
  }, [userId, chats, queryClient]);

  // Logout handler with improvements
  // Logout handler with improvements
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        // Optional: Call logout API if you want to track or invalidate sessions
        await fetch("http://localhost:5000/api/user/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.warn(
        "Logout API failed or not implemented. Proceeding with local logout."
      );
    }

    // Disconnect Socket.IO if connected
    if (socket.connected) {
      socket.disconnect();
    }

    // Clear only auth-related keys
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");

    // Clear React Query cache
    queryClient.clear();

    // Redirect to login/home page
    navigate({ to: "/" });
  };

  // Logout button triggers modal

  // Show confirmation modal on logout button click
  const onLogoutClick = () => setLogoutModalOpen(true);
  const onCancelLogout = () => setLogoutModalOpen(false);
  const onConfirmLogout = () => {
    setLogoutModalOpen(false);
    handleLogout();
  };

  const handleRoomPosting = () => navigate({ to: "/post-room" });
  const handleSearchRooms = () => navigate({ to: "/search-rooms" });
  const handleMyRooms = () => navigate({ to: "/my-rooms" });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between bg-white px-6 py-4 shadow h-14">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4 min-w-[200px] justify-end">
          <Avatar
            src={email?.avatar || "/img2.png"}
            alt="User Avatar"
            title={email?.email || ""}
            className="w-10 h-10 border border-gray-300 cursor-pointer"
          />
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <Settings size={18} /> Settings
          </Button>
          <Button
            variant="destructive"
            className="flex items-center gap-2"
            onClick={onLogoutClick}
          >
            <LogOut size={18} /> Logout
          </Button>
        </div>
      </nav>

      {/* Confirm Logout Modal */}
      <ConfirmLogout
        isOpen={logoutModalOpen}
        onConfirm={onConfirmLogout}
        onCancel={onCancelLogout}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
        <section className="col-span-12 md:col-span-7 bg-white rounded-2xl shadow overflow-hidden flex flex-col h-[calc(100vh-96px)]">
          <header className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MessageSquare size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Your Chats
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "mine" ? "default" : "outline"}
                onClick={() => setActiveTab("mine")}
              >
                My Room Chats
              </Button>
              <Button
                variant={activeTab === "others" ? "default" : "outline"}
                onClick={() => setActiveTab("others")}
              >
                Chats on Other Rooms
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4">
            {loadingChats ? (
              <p className="text-gray-500">Loading chats...</p>
            ) : !filteredChats || filteredChats.length === 0 ? (
              <p className="text-gray-500">No chats found.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredChats.map((chat) => {
                  const otherUser = chat.members.find(
                    (m) => m._id?.toString() !== userId
                  );
                  return (
                    <li
                      key={chat._id}
                      onClick={() => navigate({ to: `/chat/${chat.roomId}` })}
                      className="flex items-center gap-4 p-4 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                    >
                      <Avatar
                        src="/user.png"
                        alt="User Avatar"
                        className="w-16 h-16 border border-gray-300"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <p className="font-medium text-gray-900 truncate max-w-xs">
                          {otherUser?.email || "Unknown User"}
                        </p>
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {chat.latestMessage?.text || "No messages yet"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </main>
        </section>

        {/* Room Actions */}
        <section className="col-span-12 md:col-span-5 flex flex-col gap-6">
          <Card className="rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-semibold">
                <Home size={20} />
                Post a Room
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Let others know about available rooms.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                size="md"
                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={handleRoomPosting}
              >
                Post Room
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-semibold">
                <Home size={20} />
                Search Rooms
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Explore rooms available for rent.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                size="md"
                className="w-full rounded-md bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                onClick={handleSearchRooms}
              >
                Search Rooms
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-semibold">
                <DoorOpen size={20} />
                My Rooms
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Manage your posted rooms.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                size="md"
                className="w-full rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                onClick={handleMyRooms}
              >
                View My Rooms
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/dashboard",
    component: Dashboard,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
