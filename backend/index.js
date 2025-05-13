const express = require("express");
const cors = require("cors");
const { connectDB } = require("./connectDB");
const { userRouter } = require("./routes/UserRouter");
const { roomRouter } = require("./routes/RoomRouter");
const { ChatRouter } = require("./routes/ChatRouter");
const { MessageRouter } = require("./routes/MessageRouter");
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/room", roomRouter);
app.use("/api/chat", ChatRouter);
app.use("/api/message", MessageRouter);

connectDB().then(() => {
  app.listen(5000, () => {
    console.log("Server connected");
  });
});
