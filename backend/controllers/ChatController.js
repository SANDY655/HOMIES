const { ChatModel } = require("../models/ChatModel");
const { MessageModel } = require("../models/MessageModel");
const { UserModel } = require("../models/UserModel");

// Start or fetch chat
async function startChat(req, res) {
  const { userId, otherUserId, roomId } = req.body;
  if (!userId || !otherUserId) {
    return res.status(400).json({
      message: "Missing User IDs",
      error: true,
      success: false,
    });
  }
  try {
    let chat = await ChatModel.findOne({
      members: { $all: [userId, otherUserId] },
      ...(roomId ? { roomId } : {}),
    });

    if (!chat) {
      chat = await ChatModel.create({
        members: [userId, otherUserId],
        roomId: roomId || null,
      });
    }

    return res.json({ chat, error: false, success: true });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

// Send a message
async function sendMessage(req, res) {
  const { chatId, senderId, text } = req.body;
  if (!chatId || !senderId || !text) {
    return res.status(400).json({
      message: "Missing fields",
      error: true,
      success: false,
    });
  }

  try {
    const message = await MessageModel.create({
      chatId,
      sender: senderId,
      text,
    });
    await ChatModel.findByIdAndUpdate(chatId, { latestMessage: message._id });

    const populatedMessage = await message.populate("sender", "email");
    const chat = await ChatModel.findById(chatId).populate("members", "email");

    const senderRole = chat.members[0]._id.equals(populatedMessage.sender._id)
      ? "user"
      : "owner";
    const receiver = chat.members.find(
      (m) => !m._id.equals(populatedMessage.sender._id)
    );

    return res.json({
      message: {
        id: populatedMessage._id,
        chatId: populatedMessage.chatId,
        text: populatedMessage.text,
        sender: senderRole,
        senderEmail: populatedMessage.sender.email,
        receiverEmail: receiver ? receiver.email : null,
        timestamp: populatedMessage.createdAt,
      },
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

// Get all messages for a chat
async function getMessages(req, res) {
  try {
    const { chatId } = req.params;
    const chat = await ChatModel.findById(chatId).populate("members", "email");
    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
        error: true,
        success: false,
      });
    }

    const messages = await MessageModel.find({ chatId })
      .populate("sender", "email")
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map((msg) => {
      const senderRole = chat.members[0]._id.equals(msg.sender._id)
        ? "user"
        : "owner";
      const receiver = chat.members.find((m) => !m._id.equals(msg.sender._id));

      return {
        id: msg._id,
        chatId: msg.chatId,
        text: msg.text,
        sender: senderRole,
        senderEmail: msg.sender.email,
        receiverEmail: receiver ? receiver.email : null,
        timestamp: msg.createdAt,
      };
    });

    return res.json({
      messages: formattedMessages,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

// Get all chats for a user (by userId or email)
async function getChats(req, res) {
  try {
    const identifier = req.params.userId;

    let user;
    if (identifier.length === 24) {
      user = await UserModel.findById(identifier);
    } else {
      user = await UserModel.findOne({ email: identifier });
    }

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const chats = await ChatModel.find({ members: user._id })
      .populate("members", "email")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "email" },
      })
      .sort({ updatedAt: -1 });

    return res.json({ chats, error: false, success: true });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

module.exports = {
  startChat,
  sendMessage,
  getMessages,
  getChats,
};
