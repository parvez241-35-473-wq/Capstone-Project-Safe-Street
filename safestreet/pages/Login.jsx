import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { Card, Input, Button } from "../components/ui/Primitives.jsx";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      showToast(`Welcome back, ${user.full_name.split(" ")[0]}!`);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <Shield className="w-8 h-8 text-civic-600 mb-2" />
          <h1 className="text-xl font-bold text-gray-900">Log in to SafeStreet</h1>
          <p className="text-sm text-gray-500 mt-1">Report and track hazards in your community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <div className="mt-6 text-xs text-gray-400 bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="font-medium text-gray-500">Demo accounts</p>
          <p>Citizen: alice@example.com / password123</p>
          <p>Citizen: bob@example.com / password123</p>
          <p>Admin: admin@safestreet.gov / admin123</p>
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-civic-600 font-medium hover:underline">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}
