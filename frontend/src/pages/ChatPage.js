import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import axios from "axios";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SOCKET = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [deletingMsg, setDeletingMsg] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = React.useRef(null);
  const [showMeeting, setShowMeeting] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingType, setMeetingType] = useState("zoom");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // ── Init ─────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    initChat(token);
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [navigate]);

  const initChat = async (token) => {
    try {
      // Get current user profile
      const profileRes = await axios.get(`${API}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(profileRes.data);

      // Get accepted swap partners as contacts
      const swapsRes = await axios.get(`${API}/swaps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accepted = swapsRes.data.filter((r) => r.status === "accepted");
      const uniqueContacts = [];
      const seen = new Set();
      accepted.forEach((r) => {
        const partner =
          r.fromUser?._id === profileRes.data._id ? r.toUser : r.fromUser;
        if (partner && !seen.has(partner._id)) {
          seen.add(partner._id);
          uniqueContacts.push(partner);
        }
      });
      setContacts(uniqueContacts);

      // Auto-select user if navigated from swap requests
      const targetId = location.state?.userId;
      if (targetId && uniqueContacts.length > 0) {
        const target = uniqueContacts.find((c) => c._id === targetId);
        if (target) setSelectedUser(target);
      }

      // Connect socket
      const socket = io(SOCKET, { auth: { token } });
      socketRef.current = socket;

      socket.emit("join", profileRes.data._id);

      socket.on("onlineUsers", (users) => setOnlineUsers(users));

      socket.on("receiveMessage", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on("userTyping", ({ userId }) => {
        if (userId !== profileRes.data._id) setTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
      });
    } catch (err) {
      console.error("Chat init error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Load messages when user selected ─────────────────────
  useEffect(() => {
    if (!selectedUser) return;
    fetchMessages();
  }, [selectedUser]);

  // ── Auto scroll ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/messages/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Fetch messages error:", err);
      setMessages([]);
    }
  };

  const canDelete = (msg) => {
    if (!msg.createdAt) return false;
    const msgTime = new Date(msg.createdAt).getTime();
    const now = Date.now();
    const hours24 = 24 * 60 * 60 * 1000;
    return now - msgTime < hours24;
  };

  const deleteMessage = async (msgId) => {
    setDeletingMsg(msgId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      setSelectedMsg(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingMsg(null);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!selectedUser || sending) return;
    setSending(true);
    const msgText = message.trim();
    setMessage("");
    const fileToSend = selectedFile;
    setSelectedFile(null);

    // Create local preview URL for temp message
    const localFileUrl = fileToSend ? URL.createObjectURL(fileToSend) : null;

    const tempMsg = {
      _id: Date.now(),
      sender: currentUser._id,
      receiver: selectedUser._id,
      content: msgText || "",
      fileName: fileToSend?.name || "",
      fileType: fileToSend?.type || "",
      fileUrl: localFileUrl || "",
      localPreview: true,
      createdAt: new Date().toISOString(),
      temp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("receiverId", selectedUser._id);
      if (msgText) formData.append("content", msgText);
      if (fileToSend) formData.append("file", fileToSend);

      const res = await axios.post(`${API}/messages/send`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? res.data : m)),
      );
      if (localFileUrl) URL.revokeObjectURL(localFileUrl);
      socketRef.current?.emit("sendMessage", {
        senderId: currentUser._id,
        receiverId: selectedUser._id,
        content: msgText || fileToSend?.name,
        fileUrl: res.data.fileUrl || "",
        fileName: res.data.fileName || "",
        fileType: res.data.fileType || "",
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      console.error("Send error:", err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socketRef.current?.emit("typing", {
      senderId: currentUser?._id,
      receiverId: selectedUser?._id,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const diff = today - d;
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString();
  };

  const avatarGradients = [
    "linear-gradient(135deg,#a78bfa,#38bdf8)",
    "linear-gradient(135deg,#f472b6,#fb923c)",
    "linear-gradient(135deg,#34d399,#38bdf8)",
    "linear-gradient(135deg,#fbbf24,#f472b6)",
    "linear-gradient(135deg,#6d28d9,#f472b6)",
    "linear-gradient(135deg,#0e7490,#34d399)",
  ];

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#08080f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "3px solid rgba(167,139,250,0.2)",
              borderTop: "3px solid #a78bfa",
              margin: "0 auto 16px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}
          >
            Connecting to chat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "#08080f",
        fontFamily: "'DM Sans', sans-serif",
        color: "#f0eeff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #08080f !important; overflow: hidden; }
        .nav-pill:hover { background: rgba(255,255,255,0.07) !important; }
        .contact-item:hover { background: rgba(255,255,255,0.06) !important; }
        .contact-item.active { background: rgba(167,139,250,0.12) !important; border-left: 3px solid #a78bfa !important; }
        .send-btn:hover:not(:disabled) { opacity: 0.85; }
        .msg-input:focus { outline: none; border-color: rgba(167,139,250,0.4) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100%{opacity:0.3} 50%{opacity:1} }
        .msg-bubble { animation: fadeIn 0.2s ease; }
        .typing-dot { animation: blink 1.2s ease infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .meet-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .meet-type:hover { border-color: rgba(167,139,250,0.5) !important; }
        .meet-type.active { border-color: #a78bfa !important; background: rgba(167,139,250,0.15) !important; }
        @media (max-width: 768px) {
          .chat-sidebar { width: 70px !important; }
          .chat-sidebar-header { padding: 12px 8px !important; }
          .chat-search { display: none !important; }
          .chat-messages-title { display: none !important; }
          .contact-name { display: none !important; }
          .contact-status { display: none !important; }
          .contact-item { padding: 10px 8px !important; justify-content: center !important; }
          .chat-nav { padding: 0 12px !important; }
          .chat-toplinks { display: none !important; }
          .chat-input-area { padding: 10px 12px !important; }
        }
        @media (max-width: 480px) {
          .chat-sidebar { width: 56px !important; }
        }
      `}</style>

      {/* ── Top Nav ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "54px",
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <Logo />
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            ["Dashboard", "/dashboard"],
            ["Browse", "/browse"],
            ["Requests", "/requests"],
            ["Chat", "/chat"],
          ].map(([label, path]) => (
            <Link
              key={label}
              to={path}
              className="nav-pill"
              style={{
                padding: "6px 14px",
                borderRadius: "99px",
                fontSize: "13px",
                fontWeight: 500,
                color: path === "/chat" ? "#a78bfa" : "rgba(255,255,255,0.45)",
                background:
                  path === "/chat" ? "rgba(167,139,250,0.12)" : "transparent",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
          style={{
            padding: "6px 16px",
            borderRadius: "99px",
            background: "rgba(244,114,182,0.1)",
            border: "1px solid rgba(244,114,182,0.2)",
            color: "#f472b6",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Logout
        </button>
      </div>

      {/* ── Chat Layout ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Contacts Sidebar ── */}
        <div
          className="chat-sidebar"
          style={{
            width: "300px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {/* Sidebar Header */}
          <div
            className="chat-sidebar-header"
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="chat-messages-title"
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "#fff",
                marginBottom: "12px",
              }}
            >
              Messages
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "8px 12px",
              }}
            >
              <span style={{ fontSize: "13px" }}>🔍</span>
              <span
                style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}
              >
                Search contacts...
              </span>
            </div>
          </div>

          {/* Contact List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {contacts.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>💬</div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: "8px",
                  }}
                >
                  No contacts yet
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: "16px",
                  }}
                >
                  Accept swap requests to start chatting
                </div>
                <Link
                  to="/requests"
                  style={{
                    fontSize: "12px",
                    color: "#a78bfa",
                    textDecoration: "none",
                  }}
                >
                  View Requests →
                </Link>
              </div>
            ) : (
              contacts.map((contact, i) => (
                <div
                  key={contact._id}
                  className={`contact-item${selectedUser?._id === contact._id ? " active" : ""}`}
                  onClick={() => {
                    setSelectedUser(contact);
                    setMessages([]);
                    setTyping(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 20px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    borderLeft: "3px solid transparent",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        background: avatarGradients[i % avatarGradients.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#fff",
                      }}
                    >
                      {getInitials(contact.name)}
                    </div>
                    {isOnline(contact._id) && (
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#34d399",
                          position: "absolute",
                          bottom: "1px",
                          right: "1px",
                          border: "2px solid #08080f",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#fff",
                        marginBottom: "2px",
                      }}
                    >
                      {contact.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: isOnline(contact._id)
                          ? "#34d399"
                          : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {isOnline(contact._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* No user selected */}
          {!selectedUser ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>💬</div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: "20px",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: "8px",
                }}
              >
                Select a conversation
              </div>
              <div style={{ fontSize: "14px" }}>
                Choose a contact from the left to start chatting
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  flexShrink: 0,
                }}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background:
                        avatarGradients[
                          contacts.indexOf(selectedUser) %
                            avatarGradients.length
                        ],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "#fff",
                    }}
                  >
                    {getInitials(selectedUser.name)}
                  </div>
                  {isOnline(selectedUser._id) && (
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "#34d399",
                        position: "absolute",
                        bottom: "0",
                        right: "0",
                        border: "2px solid #08080f",
                      }}
                    />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "#fff",
                    }}
                  >
                    {selectedUser.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: isOnline(selectedUser._id)
                        ? "#34d399"
                        : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {typing
                      ? "typing..."
                      : isOnline(selectedUser._id)
                        ? "Online"
                        : "Offline"}
                  </div>
                </div>
                <div
                  style={{ marginLeft: "auto", display: "flex", gap: "6px" }}
                >
                  {selectedUser.skillsOffered?.slice(0, 2).map((s, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "11px",
                        padding: "3px 10px",
                        borderRadius: "99px",
                        background: "rgba(167,139,250,0.12)",
                        color: "#a78bfa",
                        border: "1px solid rgba(167,139,250,0.2)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Messages Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    {/* Date divider */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        margin: "16px 0 12px",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: "1px",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.25)",
                          padding: "4px 12px",
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: "99px",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {date}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: "1px",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                    </div>

                    {/* Messages */}
                    {msgs.map((msg, i) => {
                      const isMe =
                        msg.sender === currentUser?._id ||
                        msg.sender?._id === currentUser?._id;
                      return (
                        <div
                          key={msg._id || i}
                          className="msg-bubble"
                          style={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            marginBottom: "4px",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "65%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: isMe ? "flex-end" : "flex-start",
                            }}
                          >
                            <div
                              onClick={() =>
                                isMe &&
                                !msg.temp &&
                                setSelectedMsg(
                                  selectedMsg === msg._id ? null : msg._id,
                                )
                              }
                              style={{
                                padding: "10px 16px",
                                borderRadius: isMe
                                  ? "18px 18px 4px 18px"
                                  : "18px 18px 18px 4px",
                                background: isMe
                                  ? selectedMsg === msg._id
                                    ? "linear-gradient(135deg,#f472b6,#7c3aed)"
                                    : "linear-gradient(135deg,#7c3aed,#38bdf8)"
                                  : "rgba(255,255,255,0.07)",
                                border: isMe
                                  ? "none"
                                  : "1px solid rgba(255,255,255,0.08)",
                                color: "#fff",
                                fontSize: "14px",
                                lineHeight: 1.5,
                                wordBreak: "break-word",
                                opacity: msg.temp ? 0.7 : 1,
                                maxWidth: "100%",
                                cursor:
                                  isMe && !msg.temp ? "pointer" : "default",
                                transition: "background 0.2s",
                              }}
                            >
                              {/* File display */}
                              {msg.fileUrl && (
                                <div
                                  style={{
                                    marginBottom:
                                      msg.content &&
                                      msg.content !== msg.fileName
                                        ? "8px"
                                        : 0,
                                  }}
                                >
                                  {msg.fileType?.startsWith("image/") ? (
                                    <img
                                      src={msg.fileUrl}
                                      alt={msg.fileName}
                                      style={{
                                        maxWidth: "220px",
                                        maxHeight: "180px",
                                        borderRadius: "8px",
                                        display: "block",
                                      }}
                                    />
                                  ) : (
                                    <a
                                      href={
                                        msg.fileType?.includes("pdf")
                                          ? `https://docs.google.com/viewer?url=${encodeURIComponent(
                                              // Strip any transformation flags from URL to get clean URL
                                              msg.fileUrl
                                                .replace(
                                                  "/raw/upload/fl_attachment/",
                                                  "/raw/upload/",
                                                )
                                                .replace(
                                                  "/raw/upload/fl_inline/",
                                                  "/raw/upload/",
                                                ),
                                            )}&embedded=false`
                                          : msg.fileUrl
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        textDecoration: "none",
                                        background: "rgba(255,255,255,0.1)",
                                        borderRadius: "8px",
                                        padding: "8px 12px",
                                      }}
                                    >
                                      <span style={{ fontSize: "20px" }}>
                                        {msg.fileType?.includes("pdf")
                                          ? "📄"
                                          : msg.fileType?.includes("video")
                                            ? "🎥"
                                            : msg.fileType?.includes("word")
                                              ? "📝"
                                              : "📎"}
                                      </span>
                                      <div>
                                        <div
                                          style={{
                                            fontSize: "13px",
                                            color: "#fff",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {msg.fileName}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            color: "rgba(255,255,255,0.6)",
                                          }}
                                        >
                                          {msg.fileType?.includes("pdf")
                                            ? "Click to view"
                                            : "Click to open"}
                                        </div>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              )}
                              {/* Text content */}
                              {msg.content && msg.content !== msg.fileName && (
                                <div>{msg.content}</div>
                              )}
                              {/* Temp file preview */}
                              {msg.temp && msg.fileName && !msg.fileUrl && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    opacity: 0.7,
                                  }}
                                >
                                  <span>📎</span>
                                  <span style={{ fontSize: "13px" }}>
                                    {msg.fileName}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "rgba(255,255,255,0.25)",
                                marginTop: "4px",
                                paddingLeft: "4px",
                                paddingRight: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                justifyContent: isMe
                                  ? "flex-end"
                                  : "flex-start",
                              }}
                            >
                              <span>
                                {formatTime(msg.createdAt)}{" "}
                                {isMe && (msg.temp ? "⏳" : "✓")}
                              </span>
                              {isMe &&
                                selectedMsg === msg._id &&
                                !msg.temp &&
                                (canDelete(msg) ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMessage(msg._id);
                                    }}
                                    disabled={deletingMsg === msg._id}
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 8px",
                                      borderRadius: "99px",
                                      background: "rgba(244,114,182,0.2)",
                                      border: "1px solid rgba(244,114,182,0.4)",
                                      color: "#f472b6",
                                      cursor: "pointer",
                                      fontFamily: "inherit",
                                    }}
                                  >
                                    {deletingMsg === msg._id
                                      ? "..."
                                      : "🗑 Delete"}
                                  </button>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      color: "rgba(255,255,255,0.25)",
                                      padding: "2px 8px",
                                      borderRadius: "99px",
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                  >
                                    ⏰ Cannot delete after 24h
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "18px 18px 18px 4px",
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        className="typing-dot"
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.5)",
                        }}
                      />
                      <div
                        className="typing-dot"
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.5)",
                        }}
                      />
                      <div
                        className="typing-dot"
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.5)",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {messages.length === 0 && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "40px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>
                      👋
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "rgba(255,255,255,0.5)",
                        marginBottom: "6px",
                      }}
                    >
                      Say hello to {selectedUser.name}!
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      This is the beginning of your conversation
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Meeting Modal */}
              {showMeeting && (
                <div
                  style={{
                    margin: "0 24px 12px",
                    background: "rgba(167,139,250,0.08)",
                    border: "1px solid rgba(167,139,250,0.2)",
                    borderRadius: "16px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 700,
                        fontSize: "15px",
                        color: "#fff",
                      }}
                    >
                      📅 Schedule a Meeting
                    </div>
                    <button
                      onClick={() => setShowMeeting(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                        fontSize: "18px",
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Meeting type selector */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "14px",
                    }}
                  >
                    {[
                      {
                        key: "zoom",
                        label: "Zoom",
                        icon: "📹",
                        color: "#2D8CFF",
                      },
                      {
                        key: "meet",
                        label: "Google Meet",
                        icon: "🎥",
                        color: "#34d399",
                      },
                      {
                        key: "teams",
                        label: "MS Teams",
                        icon: "💼",
                        color: "#6264A7",
                      },
                      {
                        key: "other",
                        label: "Other Link",
                        icon: "🔗",
                        color: "#a78bfa",
                      },
                    ].map((t) => (
                      <button
                        key={t.key}
                        className={`meet-type${meetingType === t.key ? " active" : ""}`}
                        onClick={() => setMeetingType(t.key)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: "10px",
                          border: `1px solid rgba(255,255,255,0.1)`,
                          background: "transparent",
                          color: "#fff",
                          fontSize: "12px",
                          fontFamily: "inherit",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "18px", marginBottom: "3px" }}>
                          {t.icon}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.6)",
                          }}
                        >
                          {t.label}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Quick generate or paste link */}
                  <div style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.4)",
                        marginBottom: "8px",
                      }}
                    >
                      Paste your meeting link:
                    </div>
                    <input
                      type="text"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder={
                        meetingType === "zoom"
                          ? "https://zoom.us/j/..."
                          : meetingType === "meet"
                            ? "https://meet.google.com/..."
                            : meetingType === "teams"
                              ? "https://teams.microsoft.com/..."
                              : "https://..."
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px",
                        color: "#fff",
                        fontSize: "13px",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Quick links */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "14px",
                    }}
                  >
                    <a
                      href="https://zoom.us/start/videomeeting"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(45,140,255,0.12)",
                        border: "1px solid rgba(45,140,255,0.25)",
                        color: "#60a5fa",
                        fontSize: "11px",
                        textDecoration: "none",
                        textAlign: "center",
                        fontFamily: "inherit",
                      }}
                    >
                      📹 Start Zoom
                    </a>
                    <a
                      href="https://meet.google.com/new"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(52,211,153,0.1)",
                        border: "1px solid rgba(52,211,153,0.25)",
                        color: "#34d399",
                        fontSize: "11px",
                        textDecoration: "none",
                        textAlign: "center",
                        fontFamily: "inherit",
                      }}
                    >
                      🎥 New Meet
                    </a>
                    <a
                      href="https://teams.microsoft.com/l/meeting/new"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(98,100,167,0.12)",
                        border: "1px solid rgba(98,100,167,0.3)",
                        color: "#a78bfa",
                        fontSize: "11px",
                        textDecoration: "none",
                        textAlign: "center",
                        fontFamily: "inherit",
                      }}
                    >
                      💼 New Teams
                    </a>
                  </div>

                  <button
                    onClick={() => {
                      if (!meetingLink.trim()) return;
                      const icons = {
                        zoom: "📹",
                        meet: "🎥",
                        teams: "💼",
                        other: "🔗",
                      };
                      const names = {
                        zoom: "Zoom",
                        meet: "Google Meet",
                        teams: "MS Teams",
                        other: "Meeting",
                      };
                      setMessage(
                        `${icons[meetingType]} Join my ${names[meetingType]} session: ${meetingLink.trim()}`,
                      );
                      setShowMeeting(false);
                      setMeetingLink("");
                    }}
                    disabled={!meetingLink.trim()}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "10px",
                      background: meetingLink.trim()
                        ? "linear-gradient(90deg,#7c3aed,#38bdf8)"
                        : "rgba(255,255,255,0.06)",
                      border: "none",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: meetingLink.trim() ? "pointer" : "default",
                      fontFamily: "inherit",
                    }}
                  >
                    Send Meeting Link →
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div
                className="chat-input-area"
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  flexShrink: 0,
                }}
              >
                {/* File preview */}
                {selectedFile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      background: "rgba(167,139,250,0.1)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      borderRadius: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>
                      {selectedFile.type.startsWith("image/")
                        ? "🖼️"
                        : selectedFile.type.includes("pdf")
                          ? "📄"
                          : selectedFile.type.includes("video")
                            ? "🎥"
                            : "📎"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#fff",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {selectedFile.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      style={{
                        background: "rgba(244,114,182,0.15)",
                        border: "none",
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#f472b6",
                        fontSize: "13px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "10px",
                  }}
                >
                  {/* File attach button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files[0]) setSelectedFile(e.target.files[0]);
                    }}
                    accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.zip,.xlsx,.pptx,.csv"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "12px",
                      background: selectedFile
                        ? "rgba(167,139,250,0.2)"
                        : "rgba(255,255,255,0.06)",
                      border: selectedFile
                        ? "1px solid rgba(167,139,250,0.4)"
                        : "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      fontSize: "18px",
                      transition: "all 0.2s",
                    }}
                  >
                    📎
                  </button>

                  {/* Meeting button */}
                  <button
                    onClick={() => setShowMeeting(!showMeeting)}
                    title="Schedule meeting"
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "12px",
                      background: showMeeting
                        ? "rgba(167,139,250,0.2)"
                        : "rgba(255,255,255,0.06)",
                      border: showMeeting
                        ? "1px solid rgba(167,139,250,0.4)"
                        : "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      fontSize: "18px",
                      transition: "all 0.2s",
                    }}
                  >
                    📅
                  </button>

                  {/* Text input */}
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      padding: "12px 16px",
                    }}
                  >
                    <textarea
                      ref={inputRef}
                      className="msg-input"
                      value={message}
                      onChange={handleTyping}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${selectedUser.name}...`}
                      rows={1}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        color: "#fff",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        resize: "none",
                        outline: "none",
                        lineHeight: 1.5,
                        maxHeight: "120px",
                        overflowY: "auto",
                      }}
                    />
                  </div>

                  {/* Send button */}
                  <button
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={(!message.trim() && !selectedFile) || sending}
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "12px",
                      background:
                        message.trim() || selectedFile
                          ? "linear-gradient(135deg,#7c3aed,#38bdf8)"
                          : "rgba(255,255,255,0.06)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        message.trim() || selectedFile ? "pointer" : "default",
                      transition: "all 0.2s",
                      flexShrink: 0,
                      fontSize: "18px",
                    }}
                  >
                    {sending ? "⏳" : "➤"}
                  </button>
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.2)",
                    marginTop: "8px",
                    textAlign: "center",
                  }}
                >
                  📎 Attach · 📅 Schedule Meeting · Enter to send
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
