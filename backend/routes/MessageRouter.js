const express = require("express");
const { sendMessage, getMessages } = require("../controllers/ChatController");
const MessageRouter = express.Router();
MessageRouter.post("/send", sendMessage);
MessageRouter.get("/:chatId", getMessages);
module.exports = { MessageRouter };
