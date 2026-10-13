const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Mongo URI loaded:", !!process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully ✅");
  } catch (error) {
    console.error("MongoDB connection failed ❌");
    console.error("NAME:", error.name);
    console.error("MESSAGE:", error.message);

    throw error;
  }
};

module.exports = connectDB;