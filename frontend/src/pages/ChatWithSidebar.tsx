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

        // Preselect the first available room
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
          className={`cursor-pointer p-4 border-b hover:bg-gray-100 ${
            room._id === activeChatRoomId ? "bg-indigo-100 font-semibold" : ""
          }`}
        >
          <div className="text-sm">{displayName}</div>
          <div className="text-xs text-gray-600 truncate">
            {room.latestMessage?.content || "No messages yet"}
          </div>
        </li>
      );
    });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-300 bg-white flex flex-col">
        <h2 className="p-4 font-bold text-lg border-b border-gray-300">
          Chats
        </h2>

        <div className="flex-1 overflow-y-auto space-y-6 px-0 pb-4">
          {/* Tenants Section */}
          <div>
            <h3 className="px-4 pt-4 pb-2 text-sm font-medium text-indigo-600">
              Tenants
            </h3>
            {myChats.length > 0 ? (
              <ul className="max-h-64 overflow-y-auto">
                {renderChatList(myChats)}
              </ul>
            ) : (
              <div className="text-center p-4 text-sm text-gray-400">
                No chats yet
              </div>
            )}
          </div>

          {/* Owners Section */}
          <div>
            <h3 className="px-4 pt-4 pb-2 text-sm font-medium text-indigo-600">
              Owners
            </h3>
            {ownerChats.length > 0 ? (
              <ul className="max-h-64 overflow-y-auto">
                {renderChatList(ownerChats)}
              </ul>
            ) : (
              <div className="text-center p-4 text-sm text-gray-400">
                No chats yet
              </div>
            )}
          </div>

          {/* Empty State */}
          {chatRooms.length === 0 && (
            <div className="text-center p-4 text-sm text-gray-400">
              No chats yet
            </div>
          )}
        </div>
      </aside>
      {/* Chat Room Pane */}
      <main className="flex-1 flex flex-col">
        {activeChatRoomId ? (
          <ChatRoomPane chatRoomId={activeChatRoomId} />
        ) : (
          <div className="flex items-center justify-center flex-grow text-gray-500">
            Select a chat room from the sidebar
          </div>
        )}
      </main>
    </div>
  );
}

// ✅ TanStack Router route definition
export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chatwithsidebar",
    component: ChatWithSidebar,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
