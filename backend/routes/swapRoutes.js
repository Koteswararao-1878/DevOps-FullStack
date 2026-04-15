const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  sendRequest,
  getRequests,
  acceptRequest,
  rejectRequest,
} = require("../controllers/swapController");

router.get("/public",           async (req, res) => { const SwapRequest = require("../models/SwapRequest"); const data = await SwapRequest.find({status:"accepted"}); res.json(data); });
router.post("/request",    auth, sendRequest);
router.get("/",            auth, getRequests);
router.put("/accept/:id",  auth, acceptRequest);
router.put("/reject/:id",  auth, rejectRequest);

module.exports = router;