const express = require("express");
const {
  postroom,
  searchroom,
  getroom,
  getRoomsByUser,
  updateRoom,
  deleteRoom,
  getAllRooms,
} = require("../controllers/RoomController");
const { verifyToken } = require("../middleware/verifyToken");
const roomRouter = express.Router();
roomRouter.get("/all", getAllRooms);
roomRouter.post("/postroom", postroom);
roomRouter.get("/searchroom", searchroom);
roomRouter.get("/:id", getroom);
roomRouter.get("/user/:id", getRoomsByUser);
roomRouter.put("/:roomId", updateRoom);
roomRouter.delete("/:roomId", deleteRoom);
module.exports = { roomRouter };
