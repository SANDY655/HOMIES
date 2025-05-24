// routes/chat/ChatWithSidebar.tsx
import {
  createRoute,
  redirect,
  type RootRoute,
} from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentUserIdFromToken } from '@/lib/getCurrentUserIdFromToken';
import { ChatRoomPane } from './ChatRoomPane'; // ✅ make sure this path is correct

export function ChatWithSidebar() {
  const currentUserId = getCurrentUserIdFromToken();

  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<
    {
      _id: string;
      title?: string;
      participants: { _id: string; email?: string; avatar?: string }[];
      latestMessage?: { content: string };
    }[]
  >([]);

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
        console.error('Failed to fetch chat rooms:', error);
      }
    };

    fetchChatRooms();
  }, [currentUserId]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-300 bg-white overflow-y-auto">
        <h2 className="p-4 font-bold text-lg border-b border-gray-300">Chats</h2>
        <ul>
          {chatRooms.map((room) => {
            const otherParticipant = room.participants.find(
              (p) => p._id !== currentUserId
            );
            const displayName = otherParticipant?.email || 'Unknown';

            return (
              <li
                key={room._id}
                onClick={() => setActiveChatRoomId(room._id)}
                className={`cursor-pointer p-4 hover:bg-gray-100 ${
                  room._id === activeChatRoomId ? 'bg-indigo-100' : ''
                }`}
              >
                <div className="font-semibold">{displayName}</div>
                <div className="text-sm text-gray-600 truncate">
                  {room.latestMessage?.content || 'No messages yet'}
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main chat room pane */}
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

// ✅ Route definition for TanStack Router
export default (parentRoute: RootRoute) =>
  createRoute({
    path: '/chatwithsidebar',
    component: ChatWithSidebar,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: '/', search: { redirect: location.href } });
      }
    },
  });
