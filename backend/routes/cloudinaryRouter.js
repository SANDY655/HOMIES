const express = require("express");
const {
  getSign,
  deleteImageFromCloudinary,
} = require("../controllers/cloudinaryController");
const router = express.Router();
router.post("/get-signature", getSign);
router.delete("/image", deleteImageFromCloudinary);

module.exports = { router };
a;
