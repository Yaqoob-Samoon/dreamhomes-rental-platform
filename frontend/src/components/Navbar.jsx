import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCircle2,
  Heart,
  ShieldAlert // ✅ Added ShieldAlert for Admin Icon
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import api from "../api";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // ✅ Extract role from token
  let role = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role;
    } catch (e) {
      console.error("Invalid token");
    }
  }

  useEffect(() => {
    if (token) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get("/notifications");
          setNotifications(res.data);
          setUnreadCount(res.data.filter((n) => !n.is_read).length);
        } catch (err) {
          console.error("Failed to fetch notifications", err);
        }
      };

      fetchNotifications();

      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
      const ws = new WebSocket(`${wsUrl}/api/chat/ws?token=${token}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_notification") {
          setNotifications((prev) => [data.notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      };

      return () => ws.close();
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
    setShowNotifDropdown(false);
    if (notif.related_id) {
      navigate(`/property/${notif.related_id}`);
    }
  };

  const isActive = (path) => location.pathname === path;
  const navLinkClass = (path) =>
    `flex items-center gap-2 font-medium text-sm transition-colors duration-200 ${
      isActive(path) ? "text-[#1B1B18] font-semibold" : "text-[#736E60] hover:text-[#1B1B18]"
    }`;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-[#E7E2D9]/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-[#1B1B18] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Home className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="font-bold text-lg text-[#1B1B18] tracking-tight font-sans">
                DreamHomes
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/properties" className={navLinkClass("/properties")}>
              <Search className="w-4 h-4" /> Explore
            </Link>

            {token ? (
              <>
                {/* ✅ Conditional Admin Link */}
                {role === 'ADMIN' && (
                  <Link to="/admin" className={navLinkClass("/admin")}>
                    <ShieldAlert className="w-4 h-4 text-amber-600" /> <span className="text-amber-700">Admin</span>
                  </Link>
                )}

                <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                
                <Link to="/favorites" className={navLinkClass("/favorites")}>
                  <Heart className="w-4 h-4" /> Saved
                </Link>
                
                <Link to="/chat" className={navLinkClass("/chat")}>
                  <MessageSquare className="w-4 h-4" /> Messages
                </Link>

                {/* 🔔 Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="p-2 text-[#736E60] hover:text-[#1B1B18] hover:bg-[#FAF8F4] rounded-full transition-colors relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" strokeWidth={1.75} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-[#E7E2D9] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3.5 border-b border-[#E7E2D9]/60 bg-[#FAF8F4] flex justify-between items-center">
                        <h3 className="font-semibold text-[#1B1B18] text-sm">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="bg-[#1B1B18] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} New
                          </span>
                        )}
                      </div>

                      <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-[#8C8676] text-sm flex flex-col items-center">
                            <CheckCircle2 className="w-8 h-8 text-[#E7E2D9] mb-2" />
                            You are all caught up!
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`px-4 py-3.5 border-b border-[#E7E2D9]/40 cursor-pointer transition-colors flex gap-3 ${!notif.is_read ? "bg-[#FAF8F4] hover:bg-[#F3EFE6]" : "hover:bg-slate-50"}`}
                            >
                              <div
                                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!notif.is_read ? "bg-[#3F6652]" : "bg-transparent"}`}
                              ></div>
                              <div>
                                <p
                                  className={`text-sm leading-snug ${!notif.is_read ? "font-semibold text-[#1B1B18]" : "text-[#736E60]"}`}
                                >
                                  {notif.message}
                                </p>
                                <p className="text-[11px] text-[#8C8676] mt-1">
                                  {new Date(
                                    notif.created_at,
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    notif.created_at,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-[#736E60] hover:text-red-600 font-medium text-sm transition-colors ml-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-[#1B1B18] font-medium text-sm hover:text-[#736E60] transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-[#1B1B18] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#3F6652] transition-all shadow-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#1B1B18] p-2"
              aria-label="Toggle Menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-[#E7E2D9] px-4 pt-3 pb-6 space-y-2 shadow-xl absolute w-full">
          <Link to="/properties" className="block px-3 py-2.5 rounded-xl text-base font-medium text-[#1B1B18] hover:bg-[#FAF8F4]">
            Explore
          </Link>
          {token ? (
            <>
              {/* ✅ Conditional Admin Link Mobile */}
              {role === 'ADMIN' && (
                <Link to="/admin" className="block px-3 py-2.5 rounded-xl text-base font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Admin Panel
                </Link>
              )}
              <Link to="/dashboard" className="block px-3 py-2.5 rounded-xl text-base font-medium text-[#1B1B18] hover:bg-[#FAF8F4]">
                Dashboard
              </Link>
              <Link to="/favorites" className="block px-3 py-2.5 rounded-xl text-base font-medium text-[#1B1B18] hover:bg-[#FAF8F4]">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" strokeWidth={2} />
                  <span>Saved Properties</span>
                </div>
              </Link>
              <Link to="/chat" className="block px-3 py-2.5 rounded-xl text-base font-medium text-[#1B1B18] hover:bg-[#FAF8F4]">
                Messages
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2.5 rounded-xl text-base font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" className="block text-center px-3 py-3 rounded-xl text-base font-medium text-[#1B1B18] bg-[#FAF8F4]">
                Login
              </Link>
              <Link to="/register" className="block text-center px-3 py-3 rounded-xl text-base font-medium text-white bg-[#1B1B18]">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;