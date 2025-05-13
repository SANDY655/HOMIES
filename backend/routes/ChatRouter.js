const express = require("express");
const {
  startChat,
  sendMessage,
  getMessages,
  getChats,
} = require("../controllers/ChatController");

const ChatRouter = express.Router();

ChatRouter.post("/start", startChat);
ChatRouter.post("/send", sendMessage);
ChatRouter.get("/messages/:chatId", getMessages);
ChatRouter.get("/user/:userId", getChats);

module.exports = { ChatRouter };
