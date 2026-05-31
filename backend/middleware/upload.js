const cloudinary = require("cloudinary").v2;
const busboy = require("busboy");
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
};

// Middleware that parses multipart/form-data without multer
const parseUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) return next();

  const bb = busboy({ headers: req.headers });
  req.body = {};
  req.file = null;

  bb.on("field", (name, val) => { req.body[name] = val; });

  bb.on("file", (name, stream, info) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => {
      req.file = {
        fieldname:    name,
        originalname: info.filename,
        mimetype:     info.mimeType,
        buffer:       Buffer.concat(chunks),
        size:         Buffer.concat(chunks).length,
      };
    });
  });

  bb.on("finish", next);
  bb.on("error", next);
  req.pipe(bb);
};

module.exports = { parseUpload, uploadToCloudinary, cloudinary };