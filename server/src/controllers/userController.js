const User = require("../models/User");
const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user },
    }).select("-password");
    res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({
      message: "Server error",
    });
  }
};
module.exports = {
  getUsers,
};
