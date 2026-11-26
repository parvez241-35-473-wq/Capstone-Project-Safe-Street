import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { ClipboardList, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { api } from "../lib/api.js";
import { categoryLabel, statusLabel, statusColor, formatDate } from "../lib/utils.js";
import { Card, StatusBadge, Skeleton } from "../components/ui/Primitives.jsx";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats"),
  });

  const cards = [
    { label: "Total Reports", value: stats?.total_reports, icon: ClipboardList, color: "text-civic-600 bg-civic-50" },
    { label: "Total Users", value: stats?.total_users, icon: Users, color: "text-purple-600 bg-purple-50" },
    { label: "Pending", value: stats?.pending, icon: AlertCircle, color: "text-red-600 bg-red-50" },
    { label: "In Progress", value: stats?.in_progress, icon: Clock, color: "text-orange-600 bg-orange-50" },
    { label: "Resolved", value: stats?.resolved, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  ];

  const categoryData = (stats?.byCategory || []).map((c) => ({ name: categoryLabel(c.category), count: c.count }));
  const statusData = (stats?.byStatus || []).map((s) => ({ name: statusLabel(s.status), value: s.count, color: statusColor(s.status) }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Overview</h1>
      <p className="text-sm text-gray-500 mb-6">
        {stats?.mostReportedCategory && `Most reported category: ${categoryLabel(stats.mostReportedCategory)}`}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            {isLoading ? <Skeleton className="h-7 w-10" /> : <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>}
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Reports by Category</h2>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Reports by Status</h2>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {statusData.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Reports</h2>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            {stats?.recent?.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{h.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {h.reporter_name} · {categoryLabel(h.category)} · {formatDate(h.created_at)}
                  </p>
                </div>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
