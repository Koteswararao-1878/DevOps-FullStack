import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function SwapRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchRequests();
  }, [navigate]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/swaps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (id) => {
    setActionLoading(id + "_accept");
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/swaps/accept/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Request accepted! 🎉", "success");
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to accept", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRequest = async (id) => {
    setActionLoading(id + "_reject");
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/swaps/reject/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Request declined", "error");
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const avatarGradients = [
    "linear-gradient(135deg,#a78bfa,#38bdf8)",
    "linear-gradient(135deg,#f472b6,#fb923c)",
    "linear-gradient(135deg,#34d399,#38bdf8)",
    "linear-gradient(135deg,#fbbf24,#f472b6)",
    "linear-gradient(135deg,#6d28d9,#f472b6)",
    "linear-gradient(135deg,#0e7490,#34d399)",
  ];

  const tabs = [
    { key: "all",      label: "All"      },
    { key: "pending",  label: "Pending"  },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Declined" },
  ];

  const filtered = activeTab === "all"
    ? requests
    : requests.filter((r) => r.status === activeTab);

  const countOf = (status) => requests.filter((r) => r.status === status).length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid rgba(167,139,250,0.2)", borderTop: "3px solid #a78bfa", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", fontFamily: "'DM Sans', sans-serif", color: "#f0eeff" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #08080f !important; }
        .req-card { transition: all 0.2s; }
        .req-card:hover { border-color: rgba(167,139,250,0.3) !important; transform: translateY(-2px); }
        .tab-btn:hover { color: rgba(255,255,255,0.8) !important; }
        .nav-pill:hover { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.85) !important; }
        .acc-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        .rej-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 999, background: toast.type === "success" ? "rgba(52,211,153,0.15)" : "rgba(244,114,182,0.15)", border: `1px solid ${toast.type === "success" ? "rgba(52,211,153,0.4)" : "rgba(244,114,182,0.4)"}`, borderRadius: "12px", padding: "14px 20px", color: toast.type === "success" ? "#34d399" : "#f472b6", fontSize: "14px", fontWeight: 500, animation: "slideIn 0.3s ease", backdropFilter: "blur(12px)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Nav Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: "54px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <Logo />
        <div style={{ display: "flex", gap: "4px" }}>
          {[["Dashboard", "/dashboard"], ["Browse", "/browse"], ["Requests", "/requests"], ["Chat", "/chat"]].map(([label, path]) => (
            <Link key={label} to={path} className="nav-pill" style={{ padding: "6px 14px", borderRadius: "99px", fontSize: "13px", fontWeight: 500, color: path === "/requests" ? "#a78bfa" : "rgba(255,255,255,0.45)", background: path === "/requests" ? "rgba(167,139,250,0.12)" : "transparent", textDecoration: "none", transition: "all 0.2s" }}>
              {label}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "15px", position: "relative" }}>
            🔔<span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f472b6", position: "absolute", top: "5px", right: "5px", border: "2px solid #08080f" }} />
          </div>
          <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} style={{ padding: "6px 16px", borderRadius: "99px", background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.2)", color: "#f472b6", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Logout
          </button>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="req-body" style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Header ── */}
        <div className="fade-up" style={{ marginBottom: "28px" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "30px", color: "#fff", marginBottom: "6px" }}>
            Swap Requests ⇄
          </div>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
            Manage your incoming and outgoing skill swap requests
          </div>
        </div>

        {/* ── Summary Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "24px" }}>
          {[
            { label: "Pending",  value: countOf("pending"),  color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)"  },
            { label: "Accepted", value: countOf("accepted"), color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)"  },
            { label: "Declined", value: countOf("rejected"), color: "#f472b6", bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.2)" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "16px", padding: "18px 22px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "28px", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "6px", marginBottom: "24px" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className="tab-btn"
              onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, padding: "9px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, transition: "all 0.2s", background: activeTab === tab.key ? "rgba(167,139,250,0.18)" : "transparent", color: activeTab === tab.key ? "#a78bfa" : "rgba(255,255,255,0.45)" }}
            >
              {tab.label}
              {tab.key !== "all" && countOf(tab.key) > 0 && (
                <span style={{ marginLeft: "6px", background: activeTab === tab.key ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.1)", borderRadius: "99px", padding: "1px 7px", fontSize: "11px" }}>
                  {countOf(tab.key)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Empty State ── */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>No {activeTab === "all" ? "" : activeTab} requests yet</div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", marginBottom: "20px" }}>
              {activeTab === "all" ? "Browse users and send your first swap request!" : `No ${activeTab} requests to show`}
            </div>
            <Link to="/browse" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(90deg,#7c3aed,#38bdf8)", borderRadius: "12px", padding: "12px 24px", color: "#fff", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>
              🔍 Browse Users
            </Link>
          </div>
        )}

        {/* ── Request Cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filtered.map((req, i) => (
            <div
              key={req._id}
              className="req-card fade-up"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "22px 24px", animationDelay: `${i * 0.05}s`, opacity: 0 }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>

                {/* Avatar */}
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: avatarGradients[i % avatarGradients.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", color: "#fff", flexShrink: 0 }}>
                  {getInitials(req.sender?.name || req.fromUser?.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff" }}>
                      {req.sender?.name || req.fromUser?.name || "User"}
                    </div>
                    {/* Status Badge */}
                    <span style={{
                      fontSize: "11px", padding: "3px 10px", borderRadius: "99px", fontWeight: 500,
                      background: req.status === "pending" ? "rgba(251,191,36,0.15)" : req.status === "accepted" ? "rgba(52,211,153,0.15)" : "rgba(244,114,182,0.15)",
                      color: req.status === "pending" ? "#fbbf24" : req.status === "accepted" ? "#34d399" : "#f472b6",
                      border: req.status === "pending" ? "1px solid rgba(251,191,36,0.3)" : req.status === "accepted" ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(244,114,182,0.3)",
                    }}>
                      {req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : "Pending"}
                    </span>
                  </div>

                  {/* Skill Swap Details */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Offers</span>
                      <span style={{ fontSize: "13px", padding: "3px 12px", borderRadius: "99px", background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)", fontWeight: 500 }}>
                        {req.skillOffered || req.skillsOffered?.[0] || "—"}
                      </span>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "16px" }}>⇄</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Wants</span>
                      <span style={{ fontSize: "13px", padding: "3px 12px", borderRadius: "99px", background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)", fontWeight: 500 }}>
                        {req.skillRequested || req.skillWanted || req.skillsWanted?.[0] || "—"}
                      </span>
                    </div>
                  </div>

                  {req.message && (
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "8px", fontStyle: "italic" }}>
                      "{req.message}"
                    </div>
                  )}
                </div>

                {/* Accept / Reject Buttons */}
                {req.status === "pending" && (
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
                    <button
                      className="acc-btn"
                      onClick={() => acceptRequest(req._id)}
                      disabled={actionLoading !== null}
                      style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg,#059669,#34d399)", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", opacity: actionLoading === req._id + "_accept" ? 0.6 : 1 }}
                    >
                      {actionLoading === req._id + "_accept" ? "..." : "✓ Accept"}
                    </button>
                    <button
                      className="rej-btn"
                      onClick={() => rejectRequest(req._id)}
                      disabled={actionLoading !== null}
                      style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid rgba(244,114,182,0.3)", background: "rgba(244,114,182,0.1)", color: "#f472b6", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", opacity: actionLoading === req._id + "_reject" ? 0.6 : 1 }}
                    >
                      {actionLoading === req._id + "_reject" ? "..." : "✕ Decline"}
                    </button>
                  </div>
                )}

                {/* Accepted state — chat button */}
                {req.status === "accepted" && (
                  <button
                    onClick={() => {
                      const myId = JSON.parse(localStorage.getItem("user") || "{}").id;
                      const partner = req.sender?._id === myId || req.fromUser?._id === myId ? (req.receiver || req.toUser) : (req.sender || req.fromUser);
                      navigate("/chat", { state: { userId: partner?._id } });
                    }}
                    style={{ padding: "10px 20px", borderRadius: "10px", background: "linear-gradient(90deg,#7c3aed,#38bdf8)", color: "#fff", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                  >
                    💬 Chat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default SwapRequests;