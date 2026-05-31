const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Allowed origins ───────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  "https://skill-swap-platform-theta.vercel.app",
  "https://skill-swap-platform-2iephizhj.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ── Create HTTP server + Socket.io ────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ── Middleware ────────────────────────────────────────────
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

// ── Health Check ──────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "SkillSwap API is running ✅" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "SkillSwap backend running!" });
});

// ── Routes ───────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/swaps", require("./routes/swapRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ── Socket.io ─────────────────────────────────────────────
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log(`✅ User ${userId} is online`);
  });

  socket.on(
    "sendMessage",
    ({ senderId, receiverId, content, fileUrl, fileName, fileType }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", {
          sender: senderId,
          receiver: receiverId,
          content,
          fileUrl: fileUrl || "",
          fileName: fileName || "",
          fileType: fileType || "",
          createdAt: new Date().toISOString(),
        });
      }
    },
  );

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId: senderId });
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ User ${userId} went offline`);
        break;
      }
    }
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
