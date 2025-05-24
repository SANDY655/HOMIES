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

const getUserChatRooms = async (req, res) => {
  const { userId } = req.params;
  try {
    const chatRooms = await ChatRoom.find({
      participants: userId,
    })
      .populate("participants", "email avatar") // populate participants info you want
      .populate({
        path: "roomId", // populate the Room document
        populate: {
          path: "userId", // inside Room, populate the User (owner)
          select: "_id email", // select only fields you want
        },
      })
      .populate("latestMessage") // optional, if you want to show latest message preview
      .sort({ updatedAt: -1 });

    res.status(200).json(chatRooms);
  } catch (error) {
    console.error("Failed to get user's chat rooms:", error);
    res.status(500).json({ message: "Server error" });
  }
};

async function getChatRoomById(req, res) {
  const { chatRoomId } = req.params;

  try {
    // Find chat room by _id and populate the 'roomId' field (the Room)
    const chatRoom = await ChatRoom.findById(chatRoomId).populate({
      path: "roomId",
      select: "title", // only fetch the title field of the room
    });

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    res.json(chatRoom);
  } catch (error) {
    console.error("Error fetching chat room:", error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createOrGetChatRoom,
  getUserChatRooms,
  getChatRoomById,
};
