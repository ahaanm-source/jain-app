import { useState, useMemo } from "react";
import { LayoutGrid, Map, List } from "lucide-react";
import Header from "./components/Header";
import Filters from "./components/Filters";
import RestaurantCard from "./components/RestaurantCard";
import MapView from "./components/MapView";
import { restaurants } from "./data/restaurants";
import "./index.css";

const VIEWS = [
  { id: "list", label: "List", icon: List },
  { id: "split", label: "Split", icon: LayoutGrid },
  { id: "map", label: "Map", icon: Map },
];

export default function App() {
  const [view, setView] = useState("split");
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [jainFilter, setJainFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    return restaurants.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q));
      const matchCuisine = cuisine === "All" || r.cuisine === cuisine;
      const matchJain = jainFilter === "all" || r.jainStatus === jainFilter;
      const matchPrice = priceFilter === "All" || r.priceRange === priceFilter;
      return matchSearch && matchCuisine && matchJain && matchPrice;
    });
  }, [search, cuisine, jainFilter, priceFilter]);

  const handleCardClick = (id) => {
    setSelectedId(id === selectedId ? null : id);
    if (view === "list") setView("split");
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: "#f5f5f7" }}>
      <Header />
      <Filters
        search={search} setSearch={setSearch}
        cuisine={cuisine} setCuisine={setCuisine}
        jainFilter={jainFilter} setJainFilter={setJainFilter}
        priceFilter={priceFilter} setPriceFilter={setPriceFilter}
      />

      {/* Toolbar */}
      <div className="max-w-6xl mx-auto w-full px-6 py-3 flex items-center justify-between">
        <p className="text-sm" style={{ color: "#6e6e73" }}>
          <span className="font-semibold" style={{ color: "#1d1d1f" }}>{filtered.length}</span>
          {" "}place{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "rgba(0,0,0,0.06)" }}>
          {VIEWS.map(v => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
                style={view === v.id
                  ? { background: "white", color: "#1d1d1f", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { color: "#6e6e73" }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden max-w-6xl mx-auto w-full px-6 pb-6">
        <div className="h-full flex gap-4">

          {/* List */}
          {view !== "map" && (
            <div className={`overflow-y-auto list-scroll ${view === "split" ? "w-full md:w-[400px] shrink-0" : "w-full"}`}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl"
                    style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    ✦
                  </div>
                  <p className="font-semibold text-base" style={{ color: "#1d1d1f" }}>No results</p>
                  <p className="text-sm mt-1" style={{ color: "#6e6e73" }}>Try adjusting your filters</p>
                </div>
              ) : (
                <div className={`grid gap-3 pb-2 ${view === "list" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {filtered.map(r => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      selected={selectedId === r.id}
                      onClick={() => handleCardClick(r.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Map */}
          {view !== "list" && (
            <div className="flex-1 rounded-2xl overflow-hidden min-h-64"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <MapView
                restaurants={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 border-t" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.6)" }}>
        <p className="text-xs" style={{ color: "#aeaeb2" }}>
          Always confirm Jain requirements directly with the restaurant before visiting.
        </p>
      </footer>
    </div>
  );
}
