const express = require("express");
const {
  startChat,
  getChats,
  sendMessage,
  getMessages,
} = require("../controllers/ChatController");

const ChatRouter = express.Router();

// Chat routes
ChatRouter.post("/start", startChat);
ChatRouter.post("/send", sendMessage); // ✅ Add this
ChatRouter.get("/messages/:chatId", getMessages); // ✅ Add this
ChatRouter.get("/user/:userId", getChats);

module.exports = { ChatRouter };
