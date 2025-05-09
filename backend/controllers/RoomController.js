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
async function searchroom(req, res) {
  try {
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || 10;
    const skip = (page - 1) * limit;
    const {
      searchQuery = "",
      priceFilter,
      roomTypeFilter,
      availableFrom,
      amenities,
    } = req.query;
    const query = {};
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
      ];
    }
    if (priceFilter && priceFilter !== "all") {
      query.rent = { $lte: parseInt(priceFilter) };
    }
    if (roomTypeFilter && roomTypeFilter !== "all") {
      query.roomType = roomTypeFilter;
    }
    if (availableFrom) {
      query.availableFrom = { $gte: new Date(availableFrom) };
    }
    if (amenities) {
      const amenityList = Array.isArray(amenities) ? amenities : [amenities];
      for (const amenity of amenityList) {
        query[`amenities.${amenity}`] = true;
      }
    }

    const rooms = await RoomModel.find(query)
      .skip(skip)
      .limit(limit)
      .collation({ locale: "en", strength: 2 }) // 'strength: 2' is case-insensitive
      .sort({ title: 1 });
    res.status(200).json({
      data: rooms,
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
async function getroom(req, res) {
  try {
    const room = await RoomModel.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        message: "Room not found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      data: room,
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
module.exports = { postroom, searchroom, getroom };
