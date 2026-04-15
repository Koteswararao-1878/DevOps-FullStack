import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../components/Logo";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";


function Login() {
  const navigate = useNavigate();

  const [form, setForm]               = useState({ email: "", password: "" });
  const [stats, setStats]             = useState([
    { value:"...", label:"Active Users",    color:"#a78bfa" },
    { value:"...", label:"24/7 Available",  color:"#38bdf8" },
    { value:"Free", label:"Forever Free",  color:"#f472b6" },
    { value:"...", label:"Avg Rating",      color:"#fbbf24" },
  ]);

  useEffect(() => {
    // Fetch stats with timeout — never block login page
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const fetchStats = async () => {
      try {
        const usersRes = await axios.get(`${API}/users`, {
          signal: controller.signal,
          timeout: 3000,
        });
        const userCount = usersRes.data?.length || 0;
        setStats([
          { value: userCount + "+", label: "Active Users",  color: "#a78bfa" },
          { value: "24/7",          label: "Always Active", color: "#38bdf8" },
          { value: "Free",          label: "Forever Free",  color: "#f472b6" },
          { value: "100%",          label: "Trusted Community",    color: "#fbbf24" },
        ]);
      } catch {
        // On error just show default values silently
        setStats([
          { value: "500+", label: "Active Users",  color: "#a78bfa" },
          { value: "24/7", label: "Always Active", color: "#38bdf8" },
          { value: "Free", label: "Forever Free",  color: "#f472b6" },
          { value: "100%", label: "Trusted Community",    color: "#fbbf24" },
        ]);
      } finally {
        clearTimeout(timeout);
      }
    };

    fetchStats();
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim())               e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password)                   e.password = "Password is required";
    return e;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      // Trigger storage event for App.js to detect login
      window.dispatchEvent(new Event("storage"));
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      console.error("Response:", err.response?.data);
      if (!err.response) {
        setErrors({ general: "Cannot connect to server. Make sure backend is running on port 5000." });
      } else {
        const msg = err.response?.data?.message || "Login failed";
        if (msg.toLowerCase().includes("email")) {
          setErrors({ email: "No account found with this email" });
        } else if (msg.toLowerCase().includes("password")) {
          setErrors({ password: "Incorrect password" });
        } else {
          setErrors({ general: msg });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", fontFamily: "'DM Sans', sans-serif", color: "#f0eeff" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #08080f !important; }
        .log-input { width:100%; padding:13px 16px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#fff; font-size:14px; font-family:inherit; outline:none; transition:border-color 0.2s; }
        .log-input:focus { border-color:rgba(167,139,250,0.5); background:rgba(255,255,255,0.08); }
        .log-input.error { border-color:rgba(244,114,182,0.5) !important; }
        .log-input::placeholder { color:rgba(255,255,255,0.25); }
        .submit-btn:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
        .eye-btn:hover { color:rgba(255,255,255,0.8) !important; }
        .forgot-link:hover { color:#fff !important; }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { padding: 32px 24px !important; }
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.5s ease forwards; }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        .pulse { animation:pulse 3s ease-in-out infinite; }
      `}</style>

      {/* ── Left Panel ── */}
      <div className="login-left" style={{ flex:1, background:"linear-gradient(135deg,#1e0f4a 0%,#0e1e40 50%,#0a1628 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 48px", position:"relative", overflow:"hidden", minWidth:"400px" }}>
        <div className="pulse" style={{ position:"absolute", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)", top:"-100px", left:"-100px", pointerEvents:"none" }} />
        <div className="pulse" style={{ position:"absolute", width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle,rgba(244,114,182,0.18) 0%,transparent 70%)", bottom:"-80px", right:"-60px", pointerEvents:"none", animationDelay:"1.5s" }} />

        <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
          <div style={{marginBottom:"48px"}}><Logo /></div>

          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"34px", color:"#fff", lineHeight:1.2, marginBottom:"14px" }}>
            Welcome back! 👋
          </div>
          <div style={{ fontSize:"15px", color:"rgba(255,255,255,0.45)", lineHeight:1.7, marginBottom:"48px" }}>
            Log in to continue your<br />skill exchange journey.
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            {[
              ...stats,
            ].map((s,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"16px", textAlign:"center" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"22px", color:s.color }}>{s.value}</div>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", marginTop:"4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="login-right" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px" }}>
        <div className="fade-up" style={{ width:"100%", maxWidth:"420px" }}>

          {/* Header */}
          <div style={{ marginBottom:"32px" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"28px", color:"#fff", marginBottom:"8px" }}>
              Log in to your account
            </div>
            <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.4)" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color:"#a78bfa", textDecoration:"none", fontWeight:500 }}>Sign up free</Link>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div style={{ background:"rgba(244,114,182,0.1)", border:"1px solid rgba(244,114,182,0.3)", borderRadius:"12px", padding:"12px 16px", fontSize:"14px", color:"#f472b6", marginBottom:"20px" }}>
              ⚠️ {errors.general}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div style={{ marginBottom:"16px" }}>
              <label style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:"8px" }}>Email Address</label>
              <input
                className={`log-input${errors.email ? " error" : ""}`}
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {errors.email && <div style={{ fontSize:"12px", color:"#f472b6", marginTop:"5px" }}>⚠ {errors.email}</div>}
            </div>

            {/* Password */}
            <div style={{ marginBottom:"8px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                <label style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Password</label>
                <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.2)", cursor:"default" }}>Forgot password? <span style={{ fontSize:"10px", background:"rgba(167,139,250,0.15)", color:"#a78bfa", padding:"2px 7px", borderRadius:"99px" }}>Coming soon</span></span>
              </div>
              <div style={{ position:"relative" }}>
                <input
                  className={`log-input${errors.password ? " error" : ""}`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  style={{ paddingRight:"44px" }}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:"16px", transition:"color 0.2s" }}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && <div style={{ fontSize:"12px", color:"#f472b6", marginTop:"5px" }}>⚠ {errors.password}</div>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{ width:"100%", padding:"14px", borderRadius:"12px", background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(90deg,#7c3aed,#38bdf8)", border:"none", color:"#fff", fontSize:"15px", fontWeight:500, cursor: loading ? "default" : "pointer", fontFamily:"inherit", transition:"all 0.2s", marginTop:"20px" }}
            >
              {loading ? "Logging in..." : "Log In →"}
            </button>

          </form>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"24px 0" }}>
            <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.25)" }}>or</span>
            <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.07)" }} />
          </div>

          {/* Sign up link */}
          <div style={{ textAlign:"center" }}>
            <span style={{ fontSize:"14px", color:"rgba(255,255,255,0.4)" }}>New to SkillSwap? </span>
            <Link to="/register" style={{ fontSize:"14px", color:"#a78bfa", textDecoration:"none", fontWeight:500 }}>
              Create a free account →
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;