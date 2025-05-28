const { UserModel } = require("../models/UserModel");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const blacklist = require("../utils/tokenBlacklist");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { OtpSchemaModel } = require("../models/OtpSchema");

dotenv.config();
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "santhoshkannan525@gmail.com",
    pass: "cwsk vnmz djcw rakg",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendOtp = async (req, res) => {
  const { email, name, password, confirmPassword } = req.body;

  if (!email || !password || !name)
    return res.status(400).json({ message: "All fields are required" });

  if (password !== confirmPassword) {
    return res.json({
      message: "Passwords do not match",
      error: true,
      success: false,
    });
  }

  try {
    // Check for existing email or name
    const emailExists = await UserModel.findOne({ email });
    const nameExists = await UserModel.findOne({ name });

    if (emailExists)
      return res.status(409).json({ message: "Email already registered" });
    if (nameExists)
      return res.status(409).json({ message: "Username already taken" });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    await OtpSchemaModel.findOneAndUpdate(
      { email },
      { email, name, password, otp, expiresAt },
      { upsert: true, new: true }
    );
    console.log("OTP saved to database:", otp);
    await transporter.sendMail({
      from: "santhoshkannan525@gmail.com",
      to: email,
      subject: "Your OTP for Verification",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const otpRecord = await OtpSchemaModel.findOne({ email });

    if (!otpRecord)
      return res.status(404).json({ message: "OTP not found or expired" });

    if (otpRecord.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    // Create and save new user
    const newUser = new UserModel({
      name: otpRecord.name,
      email: otpRecord.email,
      password: otpRecord.password,
    });

    await newUser.save();
    await OtpSchemaModel.deleteOne({ email });

    return res.status(201).json({ message: "Account verified and registered" });
  } catch (err) {
    console.error("OTP Verification error:", err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

async function register(req, res) {
  try {
    const { name, email, password, confirmPassword } = req.body;
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
    const nameExists = await UserModel.findOne({ name });
    if (userExists) {
      return res.json({
        message: "Already registered",
        error: true,
        success: false,
      });
    }
    if (nameExists) {
      return res.json({
        message: "Name already exists",
        error: true,
        success: false,
      });
    }
    const newUser = new UserModel({ name, email, password });
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
        message: "Provide email and password",
        error: true,
        success: false,
      });
    }

    // Fetch user with password for comparison, explicitly selecting password field
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      // Avoid telling user which field is wrong (email or password) to improve security
      return res.status(400).json({
        message: "Invalid credentials",
        error: true,
        success: false,
      });
    }

    // Compare passwords securely
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
        error: true,
        success: false,
      });
    }

    // Generate JWT token with a shorter expiry if needed, and add issuedAt and jwtid for better tracking
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
        // jwtid: some unique id (optional),
        // issuer: 'your-app-name' (optional),
      }
    );

    // Update user login status
    user.isLoggedIn = true;
    await user.save();

    // Prepare user data without sensitive info
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      // add more safe fields here as necessary
    };

    return res.json({
      message: "Login successful",
      token,
      user: userData,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false,
    });
  }
}

async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Received token:", token);

    if (!token) {
      return res.status(401).json({ message: "No token", success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Mark user as logged out
    user.isLoggedIn = false;
    await user.save();

    // Add token to blacklist
    blacklist.add(token);

    console.log("User logged out and token blacklisted");

    return res.json({ message: "Logout successful", success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal error", success: false });
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
const verifyPassword = async (req, res) => {
  try {
    // Make sure auth middleware sets req.user
    const { email, currentPassword } = req.body;
    console.log(email);
    if (!currentPassword || !email) {
      return res
        .status(400)
        .json({ message: "Current password and email is required" });
    }

    // Select password explicitly
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    return res.json({ message: "Password verified" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Select password explicitly
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const checkUserName = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await UserModel.findOne({
      username: normalizedUsername,
    });

    res.status(200).json({ available: !existingUser });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
const updateUsername = async (req, res) => {
  try {
    const { email, newUsername } = req.body;

    if (!email || !newUsername) {
      return res
        .status(400)
        .json({ message: "Email and new username are required" });
    }

    const normalizedUsername = newUsername.trim().toLowerCase();

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if the new username already exists and is not the current user's
    const existingUser = await UserModel.findOne({ name: normalizedUsername });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(409).json({ message: "Username already taken" });
    }
    console.log(newUsername);
    const eexistingUser = await UserModel.findOneAndUpdate(
      { email },
      { name: newUsername }
    );

    return res.json({
      message: "Username updated successfully",
      success: true,
    });
  } catch (err) {
    console.error("Error updating username:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};
module.exports = {
  register,
  login,
  logout,
  getUserByEmail,
  verifyPassword,
  changePassword,
  checkUserName,
  updateUsername,
  sendOtp,
  verifyOtp,
};
