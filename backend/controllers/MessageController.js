const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const saveMessage = async (req, res) => {
  try {
    const { chatRoomId, senderId, content } = req.body;

    if (!chatRoomId || !senderId || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const message = new Message({
      chatRoom: chatRoomId,
      sender: senderId,
      content,
    });

    const savedMessage = await message.save();
    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      latestMessage: savedMessage._id,
    });
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMessagesByChatRoom = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    const messages = await Message.find({ chatRoom: chatRoomId })
      .sort({ timestamp: 1 }) // Sort by time
      .populate("sender", "email"); // Optional: get sender info
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  saveMessage,
  getMessagesByChatRoom,
};
