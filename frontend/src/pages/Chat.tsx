import { createRoute, RootRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

interface Message {
  _id: string;
  text: string;
  sender: {
    _id: string;
    email: string;
  };
  timestamp: string;
}

interface ChatResponse {
  _id: string;
  members: { _id: string; email: string }[];
}

export function Chat() {
  const { roomId } = useParams({ strict: false }) as { roomId: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatMembers, setChatMembers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const rawEmail = localStorage.getItem("email") ?? "unknown@user.com";
  const senderEmail = rawEmail.replace(/^"|"$/g, "");

  useEffect(() => {
    const initializeChat = async () => {
      try {
        // 1. Get room owner by roomId
        const resRoom = await fetch(`http://localhost:5000/api/room/${roomId}`);
        const roomData = await resRoom.json();
        if (!roomData.success) throw new Error("Room fetch failed");

        const receiverEmail = roomData.data.email;

        // 2. Fetch both users
        const senderRes = await fetch(
          `http://localhost:5000/api/user/by-email?email=${senderEmail}`
        );
        const receiverRes = await fetch(
          `http://localhost:5000/api/user/by-email?email=${receiverEmail}`
        );

        const senderUser = await senderRes.json();
        const receiverUser = await receiverRes.json();

        if (!senderUser?.data?._id || !receiverUser?.data?._id) {
          throw new Error("User(s) not found");
        }

        // 3. Start or get chat
        const chatRes = await fetch("http://localhost:5000/api/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: senderUser.data._id,
            otherUserId: receiverUser.data._id,
            roomId,
          }),
        });

        const chatData: { chat: ChatResponse } = await chatRes.json();
        setChatId(chatData.chat._id);

        const emails = chatData.chat.members.map((m) => m.email);
        setChatMembers(emails);

        // 4. Get messages
        const msgRes = await fetch(
          `http://localhost:5000/api/chat/messages/${chatData.chat._id}`
        );
        // Update this block
        const msgData = await msgRes.json();
        if (msgData.success && Array.isArray(msgData.messages)) {
          setMessages(msgData.messages);
        } else {
          setMessages([]); // Fallback to empty array
          console.error("Unexpected messages response:", msgData);
        }
      } catch (err) {
        console.error("Chat initialization failed:", err);
      }
    };

    initializeChat();
  }, [roomId, senderEmail]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId) return;

    try {
      const senderRes = await fetch(
        `http://localhost:5000/api/user/by-email?email=${senderEmail}`
      );
      const senderUser = await senderRes.json();

      if (!senderUser?.data?._id) throw new Error("Sender not found");

      const newMsg = {
        chatId,
        senderId: senderUser.data._id,
        text: input.trim(),
      };

      const res = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTimestamp = (timestamp: string) => {
    const parsed = Date.parse(timestamp);
    if (!isNaN(parsed)) {
      return new Date(parsed).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "Invalid Date";
  };

  const otherEmail = chatMembers.find((email) => email !== senderEmail);

  return (
    <div className="w-full min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-100 to-gray-200">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-blue-700 text-white px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-xl font-semibold">
            Chat with {otherEmail || "Loading..."}
          </h2>
          <div className="text-sm">
            <p>
              <span className="font-medium">You:</span> {senderEmail}
            </p>
            <p>
              <span className="font-medium">Other:</span>{" "}
              {otherEmail || "loading..."}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${
                msg.sender.email === senderEmail
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-md text-sm relative ${
                  msg.sender.email === senderEmail
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 border rounded-bl-none"
                }`}
              >
                <div className="text-[11px] mb-1 opacity-80">
                  {msg.sender.email}
                </div>
                {msg.text}
                <div className="text-[10px] text-right mt-1 opacity-60">
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
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

// Route setup
export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chat/$roomId",
    component: Chat,
    getParentRoute: () => parentRoute,
  });
