import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, Users as UsersIcon } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { formatDate } from "../lib/utils.js";
import { Card, Input, Button, Skeleton, EmptyState, ConfirmDialog } from "../components/ui/Primitives.jsx";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/admin/users"),
  });

  const filtered = (users || []).filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.del(`/admin/users/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast("User deleted.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Reports</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{u.role}</td>
                  <td className="px-4 py-3 text-gray-500">{u.report_count}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={u.id === currentUser?.id}
                      title={u.id === currentUser?.id ? "You can't delete your own account" : "Delete user"}
                      onClick={() => setDeleteTarget(u)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-0">
          <EmptyState icon={UsersIcon} title="No users found" description="Try a different search term." />
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this user?"
        description={`"${deleteTarget?.full_name}" and all of their reports will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
