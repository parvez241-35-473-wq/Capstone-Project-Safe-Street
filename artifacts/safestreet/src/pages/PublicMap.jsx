import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Search, ThumbsUp, MapPin } from "lucide-react";
import { api } from "../lib/api.js";
import { CATEGORIES, STATUSES, categoryLabel, statusColor, formatDate } from "../lib/utils.js";
import { Card, StatusBadge, Select, Input, Skeleton, EmptyState, Button } from "../components/ui/Primitives.jsx";

const DHAKA_CENTER = [23.8103, 90.4125];

export default function PublicMap() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const { data: hazards, isLoading } = useQuery({
    queryKey: ["hazards", search, category, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      const qs = params.toString();
      return api.get(`/hazards${qs ? `?${qs}` : ""}`);
    },
  });

  const center = useMemo(() => {
    if (hazards && hazards.length > 0) return [hazards[0].latitude, hazards[0].longitude];
    return DHAKA_CENTER;
  }, [hazards]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Live Hazard Map</h1>
        <p className="text-sm text-gray-500 mt-1">Explore hazards reported across the city, in real time.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Input
          placeholder="Search by title or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:col-span-1"
        />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-4">
        <Card className="p-3 max-h-[70vh] overflow-y-auto order-2 lg:order-1">
          {isLoading ? (
            <div className="space-y-3 p-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : hazards && hazards.length > 0 ? (
            <div className="space-y-3">
              {hazards.map((h) => (
                <button
                  key={h.id}
                  onClick={() => navigate(`/hazards/${h.id}`)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-civic-300 hover:bg-civic-50/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 leading-snug">{h.title}</h3>
                    <StatusBadge status={h.status} />
                  </div>
                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
                    <MapPin className="w-3 h-3" /> {h.address}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>{categoryLabel(h.category)} · {formatDate(h.created_at)}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {h.upvotes}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No hazards found"
              description="Try adjusting your search or filters."
            />
          )}
        </Card>

        <Card className="h-[70vh] overflow-hidden order-1 lg:order-2 p-0">
          <MapContainer center={center} zoom={13} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hazards?.map((h) => (
              <CircleMarker
                key={h.id}
                center={[h.latitude, h.longitude]}
                radius={9}
                pathOptions={{ color: "#fff", weight: 2, fillColor: statusColor(h.status), fillOpacity: 0.9 }}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">{h.title}</p>
                    <p className="text-gray-500">{h.address}</p>
                    <p className="text-gray-500">{categoryLabel(h.category)}</p>
                    <Button size="sm" className="mt-2" onClick={() => navigate(`/hazards/${h.id}`)}>
                      View Details
                    </Button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </Card>
      </div>
    </div>
  );
}
