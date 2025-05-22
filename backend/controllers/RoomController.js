const { RoomModel } = require("../models/RoomModel");
const { UserModel } = require("../models/UserModel");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
async function postroom(req, res) {
  try {
    const {
      userId,
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
      !userId ||
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
      userId,
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

const updateRoom = async (req, res) => {
  const { roomId } = req.params;
  const updateData = req.body;

  try {
    const updatedRoom = await RoomModel.findByIdAndUpdate(roomId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedRoom) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, room: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await RoomModel.findById(roomId);

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // ⬇️ Extract public IDs from the image URLs
    const publicIds = (room.images || []).map((url) => {
      const parts = url.split("/");
      const fileName = parts[parts.length - 1];
      const publicId = fileName.split(".")[0]; // Remove file extension
      return `${parts[parts.length - 2]}/${publicId}`; // folder/filename
    });

    // ⬇️ Delete each image from Cloudinary
    for (const publicId of publicIds) {
      await cloudinary.uploader.destroy(publicId);
    }

    // ⬇️ Delete room from database
    await RoomModel.findByIdAndDelete(roomId);

    res.json({
      success: true,
      message: "Room and associated images deleted successfully",
    });t
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
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
async function getRoomsByUser(req, res) {
  try {
    console.log(req.params);
    const { id: userId } = req.params;
    console.log(userId);
    // if (!mongoose.Types.ObjectId.isValid(userId)) {
    //   return res
    //     .status(400)
    //     .json({ message: "Invalid user ID", success: false, error: true });
    // }
    const rooms = await RoomModel.find({ userId }); // Query by userId field
    return res.status(200).json({ rooms, success: true, error: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, success: false, error: true });
  }
}

module.exports = {
  postroom,
  searchroom,
  getroom,
  getRoomsByUser,
  updateRoom,
  deleteRoom,
};
