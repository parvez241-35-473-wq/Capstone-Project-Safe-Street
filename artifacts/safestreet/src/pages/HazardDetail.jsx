import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { ArrowLeft, MapPin, ThumbsUp, Calendar, User } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { categoryLabel, statusColor, formatDate } from "../lib/utils.js";
import { Card, StatusBadge, Button, Skeleton } from "../components/ui/Primitives.jsx";

export default function HazardDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: hazard, isLoading } = useQuery({
    queryKey: ["hazard", id],
    queryFn: () => api.get(`/hazards/${id}`),
  });

  async function handleUpvote() {
    if (!isAuthenticated) {
      showToast("Please log in to upvote this hazard.", "error");
      return;
    }
    try {
      await api.post(`/hazards/${id}/upvote`);
      queryClient.invalidateQueries({ queryKey: ["hazard", id] });
      showToast("Thanks for your vote!");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hazard) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        Hazard not found.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/map" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-civic-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to map
      </Link>

      <Card className="overflow-hidden">
        {hazard.image_url && (
          <img src={hazard.image_url} alt={hazard.title} className="w-full h-64 object-cover" />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{hazard.title}</h1>
            <StatusBadge status={hazard.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-3">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {hazard.address}</span>
            <span>{categoryLabel(hazard.category)}</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" /> {hazard.reporter_name}</span>
          </div>

          <p className="text-gray-700 mt-5 leading-relaxed">{hazard.description}</p>

          <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" /> Reported {formatDate(hazard.created_at)}
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" /> Updated {formatDate(hazard.updated_at)}
            </div>
          </div>

          <div className="mt-6 h-64 rounded-xl overflow-hidden border border-gray-200">
            <MapContainer center={[hazard.latitude, hazard.longitude]} zoom={15} className="h-full w-full">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker
                center={[hazard.latitude, hazard.longitude]}
                radius={10}
                pathOptions={{ color: "#fff", weight: 2, fillColor: statusColor(hazard.status), fillOpacity: 0.9 }}
              />
            </MapContainer>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <span className="text-sm text-gray-500">{hazard.upvotes} people confirmed this hazard</span>
            <Button
              variant={hazard.userHasVoted ? "primary" : "secondary"}
              onClick={handleUpvote}
            >
              <ThumbsUp className="w-4 h-4" /> {hazard.userHasVoted ? "Upvoted" : "Upvote"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
