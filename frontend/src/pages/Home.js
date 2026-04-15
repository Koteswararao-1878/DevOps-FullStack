import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Logo from "../components/Logo";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { icon: "🔐", title: "Secure Auth",      desc: "JWT-based login with bcrypt password hashing keeps your account safe.",        color: "#a78bfa", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.2)"  },
    { icon: "🔄", title: "Skill Matching",   desc: "Smart algorithm matches you with users based on what you offer and want.",      color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.2)"   },
    { icon: "💬", title: "Real-time Chat",   desc: "Socket.io powered instant messaging with typing indicators and online status.", color: "#f472b6", bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.2)"  },
    { icon: "⭐", title: "Ratings System",   desc: "Rate your swap partners and build a trusted reputation in the community.",      color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)"   },
    { icon: "⇄", title: "Swap Requests",    desc: "Send, accept or decline swap requests with a clean request management UI.",    color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)"   },
    { icon: "👤", title: "User Profiles",    desc: "Showcase your skills, bio and ratings to attract the right swap partners.",    color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.2)"   },
  ];

  const steps = [
    { num: "01", title: "Create Account",    desc: "Sign up in seconds and set up your skill profile.",           color: "#a78bfa" },
    { num: "02", title: "Browse Users",      desc: "Explore people offering the skills you want to learn.",       color: "#38bdf8" },
    { num: "03", title: "Send Swap Request", desc: "Request a skill swap with anyone who matches your needs.",    color: "#f472b6" },
    { num: "04", title: "Learn & Teach",     desc: "Connect, chat, and exchange skills with your swap partner.",  color: "#34d399" },
  ];

  const [stats, setStats] = useState([
    { value: "...", label: "Active Users",     color: "#a78bfa" },
    { value: "24/7", label: "Always Available", color: "#38bdf8" },
    { value: "Free", label: "Forever Free",   color: "#f472b6" },
    { value: "100%", label: "Trusted Community",       color: "#fbbf24" },
  ]);
  const [heroCount, setHeroCount] = useState("...");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, swapsRes, ratingsRes] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/swaps/public`).catch(() => ({ data: [] })),
        axios.get(`${API}/ratings/public`).catch(() => ({ data: [] })),
      ]);

      const users    = usersRes.data || [];
      const userCount = users.length;

      // Count unique skills across all users
      const allSkills = new Set();
      users.forEach(u => {
        (u.skillsOffered || []).forEach(s => allSkills.add(s.toLowerCase().trim()));
        (u.skillsWanted  || []).forEach(s => allSkills.add(s.toLowerCase().trim()));
      });

      // Count accepted swaps from public or estimate
      const swapCount = swapsRes.data?.length || userCount * 2;

      // Avg rating
      const rList = ratingsRes.data || [];
      const avgRating = rList.length > 0
        ? (rList.reduce((s, r) => s + r.rating, 0) / rList.length).toFixed(1)
        : "4.8";

      setHeroCount(userCount);
      setStats([
        { value: userCount + "+",      label: "Active Users",     color: "#a78bfa" },
        { value: "24/7",               label: "Always Available",  color: "#38bdf8" },
        { value: "Free",               label: "Forever Free",     color: "#f472b6" },
        { value:  "100%",      label: "Trusted Community",       color: "#fbbf24" },
      ]);
    } catch (err) {
      console.error("Stats fetch error:", err);
      // Keep default values on error
      setStats([
        { value: "500+",  label: "Active Users",     color: "#a78bfa" },
        { value: "24/7",  label: "Always Available",  color: "#38bdf8" },
        { value: "Free",  label: "Forever Free",     color: "#f472b6" },
        { value: "100%",  label: "Trusted Community",       color: "#fbbf24" },
      ]);
      setHeroCount("500+");
    }
  };

  return (
    <div style={{ background: "#08080f", color: "#f0eeff", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #08080f !important; }

        .nav-link:hover { color: #fff !important; }
        .feature-card:hover { border-color: rgba(167,139,250,0.35) !important; transform: translateY(-4px); }
        .step-card:hover { border-color: rgba(255,255,255,0.15) !important; }
        .cta-primary:hover { opacity: 0.88; transform: translateY(-2px); }
        .cta-secondary:hover { background: rgba(255,255,255,0.1) !important; transform: translateY(-2px); }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float    { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes rotate   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse    { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:0.7; transform:scale(1.05); } }

        .fade-up  { animation: fadeUp 0.6s ease forwards; }
        .fu1 { animation-delay: 0.1s; opacity:0; }
        .fu2 { animation-delay: 0.2s; opacity:0; }
        .fu3 { animation-delay: 0.3s; opacity:0; }
        .fu4 { animation-delay: 0.4s; opacity:0; }
        .float  { animation: float 4s ease-in-out infinite; }
        .float2 { animation: float 5s ease-in-out infinite 1s; }
        .float3 { animation: float 6s ease-in-out infinite 2s; }
        .pulse  { animation: pulse 3s ease-in-out infinite; }

        .feature-card { transition: all 0.25s; }
        .step-card    { transition: all 0.2s; }
        .cta-primary  { transition: all 0.2s; }
        .cta-secondary { transition: all 0.2s; }
      `}</style>

      {/* ══════════════════════════════════
          NAVBAR
      ══════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "64px",
        background: scrolled ? ("rgba(8,8,15,0.9)") : "transparent",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "all 0.3s",
      }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link to="/login" className="nav-link" style={{ padding: "8px 18px", borderRadius: "99px", fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}>
            Login
          </Link>
          <Link to="/register" className="cta-primary" style={{ padding: "9px 22px", borderRadius: "99px", background: "linear-gradient(90deg,#7c3aed,#38bdf8)", color: "#fff", fontSize: "14px", fontWeight: 500, textDecoration: "none", display: "inline-block" }}>
            Sign Up →
          </Link>
<Link to="/admin" style={{ padding: "9px 18px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
            🛡️ Admin
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "100px 24px 60px", background: "transparent" }}>

        {/* Background glows */}
        <div className="pulse" style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)", top: "-100px", left: "-100px", pointerEvents: "none" }} />
        <div className="pulse" style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,0.15) 0%,transparent 70%)", bottom: "-80px", right: "-80px", pointerEvents: "none", animationDelay: "1.5s" }} />
        <div className="pulse" style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,rgba(244,114,182,0.12) 0%,transparent 70%)", top: "40%", left: "60%", pointerEvents: "none", animationDelay: "0.8s" }} />

        {/* Floating skill badges */}
        <div className="float"  style={{ position: "absolute", top: "18%", left: "8%",  background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "99px", padding: "8px 16px", fontSize: "13px", color: "#a78bfa", fontWeight: 500, pointerEvents: "none" }} className="floating-badge">React.js ⚛️</div>
        <div className="float2" style={{ position: "absolute", top: "28%", right: "7%", background: "rgba(56,189,248,0.12)",  border: "1px solid rgba(56,189,248,0.3)",  borderRadius: "99px", padding: "8px 16px", fontSize: "13px", color: "#38bdf8", fontWeight: 500, pointerEvents: "none" }} className="floating-badge">UI Design 🎨</div>
        <div className="float3" style={{ position: "absolute", bottom: "28%", left: "6%", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)",  borderRadius: "99px", padding: "8px 16px", fontSize: "13px", color: "#34d399", fontWeight: 500, pointerEvents: "none" }} className="floating-badge">Python 🐍</div>
        <div className="float"  style={{ position: "absolute", bottom: "22%", right: "6%", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "99px", padding: "8px 16px", fontSize: "13px", color: "#fbbf24", fontWeight: 500, pointerEvents: "none", animationDelay: "2s" }} className="floating-badge">Node.js 🟢</div>
        <div className="float2" style={{ position: "absolute", top: "45%", left: "4%", background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)", borderRadius: "99px", padding: "8px 16px", fontSize: "13px", color: "#fb923c", fontWeight: 500, pointerEvents: "none", animationDelay: "1.5s" }} className="floating-badge">Java ☕</div>

        {/* Hero content */}
        <div style={{ maxWidth: "800px", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="fade-up fu1" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "99px", padding: "8px 18px", fontSize: "13px", color: "#a78bfa", fontWeight: 500, marginBottom: "28px" }}>
            ✨ The skill exchange platform
          </div>

          <h1 className="fade-up fu2" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(42px, 7vw, 76px)", lineHeight: 1.1, color: "#fff", marginBottom: "24px" }}>
            Learn. Teach.{" "}
            <span style={{ background: "linear-gradient(90deg,#a78bfa,#38bdf8,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Grow Together.
            </span>
          </h1>

          <p className="fade-up fu3" style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: "36px", maxWidth: "560px", margin: "0 auto 36px" }}>
            Exchange skills with people around the world. No money needed — just your knowledge. Teach what you know, learn what you don't.
          </p>

          <div className="fade-up fu4 hero-btns" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" className="cta-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(90deg,#7c3aed,#38bdf8)", borderRadius: "14px", padding: "15px 32px", color: "#fff", fontSize: "16px", fontWeight: 500, textDecoration: "none" }}>
              Start Swapping Free →
            </Link>
            <Link to="/login" className="cta-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", padding: "15px 32px", color: "#fff", fontSize: "16px", fontWeight: 500, textDecoration: "none" }}>
              Login
            </Link>
          </div>

          {/* Social proof */}
          <div className="fade-up fu4" style={{ marginTop: "48px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex" }}>
              {["#a78bfa","#38bdf8","#f472b6","#34d399","#fbbf24"].map((c, i) => (
                <div key={i} style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg,${c},#08080f)`, border: "2px solid #08080f", marginLeft: i > 0 ? "-8px" : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
                  {["A","B","C","D","E"][i]}
                </div>
              ))}
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>
              <span style={{ color: "#fff", fontWeight: 500 }}>{heroCount}+ users</span> already swapping skills
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS
      ══════════════════════════════════ */}
      <section style={{ padding: "20px 48px 80px" }}>
        <div className="stats-grid" style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "28px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "36px", color: s.color, marginBottom: "6px" }}>{s.value}</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURES
      ══════════════════════════════════ */}
      <section style={{ padding: "80px 48px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ display: "inline-block", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "99px", padding: "6px 16px", fontSize: "12px", color: "#38bdf8", fontWeight: 500, marginBottom: "16px" }}>
              FEATURES
            </div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 42px)", color: "#fff", marginBottom: "14px" }}>
              Everything you need to swap skills
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)", maxWidth: "480px", margin: "0 auto" }}>
              A complete platform built with the MERN stack for seamless skill exchange
            </p>
          </div>

          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: "18px" }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: "20px", padding: "28px" }}>
                <div style={{ fontSize: "32px", marginBottom: "14px" }}>{f.icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "18px", color: "#fff", marginBottom: "8px" }}>{f.title}</div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════ */}
      <section style={{ padding: "80px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ display: "inline-block", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "99px", padding: "6px 16px", fontSize: "12px", color: "#a78bfa", fontWeight: 500, marginBottom: "16px" }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 42px)", color: "#fff" }}>
              Start swapping in 4 simple steps
            </h2>
          </div>

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: "16px" }}>
            {steps.map((s, i) => (
              <div key={i} className="step-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "28px", position: "relative", overflow: "hidden" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "48px", color: s.color, opacity: 0.15, position: "absolute", top: "12px", right: "20px", lineHeight: 1 }}>{s.num}</div>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${s.color}20`, border: `1px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "16px", color: s.color, marginBottom: "16px" }}>
                  {s.num}
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff", marginBottom: "8px" }}>{s.title}</div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA BANNER
      ══════════════════════════════════ */}
      <section style={{ padding: "80px 48px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", borderRadius: "28px", background: "linear-gradient(135deg,#1e0f4a 0%,#0e1e40 50%,#0a1628 100%)", border: "1px solid rgba(255,255,255,0.08)", padding: "64px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.2) 0%,transparent 70%)", top: "-80px", right: "-60px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,0.18) 0%,transparent 70%)", bottom: "-40px", left: "40px", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,44px)", color: "#fff", marginBottom: "16px" }}>
              Ready to start swapping? 🚀
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", marginBottom: "32px", maxWidth: "460px", margin: "0 auto 32px" }}>
              Join hundreds of learners and teachers already exchanging skills on SkillSwap. It's free, forever.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/register" className="cta-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(90deg,#7c3aed,#38bdf8)", borderRadius: "14px", padding: "14px 32px", color: "#fff", fontSize: "15px", fontWeight: 500, textDecoration: "none" }}>
                Create Free Account →
              </Link>
              <Link to="/login" className="cta-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "14px", padding: "14px 32px", color: "#fff", fontSize: "15px", fontWeight: 500, textDecoration: "none" }}>
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOOTER
      ══════════════════════════════════ */}
      <footer className="home-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
        
        {/* Logo */}
        <Logo />

        {/* Copyright */}
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
          © 2026 SkillSwap Platform. Built with MERN Stack ❤️
        </div>

        {/* Contact Info */}
        <div className="footer-contact" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Contact Us</div>
          <a href="mailto:koteswararaoyaragalla@gmail.com" style={{ fontSize: "13px", color: "#a78bfa", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            📧 koteswararaoyaragalla@gmail.com
          </a>
          <a href="tel:+918885744463" style={{ fontSize: "13px", color: "#38bdf8", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            📞 +91 88857 44463
          </a>
        </div>

      </footer>

    </div>
  );
}

export default Home;