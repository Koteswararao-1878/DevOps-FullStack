const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    return {
      folder:        "skillswap/chat",
      resource_type: isImage ? "image" : isVideo ? "video" : "raw",
      public_id:     `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
      use_filename:  true,
      type:          "upload",
      access_mode:   "public",
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

module.exports = upload;