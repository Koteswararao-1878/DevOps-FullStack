const jwt = require("jsonwebtoken");

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "admin@skillswap.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_SECRET   = process.env.JWT_SECRET     || "skillswap_secret";

// POST /api/admin/login
exports.adminLogin = (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
  const token = jwt.sign({ role: "admin", email }, ADMIN_SECRET, { expiresIn: "1d" });
  res.json({ token, role: "admin" });
};

// Middleware to protect admin routes
exports.adminProtect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Not admin" });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};