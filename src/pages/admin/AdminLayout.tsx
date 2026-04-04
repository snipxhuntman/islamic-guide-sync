import React, { createContext, useContext, useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { CalendarDays, MessageSquare, BookOpen, LayoutDashboard, LogOut, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminLang = "en" | "de";

const AdminLangContext = createContext<{ lang: AdminLang; setLang: (l: AdminLang) => void }>({
  lang: "en",
  setLang: () => {},
});

export const useAdminLang = () => useContext(AdminLangContext);

const labels: Record<AdminLang, Record<string, string>> = {
  en: {
    dashboard: "Dashboard", prayerTimes: "Prayer Times", messages: "Messages",
    classes: "Classes", logout: "Logout", adminPanel: "Admin Panel",
  },
  de: {
    dashboard: "Dashboard", prayerTimes: "Gebetszeiten", messages: "Nachrichten",
    classes: "Unterricht", logout: "Abmelden", adminPanel: "Admin-Bereich",
  },
};

const navItems = [
  { to: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/admin/prayer-times", key: "prayerTimes", icon: CalendarDays },
  { to: "/admin/messages", key: "messages", icon: MessageSquare },
  { to: "/admin/classes", key: "classes", icon: BookOpen },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const isAuth = sessionStorage.getItem("admin-auth") === "true";
  const [lang, setLang] = useState<AdminLang>(() =>
    (localStorage.getItem("admin-lang") as AdminLang) || "en"
  );

  if (!isAuth) return <Navigate to="/admin" replace />;

  const handleLogout = () => {
    sessionStorage.removeItem("admin-auth");
    navigate("/admin");
  };

  const toggleLang = () => {
    const next = lang === "en" ? "de" : "en";
    setLang(next);
    localStorage.setItem("admin-lang", next);
  };

  const t = labels[lang];

  return (
    <AdminLangContext.Provider value={{ lang, setLang }}>
      <div className="min-h-screen bg-background flex">
        <aside className="w-60 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-foreground">{t.adminPanel}</h2>
              <p className="text-xs text-muted-foreground">Al-Rahman Moschee</p>
            </div>
            <Button size="icon" variant="ghost" onClick={toggleLang} title="Toggle language">
              <Globe className="w-4 h-4" />
            </Button>
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
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </AdminLangContext.Provider>
  );
};

export default AdminLayout;
