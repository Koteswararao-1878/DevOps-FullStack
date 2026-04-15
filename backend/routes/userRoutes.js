const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getProfile,
  updateProfile,
  getAllUsers,
  getMatches,
} = require("../controllers/userController");

router.get("/profile",  auth, getProfile);    // GET  /api/users/profile
router.put("/profile",  auth, updateProfile); // PUT  /api/users/profile  ← fixed
router.get("/matches",  auth, getMatches);    // GET  /api/users/matches
router.get("/",         getAllUsers);          // GET  /api/users

module.exports = router;