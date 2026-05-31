const Message = require("../models/Message");
const { uploadToCloudinary } = require("../middleware/upload");

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    console.log("=== sendMessage called ===");
    console.log("req.body:", req.body);
    console.log(
      "req.file:",
      req.file
        ? {
            name: req.file.originalname,
            size: req.file.size,
            mime: req.file.mimetype,
          }
        : null,
    );

    const { receiverId, content } = req.body;
    if (!receiverId)
      return res.status(400).json({ message: "Receiver required" });

    const msgData = {
      sender: req.user.id,
      receiver: receiverId,
      content: content || "",
    };

    if (req.file) {
      const isImage = req.file.mimetype.startsWith("image/");
      const isVideo = req.file.mimetype.startsWith("video/");
      const resourceType = isImage ? "image" : isVideo ? "video" : "raw";

      // Strip extension from public_id to avoid Cloudinary conflicts
      const safeName = req.file.originalname
        .replace(/\s+/g, "_")
        .replace(/\.[^/.]+$/, ""); // remove extension

      console.log("=== uploading to cloudinary ===", {
        resourceType,
        safeName,
      });

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "skillswap/chat",
        resource_type: resourceType,
        public_id: `${Date.now()}-${safeName}`,
      });

      console.log("=== cloudinary result ===", result.secure_url);

      let fileUrl = result.secure_url;
      // For PDFs and docs, use fl_inline to open in browser instead of downloading
      if (!isImage && !isVideo) {
        fileUrl = fileUrl.replace("/raw/upload/", "/raw/upload/fl_inline/");
      }

      msgData.fileUrl = fileUrl;
      msgData.fileName = req.file.originalname;
      msgData.fileSize = req.file.size || 0;
      msgData.fileType = req.file.mimetype;
      if (!msgData.content) msgData.content = req.file.originalname;
    }

    const message = await Message.create(msgData);
    console.log("=== message saved ===", {
      id: message._id,
      fileUrl: message.fileUrl,
    });
    res.status(201).json(message);
  } catch (error) {
    console.error(
      "=== sendMessage error ===",
      error.message,
      error.http_code,
      JSON.stringify(error),
    );
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    const hours24 = 24 * 60 * 60 * 1000;
    if (Date.now() - new Date(msg.createdAt).getTime() > hours24)
      return res
        .status(403)
        .json({ message: "Cannot delete messages older than 24 hours" });

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
