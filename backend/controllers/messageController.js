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
    const { receiverId, content } = req.body;
    if (!receiverId) return res.status(400).json({ message: "Receiver required" });

    const msgData = {
      sender:   req.user.id,
      receiver: receiverId,
      content:  content || "",
    };

    if (req.file) {
      const isImage = req.file.mimetype.startsWith("image/");
      const isVideo = req.file.mimetype.startsWith("video/");
      const resourceType = isImage ? "image" : isVideo ? "video" : "raw";

      const result = await uploadToCloudinary(req.file.buffer, {
        folder:        "skillswap/chat",
        resource_type: resourceType,
        public_id:     `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`,
        type:          "upload",
        access_mode:   "public",
      });

      let fileUrl = result.secure_url;
      if (!isImage && !isVideo) {
        fileUrl = fileUrl.replace("/raw/upload/", "/raw/upload/fl_attachment/");
      }

      msgData.fileUrl  = fileUrl;
      msgData.fileName = req.file.originalname;
      msgData.fileSize = req.file.size || 0;
      msgData.fileType = req.file.mimetype;
      if (!msgData.content) msgData.content = req.file.originalname;
    }

    const message = await Message.create(msgData);
    res.status(201).json(message);
  } catch (error) {
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
      return res.status(403).json({ message: "Cannot delete messages older than 24 hours" });

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};