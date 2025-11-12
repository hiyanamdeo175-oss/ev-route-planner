import React, { useEffect, useState, useRef, useContext } from "react";
import { MapPin, Navigation, CarFront } from "lucide-react";
import { EVContext } from "./EVContext";
import { useTheme } from "@mui/material/styles"; // ✅ added
import { Paper, Box, Typography, Button } from "@mui/material"; // ✅ added

const RoutePlanning = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chargingMarkers, setChargingMarkers] = useState([]);

  const theme = useTheme(); // ✅ access current dark/light theme
  const { setRoutePath, setNearbyStations } = useContext(EVContext);

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
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      console.error("Google Maps API not loaded");
    }
  }, []);

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
                icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                },
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
      (result, status) => {
        setLoading(false);
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          const route = result.routes[0];
          setRoutePath(route.overview_path.map((p) => [p.lat(), p.lng()]));
          showChargingStationsAlongRoute(route);

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
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: "background-color 0.3s, color 0.3s",
        p: 3,
        borderRadius: 3,
      }}
      className="flex flex-col gap-6"
    >
      <Paper
        elevation={4}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          className="flex items-center gap-2 mb-4"
        >
          <Navigation className="text-purple-500" /> EV Route Planner
        </Typography>

        {/* Start Point */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="font-semibold flex items-center gap-2">
            <MapPin className="text-green-600" /> Start Point:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Enter start location or coordinates"
              className={`flex-1 p-2 rounded-md border focus:ring-2 outline-none ${
                theme.palette.mode === "dark"
                  ? "bg-[#1E1E1E] border-gray-700 focus:ring-green-500 text-white"
                  : "bg-white border-gray-300 focus:ring-green-500 text-black"
              }`}
            />
            <Button
              onClick={useCurrentLocation}
              variant="outlined"
              sx={{
                color: theme.palette.text.primary,
                borderColor:
                  theme.palette.mode === "dark" ? "#555" : "rgba(0,0,0,0.2)",
                "&:hover": {
                  borderColor:
                    theme.palette.mode === "dark" ? "#777" : "rgba(0,0,0,0.4)",
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                },
              }}
            >
              📍 Use Current
            </Button>
          </div>
        </div>

        {/* Destination */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="font-semibold flex items-center gap-2">
            <CarFront className="text-blue-600" /> Destination:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="Enter destination"
              className={`flex-1 p-2 rounded-md border focus:ring-2 outline-none ${
                theme.palette.mode === "dark"
                  ? "bg-[#1E1E1E] border-gray-700 focus:ring-blue-500 text-white"
                  : "bg-white border-gray-300 focus:ring-blue-500 text-black"
              }`}
            />
            <select
              onChange={(e) => setEnd(e.target.value)}
              className={`p-2 rounded-md border ${
                theme.palette.mode === "dark"
                  ? "bg-[#1E1E1E] border-gray-700 text-white"
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
        <div className="flex gap-3">
          <Button
            onClick={getDirections}
            disabled={loading}
            variant="contained"
            sx={{
              bgcolor: "#7e22ce",
              "&:hover": { bgcolor: "#6b21a8" },
              color: "#fff",
              borderRadius: "8px",
              px: 3,
              py: 1.2,
            }}
          >
            🚗 {loading ? "Loading..." : "Get Directions"}
          </Button>

          <Button
            onClick={startNavigation}
            variant="contained"
            sx={{
              bgcolor: "#16a34a",
              "&:hover": { bgcolor: "#15803d" },
              color: "#fff",
              borderRadius: "8px",
              px: 3,
              py: 1.2,
            }}
          >
            🧭 Start Navigation
          </Button>
        </div>
      </Paper>

      <Box
        ref={mapRef}
        className="w-full h-[70vh] rounded-xl border shadow-md"
        sx={{
          borderColor:
            theme.palette.mode === "dark" ? "#333" : "rgba(0,0,0,0.1)",
        }}
      ></Box>
    </Box>
  );
};

export default RoutePlanning;


