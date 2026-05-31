const cloudinary = require("cloudinary").v2;
const busboy = require("busboy");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err) {
          console.error("Cloudinary upload_stream error:", JSON.stringify(err));
          reject(err);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

const parseUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) return next();

  const bb = busboy({ headers: req.headers });
  req.body = {};
  req.file = null;

  let fileResolve;
  const filePromise = new Promise((resolve) => { fileResolve = resolve; });

  bb.on("field", (name, val) => { req.body[name] = val; });

  bb.on("file", (name, stream, info) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => {
      const buffer = Buffer.concat(chunks);
      req.file = {
        fieldname:    name,
        originalname: info.filename,
        mimetype:     info.mimeType,
        buffer,
        size:         buffer.length,
      };
      fileResolve(true);
    });
  });

  bb.on("finish", () => {
    if (!req.file) fileResolve(false);
    filePromise.then(() => next()).catch(next);
  });

  bb.on("error", (err) => { console.error("Busboy error:", err); next(err); });

  req.pipe(bb);
};

module.exports = { parseUpload, uploadToCloudinary, cloudinary };