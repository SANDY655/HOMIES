const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

const { connectDB } = require("./connectDB");
const { userRouter } = require("./routes/UserRouter");
const { roomRouter } = require("./routes/RoomRouter");
const { ChatRouter } = require("./routes/ChatRouter");
const { MessageRouter } = require("./routes/MessageRouter");
const { router } = require("./routes/cloudinaryRouter");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS for frontend
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// API Routes
app.use("/api/user", userRouter);
app.use("/api/room", roomRouter);
app.use("/api/chat", ChatRouter);
app.use("/api/message", MessageRouter);
app.use("/api/cloud", router);

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Handle user joining a chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`➡️ Socket ${socket.id} joined chat: ${chatId}`);
  });

  // Handle sending messages
  socket.on("send_message", (message) => {
    if (!message.chatId) {
      console.warn("❌ Message missing chatId:", message);
      return;
    }

    console.log("📨 Message received:", message);

    // Emit the message to the specific chat room
    io.to(message.chatId).emit("receive_message", message);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// Start server after DB connection
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
