// src/components/EVContext.jsx
import React, { createContext, useEffect, useState, useCallback } from "react";
import supabase from "./supabaseClient"; // adjust path if necessary

export const EVContext = createContext();

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Distance from point P to segment AB (in km) — uses haversine for end points, approximates using projection on lat/lon
function pointToSegmentDistanceKm(point, A, B) {
  // Convert lat/lon to simple cartesian for short distances using equirectangular approx
  const toRad = (d) => (d * Math.PI) / 180;
  const lat1 = toRad(A[0]), lon1 = toRad(A[1]);
  const lat2 = toRad(B[0]), lon2 = toRad(B[1]);
  const latP = toRad(point[0]), lonP = toRad(point[1]);

  // approximate Earth radius (km)
  const R = 6371;

  // Convert to Cartesian-like coordinates (meters not required since ratio)
  const x1 = lon1 * Math.cos((lat1 + lat2) / 2);
  const y1 = lat1;
  const x2 = lon2 * Math.cos((lat1 + lat2) / 2);
  const y2 = lat2;
  const xP = lonP * Math.cos((lat1 + lat2) / 2);
  const yP = latP;

  const A_x = x1, A_y = y1, B_x = x2, B_y = y2, P_x = xP, P_y = yP;
  const dx = B_x - A_x, dy = B_y - A_y;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) {
    t = ((P_x - A_x) * dx + (P_y - A_y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
  }
  const projX = A_x + t * dx;
  const projY = A_y + t * dy;

  const dlon = (projX - P_x);
  const dlat = (projY - P_y);

  // convert back to km roughly
  const distKm = Math.sqrt(dlat * dlat + dlon * dlon) * R;
  return Math.abs(distKm);
}

export const EVProvider = ({ children }) => {
  const [battery, setBattery] = useState(80);
  const [range, setRange] = useState(220);
  const [booking, setBooking] = useState(null);
  const [route, setRoute] = useState(null); // store route object if needed
  const [routePath, setRoutePath] = useState([]); // array of [lat, lng]
  const [allStations, setAllStations] = useState([]);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [avgEfficiency, setAvgEfficiency] = useState(0);
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem("userProfile");
    return saved
      ? JSON.parse(saved)
      : {
          name: "Dhruv Rabadiya",
          email: "dhruv@example.com",
          evModel: "Tata Nexon EV",
          range: "320 km",
          avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        };
  });

  // fetch all stations initially and subscribe for realtime updates
  useEffect(() => {
    let isActive = true;
    const fetchStations = async () => {
      const { data, error } = await supabase.from("charging_stations").select("*");
      if (error) {
        console.error("Failed to fetch stations:", error);
        return;
      }
      if (isActive) setAllStations(data || []);
    };
    fetchStations();

    const channel = supabase
      .channel("stations-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "charging_stations" },
        (payload) => {
          // re-fetch to ensure up-to-date (small table so acceptable)
          fetchStations();
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // When routePath is set, compute nearbyStations (stations near any segment)
  useEffect(() => {
    if (!routePath || routePath.length === 0 || !allStations) {
      setNearbyStations([]);
      return;
    }

    const RADIUS_KM = 5; // change to desired corridor width (e.g., 5 km)
    const stationsOnRoute = [];

    allStations.forEach((st) => {
      const stLat = Number(st.lat ?? st.latitude ?? st.location?.lat ?? 0) || Number(st.lat) || Number(st.lat);
      const stLon = Number(st.lon ?? st.longitude ?? st.location?.lng ?? 0) || Number(st.lon) || Number(st.lon);
      // If your station rows store lat/lon under 'lat'/'lon' use those. If not, adapt above.

      // If station has geometry in different fields, adjust above accordingly.
      const stationPoint = [stLat, stLon];

      // check distance to each segment in path
      let minDist = Infinity;
      for (let i = 0; i < routePath.length - 1; i++) {
        const A = routePath[i];
        const B = routePath[i + 1];
        const d = pointToSegmentDistanceKm(stationPoint, A, B);
        if (d < minDist) minDist = d;
        if (minDist <= RADIUS_KM) break;
      }

      if (minDist <= RADIUS_KM) {
        stationsOnRoute.push({
          ...st,
          _distFromRouteKm: minDist,
          coords: [stLat, stLon],
        });
      }
    });

    // sort by distance to route
    stationsOnRoute.sort((a, b) => (a._distFromRouteKm || 0) - (b._distFromRouteKm || 0));
    setNearbyStations(stationsOnRoute);
  }, [routePath, allStations]);

  // helper for recording trips
  const recordTrip = (distanceKm, efficiencyKmPerKwh) => {
    const newTrip = {
      id: Date.now(),
      distance: distanceKm,
      efficiency: efficiencyKmPerKwh,
      date: new Date().toLocaleDateString(),
    };
    setTripHistory((prev) => [...prev, newTrip]);
  };

  useEffect(() => {
    const totalDist = tripHistory.reduce((sum, t) => sum + (t.distance || 0), 0);
    const avgEff =
      tripHistory.length > 0
        ? tripHistory.reduce((sum, t) => sum + (t.efficiency || 0), 0) / tripHistory.length
        : 0;
    setTotalDistance(totalDist);
    setAvgEfficiency(avgEff);
  }, [tripHistory]);

  return (
    <EVContext.Provider
      value={{
        battery,
        setBattery,
        range,
        setRange,
        booking,
        setBooking,
        route,
        setRoute,
        routePath,
        setRoutePath,
        allStations,
        nearbyStations,
        setNearbyStations,
        tripHistory,
        recordTrip,
        totalDistance,
        avgEfficiency,
        userProfile,
        setUserProfile,
      }}
    >
      {children}
    </EVContext.Provider>
  );
};
