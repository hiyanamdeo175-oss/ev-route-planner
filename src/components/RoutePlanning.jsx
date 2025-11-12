import React, { useEffect, useState, useRef, useContext } from "react";
import { MapPin, Navigation, CarFront } from "lucide-react";
import { EVContext } from "./EVContext";

const RoutePlanning = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chargingMarkers, setChargingMarkers] = useState([]);

  // ✅ Access & update context
  const { setRoutePath, setNearbyStations, nearbyStations } = useContext(EVContext);

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

  // 🔹 Fetch charging stations along route
  const showChargingStationsAlongRoute = (route) => {
    if (!map || !window.google || !window.google.maps.places) return;
    const service = new window.google.maps.places.PlacesService(map);
    const path = route.overview_path;
    const stations = [];
    const markers = [];

    // Remove old markers first
    chargingMarkers.forEach((m) => m.setMap(null));

    path.forEach((point, index) => {
      if (index % 10 !== 0) return;
      const request = {
        location: point,
        radius: 5000, // 5 km
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
                icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" },
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

  // 🔹 Book slot handler
  const handleBookSlot = (station) => {
    localStorage.setItem("selectedStation", JSON.stringify(station));
    alert(`Redirecting to booking page for: ${station.name}`);
    window.location.href = "/battery-charging"; // ✅ navigate to slot booking page
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

          // store recent searches
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
    <div className="flex flex-col gap-6 p-6">
      <div className="shadow-xl p-6 rounded-2xl border border-gray-200 bg-white">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <Navigation className="text-purple-600" /> EV Route Planner
        </h2>

        {/* Start Point */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="font-semibold text-gray-700 flex items-center gap-2">
            <MapPin className="text-green-600" /> Start Point:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Enter start location or coordinates"
              className="flex-1 p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button
              onClick={useCurrentLocation}
              className="bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200"
            >
              📍 Use Current
            </button>
          </div>
        </div>

        {/* Destination */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="font-semibold text-gray-700 flex items-center gap-2">
            <CarFront className="text-blue-600" /> Destination:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="Enter destination"
              className="flex-1 p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              onChange={(e) => setEnd(e.target.value)}
              className="p-2 rounded-md border border-gray-300"
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
          <button
            onClick={getDirections}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            🚗 {loading ? "Loading..." : "Get Directions"}
          </button>

          <button
            onClick={startNavigation}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            🧭 Start Navigation
          </button>
        </div>
      </div>

      <div
        ref={mapRef}
        className="w-full h-[70vh] rounded-xl border border-gray-200 shadow-md"
      ></div>
    </div>
  );
};

export default RoutePlanning;

