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

    const populatedMessage = await message.populate("sender", "email");
    const chat = await ChatModel.findById(chatId).populate("members", "email");

    const receiver = chat.members.find(
      (member) => !member._id.equals(populatedMessage.sender._id)
    );

    return res.json({
      message: {
        id: populatedMessage._id,
        text: populatedMessage.text,
        senderEmail: populatedMessage.sender.email,
        receiverEmail: receiver ? receiver.email : null,
        timestamp: populatedMessage.createdAt,
      },
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
    const chat = await ChatModel.findById(chatId).populate("members", "email");
    const messages = await Message.find({ chatId })
      .populate("sender", "email") // make sure sender is populated with email
      .sort({ timestamp: 1 }); // or createdAt

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
        error: true,
        success: false,
      });
    }

    const members = chat.members;

    const formattedMessages = messages.map((msg) => {
      const receiver = members.find(
        (member) => !member._id.equals(msg.sender._id)
      );

      return {
        id: msg._id,
        text: msg.text,
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
