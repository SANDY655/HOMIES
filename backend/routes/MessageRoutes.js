const express = require("express");
const { saveMessage, getMessagesByChatRoom } = require("../controllers/MessageController");

const router = express.Router();

// Route to save a message
router.post("/save", saveMessage);
router.get("/:chatRoomId", getMessagesByChatRoom);

module.exports = router;
