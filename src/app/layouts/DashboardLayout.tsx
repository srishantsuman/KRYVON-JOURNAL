import { Outlet, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { LayoutDashboard, BookOpen, BarChart3, Calendar, LogOut, User, Bell, Menu } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export const DashboardLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
    { icon: BookOpen, label: "Journal", path: "/app/journal" },
    { icon: BarChart3, label: "Analytics", path: "/app/analytics" },
    { icon: Calendar, label: "Calendar", path: "/app/calendar" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0A0A0A" }}>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 border-r flex flex-col hidden md:flex"
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          borderColor: "rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Logo */}
        <div className="p-6">
          <motion.h1
            className="text-3xl"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #7A5CFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            animate={{
              textShadow: [
                "0 0 20px rgba(0, 212, 255, 0.3)",
                "0 0 40px rgba(122, 92, 255, 0.3)",
                "0 0 20px rgba(0, 212, 255, 0.3)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            KRYVON
          </motion.h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}>
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00D4FF 0%, #7A5CFF 100%)" }}>
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5 mt-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header
          className="h-16 border-b flex items-center justify-between px-6"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/5 relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#00FF85] rounded-full"></span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};