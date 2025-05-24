import {
  createRoute,
  redirect,
  useNavigate,
  useSearch,
  type RootRoute,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { getCurrentUserIdFromToken } from "@/lib/getCurrentUserIdFromToken";
import { ChatRoomPane } from "./ChatRoomPane";

export function ChatWithSidebar() {
  const currentUserId = getCurrentUserIdFromToken();
  const navigate = useNavigate();
  const { chatRoomId } = useSearch({ strict: false }) as {
    chatRoomId?: string;
  };

  const [chatRooms, setChatRooms] = useState<any[]>([]);
  // No tab selected initially
  const [selectedTab, setSelectedTab] = useState<
    "myChats" | "ownerChats" | undefined
  >(undefined);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchChatRooms = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chatroom/${currentUserId}`
        );
        setChatRooms(res.data);
        // DO NOT auto-select chatRoomId here
      } catch (error) {
        console.error("Failed to fetch chat rooms:", error);
      }
    };

    fetchChatRooms();
  }, [currentUserId]);

  useEffect(() => {
    if (!chatRoomId || chatRooms.length === 0 || !currentUserId) {
      // No chat room selected — clear tab selection
      setSelectedTab(undefined);
      return;
    }

    const selectedRoom = chatRooms.find((room) => room._id === chatRoomId);

    if (!selectedRoom) {
      setSelectedTab(undefined);
      return;
    }

    const isMyChat = selectedRoom.roomId?.userId?._id === currentUserId;
    setSelectedTab(isMyChat ? "myChats" : "ownerChats");
  }, [chatRoomId, chatRooms, currentUserId]);

  const myChats = chatRooms.filter(
    (room) => room.roomId?.userId?._id === currentUserId
  );
  const ownerChats = chatRooms.filter(
    (room) => room.roomId?.userId?._id !== currentUserId
  );

  const renderChatList = (rooms: any[]) =>
    rooms.map((room) => {
      const otherParticipant = room.participants.find(
        (p: any) => p._id !== currentUserId
      );
      const displayName = otherParticipant?.email || "Unknown";

      return (
        <li
          key={room._id}
          onClick={() => {
            navigate({
              search: (prev) => ({
                ...prev,
                chatRoomId: room._id,
              }),
            });
            // tab selection will update on effect via chatRoomId change
          }}
          className={`cursor-pointer p-3 border-none hover:bg-indigo-100 rounded ${
            room._id === chatRoomId ? "bg-indigo-300 font-semibold" : ""
          }`}
        >
          <div className="text-sm truncate">{displayName}</div>
          <div className="text-xs text-gray-700 truncate">
            {room.latestMessage?.content || "No messages yet"}
          </div>
        </li>
      );
    });

  return (
    <div className="flex h-screen bg-gray-50 overflow-auto">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-300 bg-white flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-300">
          <button
            onClick={() => navigate({ to: "/dashboard", search: {} })}
            className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h2 className="font-bold text-lg select-none">Chats</h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-around border-b">
          <button
            className={`w-full py-2 font-semibold ${
              selectedTab === "myChats"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => setSelectedTab("myChats")}
          >
            My Chats
          </button>
          <button
            className={`w-full py-2 font-semibold ${
              selectedTab === "ownerChats"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => setSelectedTab("ownerChats")}
          >
            Owner Chats
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-auto">
          <ul>
            {!selectedTab ? (
              <li className="p-4 text-center text-gray-400">
                Select a tab to view chats
              </li>
            ) : selectedTab === "myChats" ? (
              myChats.length > 0 ? (
                renderChatList(myChats)
              ) : (
                <li className="p-4 text-center text-gray-400">No chats yet</li>
              )
            ) : ownerChats.length > 0 ? (
              renderChatList(ownerChats)
            ) : (
              <li className="p-4 text-center text-gray-400">No chats yet</li>
            )}
          </ul>
        </div>
      </aside>

      {/* Chat Room Pane */}
      <main className="flex-1 flex flex-col bg-white">
        {!chatRoomId ? (
          <div className="flex items-center justify-center flex-grow text-gray-500">
            Start a chat by selecting a chat room from the sidebar
          </div>
        ) : (
          <ChatRoomPane chatRoomId={chatRoomId} />
        )}
      </main>
    </div>
  );
}

// Route definition (unchanged)
export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chatwithsidebar",
    component: ChatWithSidebar,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/" });
      }
    },
  });
