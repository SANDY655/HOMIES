import {
  createRoute,
  redirect,
  RootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import socket from "../socket";
import {
  Mail,
  Settings,
  LogOut,
  MessageSquare,
  Home,
  Users,
} from "lucide-react";

export function Dashboard() {
  const [email] = useState(JSON.parse(localStorage.getItem("email") || "{}"));
  // const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("userId");
  const {
    data: chats,
    isLoading: loadingChats,
    error,
  } = useQuery({
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

    // Join all chat rooms the user is part of
    chats?.forEach((chat) => socket.emit("join_chat", chat._id));

    const onNewMessage = (newMessage) => {
      console.log("New message received:", newMessage);
      queryClient.invalidateQueries(["chats", userId]);
    };

    socket.on("receive_message", onNewMessage);

    return () => {
      socket.off("receive_message", onNewMessage);
    };
  }, [userId, queryClient, chats]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/user/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.clear();
        navigate({ to: "/" });
      } else {
        alert(result.message || "Logout failed");
      }
    } catch (error) {
      alert("Something went wrong!");
    }
  };

  const handleRoomPosting = () => navigate({ to: "/post-room" });
  const handleFindRoommates = () => navigate({ to: "/find-roommates" });
  const handleSearchRooms = () => navigate({ to: "/search-rooms" });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <Heading as="h1" size="2xl" className="font-bold text-gray-900">
            Welcome to Your Dashboard
          </Heading>
          <p className="text-gray-500 text-base">
            Hello, {email || "User"}! Here’s your account overview.
          </p>
        </div>

        {/* Profile & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-2xl bg-white shadow">
            <CardHeader className="flex flex-col items-center py-6">
              <Avatar
                src={email?.avatar || "/img2.png"}
                alt="User Avatar"
                className="w-24 h-24 mb-4 border-4 border-gray-200"
              />
              <CardTitle className="text-xl text-gray-800">{email}</CardTitle>
              <CardDescription className="text-gray-500 text-sm">
                {email}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl bg-white shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <Settings size={18} /> Quick Actions
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Manage your account settings and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button size="lg" className="w-full flex gap-2 items-center">
                <Mail size={18} /> View Profile
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full flex gap-2 items-center"
              >
                <Settings size={18} /> Settings
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="w-full flex gap-2 items-center"
                onClick={handleLogout}
              >
                <LogOut size={18} /> Logout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Room Management */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl bg-white shadow-md hover:shadow-lg transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Home size={18} /> Post a Room
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Let others know about available rooms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleRoomPosting}
              >
                Post Room
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white shadow-md hover:shadow-lg transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Home size={18} /> Search Rooms
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Explore rooms available for rent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
                onClick={handleSearchRooms}
              >
                Search Rooms
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white shadow-md hover:shadow-lg transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Users size={18} /> Find Roommates
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Connect with potential roommates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full bg-green-600 text-white hover:bg-green-700"
                onClick={handleFindRoommates}
              >
                Find Roommates
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chat Section */}
        <Card className="rounded-2xl bg-white shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <MessageSquare size={18} /> Your Chats
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Conversations with users and landlords.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                      className="py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-100 rounded-md transition"
                      onClick={() => navigate({ to: `/chat/${chat.roomId}` })}
                    >
                      <Avatar src="/user.png" className="w-10 h-10" />
                      <div>
                        <div className="font-medium text-gray-800">
                          {otherUser?.email || "Unknown User"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {chat.latestMessage?.text || "No messages yet"}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
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
