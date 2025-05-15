import { createRoute, RootRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import socket from "../socket";

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

    return () => {
      socket.off("receive_message");
    };
  }, [chat?._id]);

  useEffect(() => {
    const handler = (msg: Message) => {
      refetch();
    };
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

    const optimisticMessage: Message = {
      chatId: chat._id,
      text: messageText,
      sender: "user",
      senderEmail,
      receiverEmail,
      timestamp: new Date().toISOString(),
    };

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
    <div className="w-full min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-100 to-gray-200">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="sticky top-0 z-10 bg-blue-700 text-white px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-xl font-semibold">Chat Room</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
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
                    className={`break-words max-w-[75%] px-4 py-3 rounded-2xl shadow-md text-sm relative ${
                      isSender
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <div className="text-[11px] mb-1 opacity-80">
                      {isSender ? "You" : msg.senderEmail}
                    </div>
                    {msg.text}
                    <div className="text-[10px] text-right mt-1 opacity-60">
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
            <div className="text-center text-sm text-gray-500">
              No messages yet.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition"
          >
            Send
          </button>
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
