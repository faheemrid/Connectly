const Message = require("../models/Message");
const User = require("../models/User");
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text) {
      return res.status(400).json({
        message: "Receiver and message text are required",
      });
    }
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }
    if (req.user.toString() === receiverId.toString()) {
      return res.status(400).json({
        message: "You cannot send a message to yourself",
      });
    }
    const message = await Message.create({
      sender: req.user,
      receiver: receiverId,
      text: text.trim(),
    });
    const io = req.app.get("io");
    io.to(receiverId.toString()).emit("receiveMessage", message);
    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error.message);
    res.status(500).json({
      message: "Server error",
    });
  }
};
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        {
          sender: req.user,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: req.user,
        },
      ],
    }).sort({ createdAt: 1 });
    console.log("req.user:", req.user);
    console.log("userId:", userId);
    console.log("messages:", messages);
    res.status(200).json({
      message: "Conversation fetched successfully",
      messages: messages,
    });
  } catch (error) {
    console.error("Get conversation error:", error.message);
    res.status(500).json({
      message: "Server error",
    });
  }
};
const markMessagesAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );
    res.status(200).json({
      message: "Messages marked as read",
    });
  } catch (error) {
    console.log("Mark messages as read error:", error.message);
    res.status(500).json({
      message: "Server error",
    });
  }
};
module.exports = {
  sendMessage,
  getConversation,
  markMessagesAsRead
};
