import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MessageSquare, Home, Users, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import socket from "../socket";
import { createRoute, redirect, useNavigate } from "@tanstack/react-router";
import type { RootRoute } from "@tanstack/react-router";

export function Dashboard() {
  const [email] = useState(JSON.parse(localStorage.getItem("email") || "{}"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("userId");

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
  }, [userId, queryClient, chats]);

  const handleLogout = async () => {
    // Your logout logic here
  };

  const handleRoomPosting = () => navigate({ to: "/post-room" });
  const handleFindRoommates = () => navigate({ to: "/find-roommates" });
  const handleSearchRooms = () => navigate({ to: "/search-rooms" });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
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
            onClick={handleLogout}
          >
            <LogOut size={18} /> Logout
          </Button>
        </div>
      </nav>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
        {/* Chat List (Left) */}
        <section className="col-span-12 md:col-span-7 bg-white rounded-2xl shadow overflow-hidden flex flex-col h-[calc(100vh-96px)]">
          <header className="flex items-center gap-3 p-6 border-b border-gray-200">
            <MessageSquare size={24} className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Your Chats</h2>
          </header>

          <main className="flex-1 overflow-y-auto p-4">
            {loadingChats ? (
              <p className="text-gray-500">Loading chats...</p>
            ) : !chats || chats.length === 0 ? (
              <p className="text-gray-500">No chats found.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {chats.map((chat) => {
                  const otherUser = chat.members.find((m) => m._id !== userId);
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

        {/* Right cards/buttons */}
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
                <Users size={20} />
                Find Roommates
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Connect with potential roommates.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                size="md"
                className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                onClick={handleFindRoommates}
              >
                Find Roommates
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
