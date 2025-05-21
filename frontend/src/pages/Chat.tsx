// Chat.tsx
import {
  createRoute,
  redirect,
  RootRoute,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import socket from "../socket";
import { ChatList } from "./ChatList";

interface Message {
  _id?: string;
  chatId: string;
  text: string;
  sender: "user" | "owner";
  senderEmail: string;
  receiverEmail: string;
  timestamp: string;
}

const fetchRoom = async (roomId: string) => {
  const res = await fetch(`http://localhost:5000/api/room/${roomId}`);
  const data = await res.json();
  if (!data.success) throw new Error("Room fetch failed");
  return data.data;
};

const fetchUserByEmail = async (email: string) => {
  const res = await fetch(
    `http://localhost:5000/api/user/by-email?email=${email}`
  );
  const data = await res.json();
  if (!data.success) throw new Error("User fetch failed");
  return data.data;
};

const startOrFetchChat = async ({
  userId,
  otherUserId,
  roomId,
}: {
  userId: string;
  otherUserId: string;
  roomId: string;
}) => {
  const res = await fetch("http://localhost:5000/api/chat/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, otherUserId, roomId }),
  });
  const data = await res.json();
  console.log(data);
  if (!data.success) throw new Error("Chat start failed");
  return data.chat;
};

const fetchMessages = async (chatId: string) => {
  const res = await fetch(`http://localhost:5000/api/chat/messages/${chatId}`);
  const data = await res.json();
  if (!data.success) throw new Error("Message fetch failed");
  return data.messages;
};

export function Chat() {
  const { roomId } = useParams({ strict: false }) as { roomId: string };
  const senderEmail = (
    localStorage.getItem("email") ?? "unknown@user.com"
  ).replace(/^"|"$/g, "");

  const [input, setInput] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: roomData } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoom(roomId),
  });

  useEffect(() => {
    if (roomData?.email) {
      setReceiverEmail(roomData.email);
    }
  }, [roomData]);

  const { data: senderUser } = useQuery({
    queryKey: ["user", senderEmail],
    queryFn: () => fetchUserByEmail(senderEmail),
    enabled: !!roomData,
  });

  const { data: receiverUser } = useQuery({
    queryKey: ["user", receiverEmail],
    queryFn: () => fetchUserByEmail(receiverEmail),
    enabled: !!receiverEmail,
  });

  const { data: chat } = useQuery({
    queryKey: ["chat", senderUser?._id, receiverUser?._id, roomId],
    queryFn: () =>
      startOrFetchChat({
        userId: senderUser._id,
        otherUserId: receiverUser._id,
        roomId,
      }),
    enabled: !!senderUser && !!receiverUser,
  });

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["messages", chat?._id],
    queryFn: () => fetchMessages(chat._id),
    enabled: !!chat?._id,
  });

  useEffect(() => {
    if (!chat?._id) return;
    if (!socket.connected) socket.connect();
    socket.emit("join_chat", chat._id);
    return () => socket.off("receive_message");
  }, [chat?._id]);

  useEffect(() => {
    const handler = () => refetch();
    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [refetch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !chat?._id) return;
    const messageText = input.trim();
    setInput("");
    try {
      const res = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chat._id,
          senderId: senderUser._id,
          text: messageText,
        }),
      });
      const data = await res.json();
      socket.emit("send_message", data.message);
    } catch (err) {
      console.error("Send error", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 gap-4">
      {/* ChatList Sidebar */}
      <div className="hidden lg:block w-80 shrink-0">
        <ChatList />
      </div>

      {/* Chat Window */}
      <div className="flex-1 max-w-full">
        <div className="w-full h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="sticky top-0 z-10 bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow-md">
            <h2 className="text-2xl font-bold">Chat Room</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-800 scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-blue-500 scrollbar-track-transparent">
            {messages.length > 0 ? (
              messages.map((msg, idx) => {
                const isSender = msg.senderEmail === senderEmail;
                return (
                  <div
                    key={idx}
                    className={`flex ${
                      isSender ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-md text-sm relative ${
                        isSender
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-bl-none"
                      }`}
                    >
                      <div className="text-[11px] mb-1 opacity-80 font-semibold select-none">
                        {isSender ? "You" : msg.senderEmail}
                      </div>
                      <div>{msg.text}</div>
                      <div className="text-[10px] text-right mt-1 text-gray-400 dark:text-gray-300 select-none">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 italic mt-6 select-none">
                No messages yet.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 px-5 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-full shadow transition focus:ring-4 focus:ring-blue-400"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chat/$roomId",
    component: Chat,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
