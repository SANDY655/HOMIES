const cloudinary = require("cloudinary");
const dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

async function getSign(req, res) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "mine",
    },
    process.env.CLOUD_API_SECRET
  );
  res.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.CLOUD_API_KEY,
  });
}

const deleteImageFromCloudinary = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing publicId" });
    }

    await cloudinary.uploader.destroy(publicId);

    res.json({ success: true, message: "Image deleted from Cloudinary" });
  } catch (err) {
    console.error("Error deleting image:", err);
    res.status(500).json({ success: false, message: "Failed to delete image" });
  }
};

module.exports = { getSign, deleteImageFromCloudinary };
