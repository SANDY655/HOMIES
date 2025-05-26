import socket from "@/lib/socket";
import {
  createRoute,
  redirect,
  useNavigate,
  useSearch,
  type RootRoute,
} from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getCurrentUserIdFromToken } from "@/lib/getCurrentUserIdFromToken";
import { ChatRoomPane } from "./ChatRoomPane";
import { ArrowLeftIcon } from "lucide-react";

interface Participant {
  _id: string;
  email: string;
}

interface LatestMessage {
  content: string;
  timestamp: string;
}

interface ChatRoom {
  _id: string;
  participants: Participant[];
  roomId?: {
    _id: string;
    title: string;
    userId?: { _id: string };
  };
  latestMessage?: LatestMessage;
}

export function ChatWithSidebar() {
  const currentUserId = getCurrentUserIdFromToken();
  const navigate = useNavigate();
  const { chatRoomId } = useSearch({ strict: false }) as {
    chatRoomId?: string;
  };
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    "myChats" | "ownerChats" | undefined
  >(undefined);
  const [messagesByRoom, setMessagesByRoom] = useState<{
    [key: string]: any[];
  }>({});

  useEffect(() => {
    if (!currentUserId) return;

    const fetchChatRooms = async () => {
      try {
        const res = await axios.get<ChatRoom[]>(
          `http://localhost:5000/api/chatroom/${currentUserId}`
        );
        setChatRooms(res.data);

        res.data.forEach((room) => {
          if (!socket.connected) {
            socket.connect();
          }
          socket.emit("joinRoom", room._id);
        });
      } catch (error) {
        console.error("Failed to fetch chat rooms:", error);
      }
    };

    fetchChatRooms();

    return () => {
      chatRooms.forEach((room) => {
        socket.emit("leaveRoom", room._id);
      });
      socket.disconnect();
    };
  }, [currentUserId]);

  const handleReceiveMessage = useCallback((msg) => {
    setMessagesByRoom((prevMessagesByRoom) => {
      const roomMessages = prevMessagesByRoom[msg.chatRoomId] || [];
      return {
        ...prevMessagesByRoom,
        [msg.chatRoomId]: [
          ...roomMessages,
          {
            text: msg.message,
            senderId: msg.sender,
            senderEmail: msg.senderEmail,
            timestamp: msg.timestamp,
          },
        ],
      };
    }); // Update the latest message for the sidebar

    setChatRooms((prevChatRooms) => {
      const updatedChatRooms = [...prevChatRooms];
      const roomIndex = updatedChatRooms.findIndex(
        (room) => room._id === msg.chatRoomId
      );

      if (roomIndex > -1) {
        updatedChatRooms[roomIndex].latestMessage = {
          content: msg.message,
          timestamp: msg.timestamp,
        };
        const [movedRoom] = updatedChatRooms.splice(roomIndex, 1);
        updatedChatRooms.unshift(movedRoom);
      }

      return updatedChatRooms;
    });
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("updateMessage", handleReceiveMessage);

    return () => {
      socket.off("updateMessage", handleReceiveMessage);
    };
  }, [handleReceiveMessage]);

  useEffect(() => {
    if (!chatRoomId || chatRooms.length === 0 || !currentUserId) {
      setSelectedTab(undefined);
      return;
    }

    const selectedRoom = chatRooms.find((room) => room._id === chatRoomId);
    if (!selectedRoom) {
      setSelectedTab(undefined);
      return;
    }

    setSelectedTab(
      selectedRoom.roomId?.userId?._id === currentUserId
        ? "myChats"
        : "ownerChats"
    );
  }, [chatRoomId, chatRooms, currentUserId]);

  const myChats = chatRooms.filter(
    (room) => room.roomId?.userId?._id === currentUserId
  );
  const ownerChats = chatRooms.filter(
    (room) => room.roomId?.userId?._id !== currentUserId
  );

  const renderChatList = (rooms: ChatRoom[]) =>
    rooms.map((room) => {
      const otherParticipant = room.participants.find(
        (p) => p._id !== currentUserId
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
          }}
          className={`cursor-pointer p-3 border-none hover:bg-indigo-100 rounded ${
            room._id === chatRoomId ? "bg-indigo-300 font-semibold" : ""
          }`}
        >
          <div className="text-sm truncate">{displayName}</div>{" "}
          <div className="text-xs text-gray-700 truncate">
            {room.latestMessage?.content || "No messages yet"}
          </div>{" "}
          {room.latestMessage && (
            <div className="text-xs text-gray-500 text-right">
              {" "}
              {new Date(room.latestMessage.timestamp).toLocaleTimeString()}{" "}
            </div>
          )}{" "}
        </li>
      );
    });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {" "}
      <aside className="w-80 border-r border-gray-300 bg-white flex flex-col">
        {" "}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-300">
          <button
            onClick={() => navigate({ to: "/dashboard", search: {} })}
            className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon />
          </button>
          <h2 className="font-bold text-lg select-none">Chats</h2>{" "}
        </div>{" "}
        <div className="flex justify-around border-b">
          {" "}
          <button
            className={`w-full py-2 font-semibold ${
              selectedTab === "myChats"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => setSelectedTab("myChats")}
          >
            My Chats{" "}
          </button>{" "}
          <button
            className={`w-full py-2 font-semibold ${
              selectedTab === "ownerChats"
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500"
            }`}
            onClick={() => setSelectedTab("ownerChats")}
          >
            Owner Chats{" "}
          </button>{" "}
        </div>{" "}
        <div className="flex-1 overflow-y-auto">
          {" "}
          <ul>
            {" "}
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
            )}{" "}
          </ul>{" "}
        </div>{" "}
      </aside>{" "}
      <main className="flex-1 flex flex-col bg-white">
        {" "}
        {!chatRoomId ? (
          <div className="flex items-center justify-center flex-grow text-gray-500">
            Start a chat by selecting a chat room from the sidebar{" "}
          </div>
        ) : (
          <ChatRoomPane
            chatRoomId={chatRoomId}
            onMessageSent={handleReceiveMessage}
          />
        )}{" "}
      </main>{" "}
    </div>
  );
}

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
