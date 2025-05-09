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
    console.log("Received email in search:", req.query.email); // Add this log

    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || 10;
    const skip = (page - 1) * limit;

    const {
      searchQuery = "",
      priceFilter,
      roomTypeFilter,
      availableFrom,
      amenities,
      email, // expected in query
    } = req.query;

    const query = {};

    if (email) {
      // Log the email after trimming double quotes
      const trimmedEmail = email.replace(/^"|"$/g, "");
      console.log("Building query to exclude email:", trimmedEmail);

      // Use the trimmed email in the query
      query.email = { $ne: trimmedEmail }; // Only set this once
      console.log("Query after excluding user's email:", query.email); // Log the query
    }

    // Exclude current user's rooms
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

    const rooms = await RoomModel.find(query) // No need to include email in the `find` call again
      .skip(skip)
      .limit(limit)
      .collation({ locale: "en", strength: 2 })
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
