import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLiveMessages } from "@/data/messages";
import { formatTimestamp, toWesternNumerals } from "@/utils/timeFormat";

function getReadMessageIds(): Set<string> {
  try {
    const raw = localStorage.getItem("read-message-ids");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function markAllAsRead(ids: string[]) {
  const existing = getReadMessageIds();
  ids.forEach((id) => existing.add(id));
  localStorage.setItem("read-message-ids", JSON.stringify([...existing]));
}

const Messages: React.FC = () => {
  const { t, language } = useLanguage();
  const messagesData = getLiveMessages();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(() => {
    const read = getReadMessageIds();
    return new Set(messagesData.filter((m) => !read.has(m.id)).map((m) => m.id));
  });

  useEffect(() => {
    // Scroll to bottom on mount
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // Mark all as read after a short delay
    const timer = setTimeout(() => {
      markAllAsRead(messagesData.map((m) => m.id));
      setUnreadIds(new Set());
    }, 2000);
    return () => clearTimeout(timer);
  }, [messagesData]);

  const getText = (msg: typeof messagesData[0]) => {
    if (language === "en" && msg.textEn) return msg.textEn;
    if (language === "ar" && msg.textAr) return msg.textAr;
    return msg.text;
  };

  // Group messages by date
  const grouped = messagesData.reduce<Record<string, typeof messagesData>>((acc, msg) => {
    const date = msg.timestamp.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const localeMap: Record<string, string> = { de: "de-DE", en: "en-US", ar: "ar-SA" };
    return d.toLocaleDateString(localeMap[language] || "de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Sort dates oldest first so latest is at the bottom
  const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col min-h-screen max-w-app mx-auto pb-20">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-foreground">{t("messages")}</h1>
      </div>

      <div className="flex-1 px-4 mt-4 space-y-4">
        {sortedDates.map((date) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex justify-center mb-3">
              <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                {formatDate(date)}
              </span>
            </div>
            {/* Messages */}
            <div className="space-y-2">
              {grouped[date].map((msg) => (
                <div key={msg.id} className="flex justify-start">
                  <div className={`max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm transition-colors duration-1000 ${
                    unreadIds.has(msg.id)
                      ? "bg-accent text-accent-foreground ring-2 ring-accent/50"
                      : "bg-primary text-primary-foreground"
                  }`}>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="" className={`rounded-lg mb-2 object-contain ${
                        msg.imageSize === "small" ? "max-h-24" :
                        msg.imageSize === "large" ? "max-h-72" :
                        msg.imageSize === "full" ? "max-h-none w-full" :
                        "max-h-48"
                      }`} />
                    )}
                    {getText(msg) && <p className="text-sm leading-relaxed">{getText(msg)}</p>}
                    {msg.linkUrl && (
                      <a
                        href={msg.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs underline opacity-80 hover:opacity-100 mt-1"
                      >
                        {(language === "en" && msg.linkLabelEn) || (language === "ar" && msg.linkLabelAr) || msg.linkLabel || msg.linkUrl}
                      </a>
                    )}
                    <p className="text-[10px] opacity-60 mt-1 text-end">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {messagesData.length === 0 && (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">{t("noMessages")}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Messages;
