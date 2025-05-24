const express = require("express");
const {
  createOrGetChatRoom,
  getChatRoomDetails,
  getUserChatRooms,
  getChatRoomById,
} = require("../controllers/ChatRoomController");
const router = express.Router();

router.post("/createOrGet", createOrGetChatRoom);
router.get("/:userId", getUserChatRooms);
router.get("/getChatRoom/:chatRoomId", getChatRoomById);

module.exports = router;
