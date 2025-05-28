const express = require("express");
const {
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
} = require("../controllers/UserController");
const { verifyToken } = require("../middleware/verifyToken");
const userRouter = express.Router();
userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/logout", verifyToken, logout);
userRouter.get("/by-email", getUserByEmail);
userRouter.post("/verify-password", verifyPassword);
userRouter.post("/change-password", changePassword);
userRouter.post("/check-username", checkUserName);
userRouter.put("/update-username", updateUsername);
userRouter.post("/send-otp", sendOtp);
userRouter.post("/verify-otp", verifyOtp);
module.exports = { userRouter };
