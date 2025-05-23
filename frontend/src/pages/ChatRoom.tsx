// routes/chat/ChatRoom.tsx
import {
  createRoute,
  redirect,
  RootRoute,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";

export function ChatRoom() {
  const { chatRoomId } = useParams({ from: '/chat/$chatRoomId' });

  if (!chatRoomId) {
    return <div>Error: Chat room ID is missing.</div>;
  }

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="p-4 bg-indigo-600 text-white text-lg font-semibold shadow">
        Chat Room
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No messages yet</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className="bg-white p-2 rounded shadow w-fit">
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="p-4 border-t bg-white flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
          onClick={() => {
            if (!newMessage.trim()) return;
            // Placeholder send logic
            setMessages((prev) => [...prev, { text: newMessage }]);
            setNewMessage("");
          }}
        >
          Send
        </button>
      </footer>
    </div>
  );
}
export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/chat/$chatRoomId",
    component: ChatRoom,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
