import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { EVContext } from "./EVContext"; // adjust path if needed
import "./Sidebar.css";

function Sidebar() {
  const { userProfile } = useContext(EVContext);
  const location = useLocation();

  const menuItems = [
    { path: "/", label: "Dashboard" },
    { path: "/route", label: "Route Planning" },
    { path: "/battery", label: "Battery & Charging" },
    { path: "/trip-stats", label: "Trip Statistics" },
    { path: "/profile-settings", label: "Profile Settings" },
    { path: "/app-settings", label: "App Settings" },
  ];

  return (
    <div className="sidebar">
      {/* 🔹 Header */}
      <div className="sidebar-header">
        <h2>⚡ EV Route Planner</h2>
      </div>

      {/* 🔹 User Info */}
      <div className="sidebar-user">
        <img
          src={userProfile.avatar}
          alt="User Avatar"
          className="sidebar-avatar"
        />
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{userProfile.name}</p>
          <p className="sidebar-user-email">{userProfile.email}</p>
        </div>
      </div>

      {/* 🔹 Navigation Links */}
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item.path}
            className={location.pathname === item.path ? "active" : ""}
          >
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
