import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useToast } from "../components/ui/Toast.jsx";
import { CATEGORIES, STATUSES, categoryLabel, formatDate } from "../lib/utils.js";
import { Card, Input, Select, Button, StatusBadge, Skeleton, EmptyState, ConfirmDialog } from "../components/ui/Primitives.jsx";

export default function AdminReports() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  async function handleStatusChange(id, newStatus) {
    try {
      await api.put(`/hazards/${id}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["hazards"] });
      showToast("Status updated.");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.del(`/hazards/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ["hazards"] });
      showToast("Report deleted.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Reports</h1>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Input placeholder="Search by title or address..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : hazards && hazards.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hazards.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px] truncate">{h.title}</td>
                  <td className="px-4 py-3 text-gray-500">{categoryLabel(h.category)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{h.address}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(h.created_at)}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={h.status}
                      onChange={(e) => handleStatusChange(h.id, e.target.value)}
                      className="!py-1 !text-xs w-36"
                    >
                      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/hazards/${h.id}`}>
                        <Button size="sm" variant="outline"><Eye className="w-3.5 h-3.5" /></Button>
                      </Link>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(h)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-0">
          <EmptyState icon={Search} title="No reports found" description="Try adjusting your filters." />
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this report?"
        description={`"${deleteTarget?.title}" will be permanently removed. This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
