import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api";

function AdminDashboard() {
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin"); return; }
    fetchStats(token);
  }, [navigate]);

  const fetchStats = async (token) => {
    try {
      const res = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("adminToken");
        navigate("/admin");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`${API}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast(`${name} deleted successfully`, "success");
      fetchStats(token);
    } catch {
      showToast("Failed to delete user", "error");
    }
  };

  const verifySkill = async (userId, skill, verified) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(`${API}/admin/${verified ? "unverify-skill" : "verify-skill"}`,
        { userId, skill },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(verified ? `"${skill}" unverified` : `"${skill}" verified ✅`, "success");
      fetchStats(token);
    } catch {
      showToast("Failed to update skill verification", "error");
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const avatarGradients = [
    "linear-gradient(135deg,#a78bfa,#38bdf8)",
    "linear-gradient(135deg,#f472b6,#fb923c)",
    "linear-gradient(135deg,#34d399,#38bdf8)",
    "linear-gradient(135deg,#fbbf24,#f472b6)",
    "linear-gradient(135deg,#6d28d9,#f472b6)",
    "linear-gradient(135deg,#0e7490,#34d399)",
  ];

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const statusBadge = (status) => {
    const map = {
      pending:  { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
      accepted: { bg: "rgba(52,211,153,0.15)",  color: "#34d399" },
      rejected: { bg: "rgba(244,114,182,0.15)", color: "#f472b6" },
    };
    const s = map[status] || map.pending;
    return <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: s.bg, color: s.color, fontWeight: 500 }}>{status}</span>;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid rgba(167,139,250,0.2)", borderTop: "3px solid #a78bfa", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Loading admin panel...</p>
      </div>
    </div>
  );

  const { stats, users, swaps, ratings } = data || {};

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", fontFamily: "'DM Sans', sans-serif", color: "#f0eeff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #08080f !important; }
        .adm-card { transition: all 0.2s; }
        .adm-card:hover { border-color: rgba(167,139,250,0.3) !important; }
        .tab-btn:hover { color: rgba(255,255,255,0.8) !important; }
        .del-btn:hover { background: rgba(244,114,182,0.2) !important; }
        .tr-hover:hover { background: rgba(255,255,255,0.04) !important; }
        @keyframes slideIn { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @media(max-width:768px) { .stat-grid{grid-template-columns:1fr 1fr !important;} .adm-nav{padding:0 16px !important;} }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 999, background: toast.type === "success" ? "rgba(52,211,153,0.15)" : "rgba(244,114,182,0.15)", border: `1px solid ${toast.type === "success" ? "rgba(52,211,153,0.4)" : "rgba(244,114,182,0.4)"}`, borderRadius: "12px", padding: "14px 20px", color: toast.type === "success" ? "#34d399" : "#f472b6", fontSize: "14px", fontWeight: 500, animation: "slideIn 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Top Nav */}
      <div className="adm-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: "54px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🛡️</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "18px", background: "linear-gradient(90deg,#a78bfa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Admin Panel
          </span>
        </div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
          SkillSwap Platform Management
        </div>
        <button onClick={() => { localStorage.removeItem("adminToken"); navigate("/admin"); }} style={{ padding: "6px 16px", borderRadius: "99px", background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.2)", color: "#f472b6", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          Sign Out
        </button>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "28px", color: "#fff", marginBottom: "6px" }}>Platform Overview 📊</div>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>Real-time data from your SkillSwap platform</div>
        </div>

        {/* Stats Cards */}
        <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "28px" }}>
          {[
            { label: "Total Users",     value: stats?.totalUsers,    icon: "👥", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)" },
            { label: "Total Swaps",     value: stats?.totalSwaps,    icon: "⇄",  color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.2)"  },
            { label: "Accepted Swaps",  value: stats?.acceptedSwaps, icon: "✅", color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)"  },
            { label: "Pending Swaps",   value: stats?.pendingSwaps,  icon: "⏳", color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)"  },
            { label: "Total Ratings",   value: stats?.totalRatings,  icon: "⭐", color: "#f472b6", bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.2)" },
            { label: "Avg Rating",      value: stats?.avgRating + "★", icon: "🏆", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)" },
            { label: "Total Messages",  value: stats?.totalMessages, icon: "💬", color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.2)"  },
            { label: "Declined Swaps",  value: stats?.rejectedSwaps, icon: "❌", color: "#f472b6", bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.2)" },
          ].map((s, i) => (
            <div key={i} className="adm-card" style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "16px", padding: "20px" }}>
              <div style={{ fontSize: "22px", marginBottom: "8px" }}>{s.icon}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "26px", color: s.color }}>{s.value ?? "—"}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "6px", marginBottom: "24px", width: "fit-content" }}>
          {[["overview","📊 Overview"],["users","👥 Users"],["swaps","⇄ Swaps"],["ratings","⭐ Ratings"]].map(([key, label]) => (
            <button key={key} className="tab-btn" onClick={() => setActiveTab(key)} style={{ padding: "9px 18px", borderRadius: "10px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, transition: "all 0.2s", background: activeTab === key ? "rgba(167,139,250,0.18)" : "transparent", color: activeTab === key ? "#a78bfa" : "rgba(255,255,255,0.45)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Recent Swaps */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff", marginBottom: "16px" }}>Recent Swap Activity</div>
              {swaps?.slice(0, 6).map((s, i) => (
                <div key={s._id} className="tr-hover" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>
                      {s.fromUser?.name || "?"} → {s.toUser?.name || "?"}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{formatDate(s.createdAt)}</div>
                  </div>
                  {statusBadge(s.status)}
                </div>
              ))}
            </div>

            {/* Recent Ratings */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff", marginBottom: "16px" }}>Recent Ratings</div>
              {ratings?.slice(0, 6).map((r, i) => (
                <div key={r._id} className="tr-hover" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>
                      {r.userId?.name || "?"} rated {r.ratedUserId?.name || "?"}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{r.review?.slice(0, 40)}...</div>
                  </div>
                  <div style={{ fontSize: "14px", color: "#fbbf24", fontWeight: 700, flexShrink: 0 }}>{"★".repeat(r.rating)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff", marginBottom: "4px" }}>All Users ({users?.length})</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "20px" }}>Manage registered users</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {users?.map((u, i) => (
                <div key={u._id} className="tr-hover" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: avatarGradients[i % avatarGradients.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: "#fff", flexShrink: 0 }}>
                    {getInitials(u.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#fff" }}>{u.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{u.email}</div>
                  </div>
                  <div style={{ flex: 2, minWidth: 0 }}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "6px" }}>Skills Offered:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {u.skillsOffered?.map((skill, si) => {
                        const isVerified = u.verifiedSkills?.includes(skill);
                        return (
                          <span key={si}
                            onClick={() => verifySkill(u._id, skill, isVerified)}
                            title={isVerified ? "Click to unverify" : "Click to verify"}
                            style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "99px", cursor: "pointer", fontWeight: 500, transition: "all 0.2s",
                              background: isVerified ? "rgba(52,211,153,0.15)" : "rgba(167,139,250,0.1)",
                              color: isVerified ? "#34d399" : "#a78bfa",
                              border: isVerified ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(167,139,250,0.2)"
                            }}>
                            {isVerified ? "✅ " : ""}{skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{formatDate(u.createdAt)}</div>
                  <button className="del-btn" onClick={() => deleteUser(u._id, u.name)} style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.2)", color: "#f472b6", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SWAPS TAB ── */}
        {activeTab === "swaps" && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff", marginBottom: "4px" }}>All Swap Requests ({swaps?.length})</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "20px" }}>Every swap request on the platform</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {swaps?.map((s, i) => (
                <div key={s._id} className="tr-hover" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>
                      <span style={{ color: "#a78bfa" }}>{s.fromUser?.name || "?"}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 8px" }}>⇄</span>
                      <span style={{ color: "#38bdf8" }}>{s.toUser?.name || "?"}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
                      {s.fromUser?.email} → {s.toUser?.email}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{formatDate(s.createdAt)}</div>
                  {statusBadge(s.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RATINGS TAB ── */}
        {activeTab === "ratings" && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff", marginBottom: "4px" }}>All Ratings ({ratings?.length})</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "20px" }}>Every review submitted on the platform</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ratings?.map((r, i) => (
                <div key={r._id} className="tr-hover" style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: avatarGradients[i % avatarGradients.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px", color: "#fff", flexShrink: 0 }}>
                    {getInitials(r.userId?.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>
                      <span style={{ color: "#a78bfa" }}>{r.userId?.name || "?"}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 6px" }}>rated</span>
                      <span style={{ color: "#38bdf8" }}>{r.ratedUserId?.name || "?"}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "6px", fontStyle: "italic" }}>"{r.review}"</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>{formatDate(r.createdAt)}</div>
                  </div>
                  <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: "14px", color: s <= r.rating ? "#fbbf24" : "rgba(255,255,255,0.15)" }}>★</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;