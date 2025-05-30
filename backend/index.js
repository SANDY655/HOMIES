const express = require("express");
const http = require("http");
const cors = require("cors");
const { connectDB } = require("./connectDB");
const { userRouter } = require("./routes/UserRouter");
const { roomRouter } = require("./routes/RoomRouter");
const { router } = require("./routes/cloudinaryRouter");
const messageRouter = require("./routes/MessageRoutes");
const chatRoomRouter = require("./routes/ChatRoomRoutes");
const { UserModel } = require("./models/UserModel");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// API Routes
app.use("/api/user", userRouter);
app.use("/api/room", roomRouter);
app.use("/api/cloud", router);
app.use("/api/chatroom", chatRoomRouter);
app.use("/api/message", messageRouter);

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`✅ User joined room: ${roomId}`);
  });

  socket.on("sendMessage", async ({ roomId, message, sender }) => {
    const user = await UserModel.findById(sender);
    const senderEmail = user?.email || "Unknown";
    const msg = {
      message,
      sender,
      senderEmail,
      senderName: user?.name,
      timestamp: new Date().toISOString(),
      chatRoomId: roomId,
    }; // Emit to all clients in the room, including the sender
    socket.to(roomId).emit("receiveMessage", msg);
    io.to(roomId).emit("updateMessage", msg);
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`⛔ User left room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("⛔ User disconnected:", socket.id);
  });
});

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
