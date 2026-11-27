import React from "react";
import { Link } from "react-router-dom";
import { Shield, MapPin, Users, TrendingUp, Camera, Bell } from "lucide-react";
import { Button, Card } from "../components/ui/Primitives.jsx";

const features = [
  { icon: MapPin, title: "Pinpoint hazards", desc: "Drop a pin on an interactive map to mark exactly where the hazard is." },
  { icon: Camera, title: "Add photo evidence", desc: "Upload a photo so crews know exactly what they're dealing with." },
  { icon: Users, title: "Community-powered", desc: "Every citizen report and upvote helps the city prioritize repairs." },
  { icon: Bell, title: "Stay updated", desc: "Get notified the moment your report's status changes." },
  { icon: TrendingUp, title: "Track progress", desc: "Watch reports move from Reported to In Progress to Resolved." },
  { icon: Shield, title: "Built for safety", desc: "Helping city crews fix the hazards that matter most, faster." },
];

export default function Landing() {
  return (
    <div>
      <section className="bg-gradient-to-b from-civic-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-100 text-civic-700 text-xs font-semibold mb-6">
            <Shield className="w-3.5 h-3.5" />
            Community-Powered City Maintenance
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
            Fixing our streets, <span className="text-civic-600">together.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            SafeStreet lets citizens report potholes, broken streetlights, waterlogging, and other
            road hazards in seconds — and track exactly when the city fixes them.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/report">
              <Button size="lg">Report a Hazard</Button>
            </Link>
            <Link to="/map">
              <Button size="lg" variant="secondary">View Live Map</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Everything you need to keep streets safe</h2>
          <p className="text-gray-500 mt-2">A simple, transparent way to report and track public safety hazards.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6">
              <div className="w-10 h-10 rounded-lg bg-civic-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-civic-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1.5">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-civic-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to make your street safer?</h2>
          <p className="text-civic-100 mt-3">Join citizens across the city reporting and tracking hazards in real time.</p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" className="bg-white text-civic-700 hover:bg-civic-50">Get Started — It's Free</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
