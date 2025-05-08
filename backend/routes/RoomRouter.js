const express = require("express");
const {
  postroom,
  searchroom,
  getroom,
} = require("../controllers/RoomController");
const { verifyToken } = require("../middleware/verifyToken");
const roomRouter = express.Router();
roomRouter.post("/postroom", postroom);
roomRouter.get("/searchroom", searchroom);
roomRouter.get("/:id", getroom);
module.exports = { roomRouter };
