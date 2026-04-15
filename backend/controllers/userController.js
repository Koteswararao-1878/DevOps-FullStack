const User = require("../models/User");

// GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/users/profile  ← fixed from /update to /profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, skillsOffered, skillsWanted } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, skillsOffered, skillsWanted },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/users  — all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/users/matches  — skill-matched users
exports.getMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const matches = await User.find({
      skillsOffered: { $in: currentUser.skillsWanted },
      skillsWanted:  { $in: currentUser.skillsOffered },
      _id:           { $ne: req.user.id },
    }).select("-password");
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};