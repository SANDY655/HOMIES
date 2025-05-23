const express = require("express");
const { createOrGetChatRoom } = require("../controllers/ChatRoomController");
const router = express.Router();

router.post("/createOrGet", createOrGetChatRoom);

module.exports = router;