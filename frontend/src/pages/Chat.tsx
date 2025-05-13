import { createRoute, RootRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "owner";
  senderEmail: string;
  receiverEmail: string;
  timestamp: string;
}

export function Chat() {
  const { roomId } = useParams({ strict: false }) as { roomId: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [receiverEmail, setReceiverEmail] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const rawEmail = localStorage.getItem("email") ?? "unknown@user.com";
  const senderEmail = rawEmail.replace(/^"|"$/g, ""); // Strip quotes if needed

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Step 1: Fetch room data to get owner's email
        const resRoom = await fetch(`http://localhost:5000/api/room/${roomId}`);
        const roomData = await resRoom.json();

        if (!roomData.success) throw new Error("Room fetch failed");
        const receiver = roomData.data.email;
        setReceiverEmail(receiver);

        // Step 2: Fetch sender and receiver user data
        const senderRes = await fetch(
          `http://localhost:5000/api/user/by-email?email=${senderEmail}`
        );
        const receiverRes = await fetch(
          `http://localhost:5000/api/user/by-email?email=${receiver}`
        );

        const senderUser = await senderRes.json();
        const receiverUser = await receiverRes.json();

        if (!senderUser?.data?._id || !receiverUser?.data?._id) {
          throw new Error("One or both users not found");
        }

        // Step 3: Create/start chat
        const chatRes = await fetch("http://localhost:5000/api/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: senderUser.data._id,
            otherUserId: receiverUser.data._id,
            roomId,
          }),
        });

        const chatData = await chatRes.json();
        setChatId(chatData.chat._id);

        // Step 4: Fetch existing messages
        const msgRes = await fetch(
          `http://localhost:5000/api/chat/messages/${chatData.chat._id}`
        );
        const msgData = await msgRes.json();

        setMessages(msgData?.messages || []);
      } catch (err) {
        console.error("Chat initialization failed:", err);
      }
    };

    initializeChat();
  }, [roomId, senderEmail]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
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

  return (
    <div className="w-full min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-100 to-gray-200">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-blue-700 text-white px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-xl font-semibold">Chat Room</h2>
          <p className="text-sm opacity-80">{receiverEmail}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {Array.isArray(messages) && messages.length > 0 ? (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-md text-sm relative ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <div className="text-[11px] mb-1 opacity-80">
                    {msg.senderEmail}
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
            ))
          ) : (
            <div className="text-center text-sm text-gray-500">
              No messages available.
            </div>
          )}
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
