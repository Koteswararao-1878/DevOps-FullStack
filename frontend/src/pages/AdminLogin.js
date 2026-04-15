import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api";

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ email: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API}/admin/login`, form);
      localStorage.setItem("adminToken", res.data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #08080f !important; }
        .adm-input { width:100%; padding:13px 16px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#fff; font-size:14px; font-family:inherit; outline:none; transition:border-color 0.2s; }
        .adm-input:focus { border-color:rgba(167,139,250,0.5); }
        .adm-input::placeholder { color:rgba(255,255,255,0.25); }
        .adm-btn:hover:not(:disabled) { opacity:0.85; transform:translateY(-1px); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      <div className="fade-up" style={{ width: "100%", maxWidth: "420px", padding: "0 24px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "linear-gradient(135deg,#a78bfa,#38bdf8,#f472b6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>
            🛡️
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "24px", color: "#fff", marginBottom: "6px" }}>Admin Portal</div>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>SkillSwap Platform Management</div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "32px" }}>

          {error && (
            <div style={{ background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.3)", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", color: "#f472b6", marginBottom: "20px" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Admin Email</label>
              <input className="adm-input" type="email" placeholder="admin@skillswap.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="adm-input" type={showPass ? "text" : "password"} placeholder="Admin password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ paddingRight: "44px" }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: "16px" }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button type="submit" className="adm-btn" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(90deg,#7c3aed,#38bdf8)", border: "none", color: "#fff", fontSize: "15px", fontWeight: 500, cursor: loading ? "default" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              {loading ? "Signing in..." : "🛡️ Admin Sign In"}
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>
           
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a href="/login" style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>← Back to User Login</a>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;