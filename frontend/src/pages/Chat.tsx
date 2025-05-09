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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [receiverEmail, setReceiverEmail] = useState<string>("");
  const senderEmail = localStorage.getItem("email") ?? "unknown@user.com";

  useEffect(() => {
    const fetchRoomOwner = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/room/${roomId}`);
        const data = await res.json();
        if (data.success) {
          setReceiverEmail(data.data.email);
        }
      } catch (err) {
        console.error("Failed to fetch room owner email:", err);
      }
    };
    fetchRoomOwner();
  }, [roomId]);

  const mockSendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      sender: "user",
      senderEmail,
      receiverEmail,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      mockSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-100 to-gray-200">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-blue-700 text-white px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-xl font-semibold">Chat with Room Owner</h2>
          <div className="text-sm">
            <p>
              <span className="font-medium">You:</span> {senderEmail}
            </p>
            <p>
              <span className="font-medium">Owner:</span>{" "}
              {receiverEmail || "loading..."}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg) => (
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
                    : "bg-white text-gray-800 border rounded-bl-none"
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
            onClick={mockSendMessage}
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
  });
