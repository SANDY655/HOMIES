const express = require("express");
const {
  register,
  login,
  logout,
  getUserByEmail,
} = require("../controllers/UserController");
const { verifyToken } = require("../middleware/verifyToken");
const userRouter = express.Router();
userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/logout", verifyToken, logout);
userRouter.get("/by-email", getUserByEmail);
module.exports = { userRouter };
