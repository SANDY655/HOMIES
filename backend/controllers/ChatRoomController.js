const ChatRoom = require("../models/ChatRoom");

const createOrGetChatRoom = async (req, res) => {
  const { userId1, userId2, roomId } = req.body;

  if (!userId1 || !userId2 || !roomId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Check if a chat room already exists
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId1, userId2], $size: 2 },
      roomId,
    });

    if (!chatRoom) {
      // Create a new chat room
      chatRoom = new ChatRoom({
        participants: [userId1, userId2],
        roomId,
      });

      await chatRoom.save();
    }
    res.status(200).json(chatRoom);
  } catch (error) {
    console.error("Error in createOrGetChatRoom:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createOrGetChatRoom };
