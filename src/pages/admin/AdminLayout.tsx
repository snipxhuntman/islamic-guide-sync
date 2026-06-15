import React, { createContext, useContext, useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { CalendarDays, MessageSquare, BookOpen, LayoutDashboard, LogOut, Globe, Radio, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { clearAdminSession, getAdminSessionToken } from "@/stores/contentSync";

type AdminLang = "en" | "de";

const AdminLangContext = createContext<{ lang: AdminLang; setLang: (l: AdminLang) => void }>({
  lang: "en",
  setLang: () => {},
});

export const useAdminLang = () => useContext(AdminLangContext);

const labels: Record<AdminLang, Record<string, string>> = {
  en: {
    dashboard: "Dashboard", prayerTimes: "Prayer Times", messages: "Messages",
    classes: "Classes", broadcasts: "Broadcasts", logout: "Logout", adminPanel: "Admin Panel",
  },
  de: {
    dashboard: "Dashboard", prayerTimes: "Gebetszeiten", messages: "Nachrichten",
    classes: "Unterricht", broadcasts: "Broadcasts", logout: "Abmelden", adminPanel: "Admin-Bereich",
  },
};

const navItems = [
  { to: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/admin/broadcasts", key: "broadcasts", icon: Radio },
  { to: "/admin/prayer-times", key: "prayerTimes", icon: CalendarDays },
  { to: "/admin/messages", key: "messages", icon: MessageSquare },
  { to: "/admin/classes", key: "classes", icon: BookOpen },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAuth = !!sessionStorage.getItem("admin-auth-token");
  const [lang, setLang] = useState<AdminLang>(() =>
    (localStorage.getItem("admin-lang") as AdminLang) || "en"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuth) return <Navigate to="/admin" replace />;

  const handleLogout = () => {
    sessionStorage.removeItem("admin-auth-token");
    clearAdminPassword();
    navigate("/admin");
  };

  const toggleLang = () => {
    const next = lang === "en" ? "de" : "en";
    setLang(next);
    localStorage.setItem("admin-lang", next);
  };

  const t = labels[lang];

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-foreground">{t.adminPanel}</h2>
          <p className="text-xs text-muted-foreground">Al-Rahman Moschee</p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={toggleLang} title="Toggle language">
            <Globe className="w-4 h-4" />
          </Button>
          {isMobile && (
            <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => isMobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {t[item.key]}
          </NavLink>
        ))}
      </nav>
      <div className="p-2 border-t border-border">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          {t.logout}
        </Button>
      </div>
    </>
  );

  return (
    <AdminLangContext.Provider value={{ lang, setLang }}>
      <div className="min-h-screen bg-background flex">
        {/* Desktop sidebar */}
        {!isMobile && (
          <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
            {sidebarContent}
          </aside>
        )}

        {/* Mobile overlay sidebar */}
        {isMobile && sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col z-50 shadow-xl">
              {sidebarContent}
            </aside>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {isMobile && (
            <header className="flex items-center gap-3 p-3 border-b border-border bg-card">
              <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="font-bold text-foreground">{t.adminPanel}</h2>
            </header>
          )}
          <main className={`flex-1 overflow-auto ${isMobile ? "p-3" : "p-6"}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </AdminLangContext.Provider>
  );
};

export default AdminLayout;
