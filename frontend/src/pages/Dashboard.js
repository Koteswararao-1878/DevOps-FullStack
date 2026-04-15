import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../components/Logo";

import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [allRequests, setAllRequests] = useState([]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Good night";
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchDashboardData(token);
  }, [navigate]);

  const fetchDashboardData = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, requestsRes, usersRes] = await Promise.all([
        axios.get(`${API}/users/profile`, { headers }),
        axios.get(`${API}/swaps`, { headers }),
        axios.get(`${API}/users`, { headers }),
      ]);

      const myProfile = profileRes.data;
      setUser(myProfile);
      setAllRequests(requestsRes.data);
      setRequests(requestsRes.data.slice(0, 3));

      // ── Build real top matched users ──────────────────────
      const allUsers = usersRes.data.filter(u => u._id !== myProfile._id);
      setAllUsers(usersRes.data); // save ALL users including self for skill demand counting

      // Fetch ratings for all users to get real avgRating
      let ratingsMap = {};
      try {
        await Promise.all(
          allUsers.map(async (u) => {
            const rRes = await axios.get(`${API}/ratings/${u._id}`);
            const rList = rRes.data;
            if (rList.length > 0) {
              const avg = rList.reduce((sum, r) => sum + r.rating, 0) / rList.length;
              ratingsMap[u._id] = { avg: avg.toFixed(1), count: rList.length };
            } else {
              ratingsMap[u._id] = { avg: null, count: 0 };
            }
          })
        );
      } catch (e) { console.log("Ratings fetch error", e); }

      // Score each user by skill match + rating
      const myOffered = myProfile.skillsOffered || [];
      const myWanted  = myProfile.skillsWanted  || [];

      const scored = allUsers.map(u => {
        const theirOffered = u.skillsOffered || [];
        const theirWanted  = u.skillsWanted  || [];

        // Skill match score
        const matchScore =
          theirOffered.filter(s => myWanted.some(w => w.toLowerCase() === s.toLowerCase())).length +
          theirWanted.filter(s => myOffered.some(o => o.toLowerCase() === s.toLowerCase())).length;

        const ratingInfo = ratingsMap[u._id] || { avg: null, count: 0 };
        const ratingScore = ratingInfo.avg ? parseFloat(ratingInfo.avg) : 0;

        return {
          ...u,
          avgRating: ratingInfo.avg,
          ratingCount: ratingInfo.count,
          totalScore: matchScore * 2 + ratingScore, // skill match weighted more
          matchScore,
        };
      });

      // Sort by totalScore descending, then by rating
      scored.sort((a, b) => b.totalScore - a.totalScore || b.ratingScore - a.ratingScore);

      setTopUsers(scored.slice(0, 4));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending:  { background: "rgba(251,191,36,0.15)",  color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)"  },
      accepted: { background: "rgba(52,211,153,0.15)",  color: "#34d399", border: "1px solid rgba(52,211,153,0.3)"  },
      rejected: { background: "rgba(244,114,182,0.15)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.3)" },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{ ...s, fontSize: "11px", padding: "3px 10px", borderRadius: "99px", fontWeight: 500 }}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"}
      </span>
    );
  };

  const avatarGradients = [
    "linear-gradient(135deg,#a78bfa,#38bdf8)",
    "linear-gradient(135deg,#f472b6,#fb923c)",
    "linear-gradient(135deg,#34d399,#38bdf8)",
    "linear-gradient(135deg,#fbbf24,#f472b6)",
    "linear-gradient(135deg,#6d28d9,#f472b6)",
    "linear-gradient(135deg,#0e7490,#34d399)",
  ];

  // Build real Skills in Demand from ALL users skillsWanted
  const buildSkillBarData = () => {
    const skillColors = [
      "#a78bfa,#38bdf8",
      "#f472b6,#fb923c",
      "#34d399,#38bdf8",
      "#fbbf24,#f472b6",
      "#a78bfa,#f472b6",
      "#38bdf8,#34d399",
    ];
    const countMap = {};

    // Count skillsWanted from ALL users (including self)
    const everyone = [...allUsers];
    if (user) everyone.push(user); // include logged-in user too

    everyone.forEach(u => {
      (u.skillsWanted || []).forEach(skill => {
        const key = skill.trim().toLowerCase();
        const display = skill.trim();
        countMap[display] = (countMap[display] || { count: 0, key });
        countMap[display].count += 1;
      });
    });

    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    if (sorted.length === 0) return [];

    const max = sorted[0][1].count;
    return sorted.map(([name, val], i) => ({
      name,
      count: val.count,
      pct: Math.round((val.count / max) * 100),
      colors: skillColors[i % skillColors.length],
    }));
  };

  const skillBarData = buildSkillBarData();

  // Build real activity from actual API data
  const buildActivity = () => {
    const activities = [];
    allRequests.forEach((r) => {
      const myId = user?._id;
      const isSender = r.fromUser?._id === myId || r.sender?._id === myId;
      const partnerName = isSender
        ? (r.toUser?.name || r.receiver?.name || "Someone")
        : (r.fromUser?.name || r.sender?.name || "Someone");
      const time = r.createdAt ? timeAgo(r.createdAt) : "";
      if (r.status === "pending" && isSender) {
        activities.push({ text: `You sent a swap request to ${partnerName}`, time, color: "#a78bfa" });
      } else if (r.status === "pending" && !isSender) {
        activities.push({ text: `${partnerName} sent you a swap request`, time, color: "#f472b6" });
      } else if (r.status === "accepted") {
        activities.push({ text: `Swap with ${partnerName} was accepted ✓`, time, color: "#34d399" });
      } else if (r.status === "rejected") {
        activities.push({ text: `Swap with ${partnerName} was declined`, time, color: "#fbbf24" });
      }
    });
    return activities.slice(0, 5);
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return d.toLocaleDateString();
  };

  const activityData = buildActivity();

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid rgba(167,139,250,0.2)", borderTop: "3px solid #a78bfa", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Loading dashboard...</p>
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
        .dash-card { transition: all 0.2s; }
        .dash-card:hover { border-color: rgba(167,139,250,0.3) !important; transform: translateY(-2px); }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .nav-pill:hover { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.85) !important; }
        .user-row:hover { background: rgba(255,255,255,0.04); border-radius: 10px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.55s ease forwards; }
        .fu1 { animation-delay: 0.05s; opacity:0; }
        .fu2 { animation-delay: 0.15s; opacity:0; }
        .fu3 { animation-delay: 0.25s; opacity:0; }
        @media (max-width: 900px) {
          .dash-hero-stats { grid-template-columns: 1fr 1fr !important; }
          .dash-row2 { grid-template-columns: 1fr !important; }
          .dash-row3 { grid-template-columns: 1fr !important; }
          .dash-topbar { padding: 0 16px !important; }
          .dash-toplinks { display: none !important; }
          .dash-body { padding: 20px 16px !important; }
          .dash-hero { padding: 28px 24px !important; }
          .dash-hero-title { font-size: 24px !important; }
        }
        @media (max-width: 480px) {
          .dash-hero-stats { grid-template-columns: 1fr 1fr !important; }
          .notif-dropdown { width: 260px !important; right: -60px !important; }
        }
        @keyframes swapDown { 0%{transform:translateY(0);opacity:1} 40%{transform:translateY(7px);opacity:0} 41%{transform:translateY(-7px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes swapUp { 0%{transform:translateY(0);opacity:1} 40%{transform:translateY(-7px);opacity:0} 41%{transform:translateY(7px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 8px rgba(167,139,250,0.5)} 50%{box-shadow:0 0 18px rgba(56,189,248,0.8)} }
        .logo-icon { animation: glowPulse 3s ease-in-out infinite; }
        .arrow-top { animation: swapDown 2.5s ease-in-out infinite; }
        .arrow-bot { animation: swapUp 2.5s ease-in-out infinite 0.1s; }
      `}</style>



      {/* ── Secondary Top Bar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", height:"54px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter:"blur(12px)" }}>
        <Logo />
        <div style={{ display:"flex", gap:"4px" }}>
          {[["Dashboard","/dashboard"],["Browse","/browse"],["Requests","/requests"],["Chat","/chat"]].map(([label, path]) => (
            <Link key={label} to={path} className="nav-pill" style={{ padding:"6px 14px", borderRadius:"99px", fontSize:"13px", fontWeight:500, color: location.pathname === path ? "#fff" : "rgba(255,255,255,0.5)", background: location.pathname === path ? "rgba(255,255,255,0.1)" : "transparent", border: location.pathname === path ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent", textDecoration:"none", transition:"all 0.2s" }}>
              {label}
            </Link>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ position:"relative" }}>
            <div onClick={() => setShowNotif(!showNotif)} style={{ width:"34px", height:"34px", borderRadius:"9px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"15px" }}>
              🔔
              {pendingCount > 0 && <span style={{ width:"16px", height:"16px", borderRadius:"50%", background:"#f472b6", position:"absolute", top:"-4px", right:"-4px", border:"2px solid #08080f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:"#fff", fontWeight:700 }}>{pendingCount}</span>}
            </div>
            {showNotif && (
              <div style={{ position:"absolute", right:0, top:"42px", width:"280px", background:"#1a1030", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"14px", padding:"12px", zIndex:200, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"13px", color:"#fff", marginBottom:"10px", padding:"0 4px" }}>Notifications</div>
                {pendingCount > 0 ? (
                  allRequests.filter(r=>r.status==="pending").slice(0,5).map((r,i) => (
                    <div key={i} onClick={() => { setShowNotif(false); navigate("/requests"); }} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px", borderRadius:"10px", cursor:"pointer", background:"rgba(255,255,255,0.04)", marginBottom:"6px" }}>
                      <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#a78bfa,#38bdf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:700, color:"#fff", flexShrink:0 }}>
                        {(r.sender?.name||r.fromUser?.name||"U")[0].toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"12px", color:"#fff", fontWeight:500 }}>{r.sender?.name||r.fromUser?.name||"Someone"} sent a swap request</div>
                        <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", marginTop:"2px" }}>Tap to view</div>
                      </div>
                      <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"99px", background:"rgba(251,191,36,0.15)", color:"#fbbf24" }}>Pending</span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign:"center", padding:"16px", fontSize:"13px", color:"rgba(255,255,255,0.3)" }}>No new notifications 🎉</div>
                )}
                <div onClick={() => { setShowNotif(false); navigate("/requests"); }} style={{ textAlign:"center", marginTop:"8px", fontSize:"12px", color:"#a78bfa", cursor:"pointer", fontWeight:500 }}>View all requests →</div>
              </div>
            )}
          </div>
          <div onClick={() => navigate("/profile")} style={{ width:"34px", height:"34px", borderRadius:"50%", background:"linear-gradient(135deg,#a78bfa,#38bdf8,#f472b6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"12px", color:"#fff", cursor:"pointer", title:"My Profile" }}>
            {getInitials(user?.name)}
          </div>
          <button onClick={handleLogout} style={{ padding:"6px 16px", borderRadius:"99px", background:"rgba(244,114,182,0.1)", border:"1px solid rgba(244,114,182,0.2)", color:"#f472b6", fontSize:"13px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>
            Logout
          </button>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"32px 24px" }} className="dash-body">

        {/* ════════════════════════════════
            HERO BANNER
        ════════════════════════════════ */}
        <div className="fade-up fu1" style={{ borderRadius:"24px", background:"linear-gradient(135deg,#1e0f4a 0%,#0e1e40 45%,#0a1628 100%)", border:"1px solid rgba(255,255,255,0.08)", padding:"40px 48px", marginBottom:"24px", position:"relative", overflow:"hidden" }}>
          {/* Background glows */}
          <div style={{ position:"absolute", width:"360px", height:"360px", borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.22) 0%,transparent 70%)", top:"-100px", right:"-60px", pointerEvents:"none" }} />
          <div style={{ position:"absolute", width:"240px", height:"240px", borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.18) 0%,transparent 70%)", bottom:"-60px", left:"80px", pointerEvents:"none" }} />
          <div style={{ position:"absolute", width:"180px", height:"180px", borderRadius:"50%", background:"radial-gradient(circle,rgba(244,114,182,0.15) 0%,transparent 70%)", top:"20px", left:"42%", pointerEvents:"none" }} />

          <div style={{ position:"relative", zIndex:1 }}>
            {/* Greeting row */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"32px", flexWrap:"wrap", gap:"16px" }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"34px", color:"#fff", lineHeight:1.2 }}>
                  {getGreeting()}, {user?.name?.split(" ")[0] || "User"} 👋
                </div>
                <div style={{ fontSize:"15px", color:"rgba(255,255,255,0.45)", marginTop:"10px" }}>
                  Here's what's happening with your skill swaps today
                </div>
              </div>
              {pendingCount > 0 && (
                <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(244,114,182,0.12)", border:"1px solid rgba(244,114,182,0.25)", borderRadius:"99px", padding:"10px 20px", fontSize:"13px", color:"#f472b6", fontWeight:500 }}>
                  🔔 {pendingCount} request{pendingCount > 1 ? "s" : ""} waiting
                </div>
              )}
            </div>

            {/* Stat boxes */}
            <div className="dash-hero-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1px", background:"rgba(255,255,255,0.07)", borderRadius:"16px", overflow:"hidden" }}>
              {[
                { label:"Total Swaps",  value: allRequests.filter(r=>r.status==="accepted").length, accent:"#a78bfa", sub: allRequests.length > 0 ? "Active swaps" : "No swaps yet" },
                { label:"Connections",  value: allRequests.filter(r=>r.status==="accepted").length, accent:"#38bdf8", sub: "Accepted swaps" },
                { label:"Pending",      value: pendingCount, accent:"#f472b6", sub: pendingCount > 0 ? "Needs your action" : "All clear!" },
                { label:"Your Rating",  value: user?.avgRating ? user.avgRating + "★" : "—", accent:"#fbbf24", sub: "from reviews" },
              ].map((s, i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.04)", padding:"22px 24px", textAlign:"center" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"30px", color:"#fff" }}>{s.value}</div>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", marginTop:"4px" }}>{s.label}</div>
                  <div style={{ fontSize:"11px", color:s.accent, marginTop:"4px" }}>{s.sub}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ════════════════════════════════
            ROW 2 — Skills + Requests
        ════════════════════════════════ */}
        <div className="fade-up fu2 dash-row2" style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:"20px", marginBottom:"20px" }}>

          {/* Skills in Demand */}
          <div className="dash-card" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"24px" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px", color:"#fff", marginBottom:"4px" }}>Skills in Demand</div>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"20px" }}>Most sought-after skills on the platform</div>
            {skillBarData.length > 0 ? skillBarData.map((s, i) => (
              <div key={i} style={{ marginBottom:"14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", marginBottom:"6px" }}>
                  <span style={{ color:"rgba(255,255,255,0.8)" }}>{s.name}</span>
                  <span style={{ color:"rgba(255,255,255,0.35)" }}>{s.pct}%</span>
                </div>
                <div style={{ height:"6px", background:"rgba(255,255,255,0.07)", borderRadius:"99px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${s.pct}%`, background:`linear-gradient(90deg,${s.colors})`, borderRadius:"99px", transition:"width 1s ease" }} />
                </div>
              </div>
            )) : (
              <div style={{ textAlign:"center", padding:"24px 0", color:"rgba(255,255,255,0.25)", fontSize:"13px" }}>
                <div style={{ fontSize:"32px", marginBottom:"8px" }}>📊</div>
                Skills data will appear as users join the platform!
              </div>
            )}
          </div>

          {/* Swap Requests */}
          <div className="dash-card" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"24px" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px", color:"#fff", marginBottom:"4px" }}>Swap Requests</div>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"20px" }}>Latest incoming & outgoing</div>

            {(requests.length > 0 ? requests : [
              { name:"Priya Raj",    skill:"React ↔ Figma",    status:"pending"  },
              { name:"Mohammed S.", skill:"Node.js ↔ Python",  status:"accepted" },
              { name:"Tanvi Lal",   skill:"MongoDB ↔ CSS",     status:"rejected" },
            ]).map((req, i) => (
              <div key={req._id || i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:"12px", marginBottom:"8px", border:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:avatarGradients[i % avatarGradients.length], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"12px", color:"#fff", flexShrink:0 }}>
                  {getInitials(req.sender?.name || req.receiver?.name || req.name)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"13px", fontWeight:500, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {req.sender?.name || req.receiver?.name || req.name || "User"}
                  </div>
                  <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)", marginTop:"2px" }}>
                    {req.skillOffered || req.skill || "Skill swap"}
                  </div>
                </div>
                {getStatusBadge(req.status)}
              </div>
            ))}

            <Link to="/requests" style={{ display:"block", textAlign:"center", marginTop:"12px", fontSize:"13px", color:"#a78bfa", textDecoration:"none", fontWeight:500 }}>
              View all requests →
            </Link>
          </div>
        </div>

        {/* ════════════════════════════════
            ROW 3 — Top Users + Activity
        ════════════════════════════════ */}
        <div className="fade-up fu3 dash-row3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>

          {/* Top Matched Users */}
          <div className="dash-card" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"24px" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px", color:"#fff", marginBottom:"4px" }}>Top Matched Users</div>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"20px" }}>Based on your skills offered & wanted</div>

            {topUsers.length === 0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:"rgba(255,255,255,0.25)", fontSize:"13px" }}>
                <div style={{ fontSize:"32px", marginBottom:"8px" }}>👥</div>
                No matched users yet — add your skills in Profile!
              </div>
            ) : topUsers.map((u, i) => (
              <div key={u._id || i} className="user-row" style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 8px", borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer", transition:"all 0.15s" }} onClick={() => navigate("/browse")}>
                {/* Rank badge */}
                <div style={{ width:"20px", flexShrink:0, textAlign:"center", fontSize:"12px", color:"rgba(255,255,255,0.3)", fontWeight:700 }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                </div>
                <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:avatarGradients[i % avatarGradients.length], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"12px", color:"#fff", flexShrink:0 }}>
                  {getInitials(u.name)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <div style={{ fontSize:"13px", fontWeight:500, color:"#fff" }}>{u.name}</div>
                    {u.matchScore > 0 && (
                      <span style={{ fontSize:"10px", padding:"1px 6px", borderRadius:"99px", background:"rgba(52,211,153,0.15)", color:"#34d399", fontWeight:500 }}>
                        {u.matchScore} match
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)", marginTop:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    Offers: {u.skillsOffered?.join(", ") || "—"}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  {u.avgRating ? (
                    <>
                      <div style={{ fontSize:"13px", fontWeight:500, color:"#fbbf24" }}>★ {u.avgRating}</div>
                      <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.25)", marginTop:"2px" }}>{u.ratingCount} review{u.ratingCount !== 1 ? "s" : ""}</div>
                    </>
                  ) : (
                    <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.25)" }}>No rating</div>
                  )}
                </div>
              </div>
            ))}

            <Link to="/browse" style={{ display:"block", textAlign:"center", marginTop:"16px", fontSize:"13px", color:"#38bdf8", textDecoration:"none", fontWeight:500 }}>
              Browse all users →
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="dash-card" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"24px" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px", color:"#fff", marginBottom:"4px" }}>Recent Activity</div>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"20px" }}>Your latest platform events</div>

            {activityData.length > 0 ? activityData.map((a, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"14px" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:a.color, marginTop:"5px", flexShrink:0 }} />
                <div style={{ flex:1, fontSize:"13px", color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{a.text}</div>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.25)", flexShrink:0, whiteSpace:"nowrap" }}>{a.time}</div>
              </div>
            )) : (
              <div style={{ textAlign:"center", padding:"24px 0", color:"rgba(255,255,255,0.25)", fontSize:"13px" }}>
                <div style={{ fontSize:"32px", marginBottom:"8px" }}>📭</div>
                No activity yet — start by browsing users!
              </div>
            )}

            {user?.skillsOffered?.length > 0 && (
              <div style={{ marginTop:"20px", paddingTop:"16px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"10px" }}>Your Skills</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {user.skillsOffered.map((s, i) => (
                    <span key={i} style={{ fontSize:"11px", padding:"4px 10px", borderRadius:"99px", background:"rgba(167,139,250,0.15)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.25)", fontWeight:500 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;