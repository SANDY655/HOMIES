const { UserModel } = require("../models/UserModel");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();
async function register(req, res) {
  try {
    const { email, password, confirmPass } = req.body;
    if (!email || !password || !confirmPass) {
      return res.status(400).json({
        message: "Please fill the required fields",
        error: true,
        success: false,
      });
    }
    if (password !== confirmPass) {
      return res.json({
        message: "Passwords do not match",
        error: true,
        success: false,
      });
    }
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.json({
        message: "Already registered",
        error: true,
        success: false,
      });
    }
    const newUser = new UserModel({ email, password });
    const savedUser = await newUser.save();
    return res.json({
      message: "User registered successfully",
      data: savedUser,
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
