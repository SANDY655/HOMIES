const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
if (!process.env.MONGO) {
  throw new Error("Invalid");
}
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("mongoDB connected");
  } catch (error) {
    console.log("Failed to connect");
    process.exit();
  }
}
module.exports = { connectDB };
