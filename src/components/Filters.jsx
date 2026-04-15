import { Search, X } from "lucide-react";
import { cuisineTypes, jainStatusConfig } from "../data/restaurants";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "strictly-jain", label: "Strictly Jain" },
  { value: "jain-on-request", label: "Jain on Request" },
  { value: "vegetarian-only", label: "Vegetarian" },
];

export default function Filters({ search, setSearch, cuisine, setCuisine, jainFilter, setJainFilter, priceFilter, setPriceFilter }) {
  const hasActiveFilters = search || cuisine !== "All" || jainFilter !== "all" || priceFilter !== "All";

  return (
    <div className="border-b" style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)", borderColor: "rgba(0,0,0,0.06)" }}>
      <div className="max-w-6xl mx-auto px-6 py-4 space-y-3">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#aeaeb2" }} />
          <input
            type="text"
            placeholder="Search restaurants, cuisines…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl focus:outline-none transition-all"
            style={{
              background: "#f5f5f7",
              border: "1px solid transparent",
              color: "#1d1d1f",
              ...(search ? { border: "1px solid #1a6644", background: "white", boxShadow: "0 0 0 3px rgba(26,102,68,0.08)" } : {}),
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60">
              <X className="w-4 h-4" style={{ color: "#aeaeb2" }} />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Jain status */}
          <div className="flex gap-1.5">
            {statusFilters.map((f) => {
              const active = jainFilter === f.value;
              const cfg = f.value !== "all" ? jainStatusConfig[f.value] : null;
              return (
                <button
                  key={f.value}
                  onClick={() => setJainFilter(f.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={active ? {
                    background: cfg ? cfg.color : "#1d1d1f",
                    color: "white",
                  } : {
                    background: "#f5f5f7",
                    color: "#3a3a3c",
                  }}
                >
                  {cfg && active && <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 inline-block" />}
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 mx-1" style={{ background: "rgba(0,0,0,0.1)" }} />

          {/* Price */}
          <div className="flex gap-1.5">
            {["$", "$$", "$$$"].map((p) => {
              const active = priceFilter === p;
              return (
                <button
                  key={p}
                  onClick={() => setPriceFilter(active ? "All" : p)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={active
                    ? { background: "#1d1d1f", color: "white" }
                    : { background: "#f5f5f7", color: "#3a3a3c" }
                  }
                >
                  {p}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 mx-1" style={{ background: "rgba(0,0,0,0.1)" }} />

          {/* Cuisine */}
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full focus:outline-none appearance-none transition-all"
            style={{
              background: cuisine !== "All" ? "#1d1d1f" : "#f5f5f7",
              color: cuisine !== "All" ? "white" : "#3a3a3c",
              border: "none",
            }}
          >
            {cuisineTypes.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Cuisines" : c}</option>
            ))}
          </select>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); setCuisine("All"); setJainFilter("all"); setPriceFilter("All"); }}
              className="ml-auto flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:opacity-70"
              style={{ color: "#6e6e73", background: "#f5f5f7" }}
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
