import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home, Clock, MessageSquare, BookOpen, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { key: "home", path: "/", icon: Home },
  { key: "prayerTimes", path: "/prayer-times", icon: Clock },
  { key: "messages", path: "/messages", icon: MessageSquare },
  { key: "classes", path: "/classes", icon: BookOpen },
  { key: "settings", path: "/settings", icon: Settings },
];

const BottomNav: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ key, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                isActive
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t(key)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
