import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2, ListChecks, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { categoryLabel, formatDate } from "../lib/utils.js";
import { Card, Button, StatusBadge, Skeleton, EmptyState } from "../components/ui/Primitives.jsx";

export default function CitizenDashboard() {
  const { user } = useAuth();

  const { data: myReports, isLoading } = useQuery({
    queryKey: ["my-hazards"],
    queryFn: () => api.get("/hazards/my"),
  });

  const total = myReports?.length ?? 0;
  const reported = myReports?.filter((h) => h.status === "reported").length ?? 0;
  const inProgress = myReports?.filter((h) => h.status === "in_progress").length ?? 0;
  const resolved = myReports?.filter((h) => h.status === "resolved").length ?? 0;

  const stats = [
    { label: "Total Reports", value: total, icon: ListChecks, color: "text-civic-600 bg-civic-50" },
    { label: "Reported", value: reported, icon: AlertCircle, color: "text-red-600 bg-red-50" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-orange-600 bg-orange-50" },
    { label: "Resolved", value: resolved, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(" ")[0]}!</h1>
          <p className="text-sm text-gray-500 mt-1">Here's a summary of your hazard reports.</p>
        </div>
        <Link to="/report">
          <Button><FilePlus2 className="w-4 h-4" /> Quick Report</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            {isLoading ? <Skeleton className="h-7 w-10" /> : <p className="text-2xl font-bold text-gray-900">{value}</p>}
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : myReports && myReports.length > 0 ? (
          <div className="space-y-3">
            {myReports.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{h.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{categoryLabel(h.category)} · {formatDate(h.created_at)}</p>
                </div>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FilePlus2}
            title="No reports yet"
            description="Report your first hazard to start tracking it here."
            action={<Link to="/report"><Button>Report a Hazard</Button></Link>}
          />
        )}
      </Card>
    </div>
  );
}
