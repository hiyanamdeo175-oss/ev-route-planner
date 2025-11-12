import React, { useContext, useEffect, useRef, useState } from "react";
import { EVContext } from "./EVContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const startIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const destIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Dashboard() {
  const { battery, range, booking, route, selectedStation } =
    useContext(EVContext);
  const [position, setPosition] = useState(null);
  const mapRef = useRef(null);
  const routingRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error("Location error:", err)
      );
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !route) return;
    if (routingRef.current) {
      routingRef.current.remove();
      routingRef.current = null;
    }
    if (route.startCoords && route.destCoords) {
      routingRef.current = L.Routing.control({
        waypoints: [
          L.latLng(...route.startCoords),
          L.latLng(...route.destCoords),
        ],
        show: false,
        addWaypoints: false,
        createMarker: () => null,
      }).addTo(mapRef.current);
      mapRef.current.fitBounds([route.startCoords, route.destCoords]);
    }
  }, [route]);

  const center = position || [18.5204, 73.8567];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard</h2>

      {/* Info cards */}
      <div style={{ display: "flex", gap: 15, marginBottom: 15 }}>
        {[
          { label: "Battery", value: `${battery}%` },
          { label: "Range", value: `${range} km` },
          { label: "Nearest Station", value: selectedStation?.name || "—" },
          { label: "Trip Distance", value: "120 km" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: "#2c3e50",
              color: "white",
              borderRadius: "8px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.8 }}>{item.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "8px" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <h3>Current Location & Route</h3>
      <div
        style={{
          height: "450px",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => (mapRef.current = map)}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />

          {position && (
            <Marker position={position}>
              <Popup>You are here 📍</Popup>
            </Marker>
          )}

          {selectedStation && (
            <Marker position={selectedStation.coords} icon={destIcon}>
              <Popup>{selectedStation.name}</Popup>
            </Marker>
          )}

          {route?.startCoords && (
            <Marker position={route.startCoords} icon={startIcon}>
              <Popup>{route.startLabel}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {booking && (
        <div
          style={{
            marginTop: 15,
            background: "#fff",
            padding: "10px 15px",
            borderRadius: 8,
          }}
        >
          <b>Active Booking:</b> {booking.station} ({booking.startTime} →{" "}
          {booking.endTime})
        </div>
      )}
    </div>
  );
}

export default Dashboard;
