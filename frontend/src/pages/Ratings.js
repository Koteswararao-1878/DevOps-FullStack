import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import axios from "axios";

const API = "http://localhost:5000/api";

function Ratings() {
  const navigate = useNavigate();

  const [users, setUsers]           = useState([]);
  const [ratings, setRatings]       = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rating, setRating]         = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skillLearned, setSkillLearned] = useState("");
  const [toast, setToast]           = useState(null);
  const [tab, setTab]               = useState("give"); // "give" | "received"

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, ratingsRes] = await Promise.all([
        axios.get(`${API}/users`, { headers }),
        axios.get(`${API}/ratings`, { headers }),
      ]);
      setUsers(usersRes.data);
      setRatings(ratingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (!selectedUser) return showToast("Please select a user to rate", "error");
    if (rating === 0)  return showToast("Please select a star rating", "error");
    if (!review.trim()) return showToast("Please write a review", "error");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/ratings/add`, {
        ratedUserId: selectedUser._id,
        rating,
        review,
        skillLearned,
      }, { headers: { Authorization: `Bearer ${token}` } });

      showToast("Rating submitted! ⭐", "success");
      setSelectedUser(null);
      setRating(0);
      setReview("");
      setSkillLearned("");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit rating", "error");
    } finally {
      setSubmitting(false);
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

  const starColor = (star) => {
    const active = hoverRating || rating;
    return star <= active ? "#fbbf24" : "rgba(255,255,255,0.12)";
  };

  const ratingLabel = (r) => {
    const labels = { 1:"Poor", 2:"Fair", 3:"Good", 4:"Great", 5:"Excellent" };
    return labels[r] || "";
  };

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#08080f", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:"48px", height:"48px", borderRadius:"50%", border:"3px solid rgba(167,139,250,0.2)", borderTop:"3px solid #a78bfa", margin:"0 auto 16px", animation:"spin 0.8s linear infinite" }} />
          <p style={{ color:"rgba(255,255,255,0.4)", fontFamily:"sans-serif" }}>Loading ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#08080f", fontFamily:"'DM Sans', sans-serif", color:"#f0eeff" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #08080f !important; }
        .nav-pill:hover { background: rgba(255,255,255,0.07) !important; }
        .user-opt:hover { border-color: rgba(167,139,250,0.4) !important; background: rgba(167,139,250,0.08) !important; }
        .user-opt.selected { border-color: rgba(167,139,250,0.6) !important; background: rgba(167,139,250,0.12) !important; }
        .star-btn { transition: transform 0.1s; cursor: pointer; background: none; border: none; padding: 0; line-height: 1; }
        .star-btn:hover { transform: scale(1.2); }
        .submit-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        .review-input:focus { outline: none; border-color: rgba(167,139,250,0.5) !important; }
        .rating-card:hover { border-color: rgba(255,255,255,0.15) !important; transform: translateY(-2px); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .rating-card { transition: all 0.2s; }
        @media (max-width: 768px) {
          .ratings-grid { grid-template-columns: 1fr !important; }
          .ratings-body { padding: 20px 16px !important; }
          .ratings-summary { flex-direction: column !important; align-items: center !important; gap: 16px !important; }
          .ratings-divider { display: none !important; }
        }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:"fixed", top:"24px", right:"24px", zIndex:999, background: toast.type === "success" ? "rgba(52,211,153,0.15)" : "rgba(244,114,182,0.15)", border:`1px solid ${toast.type === "success" ? "rgba(52,211,153,0.4)" : "rgba(244,114,182,0.4)"}`, borderRadius:"12px", padding:"14px 20px", color: toast.type === "success" ? "#34d399" : "#f472b6", fontSize:"14px", fontWeight:500, animation:"slideIn 0.3s ease", backdropFilter:"blur(12px)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Nav Bar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", height:"54px", background:"rgba(255,255,255,0.02)", borderBottom:"1px solid rgba(255,255,255,0.06)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100 }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"18px", background:"linear-gradient(90deg,#a78bfa,#38bdf8,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>SkillSwap</span>
        <div style={{ display:"flex", gap:"4px" }}>
          {[["Dashboard","/dashboard"],["Browse","/browse"],["Requests","/requests"],["Chat","/chat"],["Ratings","/ratings"]].map(([label, path]) => (
            <Link key={label} to={path} className="nav-pill" style={{ padding:"6px 14px", borderRadius:"99px", fontSize:"13px", fontWeight:500, color: path==="/ratings" ? "#a78bfa" : "rgba(255,255,255,0.45)", background: path==="/ratings" ? "rgba(167,139,250,0.12)" : "transparent", textDecoration:"none", transition:"all 0.2s" }}>{label}</Link>
          ))}
        </div>
        <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} style={{ padding:"6px 16px", borderRadius:"99px", background:"rgba(244,114,182,0.1)", border:"1px solid rgba(244,114,182,0.2)", color:"#f472b6", fontSize:"13px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>Logout</button>
      </div>

      {/* ── Body ── */}
      <div className="ratings-body" style={{ maxWidth:"1000px", margin:"0 auto", padding:"32px 24px" }}>

        {/* ── Header ── */}
        <div className="fade-up" style={{ marginBottom:"28px" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"30px", color:"#fff", marginBottom:"6px" }}>Ratings & Reviews ⭐</div>
          <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.4)" }}>Rate your swap partners and see what others say about you</div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:"4px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"6px", marginBottom:"24px", width:"fit-content" }}>
          {[["give","⭐ Give Rating"],["received","💬 Received Reviews"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding:"9px 20px", borderRadius:"10px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", fontWeight:500, transition:"all 0.2s", background: tab===key ? "rgba(167,139,250,0.18)" : "transparent", color: tab===key ? "#a78bfa" : "rgba(255,255,255,0.45)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════
            TAB 1 — GIVE RATING
        ══════════════════════════════════ */}
        {tab === "give" && (
          <div className="ratings-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr", gap:"20px" }}>

            {/* User Selection */}
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"24px" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px", color:"#fff", marginBottom:"4px" }}>Select User to Rate</div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"16px" }}>Choose who you want to review</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px", maxHeight:"400px", overflowY:"auto" }}>
                {users.map((u, i) => (
                  <div
                    key={u._id}
                    className={`user-opt${selectedUser?._id === u._id ? " selected" : ""}`}
                    onClick={() => setSelectedUser(u)}
                    style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", background:"rgba(255,255,255,0.03)", border:`1px solid ${selectedUser?._id === u._id ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.07)"}`, borderRadius:"12px", cursor:"pointer", transition:"all 0.15s" }}
                  >
                    <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:avatarGradients[i % avatarGradients.length], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"13px", color:"#fff", flexShrink:0 }}>
                      {getInitials(u.name)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"13px", fontWeight:500, color:"#fff" }}>{u.name}</div>
                      <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", marginTop:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {u.skillsOffered?.join(", ") || "No skills listed"}
                      </div>
                    </div>
                    {selectedUser?._id === u._id && (
                      <div style={{ width:"18px", height:"18px", borderRadius:"50%", background:"#a78bfa", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", color:"#fff", flexShrink:0 }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Form */}
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"24px" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px", color:"#fff", marginBottom:"4px" }}>Write Your Review</div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"20px" }}>Share your experience with this user</div>

              {/* Selected user preview */}
              {selectedUser ? (
                <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:"12px", marginBottom:"20px" }}>
                  <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:avatarGradients[0], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"13px", color:"#fff" }}>
                    {getInitials(selectedUser.name)}
                  </div>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:500, color:"#fff" }}>Reviewing: {selectedUser.name}</div>
                    <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)" }}>{selectedUser.email}</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding:"16px", background:"rgba(255,255,255,0.03)", border:"1px dashed rgba(255,255,255,0.1)", borderRadius:"12px", textAlign:"center", fontSize:"13px", color:"rgba(255,255,255,0.3)", marginBottom:"20px" }}>
                  ← Select a user from the left
                </div>
              )}

              {/* Which skill did you learn? */}
              {selectedUser && selectedUser.skillsOffered?.length > 0 && (
                <div style={{ marginBottom:"16px" }}>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"8px" }}>
                    Which skill did you learn from {selectedUser.name.split(" ")[0]}?
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                    {selectedUser.skillsOffered.map((skill, i) => (
                      <button key={i} onClick={() => setSkillLearned(skillLearned === skill ? "" : skill)}
                        style={{ padding:"6px 14px", borderRadius:"99px", fontSize:"13px", fontWeight:500, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                          background: skillLearned === skill ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.04)",
                          color: skillLearned === skill ? "#a78bfa" : "rgba(255,255,255,0.5)",
                          border: skillLearned === skill ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.08)"
                        }}>
                        {selectedUser.verifiedSkills?.includes(skill) ? "✅ " : ""}{skill}
                        {skillLearned === skill && " ✓"}
                      </button>
                    ))}
                  </div>
                  {skillLearned && (
                    <div style={{ fontSize:"12px", color:"#34d399", marginTop:"6px" }}>
                      ✓ Rating specifically for: <strong>{skillLearned}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Star Rating */}
              <div style={{ marginBottom:"20px" }}>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"12px" }}>Your Rating</div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      className="star-btn"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <svg width="36" height="36" viewBox="0 0 24 24" fill={starColor(star)} style={{ transition:"fill 0.15s" }}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  ))}
                  {(hoverRating || rating) > 0 && (
                    <span style={{ fontSize:"14px", fontWeight:500, color:"#fbbf24", marginLeft:"8px" }}>
                      {ratingLabel(hoverRating || rating)}
                    </span>
                  )}
                </div>
              </div>

              {/* Review Text */}
              <div style={{ marginBottom:"24px" }}>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"8px" }}>Your Review</div>
                <textarea
                  className="review-input"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Describe your experience — was this person helpful? Did they teach well? Would you swap with them again?"
                  rows={5}
                  style={{ width:"100%", padding:"13px 16px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"#fff", fontSize:"14px", fontFamily:"inherit", resize:"vertical", transition:"border-color 0.2s" }}
                />
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.2)", marginTop:"4px", textAlign:"right" }}>{review.length}/500</div>
              </div>

              {/* Submit */}
              <button
                className="submit-btn"
                onClick={submitRating}
                disabled={submitting || !selectedUser || rating === 0}
                style={{ width:"100%", padding:"14px", borderRadius:"12px", background: (!selectedUser || rating === 0) ? "rgba(255,255,255,0.06)" : "linear-gradient(90deg,#7c3aed,#fbbf24)", border:"none", color:"#fff", fontSize:"15px", fontWeight:500, cursor: (!selectedUser || rating === 0) ? "default" : "pointer", fontFamily:"inherit", transition:"all 0.2s" }}
              >
                {submitting ? "Submitting..." : "⭐ Submit Rating"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 2 — RECEIVED REVIEWS
        ══════════════════════════════════ */}
        {tab === "received" && (
          <div>
            {ratings.length === 0 ? (
              <div style={{ textAlign:"center", padding:"80px 24px" }}>
                <div style={{ fontSize:"48px", marginBottom:"16px" }}>⭐</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"20px", color:"rgba(255,255,255,0.5)", marginBottom:"8px" }}>No reviews yet</div>
                <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.3)" }}>Complete skill swaps to receive your first review!</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                {/* Summary Card */}
                <div className="ratings-summary" style={{ background:"linear-gradient(135deg,#1e0f4a,#0e1e40)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", padding:"24px", display:"flex", alignItems:"center", gap:"32px", flexWrap:"wrap", marginBottom:"8px" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"48px", color:"#fbbf24" }}>
                      {(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)}
                    </div>
                    <div style={{ display:"flex", gap:"4px", justifyContent:"center", margin:"6px 0" }}>
                      {[1,2,3,4,5].map((s) => (
                        <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= Math.round(ratings.reduce((sum,r)=>sum+r.rating,0)/ratings.length) ? "#fbbf24" : "rgba(255,255,255,0.15)"}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)" }}>Average Rating</div>
                  </div>
                  <div className="ratings-divider" style={{ height:"60px", width:"1px", background:"rgba(255,255,255,0.08)" }} />
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"36px", color:"#a78bfa" }}>{ratings.length}</div>
                    <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", marginTop:"4px" }}>Total Reviews</div>
                  </div>
                  <div className="ratings-divider" style={{ height:"60px", width:"1px", background:"rgba(255,255,255,0.08)" }} />
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"36px", color:"#34d399" }}>
                      {ratings.filter((r) => r.rating >= 4).length}
                    </div>
                    <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", marginTop:"4px" }}>Positive Reviews</div>
                  </div>
                </div>

                {/* Review Cards */}
                {ratings.map((r, i) => (
                  <div key={r._id || i} className="rating-card" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"18px", padding:"22px 24px" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:"14px" }}>
                      <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:avatarGradients[i % avatarGradients.length], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"14px", color:"#fff", flexShrink:0 }}>
                        {getInitials(r.ratedBy?.name || "U")}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap", marginBottom:"8px" }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"15px", color:"#fff" }}>
                            {r.ratedBy?.name || "Anonymous"}
                          </div>
                          <div style={{ display:"flex", gap:"3px" }}>
                            {[1,2,3,4,5].map((s) => (
                              <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= r.rating ? "#fbbf24" : "rgba(255,255,255,0.15)"}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            ))}
                          </div>
                          <span style={{ fontSize:"12px", padding:"2px 10px", borderRadius:"99px", background: r.rating >= 4 ? "rgba(52,211,153,0.15)" : r.rating === 3 ? "rgba(251,191,36,0.15)" : "rgba(244,114,182,0.15)", color: r.rating >= 4 ? "#34d399" : r.rating === 3 ? "#fbbf24" : "#f472b6", fontWeight:500 }}>
                            {ratingLabel(r.rating)}
                          </span>
                        </div>
                        {r.skillLearned && (
                          <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"3px 10px", borderRadius:"99px", background:"rgba(167,139,250,0.12)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.2)", marginBottom:"6px" }}>
                            Learned: {r.skillLearned}
                          </div>
                        )}
                        <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>
                          "{r.review}"
                        </div>
                        {r.createdAt && (
                          <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.25)", marginTop:"8px" }}>
                            {new Date(r.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Ratings;