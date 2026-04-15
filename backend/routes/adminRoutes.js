const express = require("express");
const router  = express.Router();
const { adminLogin, adminProtect } = require("../controllers/adminAuth");
const { getStats, deleteUser, verifySkill, unverifySkill } = require("../controllers/adminController");

router.post("/login",           adminLogin);
router.get("/stats",  adminProtect, getStats);
router.delete("/users/:id", adminProtect, deleteUser);
router.post("/verify-skill",   adminProtect, verifySkill);
router.post("/unverify-skill", adminProtect, unverifySkill);

module.exports = router;