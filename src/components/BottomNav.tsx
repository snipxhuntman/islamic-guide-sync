import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home, Clock, MessageSquare, BookOpen, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { hasUnreadMessages, hasUnseenCancellations } from "@/utils/notifications";

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
  const [unreadMessages, setUnreadMessages] = useState(false);
  const [unseenCancellations, setUnseenCancellations] = useState(false);

  useEffect(() => {
    const check = () => {
      setUnreadMessages(hasUnreadMessages());
      setUnseenCancellations(hasUnseenCancellations());
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const hasBadge = (key: string) => {
    if (key === "messages") return unreadMessages;
    if (key === "classes") return unseenCancellations;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ key, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          const badge = hasBadge(key);
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                isActive
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card" />
                )}
              </div>
              <span className="text-[10px] font-medium">{t(key)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
