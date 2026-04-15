import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit form state
  const [form, setForm] = useState({
    name: "",
    bio: "",
    skillsOffered: [],
    skillsWanted: [],
  });

  // Skill input helpers
  const [skillOfferedInput, setSkillOfferedInput] = useState("");
  const [skillWantedInput, setSkillWantedInput] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setForm({
        name: res.data.name || "",
        bio: res.data.bio || "",
        skillsOffered: res.data.skillsOffered || [],
        skillsWanted: res.data.skillsWanted || [],
      });
    } catch (err) {
      console.error(err);
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API}/users/profile`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setEditing(false);
      showToast("Profile updated! ✅", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (type) => {
    if (type === "offered") {
      const val = skillOfferedInput.trim();
      if (!val || form.skillsOffered.includes(val)) return;
      setForm((prev) => ({ ...prev, skillsOffered: [...prev.skillsOffered, val] }));
      setSkillOfferedInput("");
    } else {
      const val = skillWantedInput.trim();
      if (!val || form.skillsWanted.includes(val)) return;
      setForm((prev) => ({ ...prev, skillsWanted: [...prev.skillsWanted, val] }));
      setSkillWantedInput("");
    }
  };

  const removeSkill = (type, skill) => {
    if (type === "offered") {
      setForm((prev) => ({ ...prev, skillsOffered: prev.skillsOffered.filter((s) => s !== skill) }));
    } else {
      setForm((prev) => ({ ...prev, skillsWanted: prev.skillsWanted.filter((s) => s !== skill) }));
    }
  };

  const handleKeyDown = (e, type) => {
    if (e.key === "Enter") { e.preventDefault(); addSkill(type); }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid rgba(167,139,250,0.2)", borderTop: "3px solid #a78bfa", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Loading profile...</p>
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
        .nav-pill:hover { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.85) !important; }
        .edit-input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; font-size: 14px; font-family: inherit; transition: border-color 0.2s; outline: none; }
        .edit-input:focus { border-color: rgba(167,139,250,0.5); }
        .skill-remove:hover { background: rgba(244,114,182,0.3) !important; }
        .save-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .cancel-btn:hover { background: rgba(255,255,255,0.08) !important; }
        @media (max-width: 768px) {
          .profile-body { padding: 20px 16px !important; max-width: 100% !important; }
          .profile-hero-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .profile-stats { grid-template-columns: 1fr 1fr 1fr !important; }
          .profile-skills-grid { grid-template-columns: 1fr !important; }
          .profile-links { grid-template-columns: 1fr !important; }
          .profile-edit-btn { width: 100% !important; margin-top: 12px !important; }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .fu1 { animation-delay: 0.05s; opacity: 0; }
        .fu2 { animation-delay: 0.15s; opacity: 0; }
        .fu3 { animation-delay: 0.25s; opacity: 0; }
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
            <Link key={label} to={path} className="nav-pill" style={{ padding: "6px 14px", borderRadius: "99px", fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "all 0.2s" }}>
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
      <div className="profile-body" style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Profile Hero Card ── */}
        <div className="fade-up fu1" style={{ borderRadius: "24px", background: "linear-gradient(135deg,#1e0f4a 0%,#0e1e40 45%,#0a1628 100%)", border: "1px solid rgba(255,255,255,0.08)", padding: "36px 40px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
          {/* Glows */}
          <div style={{ position: "absolute", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.2) 0%,transparent 70%)", top: "-80px", right: "-40px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle,rgba(244,114,182,0.15) 0%,transparent 70%)", bottom: "-40px", left: "60px", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{ width: "88px", height: "88px", borderRadius: "50%", background: "linear-gradient(135deg,#a78bfa,#38bdf8,#f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "28px", color: "#fff", flexShrink: 0, border: "3px solid rgba(255,255,255,0.15)" }}>
              {getInitials(user?.name)}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "28px", color: "#fff", marginBottom: "4px" }}>
                {user?.name || "Your Name"}
              </div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "10px" }}>
                {user?.email}
              </div>
              {user?.bio && (
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: "480px" }}>
                  {user.bio}
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setEditing(!editing)}
              style={{ padding: "10px 22px", borderRadius: "12px", background: editing ? "rgba(255,255,255,0.08)" : "linear-gradient(90deg,#7c3aed,#38bdf8)", border: editing ? "1px solid rgba(255,255,255,0.15)" : "none", color: "#fff", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
            >
              {editing ? "✕ Cancel" : "✏️ Edit Profile"}
            </button>
          </div>

          {/* Stats Row */}
          <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: "rgba(255,255,255,0.07)", borderRadius: "14px", overflow: "hidden", marginTop: "28px" }}>
            {[
              { label: "Skills Offered", value: user?.skillsOffered?.length || 0, color: "#a78bfa" },
              { label: "Skills Wanted",  value: user?.skillsWanted?.length  || 0, color: "#38bdf8" },
              { label: "Your Rating",    value: user?.avgRating || "—",           color: "#fbbf24" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "18px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "24px", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Edit Form ── */}
        {editing && (
          <div className="fade-up" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "20px", padding: "28px", marginBottom: "20px" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "18px", color: "#fff", marginBottom: "20px" }}>
              ✏️ Edit Profile
            </div>

            {/* Name */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Full Name</label>
              <input
                className="edit-input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Bio</label>
              <textarea
                className="edit-input"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell others about yourself..."
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Skills Offered */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Skills You Offer</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input
                  className="edit-input"
                  type="text"
                  value={skillOfferedInput}
                  onChange={(e) => setSkillOfferedInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "offered")}
                  placeholder="e.g. React, Python... press Enter"
                  style={{ flex: 1 }}
                />
                <button onClick={() => addSkill("offered")} style={{ padding: "10px 18px", borderRadius: "12px", background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  + Add
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {form.skillsOffered.map((skill, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "5px 12px", borderRadius: "99px", background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                    {skill}
                    <button className="skill-remove" onClick={() => removeSkill("offered", skill)} style={{ background: "rgba(167,139,250,0.2)", border: "none", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#a78bfa", fontSize: "12px", lineHeight: 1, padding: 0, transition: "all 0.15s" }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Skills Wanted */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Skills You Want to Learn</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input
                  className="edit-input"
                  type="text"
                  value={skillWantedInput}
                  onChange={(e) => setSkillWantedInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "wanted")}
                  placeholder="e.g. UI Design, Node.js... press Enter"
                  style={{ flex: 1 }}
                />
                <button onClick={() => addSkill("wanted")} style={{ padding: "10px 18px", borderRadius: "12px", background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  + Add
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {form.skillsWanted.map((skill, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "5px 12px", borderRadius: "99px", background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)" }}>
                    {skill}
                    <button className="skill-remove" onClick={() => removeSkill("wanted", skill)} style={{ background: "rgba(56,189,248,0.2)", border: "none", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#38bdf8", fontSize: "12px", lineHeight: 1, padding: 0, transition: "all 0.15s" }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="save-btn"
                onClick={saveProfile}
                disabled={saving}
                style={{ flex: 1, padding: "13px", borderRadius: "12px", background: "linear-gradient(90deg,#7c3aed,#38bdf8)", border: "none", color: "#fff", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : "💾 Save Profile"}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setEditing(false)}
                style={{ padding: "13px 24px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Skills Display Cards ── */}
        <div className="fade-up fu2" className="profile-skills-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

          {/* Skills Offered */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "15px", color: "#fff" }}>Skills I Offer</div>
              {user?.verifiedSkills?.length > 0 && (
                <span style={{ fontSize: "11px", color: "#34d399", display: "flex", alignItems: "center", gap: "4px" }}>
                  ✅ {user.verifiedSkills.length} verified
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "16px" }}>What you can teach others</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {user?.skillsOffered?.length > 0 ? user.skillsOffered.map((skill, i) => {
                const isVerified = user.verifiedSkills?.includes(skill);
                return (
                  <span key={i} style={{ fontSize: "13px", padding: "6px 14px", borderRadius: "99px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "5px",
                    background: isVerified ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.12)",
                    color: isVerified ? "#34d399" : "#a78bfa",
                    border: isVerified ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(167,139,250,0.25)"
                  }}>
                    {isVerified && <span title="Verified by Admin" style={{ fontSize: "13px" }}>✅</span>}
                    {skill}
                  </span>
                );
              }) : (
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                  No skills added yet — click Edit Profile
                </div>
              )}
            </div>
          </div>

          {/* Skills Wanted */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "22px" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "15px", color: "#fff", marginBottom: "4px" }}>Skills I Want</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "16px" }}>What you want to learn</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {user?.skillsWanted?.length > 0 ? user.skillsWanted.map((skill, i) => (
                <span key={i} style={{ fontSize: "13px", padding: "6px 14px", borderRadius: "99px", background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)", fontWeight: 500 }}>
                  {skill}
                </span>
              )) : (
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                  No skills added yet — click Edit Profile
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="fade-up fu3" className="profile-links" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
          {[
            { label: "Browse Users",   icon: "🔍", path: "/browse",   color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)" },
            { label: "Swap Requests",  icon: "⇄",  path: "/requests", color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.2)"  },
            { label: "My Ratings",     icon: "⭐", path: "/ratings",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)"  },
          ].map((item, i) => (
            <Link key={i} to={item.path} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderRadius: "14px", background: item.bg, border: `1px solid ${item.border}`, textDecoration: "none", transition: "all 0.2s" }}>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: item.color }}>{item.label}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

export default Profile;