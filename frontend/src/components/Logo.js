import React from "react";
import { Link } from "react-router-dom";

function Logo({ size = "md" }) {

  const iconSize  = size === "sm" ? "30px" : "38px";
  const iconBr    = size === "sm" ? "9px"  : "11px";
  const svgSize   = size === "sm" ? 18     : 22;
  const fontSize  = size === "sm" ? "16px" : "20px";
  const tagSize   = size === "sm" ? "9px"  : "10px";

  return (
    <>
      <style>{`
        @keyframes swapRight {
          0%,100% { transform:translateX(0);  opacity:1; }
          40%     { transform:translateX(7px); opacity:0; }
          41%     { transform:translateX(-7px);opacity:0; }
          90%     { transform:translateX(0);  opacity:1; }
        }
        @keyframes swapLeft {
          0%,100% { transform:translateX(0);   opacity:1; }
          40%     { transform:translateX(-7px); opacity:0; }
          41%     { transform:translateX(7px);  opacity:0; }
          90%     { transform:translateX(0);   opacity:1; }
        }
        @keyframes logoPulse {
          0%,100% { box-shadow: 0 0 8px rgba(167,139,250,0.5); }
          50%     { box-shadow: 0 0 20px rgba(56,189,248,0.7); }
        }
        .logo-icon-anim { animation: logoPulse 3s ease-in-out infinite; }
        .logo-arr-r     { animation: swapRight 2.5s ease-in-out infinite; }
        .logo-arr-l     { animation: swapLeft  2.5s ease-in-out infinite 0.1s; }
      @media (max-width: 480px) {
        .logo-tag { display: none !important; }
      }
      `}</style>

      <Link
        to="/dashboard"
        style={{ textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"10px" }}
      >
        {/* Animated icon box */}
        <div
          className="logo-icon-anim"
          style={{ width:iconSize, height:iconSize, borderRadius:iconBr, background:"linear-gradient(135deg,#a78bfa,#38bdf8,#f472b6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
        >
          <svg width={svgSize} height={svgSize} viewBox="0 0 32 32" fill="none">
            <g className="logo-arr-r">
              <line x1="5" y1="11" x2="24" y2="11" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <polyline points="18,5 25,11 18,17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </g>
            <g className="logo-arr-l">
              <line x1="27" y1="21" x2="8" y2="21" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <polyline points="14,15 7,21 14,27" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </g>
          </svg>
        </div>

        {/* Text + tagline */}
        <div>
          <div style={{ display:"flex", alignItems:"baseline", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:fontSize, lineHeight:1 }}>
            <span style={{ background:"linear-gradient(90deg,#a78bfa,#38bdf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Skill
            </span>
            <span style={{ color:"#fff" }}>Swap</span>
          </div>
          {size !== "sm" && (
            <div className="logo-tag" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:tagSize, color:"rgba(255,255,255,0.3)", letterSpacing:"1.5px", marginTop:"2px" }}>
              LEARN · TEACH · GROW
            </div>
          )}
        </div>
      </Link>
    </>
  );
}

export default Logo;