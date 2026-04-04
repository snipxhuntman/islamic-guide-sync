import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLiveMessages } from "@/data/messages";

const Messages: React.FC = () => {
  const { t, language } = useLanguage();
  const messagesData = getLiveMessages();

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

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

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
                  <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                    <p className="text-sm leading-relaxed">{getText(msg)}</p>
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
      </div>
    </div>
  );
};

export default Messages;
