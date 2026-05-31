const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const { parseUpload } = require("../middleware/upload");
const { getMessages, sendMessage, deleteMessage } = require("../controllers/messageController");

router.post("/send",   auth, parseUpload, sendMessage);
router.get("/:userId", auth, getMessages);
router.delete("/:id",  auth, deleteMessage);

module.exports = router;