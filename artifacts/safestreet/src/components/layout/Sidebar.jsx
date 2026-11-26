import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FilePlus2, ListChecks, Bell, User, Shield,
  Users as UsersIcon, ClipboardList,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";

const citizenLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/report", label: "Report Hazard", icon: FilePlus2 },
  { to: "/my-reports", label: "My Reports", icon: ListChecks },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

const adminLinks = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/reports", label: "All Reports", icon: ClipboardList },
  { to: "/admin/users", label: "Users", icon: UsersIcon },
];

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const links = isAdmin ? adminLinks : citizenLinks;

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-4rem)] py-6 px-3">
      <div className="flex items-center gap-2 px-3 mb-6 text-civic-700 font-semibold">
        <Shield className="w-5 h-5" />
        {isAdmin ? "Admin Panel" : "Citizen Panel"}
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard" || to === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-civic-50 text-civic-700" : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
