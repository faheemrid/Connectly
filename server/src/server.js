const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const User = require("./models/User");
const Message = require("./models/Message");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.set("io", io);
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "Connectly API is running 🚀",
  });
});
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join", async (userId) => {
    try {
      socket.userId = userId;
      socket.join(userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
      });
      console.log(`User ${userId} is online`);
      socket.broadcast.emit("userOnline", {
        userId: userId,
      });
    } catch (error) {
      console.error("Online status error:", error.message);
    }
  });
  socket.on("sendMessage", async (data) => {
    try {
      const { senderId, receiverId, text } = data;
      if (!senderId || !receiverId || !text?.trim()) {
        return;
      }
      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text: text.trim(),
      });
      console.log("MESSAGE SAVED:", message._id);
      io.to(receiverId).emit("newMessage", message);
      io.to(senderId).emit("messageSent", message);
    } catch (error) {
      console.log("Send message error:", error.message);
    }
  });
  socket.on("disconnect", async () => {
    try {
      const userId = socket.userId;
      console.log("DISCONNECTED USER:", userId);
      if (!userId) return;

      const room = io.sockets.adapter.rooms.get(userId);
      console.log("ROOM AFTER DISCONNECT:", room);
      console.log("ROOM SIZE:", room ? room.size : 0);
      const remainingConnections = room ? room.size : 0;
      if (remainingConnections === 0) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: lastSeen,
        });
        console.log(`User ${userId} is offline`);
        console.log(`Last seen: ${lastSeen.toISOString()}`);
        socket.broadcast.emit("userOffline", {
          userId: userId,
          lastSeen: lastSeen.toISOString(),
        });
      }
    } catch (error) {
      console.log("Offline status error:", error.message);
    }
  });
});
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
    });
  } catch (error) {
    console.error("Server startup failed ❌");
    console.error(error.message);
  }
};
startServer();
