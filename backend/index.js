const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

const { connectDB } = require("./connectDB");
const { userRouter } = require("./routes/UserRouter");
const { roomRouter } = require("./routes/RoomRouter");
const { ChatRouter } = require("./routes/ChatRouter");
const { MessageRouter } = require("./routes/MessageRouter");

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/room", roomRouter);
app.use("/api/chat", ChatRouter);
app.use("/api/message", MessageRouter);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle joining chat
  socket.on("join_chat", (chatId) => {
    console.log(`Socket ${socket.id} attempting to join chat: ${chatId}`);
    socket.join(chatId, () => {
      console.log(`Socket ${socket.id} joined chat: ${chatId}`);
    });
  });

  // Handle sending a message
  socket.on("send_message", (message) => {
    console.log("✅ Message received via socket:", message);
    if (!message.chatId) {
      console.warn("❌ message.chatId is undefined!");
    } else {
      console.log("🔁 Broadcasting message to room:", message.chatId);
      io.to(message.chatId).emit("receive_message", message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

connectDB().then(() => {
  server.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
  });
});
