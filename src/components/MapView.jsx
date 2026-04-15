import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { jainStatusConfig } from "../data/restaurants";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createMarker(jainStatus, isSelected) {
  const cfg = jainStatusConfig[jainStatus];
  const size = isSelected ? 14 : 10;
  const ring = isSelected ? `box-shadow: 0 0 0 3px ${cfg.color}30, 0 2px 8px rgba(0,0,0,0.2);` : `box-shadow: 0 1px 4px rgba(0,0,0,0.25);`;

  return L.divIcon({
    html: `<div style="
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: ${cfg.color};
      border: 2.5px solid white;
      ${ring}
    "></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 8)],
  });
}

function FlyTo({ restaurant }) {
  const map = useMap();
  if (restaurant) map.flyTo([restaurant.lat, restaurant.lng], 16, { duration: 1 });
  return null;
}

export default function MapView({ restaurants, selectedId, onSelect }) {
  const selected = restaurants.find(r => r.id === selectedId);

  return (
    <div className="relative h-full">
      {/* Legend */}
      <div
        className="absolute top-3 left-3 z-50 rounded-xl p-3 space-y-2"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        {Object.entries(jainStatusConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
            <span className="text-[11px] font-medium" style={{ color: "#3a3a3c" }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      <MapContainer
        center={[42.2776, -83.7409]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {selected && <FlyTo restaurant={selected} />}

        {restaurants.map(r => {
          const cfg = jainStatusConfig[r.jainStatus];
          const isSelected = selectedId === r.id;
          return (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={createMarker(r.jainStatus, isSelected)}
              eventHandlers={{ click: () => onSelect(isSelected ? null : r.id) }}
            >
              <Popup>
                <div style={{ minWidth: "190px" }}>
                  <p style={{ fontWeight: 600, fontSize: "14px", color: "#1d1d1f", margin: "0 0 2px" }}>{r.name}</p>
                  <p style={{ fontSize: "12px", color: "#6e6e73", margin: "0 0 8px" }}>{r.cuisine}</p>
                  <p style={{ fontSize: "12px", color: "#3a3a3c", margin: "0 0 2px" }}>{r.address}</p>
                  <p style={{ fontSize: "12px", color: "#6e6e73", margin: "0 0 8px" }}>{r.phone}</p>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    fontSize: "11px", fontWeight: 600, padding: "3px 10px",
                    borderRadius: "999px", background: cfg.bg, color: cfg.color,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                    {cfg.label}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
