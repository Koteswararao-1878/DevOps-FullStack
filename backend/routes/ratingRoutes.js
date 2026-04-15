const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  addRating,
  getRatings,
  getRatingsByUser,
} = require("../controllers/ratingController");

router.get("/public",          async (req, res) => { const Rating = require("../models/Rating"); const data = await Rating.find(); res.json(data); });
router.post("/add",       auth, addRating);        // POST /api/ratings/add
router.get("/",           auth, getRatings);        // GET  /api/ratings  (my received ratings)
router.get("/:userId",         getRatingsByUser);   // GET  /api/ratings/:userId

module.exports = router;