import { MapPin, Phone, Clock, Star } from "lucide-react";
import { jainStatusConfig } from "../data/restaurants";

export default function RestaurantCard({ restaurant, selected, onClick }) {
  const cfg = jainStatusConfig[restaurant.jainStatus];

  return (
    <div
      onClick={onClick}
      className="group rounded-2xl cursor-pointer transition-all duration-200"
      style={{
        background: "white",
        border: selected ? `1.5px solid ${cfg.color}` : "1.5px solid rgba(0,0,0,0.06)",
        boxShadow: selected
          ? `0 0 0 4px ${cfg.color}14, 0 4px 20px rgba(0,0,0,0.08)`
          : "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-[15px] leading-tight" style={{ color: "#1d1d1f" }}>
              {restaurant.name}
            </h3>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "#6e6e73" }}>
              {restaurant.cuisine}
            </p>
          </div>

          {/* Status badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
            style={{ background: cfg.bg }}
          >
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] leading-relaxed line-clamp-2 mb-4" style={{ color: "#3a3a3c" }}>
          {restaurant.description}
        </p>

        {/* Highlights */}
        {restaurant.highlights?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {restaurant.highlights.map(h => (
              <span key={h} className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: "#f5f5f7", color: "#3a3a3c" }}>
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t mb-3.5" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

        {/* Footer meta */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#aeaeb2" }} />
              <span className="text-xs" style={{ color: "#6e6e73" }}>{restaurant.address}</span>
            </div>
            <span className="text-xs font-semibold ml-2 shrink-0" style={{ color: "#3a3a3c" }}>
              {restaurant.priceRange}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "#aeaeb2" }} />
            <span className="text-xs" style={{ color: "#6e6e73" }}>{restaurant.hours}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "#aeaeb2" }} />
              <a
                href={`tel:${restaurant.phone}`}
                onClick={e => e.stopPropagation()}
                className="text-xs transition-opacity hover:opacity-70"
                style={{ color: "#1a6644" }}
              >
                {restaurant.phone}
              </a>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
              <span className="text-xs font-semibold" style={{ color: "#3a3a3c" }}>{restaurant.rating}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {restaurant.tags.map(tag => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: "#f5f5f7", color: "#6e6e73" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
