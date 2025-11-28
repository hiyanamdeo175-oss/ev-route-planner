import React, { useContext, useEffect, useState } from "react";
import { EVContext } from "./EVContext";
import EVMap from "./EVMap";
import puneStations from "../data/puneStations.json";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "@mui/material/styles";

function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Dashboard() {
  const {
    battery,
    range,
    booking,
    route,
    selectedStation,
    predictedEnergy,
    userProfile,
  } = useContext(EVContext);
  const { logout } = useAuth();
  const theme = useTheme();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error("Location error:", err)
      );
    }
  }, []);

  const center = position || [18.5204, 73.8567];

  // Static dataset of EV charging stations (Pune, Lonavla, Mumbai) from JSON
  const stationsForMap = puneStations;

  // Nearest station based on current location
  const nearestStation = position
    ? stationsForMap.reduce((best, st) => {
        const lat = Number(st.latitude ?? st.lat ?? st.location?.lat);
        const lon = Number(st.longitude ?? st.lon ?? st.location?.lng);
        if (!lat || !lon) return best;

        const dist = haversineKm(position, [lat, lon]);
        if (!best || dist < best.distanceKm) {
          return { station: st, distanceKm: dist };
        }
        return best;
      }, null)
    : null;

  return (
    <div
      style={{
        padding: "12px 8px 24px 8px",
        maxWidth: 1280,
        margin: "0 auto",
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top, #1d4ed8 0, #020617 55%, #000000 100%)"
            : "linear-gradient(to bottom, #e5f3ff, #ffffff)",
      }}
    >
      {/* Hero header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            Live EV Overview
          </h2>
          <p style={{ fontSize: 13, opacity: 0.75 }}>
            Track your battery, range, active route and charging station status in
            one place.
          </p>
          {userProfile && (
            <p
              style={{
                marginTop: 6,
                fontSize: 12,
                opacity: 0.75,
              }}
            >
              {userProfile.evModel && (
                <span>
                  EV: <strong>{userProfile.evModel}</strong>
                </span>
              )}
              {userProfile.batteryHealth && (
                <span>
                  {" "}• Battery health: {userProfile.batteryHealth}%
                </span>
              )}
              {userProfile.preferredChargeLimit && (
                <span>
                  {" "}• Charge limit: {userProfile.preferredChargeLimit}%
                </span>
              )}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {predictedEnergy?.predictedRemainingSoC != null && (
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.2))",
                border: "1px solid rgba(34,197,94,0.5)",
                fontSize: 13,
              }}
            >
              Predicted SoC at destination:
              <span style={{ fontWeight: 600, marginLeft: 6 }}>
                {predictedEnergy.predictedRemainingSoC}%
              </span>
            </div>
          )}

          <button
            onClick={logout}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.6)",
              backgroundColor: "rgba(15,23,42,0.9)",
              color: "#e5e7eb",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Alerts strip */}
      <div
        style={{
          marginBottom: 16,
        }}
      >
        {(() => {
          const alerts = [];

          if (battery <= 20) {
            alerts.push("Low current battery – consider charging soon.");
          }

          if (predictedEnergy?.predictedRemainingSoC != null &&
              predictedEnergy.predictedRemainingSoC < 15) {
            alerts.push("Planned route may leave you with very low charge.");
          }

          if (predictedEnergy?.nextServiceDuePercent != null &&
              predictedEnergy.nextServiceDuePercent > 0.8) {
            alerts.push("Service interval coming up based on odometer.");
          }

          if (predictedEnergy?.batteryHealth != null &&
              predictedEnergy.batteryHealth < 0.7) {
            alerts.push("Battery health is degraded – expect reduced range.");
          }

          if (predictedEnergy?.alerts?.length) {
            alerts.push(...predictedEnergy.alerts);
          }

          if (!alerts.length) return null;

          return (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {alerts.slice(0, 4).map((msg, idx) => (
                <div
                  key={idx + msg}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(248,113,113,0.6)",
                    background:
                      "linear-gradient(135deg, rgba(248,113,113,0.15), rgba(248,250,252,0.04))",
                    fontSize: 11,
                    color: "#fecaca",
                  }}
                >
                  {msg}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        {[
          {
            label: "Battery",
            value: `${battery}%`,
            accent: "#22c55e",
          },
          {
            label: "Estimated Range",
            value: `${range} km`,
            accent: "#38bdf8",
          },
          {
            label: "Nearest Station",
            value:
              nearestStation?.station?.name ||
              nearestStation?.station?.station_name ||
              "No station selected",
            accent: "#a855f7",
          },
          {
            label: "Battery Health",
            value:
              predictedEnergy?.batteryHealth != null
                ? `${Math.round(predictedEnergy.batteryHealth * 100)}%`
                : "—",
            accent: "#f97316",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 18,
              padding: "14px 16px",
              background:
                "linear-gradient(145deg, rgba(15,23,42,0.85), rgba(15,23,42,0.4))",
              border: "1px solid rgba(148,163,184,0.35)",
              boxShadow: "0 14px 35px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 120,
                height: 120,
                borderRadius: "999px",
                background: item.accent,
                opacity: 0.18,
                filter: "blur(26px)",
                top: -40,
                right: -40,
              }}
            />
            <div style={{ fontSize: 13, opacity: 0.78 }}>{item.label}</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* Map card */}
        <div
          style={{
            background: "rgba(15,23,42,0.9)",
            borderRadius: 20,
            border: "1px solid rgba(148,163,184,0.4)",
            padding: 12,
            boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Current route</h3>
              <p style={{ fontSize: 12, opacity: 0.7 }}>
                Live position with your active EV route and selected station.
              </p>
            </div>
          </div>

          <div
            style={{
              height: 420,
              width: "100%",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(51,65,85,0.9)",
            }}
          >
            <EVMap
              stations={stationsForMap}
              center={[center[1], center[0]]}
              zoom={12}
              userLocation={position}
            />
          </div>
        </div>

        {/* Alerts / booking card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {predictedEnergy?.alerts?.length > 0 && (
            <div
              style={{
                background: "rgba(15,23,42,0.9)",
                borderRadius: 18,
                padding: 14,
                border: "1px solid rgba(248,250,252,0.18)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <h4 style={{ fontSize: 14, fontWeight: 600 }}>
                  Service & battery alerts
                </h4>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(248,250,252,0.08)",
                    border: "1px solid rgba(148,163,184,0.6)",
                  }}
                >
                  {predictedEnergy.alerts.length} active
                </span>
              </div>
              <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                {predictedEnergy.alerts.map((a) => (
                  <li key={a} style={{ marginBottom: 2 }}>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {booking && (
            <div
              style={{
                marginTop: predictedEnergy?.alerts?.length ? 0 : 4,
                background: "rgba(15,23,42,0.9)",
                padding: 14,
                borderRadius: 18,
                border: "1px solid rgba(56,189,248,0.6)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Active charging booking
              </div>
              <div>
                {booking.station} ({booking.startTime} → {booking.endTime})
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
