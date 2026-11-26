import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Locate, ImagePlus } from "lucide-react";
import { api } from "../lib/api.js";
import { useToast } from "../components/ui/Toast.jsx";
import { CATEGORIES } from "../lib/utils.js";
import { Card, Input, Textarea, Select, Button } from "../components/ui/Primitives.jsx";

const DHAKA_CENTER = [23.8103, 90.4125];

function LocationPicker({ position, onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function ReportHazard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "pothole",
    address: "",
  });
  const [position, setPosition] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  function detectLocation() {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        showToast("Could not detect your location.", "error");
        setLocating(false);
      }
    );
  }

  function validate() {
    const errs = {};
    if (form.title.trim().length < 3) errs.title = "Title must be at least 3 characters.";
    if (form.description.trim().length < 10) errs.description = "Description must be at least 10 characters.";
    if (!form.address.trim()) errs.address = "Address is required.";
    if (!position) errs.position = "Please select a location on the map.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const hazard = await api.post("/hazards", {
        ...form,
        latitude: position[0],
        longitude: position[1],
      });

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        await api.post(`/hazards/${hazard.id}/image`, formData, { isFormData: true });
      }

      showToast("Hazard reported successfully!");
      navigate("/my-reports");
    } catch (err) {
      showToast(err.message || "Failed to submit report.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Report a Hazard</h1>
      <p className="text-sm text-gray-500 mb-6">Help your community by reporting road and safety hazards.</p>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Title"
            placeholder="e.g. Large pothole near intersection"
            value={form.title}
            error={errors.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Description"
            rows={4}
            placeholder="Describe the hazard in detail..."
            value={form.description}
            error={errors.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Input
              label="Address"
              placeholder="Street address or landmark"
              value={form.address}
              error={errors.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Location</span>
              <Button type="button" size="sm" variant="outline" onClick={detectLocation} disabled={locating}>
                <Locate className="w-3.5 h-3.5" /> {locating ? "Detecting..." : "Detect my location"}
              </Button>
            </div>
            <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
              <MapContainer center={position || DHAKA_CENTER} zoom={13} className="h-full w-full">
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker position={position} onPick={setPosition} />
              </MapContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Click on the map to drop a pin at the hazard location.</p>
            {errors.position && <p className="text-xs text-red-600 mt-1">{errors.position}</p>}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1.5">Photo (optional)</span>
            <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-civic-400 text-sm text-gray-500">
              <ImagePlus className="w-4 h-4" />
              {imageFile ? imageFile.name : "Click to upload an image (max 5MB)"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
