import React, { useState } from "react";
import { User } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { formatDate } from "../lib/utils.js";
import { Card, Input, Button } from "../components/ui/Primitives.jsx";

export default function Profile() {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.put("/users/me", { fullName });
      updateLocalUser(updated);
      showToast("Profile updated.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-civic-100 flex items-center justify-center text-civic-700">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role} · Joined {formatDate(user?.created_at)}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={error}
          />
          <Input label="Email" value={user?.email || ""} disabled readOnly className="bg-gray-50 text-gray-500" />
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </form>
      </Card>
    </div>
  );
}
