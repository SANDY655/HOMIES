const express = require("express");
const { register, login, logout } = require("../controllers/UserController");
const { verifyToken } = require("../middleware/verifyToken");
const userRouter = express.Router();
userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/logout", verifyToken, logout);
module.exports = { userRouter };
