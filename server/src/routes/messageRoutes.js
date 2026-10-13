const express=require("express");
const{sendMessage,getConversation,markMessagesAsRead}=require("../controllers/messageController")
const protect=require("../middleware/authMiddleware");
// const { route } = require("./authRoutes");
const router=express.Router();
router.post("/",protect,sendMessage);
router.get("/:userId",protect,getConversation)
router.patch("/:userId/read",protect,markMessagesAsRead)
module.exports=router