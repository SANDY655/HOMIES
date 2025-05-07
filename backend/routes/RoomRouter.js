const express = require("express");
const { postroom } = require("../controllers/RoomController");
const { verifyToken } = require("../middleware/verifyToken");
const roomRouter = express.Router();
roomRouter.post("/postroom", postroom);
module.exports = { roomRouter };
