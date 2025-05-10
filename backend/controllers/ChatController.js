const { ChatModel } = require("../models/ChatModel");
const { MessageModel } = require("../models/MessageModel");

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
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

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
    return res.json({
      message,
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

async function getMessages(req, res) {
  try {
    const { chatId } = req.params;
    const messages = await MessageModel.find({ chatId }).populate(
      "sender",
      "email"
    );
    return res.json({
      messages,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

async function getChats(req, res) {
  try {
    const { userId } = req.params;
    const chats = await ChatModel.find({ members: userId })
      .populate("members", "email")
      .populate("latestMessage");
    return res.json({
      chats,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

module.exports = { startChat, sendMessage, getMessages, getChats };
