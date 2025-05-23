const express = require("express");
const cors = require("cors");
const { connectDB } = require("./connectDB");
const { userRouter } = require("./routes/UserRouter");
const { roomRouter } = require("./routes/RoomRouter");
const { router } = require("./routes/cloudinaryRouter");
const chatRoomRouter = require("./routes/ChatRoomRoutes");

const app = express();
// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// API RoutesA
app.use("/api/user", userRouter);
app.use("/api/room", roomRouter);
app.use("/api/cloud", router);
app.use("/api/chatroom", chatRoomRouter);

// Start server after DB connection
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
