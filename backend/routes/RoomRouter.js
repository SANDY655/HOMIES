const express = require("express");
const {
  postroom,
  searchroom,
  getroom,
  getRoomsByUser,
} = require("../controllers/RoomController");
const { verifyToken } = require("../middleware/verifyToken");
const roomRouter = express.Router();
roomRouter.post("/postroom", postroom);
roomRouter.get("/searchroom", searchroom);
roomRouter.get("/:id", getroom);
roomRouter.get("/user/:id", getRoomsByUser);
module.exports = { roomRouter };
