import React, { useEffect, useState, useRef, useContext } from "react";
import { MapPin, Navigation, CarFront } from "lucide-react";
import { EVContext } from "./EVContext";
import { predictEnergy } from "../services/aiApi";
import { useTheme } from "@mui/material/styles"; // ✅ added
import { Paper, Box, Typography, Button } from "@mui/material"; // ✅ added
import puneStations from "../data/puneStations.json";

const RoutePlanning = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chargingMarkers, setChargingMarkers] = useState([]);
  const [autoRouteFromDashboard, setAutoRouteFromDashboard] = useState(false);

  const theme = useTheme(); // ✅ access current dark/light theme
  const { battery, setRoutePath, setNearbyStations, setPredictedEnergy, userProfile } =
    useContext(EVContext);

  useEffect(() => {
    const initMap = () => {
      const mapObj = new window.google.maps.Map(mapRef.current, {
        center: { lat: 18.5204, lng: 73.8567 },
        zoom: 11,
      });
      setMap(mapObj);

      const renderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
      });
      renderer.setMap(mapObj);
      setDirectionsRenderer(renderer);

      // Static EV stations (Pune, Lonavla, Mumbai) also visible on this map
      puneStations.forEach((st) => {
        const lat = Number(st.latitude);
        const lng = Number(st.longitude);
        if (!lat || !lng) return;

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapObj,
          title: st.name,
          icon: {
            url: "https://maps.google.com/mapfiles/kml/paddle/blu-circle.png",
            scaledSize: new window.google.maps.Size(40, 40),
          },
        });

        const info = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: system-ui, sans-serif; font-size: 12px;">
              <strong>${st.name}</strong><br/>
              <span>${st.address || ""}</span><br/>
              <small>${
                Array.isArray(st.connectors) && st.connectors.length
                  ? "Connectors: " + st.connectors.join(", ")
                  : ""
              }</small>
            </div>
          `,
        });

        marker.addListener("click", () => {
          info.open(mapObj, marker);
        });
      });
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      console.error("Google Maps API not loaded");
    }
  }, []);

  // If user clicked a station on the Dashboard map, prefill destination
  useEffect(() => {
    try {
      const raw = localStorage.getItem("routeDestinationFromDashboard");
      if (!raw) return;
      const dest = JSON.parse(raw);
      if (!dest || (!dest.lat && !dest.lng)) return;

      const coordString = `${dest.lat},${dest.lng}`;
      setEnd(coordString);

      // Seed recent searches with this destination label so user sees a friendly name
      if (dest.name) {
        setRecentSearches((prev) => {
          const updated = [dest.name, ...prev.filter((p) => p !== dest.name)].slice(0, 5);
          localStorage.setItem("recentSearches", JSON.stringify(updated));
          return updated;
        });
      }

      // Flag that we should auto-route using current location as start
      setAutoRouteFromDashboard(true);
    } catch (e) {
      // ignore JSON/localStorage errors
    }
  }, []);

  // When arriving from Dashboard station double-click, auto-use current location
  // as start and trigger directions so nearest stations along route are shown.
  useEffect(() => {
    if (!autoRouteFromDashboard || !end) return;
    if (!navigator.geolocation) {
      setAutoRouteFromDashboard(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const origin = `${latitude},${longitude}`;
        setStart(origin);
        setAutoRouteFromDashboard(false);

        // Give React a tick to update state, then trigger directions
        setTimeout(() => {
          getDirections();
        }, 0);
      },
      () => {
        // If location fails, just clear the flag and let user enter manually
        setAutoRouteFromDashboard(false);
      }
    );
  }, [autoRouteFromDashboard, end]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = `${latitude},${longitude}`;
        setStart(loc);

        if (map) {
          map.setCenter({ lat: latitude, lng: longitude });
          new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map,
            title: "Current Location",
          });
        }
      },
      () => alert("Unable to fetch location")
    );
  };

  const showChargingStationsAlongRoute = (route) => {
    if (!map || !window.google || !window.google.maps.places) return;
    const service = new window.google.maps.places.PlacesService(map);
    const path = route.overview_path;
    const stations = [];
    const markers = [];

    chargingMarkers.forEach((m) => m.setMap(null));

    path.forEach((point, index) => {
      if (index % 10 !== 0) return;
      const request = {
        location: point,
        radius: 5000,
        type: ["electric_vehicle_charging_station"],
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          results.forEach((place) => {
            if (!stations.some((s) => s.place_id === place.place_id)) {
              const station = {
                name: place.name,
                vicinity: place.vicinity,
                coords: place.geometry.location,
                place_id: place.place_id,
              };
              stations.push(station);

              const marker = new window.google.maps.Marker({
                position: place.geometry.location,
                map,
                title: place.name,
                zIndex: 9999,
                icon: {
                  url:
                    "https://maps.google.com/mapfiles/kml/paddle/grn-circle.png", // bright green paddle
                  scaledSize: new window.google.maps.Size(40, 40),
                },
              });

              // more visible glow around EV station
              new window.google.maps.Circle({
                strokeColor: "#22c55e",
                strokeOpacity: 0.5,
                strokeWeight: 1,
                fillColor: "#22c55e",
                fillOpacity: 0.12,
                map,
                center: place.geometry.location,
                radius: 800, // 800m glow
              });

              const info = new window.google.maps.InfoWindow({
                content: `
                  <div style="font-family: sans-serif; text-align:center;">
                    <strong>${place.name}</strong><br/>
                    <small>${place.vicinity}</small><br/>
                    <button id="book-${place.place_id}" 
                      style="margin-top:8px;padding:5px 10px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer;">
                      🔌 Book Slot
                    </button>
                  </div>`,
              });

              marker.addListener("click", () => {
                info.open(map, marker);
                setTimeout(() => {
                  const btn = document.getElementById(`book-${place.place_id}`);
                  if (btn) {
                    btn.addEventListener("click", () => handleBookSlot(station));
                  }
                }, 100);
              });

              markers.push(marker);
            }
          });

          setChargingMarkers(markers);
          setNearbyStations(stations);
        }
      });
    });
  };

  const handleBookSlot = (station) => {
    localStorage.setItem("selectedStation", JSON.stringify(station));
    alert(`Redirecting to booking page for: ${station.name}`);
    window.location.href = "/battery-charging";
  };

  const getDirections = () => {
    if (!start || !end) {
      alert("Please enter both start and destination points");
      return;
    }

    setLoading(true);
    const service = new window.google.maps.DirectionsService();

    service.route(
      {
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      async (result, status) => {
        setLoading(false);
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          const route = result.routes[0];
          setRoutePath(route.overview_path.map((p) => [p.lat(), p.lng()]));
          showChargingStationsAlongRoute(route);

          try {
            const legs = route.legs || [];
            const totalMeters = legs.reduce(
              (sum, leg) => sum + (leg.distance?.value || 0),
              0
            );
            const distanceKm = totalMeters / 1000;

            const odometerKmNum = Number(userProfile?.odometerKm || 0) || 0;
            const batteryHealthNum = Number(userProfile?.batteryHealth || 0);
            const preferredLimit = Number(
              userProfile?.preferredChargeLimit || battery
            );

            const energyResult = await predictEnergy({
              currentSoCPercent: battery,
              batteryCapacityKWh: 40,
              distanceKmPlanned: distanceKm,
              odometerKm: odometerKmNum,
              batteryHealthPercent:
                batteryHealthNum > 0 && batteryHealthNum <= 100
                  ? batteryHealthNum
                  : undefined,
              preferredChargeLimitPercent:
                preferredLimit > 0 && preferredLimit <= 100
                  ? preferredLimit
                  : undefined,
            });
            setPredictedEnergy(energyResult);
          } catch (err) {
            console.error("Energy prediction failed", err);
            setPredictedEnergy(null);
          }

          setRecentSearches((prev) => {
            const updated = [...new Set([end, ...prev])].slice(0, 5);
            localStorage.setItem("recentSearches", JSON.stringify(updated));
            return updated;
          });
        } else {
          alert("Directions request failed: " + status);
        }
      }
    );
  };

  const startNavigation = () => {
    if (!start || !end) {
      alert("Please enter both start and destination points");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      start
    )}&destination=${encodeURIComponent(end)}&travelmode=driving`;
    window.open(url, "_blank");
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    setRecentSearches(stored);
  }, []);

  return (
    <Box
      sx={{
        bgcolor: theme.palette.mode === "dark" ? "#020617" : "#0b1120",
        color: theme.palette.text.primary,
        transition: "background-color 0.3s, color 0.3s",
        p: 2,
        borderRadius: 3,
      }}
      className="min-h-screen flex flex-col"
    >
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          py: 2,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            gap: 1.5,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Navigation className="text-purple-400" /> Smart Route Planning
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: 12, opacity: 0.7, maxWidth: 420, mt: 0.5 }}
            >
              Plan EV-friendly routes, discover charging stations along the way, and
              trigger energy prediction by fetching directions.
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0,1fr)",
              md: "minmax(0,1.2fr) minmax(0,2fr)",
            },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          {/* Left column: controls */}
          <Paper
            elevation={4}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor:
                theme.palette.mode === "dark" ? "#020617" : theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: "1px solid rgba(148,163,184,0.3)",
            }}
          >
            {/* Start Point */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="font-semibold flex items-center gap-2 text-sm">
                <MapPin className="text-emerald-400" /> Start point
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  placeholder="Enter start location or coordinates"
                  className={`flex-1 p-2 rounded-md border focus:ring-2 outline-none text-sm ${
                    theme.palette.mode === "dark"
                      ? "bg-[#020617] border-slate-700 focus:ring-emerald-500 text-slate-100"
                      : "bg-white border-gray-300 focus:ring-emerald-500 text-black"
                  }`}
                />
                <Button
                  onClick={useCurrentLocation}
                  variant="outlined"
                  sx={{
                    color: theme.palette.text.primary,
                    borderColor:
                      theme.palette.mode === "dark" ? "#4b5563" : "rgba(148,163,184,0.6)",
                    "&:hover": {
                      borderColor:
                        theme.palette.mode === "dark" ? "#9ca3af" : "rgba(75,85,99,0.9)",
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(148,163,184,0.12)"
                          : "rgba(15,23,42,0.05)",
                    },
                    textTransform: "none",
                  }}
                  size="small"
                >
                  📍 Use current
                </Button>
              </div>
            </div>

            {/* Destination */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="font-semibold flex items-center gap-2 text-sm">
                <CarFront className="text-sky-400" /> Destination
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  placeholder="Enter destination"
                  className={`flex-1 p-2 rounded-md border focus:ring-2 outline-none text-sm ${
                    theme.palette.mode === "dark"
                      ? "bg-[#020617] border-slate-700 focus:ring-sky-500 text-slate-100"
                      : "bg-white border-gray-300 focus:ring-sky-500 text-black"
                  }`}
                />
                <select
                  onChange={(e) => setEnd(e.target.value)}
                  className={`p-2 rounded-md border text-sm ${
                    theme.palette.mode === "dark"
                      ? "bg-[#020617] border-slate-700 text-slate-100"
                      : "bg-white border-gray-300 text-black"
                  }`}
                >
                  <option value="">Recent ⬇️</option>
                  {recentSearches.map((place, i) => (
                    <option key={i} value={place}>
                      {place}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 mt-2">
              <Button
                onClick={getDirections}
                disabled={loading}
                variant="contained"
                sx={{
                  bgcolor: "#7e22ce",
                  "&:hover": { bgcolor: "#6b21a8" },
                  color: "#fff",
                  borderRadius: "8px",
                  px: 2.8,
                  py: 1,
                  textTransform: "none",
                  fontSize: 14,
                }}
              >
                🚗 {loading ? "Loading..." : "Get directions"}
              </Button>

              <Button
                onClick={startNavigation}
                variant="contained"
                sx={{
                  bgcolor: "#16a34a",
                  "&:hover": { bgcolor: "#15803d" },
                  color: "#fff",
                  borderRadius: "8px",
                  px: 2.6,
                  py: 1,
                  textTransform: "none",
                  fontSize: 14,
                }}
              >
                🧭 Start navigation
              </Button>
            </div>

            <Typography
              variant="caption"
              sx={{ display: "block", mt: 1.5, fontSize: 11, opacity: 0.7 }}
            >
              Getting directions will also update your route path and trigger energy
              prediction used on the dashboard.
            </Typography>
          </Paper>

          {/* Right column: map */}
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(51,65,85,0.9)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
              overflow: "hidden",
              minHeight: 360,
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: theme.palette.mode === "dark" ? "#020617" : "#0b1120",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Route map
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: 11, opacity: 0.7 }}
              >
                Shows your planned path and nearby charging markers.
              </Typography>
            </Box>
            <Box ref={mapRef} sx={{ height: { xs: 360, md: 440 }, width: "100%" }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RoutePlanning;


