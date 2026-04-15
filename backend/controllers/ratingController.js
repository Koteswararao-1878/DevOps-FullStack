const Rating = require("../models/Rating");

// POST /api/ratings/add
exports.addRating = async (req, res) => {
  try {
    const { ratedUserId, rating, review, skillLearned } = req.body;

    if (!ratedUserId || !rating) {
      return res.status(400).json({ message: "User and rating are required" });
    }

    // Check if already rated for this skill
    const existing = await Rating.findOne({
      userId: req.user.id,
      ratedUserId,
      skillLearned: skillLearned || "",
    });

    if (existing) {
      return res.status(400).json({ message: "You have already rated this user for this skill" });
    }

    const newRating = await Rating.create({
      userId: req.user.id,
      ratedUserId,
      rating,
      review,
      skillLearned: skillLearned || "",
    });

    const populated = await Rating.findById(newRating._id)
      .populate("userId", "name email");

    res.status(201).json(populated);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/ratings — ratings received by logged-in user
exports.getRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ ratedUserId: req.user.id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const result = ratings.map((r) => {
      const obj = r.toObject();
      obj.ratedBy = obj.userId;
      return obj;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/ratings/:userId — ratings for a specific user
exports.getRatingsByUser = async (req, res) => {
  try {
    const ratings = await Rating.find({ ratedUserId: req.params.userId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const result = ratings.map((r) => {
      const obj = r.toObject();
      obj.ratedBy = obj.userId;
      return obj;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/ratings/public
exports.getPublicRatings = async (req, res) => {
  try {
    const ratings = await Rating.find().populate("userId", "name");
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};