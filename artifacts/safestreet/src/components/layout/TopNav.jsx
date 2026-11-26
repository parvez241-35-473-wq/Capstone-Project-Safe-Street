import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function TopNav() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-civic-700">
          <Shield className="w-6 h-6 text-civic-600" strokeWidth={2.4} />
          SafeStreet
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/map" className="hover:text-civic-700 transition-colors">Live Map</Link>
          {isAuthenticated ? (
            <>
              <Link to={isAdmin ? "/admin" : "/dashboard"} className="hover:text-civic-700 transition-colors">
                Dashboard
              </Link>
              <Link to="/report" className="hover:text-civic-700 transition-colors">Report a Hazard</Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Hi, {user?.full_name?.split(" ")[0]}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-civic-700 transition-colors">Log in</Link>
              <Link
                to="/report"
                className="px-4 py-2 rounded-lg bg-civic-600 text-white font-semibold hover:bg-civic-700 transition-colors shadow-soft"
              >
                Report a Hazard
              </Link>
            </>
          )}
        </nav>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2 text-sm font-medium text-gray-700">
          <Link to="/map" className="block py-1.5" onClick={() => setOpen(false)}>Live Map</Link>
          {isAuthenticated ? (
            <>
              <Link to={isAdmin ? "/admin" : "/dashboard"} className="block py-1.5" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link to="/report" className="block py-1.5" onClick={() => setOpen(false)}>Report a Hazard</Link>
              <button onClick={() => { setOpen(false); handleLogout(); }} className="block py-1.5 text-left w-full">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-1.5" onClick={() => setOpen(false)}>Log in</Link>
              <Link to="/report" className="block py-1.5 text-civic-700 font-semibold" onClick={() => setOpen(false)}>Report a Hazard</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
