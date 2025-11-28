import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import BatteryCharging from "./components/BatteryCharging";
import RoutePlanning from "./components/RoutePlanning";
import Sidebar from "./components/Sidebar";
import "./App.css";
import TripStats from "./components/TripStats";
import ProfileSettings from "./components/ProfileSettings";
import AppSettings from "./components/AppSettings";
import Login from "./components/Login";
import ChatAssistant from "./components/ChatAssistant";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/*"
            element={
              <div
                style={{
                  display: "flex",
                  height: "100vh",
                  background: "#0f172a",
                  fontFamily: "Poppins, sans-serif",
                  color: "#e5e7eb",
                }}
              >
                {sidebarOpen && <Sidebar />}
                <div
                  style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "20px",
                    position: "relative",
                    background:
                      "radial-gradient(circle at top, #1d4ed8 0, #020617 55%, #000000 100%)",
                  }}
                >
                  {/* Sidebar toggle */}
                  <button
                    onClick={() => setSidebarOpen((prev) => !prev)}
                    style={{
                      position: "fixed",
                      top: 16,
                      left: sidebarOpen ? 224 : 16,
                      zIndex: 50,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(148,163,184,0.6)",
                      backgroundColor: "rgba(15,23,42,0.9)",
                      color: "#e5e7eb",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {sidebarOpen ? "Hide menu" : "Show menu"}
                  </button>

                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/battery" element={<BatteryCharging />} />
                    <Route path="/route" element={<RoutePlanning />} />
                    <Route path="/trip-stats" element={<TripStats />} />
                    <Route path="/profile-settings" element={<ProfileSettings />} />
                    <Route path="/app-settings" element={<AppSettings />} />
                  </Routes>

                  <ChatAssistant />
                </div>
              </div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

