import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BrowseUsers from "./pages/BrowseUsers";
import SwapRequests from "./pages/SwapRequests";
import ChatPage from "./pages/ChatPage";
import Profile from "./pages/Profile";
import Ratings from "./pages/Ratings";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// ── Theme Context ────────────────────────────────
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved || "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Protected route component — re-checks token on every render
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin" replace />;
};

function AppRoutes() {
  // This state forces re-render when token changes
  const [, setAuth] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    // Listen for storage changes (login/logout)
    const handleStorage = () => setAuth(!!localStorage.getItem("token"));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<Home />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin"    element={<AdminLogin />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/browse"    element={<ProtectedRoute><BrowseUsers /></ProtectedRoute>} />
      <Route path="/requests"  element={<ProtectedRoute><SwapRequests /></ProtectedRoute>} />
      <Route path="/chat"      element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/ratings"   element={<ProtectedRoute><Ratings /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;