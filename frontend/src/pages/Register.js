import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();
  const emailCheckTimer = useRef(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [errors, setErrors]               = useState({});
  const [step, setStep]                   = useState(1);
  const [emailStatus, setEmailStatus]     = useState(null); // null | "checking" | "taken" | "available"

  // ── Real-time email check ─────────────────────────────────
  const checkEmailAvailability = (email) => {
    clearTimeout(emailCheckTimer.current);
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setEmailStatus(null); return; }
    setEmailStatus("checking");
    emailCheckTimer.current = setTimeout(async () => {
      try {
        const res = await axios.post(`${API}/auth/check-email`, { email });
        setEmailStatus(res.data.exists ? "taken" : "available");
        if (res.data.exists) {
          setErrors((prev) => ({ ...prev, email: "This email is already registered" }));
        } else {
          setErrors((prev) => ({ ...prev, email: "" }));
        }
      } catch {
        setEmailStatus(null);
      }
    }, 600); // debounce 600ms
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "email") checkEmailAvailability(value);
    if (errors[field] && field !== "email") setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                           e.name            = "Full name is required";
    if (!form.email.trim())                          e.email           = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))       e.email           = "Enter a valid email";
    else if (emailStatus === "taken")                e.email           = "This email is already registered";
    if (!form.phone.trim())                          e.phone           = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone))           e.phone           = "Enter a valid 10-digit number";
    if (!form.password)                              e.password        = "Password is required";
    else if (form.password.length < 6)               e.password        = "Minimum 6 characters";
    if (!form.confirmPassword)                       e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await API.post("/auth/register", {
        name: form.name, email: form.email,
        phone: form.phone, password: form.password,
      });
      setStep(2);
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      setErrors({ general: serverMessage || err.message || "Registration failed" });
      console.error("Registration error:", err.response?.data || err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return { label: "", color: "", width: "0%" };
    if (p.length < 4)  return { label: "Weak",   color: "#f472b6", width: "25%" };
    if (p.length < 6)  return { label: "Fair",   color: "#fbbf24", width: "50%" };
    if (p.length < 10) return { label: "Good",   color: "#38bdf8", width: "75%" };
    return               { label: "Strong", color: "#34d399", width: "100%" };
  };
  const strength = passwordStrength();

  const emailIndicator = () => {
    if (emailStatus === "checking")  return { text: "Checking...",       color: "rgba(255,255,255,0.35)", icon: "⏳" };
    if (emailStatus === "taken")     return { text: "Email already taken", color: "#f472b6",              icon: "✕" };
    if (emailStatus === "available") return { text: "Email is available!", color: "#34d399",              icon: "✓" };
    return null;
  };
  const emailHint = emailIndicator();

  // ── Success Screen ────────────────────────────────────────
  if (step === 2) {
    return (
      <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap'); @keyframes pop { 0%{transform:scale(0.5);opacity:0} 80%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} } .pop{animation:pop 0.5s ease forwards;}`}</style>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="pop" style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(52,211,153,0.15)", border: "2px solid rgba(52,211,153,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", margin: "0 auto 24px" }}>✅</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "28px", color: "#fff", marginBottom: "10px" }}>Account Created!</div>
          <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>Welcome to SkillSwap, {form.name.split(" ")[0]}! 🎉</div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "32px" }}>Your account has been registered with {form.email}</div>
          <button onClick={() => navigate("/login")} style={{ padding: "13px 36px", borderRadius: "12px", background: "linear-gradient(90deg,#7c3aed,#38bdf8)", border: "none", color: "#fff", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", fontFamily: "'DM Sans', sans-serif", color: "#f0eeff" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #08080f !important; }
        .reg-input { width:100%; padding:13px 16px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#fff; font-size:14px; font-family:inherit; outline:none; transition:border-color 0.2s; }
        .reg-input:focus { border-color:rgba(167,139,250,0.5); background:rgba(255,255,255,0.08); }
        .reg-input.error   { border-color:rgba(244,114,182,0.5) !important; }
        .reg-input.success { border-color:rgba(52,211,153,0.5) !important; }
        .reg-input::placeholder { color:rgba(255,255,255,0.25); }
        .submit-btn:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
        .eye-btn:hover { color:rgba(255,255,255,0.8) !important; }
        @media (max-width: 768px) {
          .reg-left { display: none !important; }
          .reg-right { padding: 32px 24px !important; }
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.5s ease forwards; }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        .pulse { animation:pulse 3s ease-in-out infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 0.8s linear infinite; }
      `}</style>

      {/* ── Left Panel ── */}
      <div className="reg-left" style={{ flex:1, background:"linear-gradient(135deg,#1e0f4a 0%,#0e1e40 50%,#0a1628 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 48px", position:"relative", overflow:"hidden", minWidth:"400px" }}>
        <div className="pulse" style={{ position:"absolute", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)", top:"-100px", left:"-100px", pointerEvents:"none" }} />
        <div className="pulse" style={{ position:"absolute", width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.18) 0%,transparent 70%)", bottom:"-80px", right:"-60px", pointerEvents:"none", animationDelay:"1.5s" }} />
        <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
          <div style={{marginBottom:"48px"}}><Logo /></div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"34px", color:"#fff", lineHeight:1.2, marginBottom:"14px" }}>Join the skill<br />exchange community</div>
          <div style={{ fontSize:"15px", color:"rgba(255,255,255,0.45)", lineHeight:1.7, marginBottom:"40px" }}>Teach what you know.<br />Learn what you don't.<br />No money needed.</div>
          {[
            { icon:"🔄", text:"Smart Skill Matching",      color:"#a78bfa" },
            { icon:"💬", text:"Real-time Chat",             color:"#38bdf8" },
            { icon:"⭐", text:"Ratings & Reviews",          color:"#fbbf24" },
            { icon:"🔐", text:"Secure JWT Authentication",  color:"#34d399" },
          ].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", marginBottom:"10px", textAlign:"left" }}>
              <span style={{ fontSize:"18px" }}>{f.icon}</span>
              <span style={{ fontSize:"14px", color:f.color, fontWeight:500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="reg-right" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px", overflowY:"auto" }}>
        <div className="fade-up" style={{ width:"100%", maxWidth:"440px" }}>

          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"28px", color:"#fff", marginBottom:"8px" }}>Create your account</div>
            <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.4)" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color:"#a78bfa", textDecoration:"none", fontWeight:500 }}>Log in</Link>
            </div>
          </div>

          {errors.general && (
            <div style={{ background:"rgba(244,114,182,0.1)", border:"1px solid rgba(244,114,182,0.3)", borderRadius:"12px", padding:"12px 16px", fontSize:"14px", color:"#f472b6", marginBottom:"20px" }}>
              ⚠️ {errors.general}
            </div>
          )}

          <form onSubmit={handleRegister}>

            {/* Full Name */}
            <div style={{ marginBottom:"16px" }}>
              <label style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:"8px" }}>Full Name</label>
              <input className={`reg-input${errors.name ? " error" : ""}`} type="text" placeholder="e.g. Arjun Kumar" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
              {errors.name && <div style={{ fontSize:"12px", color:"#f472b6", marginTop:"5px" }}>⚠ {errors.name}</div>}
            </div>

            {/* Email with real-time check */}
            <div style={{ marginBottom:"16px" }}>
              <label style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:"8px" }}>Email Address</label>
              <div style={{ position:"relative" }}>
                <input
                  className={`reg-input${errors.email ? " error" : emailStatus === "available" ? " success" : ""}`}
                  type="email"
                  placeholder="e.g. arjun@gmail.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  style={{ paddingRight:"40px" }}
                />
                {/* Status icon */}
                {emailStatus && (
                  <div style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"14px" }}>
                    {emailStatus === "checking"  && <div style={{ width:"14px", height:"14px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.2)", borderTop:"2px solid #a78bfa" }} className="spin" />}
                    {emailStatus === "taken"     && <span style={{ color:"#f472b6" }}>✕</span>}
                    {emailStatus === "available" && <span style={{ color:"#34d399" }}>✓</span>}
                  </div>
                )}
              </div>
              {/* Email hint below input */}
              {emailHint && !errors.email && (
                <div style={{ fontSize:"12px", color:emailHint.color, marginTop:"5px" }}>{emailHint.icon} {emailHint.text}</div>
              )}
              {errors.email && <div style={{ fontSize:"12px", color:"#f472b6", marginTop:"5px" }}>⚠ {errors.email}</div>}
            </div>

            {/* Phone */}
            <div style={{ marginBottom:"16px" }}>
              <label style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:"8px" }}>Phone Number</label>
              <div style={{ position:"relative" }}>
                <div style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", color:"rgba(255,255,255,0.35)", borderRight:"1px solid rgba(255,255,255,0.1)", paddingRight:"10px", pointerEvents:"none" }}>🇮🇳 +91</div>
                <input className={`reg-input${errors.phone ? " error" : ""}`} type="tel" placeholder="10-digit mobile number" value={form.phone} onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g,"").slice(0,10))} style={{ paddingLeft:"72px" }} />
              </div>
              {errors.phone && <div style={{ fontSize:"12px", color:"#f472b6", marginTop:"5px" }}>⚠ {errors.phone}</div>}
            </div>

            {/* Password */}
            <div style={{ marginBottom:"8px" }}>
              <label style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:"8px" }}>Create Password</label>
              <div style={{ position:"relative" }}>
                <input className={`reg-input${errors.password ? " error" : ""}`} type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={form.password} onChange={(e) => handleChange("password", e.target.value)} style={{ paddingRight:"44px" }} />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)} style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:"16px", transition:"color 0.2s" }}>{showPassword ? "🙈" : "👁"}</button>
              </div>
              {errors.password && <div style={{ fontSize:"12px", color:"#f472b6", marginTop:"5px" }}>⚠ {errors.password}</div>}
            </div>

            {/* Strength bar */}
            {form.password && (
              <div style={{ marginBottom:"16px" }}>
                <div style={{ height:"4px", background:"rgba(255,255,255,0.07)", borderRadius:"99px", overflow:"hidden", marginBottom:"4px" }}>
                  <div style={{ height:"100%", width:strength.width, background:strength.color, borderRadius:"99px", transition:"width 0.3s,background 0.3s" }} />
                </div>
                <div style={{ fontSize:"11px", color:strength.color }}>{strength.label} password</div>
              </div>
            )}

            {/* Confirm Password */}
            <div style={{ marginBottom:"24px" }}>
              <label style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:"8px" }}>Confirm Password</label>
              <div style={{ position:"relative" }}>
                <input className={`reg-input${errors.confirmPassword ? " error" : ""}`} type={showConfirm ? "text" : "password"} placeholder="Re-enter your password" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} style={{ paddingRight:"44px" }} />
                <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)} style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:"16px", transition:"color 0.2s" }}>{showConfirm ? "🙈" : "👁"}</button>
              </div>
              {errors.confirmPassword && <div style={{ fontSize:"12px", color:"#f472b6", marginTop:"5px" }}>⚠ {errors.confirmPassword}</div>}
              {form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword && (
                <div style={{ fontSize:"12px", color:"#34d399", marginTop:"5px" }}>✓ Passwords match</div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="submit-btn" disabled={loading || emailStatus === "taken" || emailStatus === "checking"} style={{ width:"100%", padding:"14px", borderRadius:"12px", background: loading || emailStatus === "taken" ? "rgba(255,255,255,0.08)" : "linear-gradient(90deg,#7c3aed,#38bdf8)", border:"none", color:"#fff", fontSize:"15px", fontWeight:500, cursor: loading || emailStatus === "taken" ? "default" : "pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
              {loading ? "Creating account..." : emailStatus === "taken" ? "Email already taken ✕" : "Create Account →"}
            </button>

          </form>

          <div style={{ marginTop:"20px", fontSize:"12px", color:"rgba(255,255,255,0.2)", textAlign:"center", lineHeight:1.6 }}>
            By creating an account you agree to our Terms of Service
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;