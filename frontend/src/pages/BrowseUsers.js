import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import axios from "axios";

const API = "http://localhost:5000/api";

function BrowseUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const [showFeedback, setShowFeedback] = useState(null); // userId
  const [feedbackUser, setFeedbackUser] = useState(null);
  const [showRateModal, setShowRateModal] = useState(null);
  const [rateForm, setRateForm] = useState({ rating: 0, review: "", skillLearned: "" });
  const [hoverStar, setHoverStar] = useState(0);
  const [rateSubmitting, setRateSubmitting] = useState(false);
  const [swappedUsers, setSwappedUsers] = useState([]);
  const [showSwapModal, setShowSwapModal] = useState(null); // user object
  const [selectedSkill, setSelectedSkill] = useState("");
  const [mySkillOffer, setMySkillOffer] = useState("");
  const [myProfile, setMyProfile] = useState(null);
  const [sentMap, setSentMap] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    getUsers();
  }, [navigate]);

  useEffect(() => {
    applyFilter();
  }, [search, filterSkill, users]);

  const getUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const [usersRes, profileRes] = await Promise.all([
        axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/users/profile`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      // Filter out logged-in user from list
      const myId = profileRes.data._id;
      setMyProfile(profileRes.data);
      const filtered = usersRes.data.filter(u => u._id !== myId);
      setUsers(filtered);
      setFiltered(filtered);

      // Fetch ratings for each user
      const ratingsMap = {};
      await Promise.all(filtered.map(async (u) => {
        try {
          const rRes = await axios.get(`${API}/ratings/${u._id}`);
          const rList = rRes.data;
          const avg = rList.length > 0
            ? (rList.reduce((s, r) => s + r.rating, 0) / rList.length).toFixed(1)
            : null;
          // Group by skill
          const bySkill = {};
          rList.forEach(r => {
            const sk = r.skillLearned || "General";
            if (!bySkill[sk]) bySkill[sk] = [];
            bySkill[sk].push(r);
          });
          ratingsMap[u._id] = { avg, count: rList.length, list: rList, bySkill };
        } catch { ratingsMap[u._id] = { avg: null, count: 0, list: [], bySkill: {} }; }
      }));
      setUserRatings(ratingsMap);

      // Fetch accepted swap partners
      const swapsRes = await axios.get(`${API}/swaps`, { headers: { Authorization: `Bearer ${token}` } });
      const partners = swapsRes.data
        .filter(s => s.status === "accepted")
        .map(s => s.fromUser?._id === myId ? s.toUser : s.fromUser)
        .filter(Boolean)
        .map(u => u._id);
      setSwappedUsers([...new Set(partners)]);

    } catch (err) {
      console.error("Error fetching users:", err);
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let result = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.skillsOffered?.some((s) => s.toLowerCase().includes(q)) ||
          u.skillsWanted?.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterSkill.trim()) {
      const q = filterSkill.toLowerCase();
      result = result.filter((u) =>
        u.skillsOffered?.some((s) => s.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  };

  const sendSwapRequest = async (receiverId, wantSkill, offerSkill) => {
    setSending(receiverId);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/swaps/request`,
        { receiverId, skillWanted: wantSkill, skillOffered: offerSkill },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSentMap((prev) => ({ ...prev, [receiverId]: true }));
      setShowSwapModal(null);
      setSelectedSkill("");
      setMySkillOffer("");
      showToast(`Swap request sent for "${wantSkill}"! ✅`, "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send request";
      showToast(msg, "error");
    } finally {
      setSending(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const submitRating = async () => {
    if (!rateForm.rating) return showToast("Please select stars", "error");
    if (!rateForm.skillLearned) return showToast("Please select which skill you learned", "error");
    if (!rateForm.review.trim()) return showToast("Please write a review", "error");
    setRateSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/ratings/add`, {
        ratedUserId: showRateModal._id,
        rating: rateForm.rating,
        review: rateForm.review,
        skillLearned: rateForm.skillLearned,
      }, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Rating submitted! ⭐", "success");
      setShowRateModal(null);
      setRateForm({ rating: 0, review: "", skillLearned: "" });
      // Refresh ratings
      const r = await axios.get(`${API}/ratings/${showRateModal._id}`);
      const avg = r.data.length > 0 ? (r.data.reduce((s, x) => s + x.rating, 0) / r.data.length).toFixed(1) : null;
      setUserRatings(prev => ({ ...prev, [showRateModal._id]: { avg, count: r.data.length, list: r.data } }));
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit", "error");
    } finally {
      setRateSubmitting(false);
    }
  };

  const openFeedback = (user) => {
    setShowFeedback(user._id);
    setFeedbackUser(user);
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
    "linear-gradient(135deg,#be185d,#fbbf24)",
    "linear-gradient(135deg,#a78bfa,#34d399)",
  ];

  const allSkills = [...new Set(users.flatMap((u) => u.skillsOffered || []))];

  // ── Loading Screen ──────────────────────────────────────
  if (loading) {
    const openFeedback = (user) => {
    setFeedbackUser(user);
    setShowFeedback(user._id);
  };

  return (
      <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid rgba(167,139,250,0.2)", borderTop: "3px solid #a78bfa", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Loading users...</p>
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
        .user-card { transition: all 0.2s; }
        .user-card:hover { border-color: rgba(167,139,250,0.35) !important; transform: translateY(-3px); }
        .swap-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        .nav-pill:hover { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.85) !important; }
        .filter-chip:hover { border-color: rgba(167,139,250,0.5) !important; color: #a78bfa !important; }
        .filter-chip.active { background: rgba(167,139,250,0.15) !important; border-color: rgba(167,139,250,0.5) !important; color: #a78bfa !important; }
        .search-input:focus { outline: none; border-color: rgba(167,139,250,0.5) !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .skill-tag { transition: all 0.15s; }
        @media (max-width: 768px) {
          .browse-grid { grid-template-columns: 1fr !important; }
          .browse-topbar { padding: 0 16px !important; }
          .browse-toplinks { display: none !important; }
          .browse-body { padding: 20px 16px !important; }
          .filter-row { flex-wrap: wrap !important; gap: 6px !important; }
        }
        .skill-tag:hover { background: rgba(56,189,248,0.2) !important; }
      `}</style>

      {/* ── Feedback Modal ── */}
      {showFeedback && feedbackUser && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }} onClick={() => setShowFeedback(null)}>
          <div style={{ background:"#0f0f1e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", padding:"28px", width:"100%", maxWidth:"480px", maxHeight:"80vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg,#a78bfa,#38bdf8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#fff", fontSize:"14px" }}>
                {feedbackUser.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"18px", color:"#fff" }}>{feedbackUser.name}</div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)" }}>
                  {userRatings[feedbackUser._id]?.count || 0} reviews ·
                  {userRatings[feedbackUser._id]?.avg ? ` ★ ${userRatings[feedbackUser._id].avg}` : " No rating yet"}
                </div>
              </div>
              <button onClick={() => setShowFeedback(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"22px" }}>×</button>
            </div>

            {/* Skill-wise feedback */}
            {Object.keys(userRatings[feedbackUser._id]?.bySkill || {}).length > 0 ? (
              Object.entries(userRatings[feedbackUser._id].bySkill).map(([skill, reviews]) => {
                const skillAvg = (reviews.reduce((s,r) => s+r.rating, 0) / reviews.length).toFixed(1);
                return (
                  <div key={skill} style={{ marginBottom:"16px", background:"rgba(255,255,255,0.04)", borderRadius:"12px", padding:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                      <div style={{ fontSize:"14px", fontWeight:600, color:"#a78bfa" }}>
                        {feedbackUser.verifiedSkills?.includes(skill) ? "✅ " : ""}
                        {skill}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:"13px", color: s <= Math.round(skillAvg) ? "#fbbf24" : "rgba(255,255,255,0.15)" }}>★</span>)}
                        <span style={{ fontSize:"12px", color:"#fbbf24", marginLeft:"4px" }}>{skillAvg}</span>
                      </div>
                    </div>
                    {reviews.map((r, i) => (
                      <div key={i} style={{ marginBottom:"8px", paddingBottom:"8px", borderBottom: i < reviews.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <div style={{ fontSize:"12px", color:"#fff", fontWeight:500, marginBottom:"3px" }}>{r.ratedBy?.name || "Anonymous"}</div>
                        <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", fontStyle:"italic" }}>"{r.review || "No review text"}"</div>
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign:"center", padding:"32px", color:"rgba(255,255,255,0.3)", fontSize:"14px" }}>
                <div style={{ fontSize:"32px", marginBottom:"8px" }}>📭</div>
                No feedback yet for this user
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Swap Request Modal ── */}
      {showSwapModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={e => { if(e.target === e.currentTarget) setShowSwapModal(null); }}>
          <div style={{ background:"#12101e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"24px", padding:"32px", width:"100%", maxWidth:"500px" }}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"24px" }}>
              <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:"linear-gradient(135deg,#a78bfa,#38bdf8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"16px", color:"#fff", flexShrink:0 }}>
                {showSwapModal.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"18px", color:"#fff" }}>Send Swap Request</div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)" }}>to {showSwapModal.name}</div>
              </div>
              <button onClick={() => setShowSwapModal(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"22px" }}>×</button>
            </div>

            {/* Step 1 - Select skill to LEARN */}
            <div style={{ marginBottom:"20px" }}>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"10px" }}>
                🎯 Which skill do you want to learn from {showSwapModal.name}?
              </div>
              {showSwapModal.skillsOffered?.length > 0 ? (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                  {showSwapModal.skillsOffered.map((skill, i) => {
                    const isVerified = showSwapModal.verifiedSkills?.includes(skill);
                    return (
                      <button key={i} onClick={() => setSelectedSkill(skill)}
                        style={{ padding:"8px 16px", borderRadius:"99px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", fontWeight:500, transition:"all 0.15s",
                          background: selectedSkill === skill ? "linear-gradient(90deg,#7c3aed,#38bdf8)" : "rgba(255,255,255,0.07)",
                          color: selectedSkill === skill ? "#fff" : "rgba(255,255,255,0.6)",
                          outline: selectedSkill === skill ? "2px solid #a78bfa" : "none",
                          outlineOffset: "2px"
                        }}>
                        {isVerified && "✅ "}{skill}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.25)" }}>This user hasn't listed any skills yet</div>
              )}
            </div>

            {/* Step 2 - Select skill to OFFER */}
            <div style={{ marginBottom:"24px" }}>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"10px" }}>
                🤝 What skill will you offer in return?
              </div>
              {myProfile?.skillsOffered?.length > 0 ? (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                  {myProfile.skillsOffered.map((skill, i) => (
                    <button key={i} onClick={() => setMySkillOffer(skill)}
                      style={{ padding:"8px 16px", borderRadius:"99px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", fontWeight:500, transition:"all 0.15s",
                        background: mySkillOffer === skill ? "linear-gradient(90deg,#f472b6,#fb923c)" : "rgba(255,255,255,0.07)",
                        color: mySkillOffer === skill ? "#fff" : "rgba(255,255,255,0.6)",
                        outline: mySkillOffer === skill ? "2px solid #f472b6" : "none",
                        outlineOffset: "2px"
                      }}>
                      {skill}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.25)" }}>Add your skills in Profile first!</div>
              )}
            </div>

            {/* Summary */}
            {selectedSkill && mySkillOffer && (
              <div style={{ padding:"12px 16px", background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:"12px", marginBottom:"20px", fontSize:"13px", color:"rgba(255,255,255,0.7)", lineHeight:1.6 }}>
                You will learn <span style={{ color:"#38bdf8", fontWeight:600 }}>{selectedSkill}</span> from {showSwapModal.name} and teach them <span style={{ color:"#f472b6", fontWeight:600 }}>{mySkillOffer}</span> in return.
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={() => sendSwapRequest(showSwapModal._id, selectedSkill, mySkillOffer)}
              disabled={!selectedSkill || !mySkillOffer || sending === showSwapModal._id}
              style={{ width:"100%", padding:"14px", borderRadius:"14px", border:"none", fontFamily:"inherit", fontSize:"15px", fontWeight:600, cursor: selectedSkill && mySkillOffer ? "pointer" : "default", transition:"all 0.2s",
                background: selectedSkill && mySkillOffer ? "linear-gradient(90deg,#7c3aed,#38bdf8)" : "rgba(255,255,255,0.06)",
                color:"#fff", opacity: selectedSkill && mySkillOffer ? 1 : 0.5
              }}>
              {sending === showSwapModal._id ? "Sending..." : "⇄ Send Swap Request"}
            </button>
          </div>
        </div>
      )}

      {/* ── Rate User Modal ── */}
      {showRateModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }} onClick={(e) => { if(e.target === e.currentTarget) setShowRateModal(null); }}>
          <div style={{ background:"#1a1030", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", padding:"28px", width:"100%", maxWidth:"480px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"18px", color:"#fff" }}>Rate {showRateModal.name}</div>
              <button onClick={() => setShowRateModal(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"22px" }}>×</button>
            </div>

            {/* Skill selector — only skills they offer */}
            <div style={{ marginBottom:"18px" }}>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"10px" }}>Which skill did you learn from them?</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {showRateModal.skillsOffered?.map((skill, i) => (
                  <button key={i} onClick={() => setRateForm(p => ({...p, skillLearned: skill}))}
                    style={{ padding:"7px 14px", borderRadius:"99px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", fontWeight:500, transition:"all 0.15s",
                      background: rateForm.skillLearned === skill ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.06)",
                      color: rateForm.skillLearned === skill ? "#a78bfa" : "rgba(255,255,255,0.5)",
                      outline: rateForm.skillLearned === skill ? "2px solid #a78bfa" : "none"
                    }}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Star rating */}
            <div style={{ marginBottom:"18px" }}>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"10px" }}>Your Rating</div>
              <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                {[1,2,3,4,5].map(star => (
                  <svg key={star} width="36" height="36" viewBox="0 0 24 24" style={{ cursor:"pointer", transition:"transform 0.1s" }}
                    fill={(hoverStar || rateForm.rating) >= star ? "#fbbf24" : "rgba(255,255,255,0.12)"}
                    onClick={() => setRateForm(p => ({...p, rating: star}))}
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(0)}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
                {rateForm.rating > 0 && (
                  <span style={{ fontSize:"13px", color:"#fbbf24", marginLeft:"8px" }}>
                    {["","Poor","Fair","Good","Great","Excellent"][rateForm.rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Review text */}
            <div style={{ marginBottom:"20px" }}>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"8px" }}>Your Review</div>
              <textarea
                value={rateForm.review}
                onChange={e => setRateForm(p => ({...p, review: e.target.value}))}
                placeholder="How was your experience learning from them?"
                rows={3}
                style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"#fff", fontSize:"14px", fontFamily:"inherit", resize:"none", outline:"none" }}
              />
            </div>

            <button onClick={submitRating} disabled={rateSubmitting || !rateForm.rating || !rateForm.skillLearned}
              style={{ width:"100%", padding:"13px", borderRadius:"12px", border:"none", fontFamily:"inherit", fontSize:"15px", fontWeight:500, cursor: rateForm.rating && rateForm.skillLearned ? "pointer" : "default", transition:"all 0.2s",
                background: rateForm.rating && rateForm.skillLearned ? "linear-gradient(90deg,#7c3aed,#fbbf24)" : "rgba(255,255,255,0.06)",
                color:"#fff" }}>
              {rateSubmitting ? "Submitting..." : "⭐ Submit Rating"}
            </button>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 999, background: toast.type === "success" ? "rgba(52,211,153,0.15)" : "rgba(244,114,182,0.15)", border: `1px solid ${toast.type === "success" ? "rgba(52,211,153,0.4)" : "rgba(244,114,182,0.4)"}`, borderRadius: "12px", padding: "14px 20px", color: toast.type === "success" ? "#34d399" : "#f472b6", fontSize: "14px", fontWeight: 500, animation: "slideIn 0.3s ease", backdropFilter: "blur(12px)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Top Nav Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: "54px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <Logo />
        <div style={{ display: "flex", gap: "4px" }}>
          {[["Dashboard", "/dashboard"], ["Browse", "/browse"], ["Requests", "/requests"], ["Chat", "/chat"]].map(([label, path]) => (
            <Link key={label} to={path} className="nav-pill" style={{ padding: "6px 14px", borderRadius: "99px", fontSize: "13px", fontWeight: 500, color: path === "/browse" ? "#a78bfa" : "rgba(255,255,255,0.45)", background: path === "/browse" ? "rgba(167,139,250,0.12)" : "transparent", textDecoration: "none", transition: "all 0.2s" }}>
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
      <div className="browse-body" style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Page Header ── */}
        <div className="fade-up" style={{ marginBottom: "28px" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "30px", color: "#fff", marginBottom: "6px" }}>
            Browse Users 🔍
          </div>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
            {filtered.length} user{filtered.length !== 1 ? "s" : ""} found — find your perfect skill match
          </div>
        </div>

        {/* ── Search + Filter Bar ── */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "20px 24px", marginBottom: "24px" }}>
          {/* Search Input */}
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none" }}>🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search by name or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "12px 16px 12px 44px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "14px", fontFamily: "inherit", transition: "border-color 0.2s" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
            )}
          </div>

          {/* Skill Filter Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginRight: "4px" }}>Filter by skill:</span>
            <button
              className={`filter-chip${filterSkill === "" ? " active" : ""}`}
              onClick={() => setFilterSkill("")}
              style={{ padding: "5px 14px", borderRadius: "99px", fontSize: "12px", fontWeight: 500, background: filterSkill === "" ? "rgba(167,139,250,0.15)" : "transparent", border: `1px solid ${filterSkill === "" ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.12)"}`, color: filterSkill === "" ? "#a78bfa" : "rgba(255,255,255,0.45)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
            >
              All
            </button>
            {allSkills.slice(0, 10).map((skill) => (
              <button
                key={skill}
                className={`filter-chip${filterSkill === skill ? " active" : ""}`}
                onClick={() => setFilterSkill(filterSkill === skill ? "" : skill)}
                style={{ padding: "5px 14px", borderRadius: "99px", fontSize: "12px", fontWeight: 500, background: filterSkill === skill ? "rgba(167,139,250,0.15)" : "transparent", border: `1px solid ${filterSkill === skill ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.12)"}`, color: filterSkill === skill ? "#a78bfa" : "rgba(255,255,255,0.45)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* ── No Results ── */}
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>No users found</div>
            <div style={{ fontSize: "14px" }}>Try a different search or clear the filter</div>
            <button onClick={() => { setSearch(""); setFilterSkill(""); }} style={{ marginTop: "20px", padding: "10px 24px", borderRadius: "99px", background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
              Clear filters
            </button>
          </div>
        )}

        {/* ── Users Grid ── */}
        <div className="browse-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {filtered.map((user, i) => (
            <div
              key={user._id}
              className="user-card fade-up"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px", animationDelay: `${i * 0.05}s`, opacity: 0 }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: avatarGradients[i % avatarGradients.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "16px", color: "#fff", flexShrink: 0 }}>
                  {getInitials(user.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff", marginBottom: "2px" }}>{user.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{user.email}</div>
                </div>
                {user.avgRating && (
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#fbbf24", flexShrink: 0 }}>★ {user.avgRating}</div>
                )}
              </div>

              {/* Skills Offered */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Offers</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {user.skillsOffered?.length > 0 ? user.skillsOffered.map((skill, j) => {
                    const isVerified = user.verifiedSkills?.includes(skill);
                    return (
                      <span key={j} className="skill-tag" title={isVerified ? "✅ Verified skill" : ""} style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "99px", fontWeight: 500, cursor: "default", display: "inline-flex", alignItems: "center", gap: "4px",
                        background: isVerified ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.12)",
                        color: isVerified ? "#34d399" : "#a78bfa",
                        border: isVerified ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(167,139,250,0.25)"
                      }}>
                        {isVerified && "✅"}{skill}
                      </span>
                    );
                  }) : (
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>No skills listed</span>
                  )}
                </div>
              </div>

              {/* Skills Wanted */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Wants to Learn</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {user.skillsWanted?.length > 0 ? user.skillsWanted.map((skill, j) => (
                    <span key={j} className="skill-tag" style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "99px", background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)", fontWeight: 500, cursor: "default" }}>
                      {skill}
                    </span>
                  )) : (
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>None listed</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "12px" }} />

              {/* Buttons row */}
              <div style={{ display:"flex", gap:"8px" }}>
              {swappedUsers.includes(user._id) && (
                <button onClick={() => { setShowRateModal(user); setRateForm({ rating:0, review:"", skillLearned:"" }); setHoverStar(0); }}
                  style={{ flex:1, padding:"10px", borderRadius:"12px", border:"1px solid rgba(251,191,36,0.3)", background:"rgba(251,191,36,0.1)", color:"#fbbf24", fontSize:"13px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>
                  ⭐ Rate
                </button>
              )}

              {/* Send Swap Button */}
              <button
                className="swap-btn"
                onClick={() => { if (!sentMap[user._id]) { setShowSwapModal(user); setSelectedSkill(""); setMySkillOffer(""); } }}
                disabled={sending === user._id || sentMap[user._id]}
                style={{
                  flex: swappedUsers.includes(user._id) ? 2 : 1,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: sentMap[user._id] ? "default" : "pointer",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  background: sentMap[user._id]
                    ? "rgba(52,211,153,0.12)"
                    : sending === user._id
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(90deg,#7c3aed,#38bdf8)",
                  color: sentMap[user._id] ? "#34d399" : "#fff",
                  border: sentMap[user._id] ? "1px solid rgba(52,211,153,0.3)" : "none",
                }}
              >
                {sentMap[user._id]
                  ? "✅ Request Sent"
                  : sending === user._id
                  ? "Sending..."
                  : "⇄ Send Swap Request"}
              </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default BrowseUsers;