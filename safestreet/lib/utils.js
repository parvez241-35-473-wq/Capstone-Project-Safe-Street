export const CATEGORIES = [
  { value: "pothole", label: "Pothole" },
  { value: "broken_streetlight", label: "Broken Streetlight" },
  { value: "waterlogging", label: "Waterlogging" },
  { value: "open_manhole", label: "Open Manhole" },
  { value: "damaged_road", label: "Damaged Road" },
  { value: "traffic_signal_failure", label: "Traffic Signal Failure" },
  { value: "other", label: "Other" },
];

export const STATUSES = [
  { value: "reported", label: "Reported", color: "#dc2626" },
  { value: "in_progress", label: "In Progress", color: "#ea580c" },
  { value: "resolved", label: "Resolved", color: "#16a34a" },
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label || value;
}

export function statusColor(value) {
  return STATUSES.find((s) => s.value === value)?.color || "#6b7280";
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}
