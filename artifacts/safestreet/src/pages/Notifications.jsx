import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "../lib/api.js";
import { formatDate } from "../lib/utils.js";
import { Card, Button, Skeleton, EmptyState } from "../components/ui/Primitives.jsx";

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications"),
  });

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      // silent fail is acceptable for a read-state toggle
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h1>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 ${n.is_read ? "" : "border-civic-200 bg-civic-50/40"}`}
            >
              <div className="flex items-start gap-3">
                <Bell className={`w-4 h-4 mt-0.5 shrink-0 ${n.is_read ? "text-gray-300" : "text-civic-600"}`} />
                <div>
                  <p className={`text-sm ${n.is_read ? "text-gray-500" : "text-gray-900 font-medium"}`}>{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
              </div>
              {!n.is_read && (
                <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>
                  <CheckCheck className="w-3.5 h-3.5" /> Mark read
                </Button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-0">
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        </Card>
      )}
    </div>
  );
}
