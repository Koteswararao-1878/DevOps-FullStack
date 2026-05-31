const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/authMiddleware");
const { upload } = require("../middleware/upload");  // ← destructure now
const { getMessages, sendMessage, deleteMessage } = require("../controllers/messageController");

router.post("/send",   auth, upload.single("file"), sendMessage);
router.get("/:userId", auth, getMessages);
router.delete("/:id",  auth, deleteMessage);

module.exports = router;