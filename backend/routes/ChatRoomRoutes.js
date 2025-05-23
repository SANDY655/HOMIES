const express = require("express");
const {
  createOrGetChatRoom,
  getChatRoomDetails,
} = require("../controllers/ChatRoomController");
const router = express.Router();

router.post("/createOrGet", createOrGetChatRoom);
router.get("/:chatRoomId", getChatRoomDetails);

module.exports = router;
