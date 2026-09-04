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
const app = express();
// Create HTTP server
const server = http.createServer(app);
// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.set("io",io)
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
// Socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join",(userId)=>{
    socket.join(userId);
    console.log(`User${userId} joined their room`)
  })
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
const PORT = process.env.PORT || 5000;
connectDB();
// Important: server.listen, not app.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});