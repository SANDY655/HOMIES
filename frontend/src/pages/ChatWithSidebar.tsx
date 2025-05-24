import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { getCurrentUserIdFromToken } from "@/lib/getCurrentUserIdFromToken";
import { ChatRoomPane } from "./ChatRoomPane";

export function ChatWithSidebar() {
  const currentUserId = getCurrentUserIdFromToken();
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchChatRooms = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chatroom/${currentUserId}`
        );
        setChatRooms(res.data);

        if (res.data.length > 0) {
          setActiveChatRoomId(res.data[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch chat rooms:", error);
      }
    };

    fetchChatRooms();
  }, [currentUserId]);

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
          onClick={() => setActiveChatRoomId(room._id)}
          className={`cursor-pointer p-3 mb-1 rounded hover:bg-indigo-100 ${
            room._id === activeChatRoomId ? "bg-indigo-300 font-semibold" : ""
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-96 border-r border-gray-300 bg-white flex">
        {/* Left column - Tenants */}
        <section className="w-1/2 border-r border-gray-200 flex flex-col">
          <header className="p-3 bg-indigo-50 border-b border-indigo-200 font-semibold text-indigo-700 text-center">
            Tenants
          </header>
          <ul className="flex-1 overflow-y-auto p-2">{renderChatList(myChats)}</ul>
          {myChats.length === 0 && (
            <div className="p-4 text-center text-gray-400">No chats</div>
          )}
        </section>

        {/* Right column - Owners */}
        <section className="w-1/2 flex flex-col">
          <header className="p-3 bg-green-50 border-b border-green-200 font-semibold text-green-700 text-center">
            Owners
          </header>
          <ul className="flex-1 overflow-y-auto p-2">{renderChatList(ownerChats)}</ul>
          {ownerChats.length === 0 && (
            <div className="p-4 text-center text-gray-400">No chats</div>
          )}
        </section>
      </aside>

      {/* Chat Room Pane */}
      <main className="flex-1 flex flex-col bg-white">
        {activeChatRoomId ? (
          <ChatRoomPane chatRoomId={activeChatRoomId} />
        ) : (
          <div className="flex items-center justify-center flex-grow text-gray-500">
            Select a chat room from either column
          </div>
        )}
      </main>
    </div>
  );
}

// TanStack Router route definition
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
