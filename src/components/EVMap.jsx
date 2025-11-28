import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function EVMap({
  stations = [],
  center = [73.8567, 18.5204],
  zoom = 12,
  userLocation, // [lat, lon]
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl());

    // Highlight current user location if provided (red location pin)
    if (userLocation && Array.isArray(userLocation) && userLocation.length === 2) {
      const [lat, lon] = userLocation;
      const lngLat = [lon, lat];

      new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat(lngLat)
        .setPopup(new mapboxgl.Popup().setHTML("<strong>You are here</strong>"))
        .addTo(map);
    }

    stations
      .filter((st) =>
        st &&
        (st.longitude != null || st.lon != null || st.location?.lng != null) &&
        (st.latitude != null || st.lat != null || st.location?.lat != null)
      )
      .forEach((st) => {
        const lng =
          Number(st.longitude ?? st.lon ?? st.location?.lng) ||
          Number(st.lon) ||
          Number(st.longitude);
        const lat =
          Number(st.latitude ?? st.lat ?? st.location?.lat) ||
          Number(st.lat) ||
          Number(st.latitude);

        if (!lat || !lng) return;

        const title = st.name || st.station_name || "Charging station";
        const addr =
          st.address ||
          st.vicinity ||
          st.location_name ||
          st.formatted_address ||
          "";
        const connectors =
          st.connectors || st.connector_types || st.ports || st.chargers || [];
        const connectorText = Array.isArray(connectors)
          ? connectors
              .map((c) =>
                typeof c === "string"
                  ? c
                  : c.type || c.name || c.connector_type || "Port"
              )
              .join(", ")
          : "";
        const dist = st._distFromRouteKm;

        let html = `<div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size:12px; color:#0f172a;">
          <h3 style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:#020617;">${title}</h3>`;
        if (addr) {
          html += `<div style=\"margin:0 0 4px 0;color:#111827;\">${addr}</div>`;
        }
        if (connectorText) {
          html += `<div style=\"margin:0 0 4px 0;color:#111827;\"><strong>Connectors:</strong> ${connectorText}</div>`;
        } else if (Array.isArray(st.ports)) {
          html += `<div style=\"margin:0 0 4px 0;color:#111827;\">Ports: ${st.ports.length}</div>`;
        }
        if (typeof dist === "number") {
          const km = dist.toFixed(1);
          html += `<div style=\"margin:0 0 2px 0;color:#111827;opacity:0.9;\">${km} km from route</div>`;
        }
        html += `</div>`;

        // Blue pin for charging station
        const marker = new mapboxgl.Marker({ color: "#3b82f6" })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(html))
          .addTo(map);

        // When user double-clicks a station marker, send them to Route Planning with this as destination
        marker.getElement().addEventListener("dblclick", () => {
          try {
            const destPayload = {
              name: title,
              address: addr,
              lat,
              lng,
            };
            localStorage.setItem(
              "routeDestinationFromDashboard",
              JSON.stringify(destPayload)
            );
          } catch (e) {
            // ignore storage errors
          }

          // Navigate to the Route Planning page (React route is /route)
          window.location.href = "/route";
        });
      });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [
    stations,
    center.toString(),
    zoom,
    userLocation && userLocation.toString(),
  ]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
