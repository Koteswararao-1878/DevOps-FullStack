const Message = require("../models/Message");

// GET /api/messages/:userId
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

// POST /api/messages/send
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId) return res.status(400).json({ message: "Receiver required" });

    const msgData = {
      sender:   req.user.id,
      receiver: receiverId,
      content:  content || "",
    };

    // If file uploaded via Cloudinary
    if (req.file) {
      msgData.fileUrl  = req.file.path;        // Cloudinary URL
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

// DELETE /api/messages/:id
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    // 24 hour restriction
    const hours24 = 24 * 60 * 60 * 1000;
    if (Date.now() - new Date(msg.createdAt).getTime() > hours24)
      return res.status(403).json({ message: "Cannot delete messages older than 24 hours" });

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};