import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, FilePlus2, ThumbsUp, MapPin, Trash2, Pencil, Eye } from "lucide-react";
import { api } from "../lib/api.js";
import { useToast } from "../components/ui/Toast.jsx";
import { categoryLabel, formatDate } from "../lib/utils.js";
import { Card, Input, Button, StatusBadge, Skeleton, EmptyState, ConfirmDialog } from "../components/ui/Primitives.jsx";

export default function MyReports() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["my-hazards"],
    queryFn: () => api.get("/hazards/my"),
  });

  const filtered = (reports || []).filter(
    (h) =>
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.del(`/hazards/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ["my-hazards"] });
      showToast("Report deleted.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <Link to="/report"><Button><FilePlus2 className="w-4 h-4" /> New Report</Button></Link>
      </div>

      <Input
        placeholder="Search your reports..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={Search}
            title="No reports found"
            description={reports?.length ? "Try a different search term." : "You haven't reported any hazards yet."}
            action={!reports?.length && <Link to="/report"><Button>Report a Hazard</Button></Link>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => (
            <Card key={h.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{h.title}</h3>
                  <StatusBadge status={h.status} />
                </div>
                <p className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
                  <MapPin className="w-3 h-3" /> {h.address}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
                  <span>{categoryLabel(h.category)}</span>
                  <span>{formatDate(h.created_at)}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {h.upvotes}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/hazards/${h.id}`}>
                  <Button size="sm" variant="outline"><Eye className="w-3.5 h-3.5" /> View</Button>
                </Link>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(h)}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
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
