const express = require("express");
const { postroom, searchroom } = require("../controllers/RoomController");
const { verifyToken } = require("../middleware/verifyToken");
const roomRouter = express.Router();
roomRouter.post("/postroom", postroom);
roomRouter.get("/searchroom", searchroom);
module.exports = { roomRouter };
