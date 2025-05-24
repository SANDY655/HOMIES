import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { getCurrentUserIdFromToken } from "@/lib/getCurrentUserIdFromToken";
import { ChatRoomPane } from "./ChatRoomPane";

export function ChatWithSidebar() {
  const currentUserId = getCurrentUserIdFromToken();
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [openSection, setOpenSection] = useState<
    "myChats" | "ownerChats" | null
  >("myChats");

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
          className={`cursor-pointer p-3 border-b last:border-none hover:bg-indigo-100 rounded ${
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
    <div className="flex h-screen bg-gray-50 overflow-auto">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-300 bg-white flex flex-col">
        <h2 className="p-4 font-bold text-lg border-b border-gray-300">
          Chats
        </h2>

        <div className="flex-1 px-2 py-4 space-y-4">
          {/* My Chats Accordion */}
          <div>
            <button
              onClick={() =>
                setOpenSection(openSection === "myChats" ? null : "myChats")
              }
              className="w-full flex justify-between items-center px-4 py-2 bg-indigo-100 rounded cursor-pointer font-semibold text-indigo-700"
              aria-expanded={openSection === "myChats"}
            >
              My Chats (Tenants)
              <span className="ml-2 transform transition-transform duration-300">
                {openSection === "myChats" ? "▾" : "▸"}
              </span>
            </button>

            {openSection === "myChats" && (
              <ul className="mt-2 border rounded border-indigo-200">
                {myChats.length > 0 ? (
                  renderChatList(myChats)
                ) : (
                  <li className="p-4 text-center text-gray-400">
                    No chats yet
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Owner Chats Accordion */}
          <div>
            <button
              onClick={() =>
                setOpenSection(
                  openSection === "ownerChats" ? null : "ownerChats"
                )
              }
              className="w-full flex justify-between items-center px-4 py-2 bg-green-100 rounded cursor-pointer font-semibold text-green-700"
              aria-expanded={openSection === "ownerChats"}
            >
              Owner Chats
              <span className="ml-2 transform transition-transform duration-300">
                {openSection === "ownerChats" ? "▾" : "▸"}
              </span>
            </button>

            {openSection === "ownerChats" && (
              <ul className="mt-2 border rounded border-green-200">
                {ownerChats.length > 0 ? (
                  renderChatList(ownerChats)
                ) : (
                  <li className="p-4 text-center text-gray-400">
                    No chats yet
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Chat Room Pane */}
      <main className="flex-1 flex flex-col bg-white">
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
