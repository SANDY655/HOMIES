const express = require("express");
const { getSign } = require("../controllers/cloudinaryController");
const router = express.Router();
router.post("/get-signature", getSign);
module.exports = { router };
