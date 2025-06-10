import socket from "@/lib/socket";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { getCurrentUserIdFromToken } from "@/lib/getCurrentUserIdFromToken";

interface ChatRoomPaneProps {
  chatRoomId: string;
  onMessageSent: (msg: any) => void;
  theme: "dark" | "light";
}

export function ChatRoomPane({
  chatRoomId,
  onMessageSent,
  theme,
}: ChatRoomPaneProps) {
  const currentUserId = getCurrentUserIdFromToken();
  interface Message {
    text: string;
    senderId: string;
    senderEmail?: string;
    senderName?: string;
    timestamp: string;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [roomTitle, setRoomTitle] = useState("Chat Room");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const res = await axios.get(
          `https://homies-oqpt.onrender.com/api/chatroom/getChatRoom/${chatRoomId}`
        );
        setRoomTitle(res.data.roomId.title);
      } catch (error) {
        console.error("Failed to fetch chat room info:", error);
      }
    };
    fetchRoomInfo();
  }, [chatRoomId]);

  interface ApiMessage {
    content: string;
    sender: {
      _id: string;
      email: string;
      name?: string;
    };
    timestamp: string;
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `https://homies-oqpt.onrender.com/api/message/${chatRoomId}`
        );
        const formattedMessages = res.data.map((msg: ApiMessage) => ({
          text: msg.content,
          senderId: msg.sender._id,
          senderEmail: msg.sender.email,
          senderName: msg.sender.name || "Unknown",
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [chatRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleMessage = (msg: {
      chatRoomId: string;
      message: string;
      sender: string;
      senderName?: string;
      senderEmail?: string;
      timestamp: string;
    }) => {
      if (msg.chatRoomId === chatRoomId) {
        const newMsg = {
          text: msg.message,
          senderId: msg.sender,
          senderName: msg.senderName || "Unknown",
          senderEmail: msg.senderEmail,
          timestamp: msg.timestamp,
        };
        setMessages((prev) => [...prev, newMsg]);
        onMessageSent(msg);
      }
    };

    socket.on("receiveMessage", handleMessage);
    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [chatRoomId, onMessageSent]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const msg = {
      text: newMessage,
      senderId: currentUserId ?? "",
      senderEmail: "Me",
      senderName: "You",
      timestamp: new Date().toISOString(),
    };

    socket.emit("sendMessage", {
      roomId: chatRoomId,
      message: newMessage,
      sender: currentUserId,
    });

    try {
      await axios.post("https://homies-oqpt.onrender.com/api/message/save", {
        chatRoomId,
        senderId: currentUserId,
        content: newMessage,
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }

    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  const containerClass =
    theme === "dark"
      ? "bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100"
      : "bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800";

  const headerClass =
    theme === "dark"
      ? "bg-gradient-to-r from-purple-800 to-indigo-800 text-white"
      : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white";

  const inputClass =
    theme === "dark"
      ? "bg-gray-700 text-white border-gray-600 focus:ring-indigo-400"
      : "bg-white text-black border-slate-300 focus:ring-indigo-400";

  const footerClass =
    theme === "dark"
      ? "bg-gray-900 border-t border-gray-700"
      : "bg-white border-t";

  return (
    <div className={`flex flex-col h-screen ${containerClass}`}>
      <header
        className={`px-6 py-4 shadow-lg flex items-center justify-between ${headerClass}`}
      >
        <h1 className="text-xl font-bold">💬 Chat Room</h1>
        <span className="text-sm font-medium">Room: {roomTitle}</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 italic">No messages yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm transition-all duration-300 ${
                  msg.senderId === currentUserId
                    ? theme === "dark"
                      ? "bg-indigo-700 self-end"
                      : "bg-indigo-100 self-end"
                    : theme === "dark"
                    ? "bg-gray-700 self-start"
                    : "bg-white self-start"
                }`}
              >
                <div className="text-sm font-semibold mb-1">
                  {msg.senderId === currentUserId ? "You" : msg.senderName}
                </div>
                <div className="text-base">{msg.text}</div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer
        className={`p-4 shadow-inner flex items-center gap-2 ${footerClass}`}
      >
        <input
          type="text"
          className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-all ${inputClass}`}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
