const User        = require("../models/User");
const SwapRequest = require("../models/SwapRequest");
const Rating      = require("../models/Rating");
const Message     = require("../models/Message");

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [users, swaps, ratings, messages] = await Promise.all([
      User.find().select("-password"),
      SwapRequest.find()
        .populate("fromUser", "name email")
        .populate("toUser",   "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Rating.find()
        .populate("userId",      "name email")
        .populate("ratedUserId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Message.countDocuments(),
    ]);

    const accepted  = swaps.filter(s => s.status === "accepted");
    const pending   = swaps.filter(s => s.status === "pending");
    const rejected  = swaps.filter(s => s.status === "rejected");
    const avgRating = ratings.length
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : "0";

    // Clean swaps — replace null users with placeholder
    const cleanSwaps = swaps.map(s => ({
      ...s,
      fromUser: s.fromUser || { name: "Deleted User", email: "" },
      toUser:   s.toUser   || { name: "Deleted User", email: "" },
    }));

    const cleanRatings = ratings.map(r => ({
      ...r,
      userId:      r.userId      || { name: "Deleted User", email: "" },
      ratedUserId: r.ratedUserId || { name: "Deleted User", email: "" },
    }));

    res.json({
      stats: {
        totalUsers:    users.length,
        totalSwaps:    swaps.length,
        acceptedSwaps: accepted.length,
        pendingSwaps:  pending.length,
        rejectedSwaps: rejected.length,
        totalRatings:  ratings.length,
        totalMessages: messages,
        avgRating,
      },
      users,
      swaps:   cleanSwaps,
      ratings: cleanRatings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/users/:id — cascade delete all user data
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const SwapRequest = require("../models/SwapRequest");
    const Rating      = require("../models/Rating");
    const Message     = require("../models/Message");

    // Delete all related data in parallel
    await Promise.all([
      User.findByIdAndDelete(userId),
      SwapRequest.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] }),
      Rating.deleteMany({ $or: [{ userId }, { ratedUserId: userId }] }),
      Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
    ]);

    res.json({ message: "User and all related data deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/verify-skill
exports.verifySkill = async (req, res) => {
  try {
    const { userId, skill } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Add skill to verifiedSkills if not already there
    if (!user.verifiedSkills.includes(skill)) {
      user.verifiedSkills.push(skill);
      await user.save();
    }
    res.json({ message: `Skill "${skill}" verified for ${user.name}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/unverify-skill
exports.unverifySkill = async (req, res) => {
  try {
    const { userId, skill } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.verifiedSkills = user.verifiedSkills.filter(s => s !== skill);
    await user.save();
    res.json({ message: `Skill "${skill}" unverified`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};