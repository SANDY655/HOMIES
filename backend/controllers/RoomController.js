const { RoomModel } = require("../models/RoomModel");
const { UserModel } = require("../models/UserModel");
async function postroom(req, res) {
  try {
    const {
      email,
      title,
      description,
      location,
      rent,
      deposit,
      availableFrom,
      roomType,
      amenities,
      images,
    } = req.body;
    if (
      !email ||
      !title ||
      !description ||
      !location ||
      !rent ||
      !deposit ||
      !availableFrom ||
      !roomType ||
      !amenities ||
      !images
    ) {
      return res.status(400).json({
        message: "Please fill the required fields",
        error: true,
        success: false,
      });
    }
    const userExists = await UserModel.findOne({ email });
    if (!userExists) {
      return res.status(400).json({
        message: "Please regiter an account",
        error: true,
        success: false,
      });
    }

    const newRoom = new RoomModel({
      email,
      title,
      description,
      location,
      rent,
      deposit,
      availableFrom,
      roomType,
      amenities,
      images,
    });
    const savedRoom = await newRoom.save();
    return res.json({
      message: "Room posted Successfully",
      data: savedRoom,
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
module.exports = { postroom };
