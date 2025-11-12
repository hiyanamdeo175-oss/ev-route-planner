import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { EVProvider } from "./components/EVContext";
import Dashboard from "./components/Dashboard";
import BatteryCharging from "./components/BatteryCharging";
import RoutePlanning from "./components/RoutePlanning";
import Sidebar from "./components/Sidebar";
import "./App.css";
import TripStats from "./components/TripStats";
import ProfileSettings from "./components/ProfileSettings";
import AppSettings from "./components/AppSettings";


function App() {
  return (
    <EVProvider>
      <Router>
        <div
          style={{
            display: "flex",
            height: "100vh",
            background: "#ecf0f1",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {/* Sidebar Navigation */}
          <Sidebar />

          {/* Main Content Area */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "20px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/battery" element={<BatteryCharging />} />
              <Route path="/route" element={<RoutePlanning />} />
              <Route path="/trip-stats" element={<TripStats />} /> 
              <Route path="/profile-settings" element={<ProfileSettings />} />
              <Route path="/app-settings" element={<AppSettings />} />

            </Routes>
          </div>
        </div>
      </Router>
    </EVProvider>
  );
}

export default App;

