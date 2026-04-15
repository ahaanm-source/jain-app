import { restaurants, jainStatusConfig } from "../data/restaurants";

const counts = {
  "strictly-jain": restaurants.filter(r => r.jainStatus === "strictly-jain").length,
  "jain-on-request": restaurants.filter(r => r.jainStatus === "jain-on-request").length,
  "vegetarian-only": restaurants.filter(r => r.jainStatus === "vegetarian-only").length,
};

export default function Header() {
  return (
    <header style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-end justify-between gap-6">
          {/* Title block */}
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: "#1a6644" }}>
                <span style={{ color: "white", fontSize: "14px" }}>✦</span>
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#6e6e73", letterSpacing: "0.12em" }}>
                Ann Arbor, Michigan
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1d1d1f", lineHeight: 1.1 }}>
              Jain Dining Guide
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "#6e6e73" }}>
              Find Jain-friendly restaurants near you
            </p>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-2">
            {Object.entries(jainStatusConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: cfg.bg }}>
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                  {counts[key]} {key === "strictly-jain" ? "Strictly Jain" : key === "jain-on-request" ? "On Request" : "Vegetarian"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
