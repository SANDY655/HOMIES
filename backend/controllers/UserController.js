const { UserModel } = require("../models/UserModel");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const blacklist = require("../utils/tokenBlacklist");

dotenv.config();
async function register(req, res) {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Please fill the required fields",
        error: true,
        success: false,
      });
    }
    if (password !== confirmPassword) {
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
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Provide email and Password",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        message: "User does not exist",
        error: true,
        success: false,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect Password",
        error: true,
        success: false,
      });
    }

    if (user.isLoggedIn) {
      return res.status(400).json({
        message: "Already Logged in",
        error: true,
        success: false,
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    user.isLoggedIn = true;
    await user.save();

    // ✅ Strip sensitive info like password before sending user data
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name, // add more fields if needed
    };

    return res.json({
      message: "Login Successful",
      token,
      user: userData, // ✅ send user info here
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

async function logout(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        message: "No token provided",
        success: false,
        error: true,
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }
    blacklist.add(token);
    user.isLoggedIn = false;
    await user.save();
    return res.json({
      message: "Logged Out Successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}
async function getUserByEmail(req, res) {
  const { email } = req.query;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    return res.json({ data: user, success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
}

module.exports = { register, login, logout, getUserByEmail };
