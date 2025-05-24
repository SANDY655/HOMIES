// routes/chat/ChatRoom.tsx
import socket from "@/lib/socket";
import { getCurrentUserIdFromToken } from "@/lib/getCurrentUserIdFromToken";
import {
  createRoute,
  redirect,
  RootRoute,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

export function ChatRoom() {
  const { chatRoomId } = useParams({ from: "/chat/$chatRoomId" });
  const currentUserId = getCurrentUserIdFromToken();

  const [messages, setMessages] = useState<
    { text: string; senderId: string; senderEmail: string; timestamp: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [roomTitle, setRoomTitle] = useState("Chat Room");

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chatroom/getChatRoom/${chatRoomId}`
        );
        const chatRoom = res.data;
        console.log(chatRoom)
        setRoomTitle(chatRoom.roomId?.title);
        console.log(res)
      } catch (error) {
        console.error("Failed to fetch chat room info:", error);
      }
    };

    fetchRoomInfo();
  }, [chatRoomId, currentUserId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/message/${chatRoomId}`
        );
        const formattedMessages = res.data.map((msg: any) => ({
          text: msg.content,
          senderId:
            typeof msg.sender === "object" ? msg.sender._id : msg.sender,
          senderEmail: typeof msg.sender === "object" ? msg.sender.email : "",
          timestamp: msg.timestamp,
        }));

        setMessages(formattedMessages);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [chatRoomId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("joinRoom", chatRoomId);

    const handleMessage = (msg: any) => {
      // Ensure msg has senderId and senderEmail fields
      const newMsg = {
        text: msg.message || msg.text,
        senderId: msg.sender || "",
        senderEmail: msg.senderEmail || "Unknown",
        timestamp: msg.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.emit("leaveRoom", chatRoomId);
      socket.off("receiveMessage", handleMessage);
    };
  }, [chatRoomId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const msg = {
      text: newMessage,
      senderId: currentUserId,
      senderEmail: "Me",
      timestamp: new Date().toISOString(),
    };

    socket.emit("sendMessage", {
      roomId: chatRoomId,
      message: newMessage,
      sender: currentUserId,
    });

    try {
      await axios.post("http://localhost:5000/api/message/save", {
        chatRoomId: chatRoomId,
        senderId: currentUserId,
        content: newMessage,
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }

    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="p-4 bg-indigo-600 text-white text-lg font-semibold shadow flex items-center justify-between">
        Chat Room
        <div className="p-2 text-white text-center font-medium">
          Title: {roomTitle}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No messages yet</p>
        ) : (
          <div className="space-y-2 flex flex-col">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded shadow w-fit max-w-[60%] ${
                  msg.senderId === currentUserId
                    ? "bg-indigo-200 self-end"
                    : "bg-white self-start"
                }`}
              >
                <div className="text-sm font-semibold">
                  {msg.senderId === currentUserId ? "Me" : msg.senderEmail}
                </div>
                <div>{msg.text}</div>
                <div className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
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
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
          onClick={sendMessage}
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
