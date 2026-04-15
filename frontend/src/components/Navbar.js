import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useTheme } from "../App";

function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const logout = () => {
    localStorage.removeItem("token");
    window.location = "/login";
  };

  const isActive = (path) => {
    return location.pathname === path ? "active-link" : "";
  };

  return (
    <nav className="navbar navbar-expand-lg premium-navbar">
      <div className="container d-flex justify-content-between align-items-center">

        {/* LOGO */}
        <Logo size="sm" />

        {/* NAV LINKS */}
        <div className="d-flex align-items-center">

          <Link to="/dashboard" className={`nav-link ${isActive("/dashboard")}`}>
            🏠 Dashboard
          </Link>

          <Link to="/browse" className={`nav-link ${isActive("/browse")}`}>
            🔍 Browse
          </Link>

          <Link to="/requests" className={`nav-link ${isActive("/requests")}`}>
            🔄 Requests
          </Link>

          <Link to="/ratings" className={`nav-link ${isActive("/ratings")}`}>
            ⭐ Ratings
          </Link>

          {/* THEME TOGGLE */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="theme-toggle-thumb">
              {theme === "dark" ? "🌙" : "☀️"}
            </div>
          </button>

          {/* USER PROFILE */}
          <div className="profile-container">
            <div className="profile-icon" onClick={() => setOpen(!open)}>
              👤
            </div>

            {open && (
              <div className="dropdown-menu show">
                <Link to="/dashboard" className="dropdown-item">
                  Profile
                </Link>
                <button className="dropdown-item" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;