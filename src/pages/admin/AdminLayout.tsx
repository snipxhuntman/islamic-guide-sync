import React from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { CalendarDays, MessageSquare, BookOpen, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/prayer-times", label: "Prayer Times", icon: CalendarDays },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/classes", label: "Classes", icon: BookOpen },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const isAuth = sessionStorage.getItem("admin-auth") === "true";

  if (!isAuth) return <Navigate to="/admin" replace />;

  const handleLogout = () => {
    sessionStorage.removeItem("admin-auth");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">Admin Panel</h2>
          <p className="text-xs text-muted-foreground">Al-Rahman Moschee</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
