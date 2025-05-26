import socket from "@/lib/socket";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { getCurrentUserIdFromToken } from "@/lib/getCurrentUserIdFromToken";

export function ChatRoomPane({ chatRoomId, onMessageSent }) {
  const currentUserId = getCurrentUserIdFromToken();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [roomTitle, setRoomTitle] = useState("Chat Room");

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chatroom/getChatRoom/${chatRoomId}`
        );
        setRoomTitle(res.data.roomId.title);
      } catch (error) {
        console.error("Failed to fetch chat room info:", error);
      }
    };

    fetchRoomInfo();
  }, [chatRoomId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          ` http://localhost:5000/api/message/${chatRoomId}`
        );
        const formattedMessages = res.data.map((msg) => ({
          text: msg.content,
          senderId: msg.sender._id,
          senderEmail: msg.sender.email,
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

    // socket.emit("joinRoom", chatRoomId);

    const handleMessage = (msg) => {
      // Only add the message if it belongs to the current chat room
      if (msg.chatRoomId === chatRoomId) {
        const newMsg = {
          text: msg.message,
          senderId: msg.sender,
          senderEmail: msg.senderEmail,
          timestamp: msg.timestamp,
        };

        setMessages((prev) => [...prev, newMsg]);
        onMessageSent(msg); // Notify parent of new message
      }
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      // socket.emit("leaveRoom", chatRoomId);
      socket.off("receiveMessage", handleMessage);
    };
  }, [chatRoomId, onMessageSent]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const msg = {
      text: newMessage,
      senderId: currentUserId,
      senderEmail: "Me", // We set 'Me' for the sender in the UI
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
      {" "}
      <header className="p-4 bg-indigo-600 text-white text-lg font-semibold shadow flex items-center justify-between">
        <div>Chat Room</div>{" "}
        <div className="p-2 text-white text-center font-medium">
          Title: {roomTitle}
        </div>{" "}
      </header>{" "}
      <main className="flex-1 overflow-y-auto px-4 py-2">
        {" "}
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No messages yet</p>
        ) : (
          <div className="space-y-2 flex flex-col">
            {" "}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded shadow w-fit max-w-[60%] ${
                  msg.senderId === currentUserId
                    ? "bg-indigo-200 self-end"
                    : "bg-white self-start"
                }`}
              >
                {" "}
                <div className="text-sm font-semibold">
                  {msg.senderId === currentUserId ? "Me" : msg.senderEmail}
                </div>
                <div>{msg.text}</div>{" "}
                <div className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>{" "}
              </div>
            ))}
            <div ref={messagesEndRef} />{" "}
          </div>
        )}{" "}
      </main>{" "}
      <footer className="p-4 border-t bg-white flex gap-2">
        {" "}
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />{" "}
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
          onClick={sendMessage}
        >
          Send{" "}
        </button>{" "}
      </footer>{" "}
    </div>
  );
}
