import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { messagesData } from "@/data/messages";

const MessageCarousel: React.FC = () => {
  const { language } = useLanguage();
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const messages = messagesData.slice(0, 4);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [messages.length]);

  const getText = (msg: typeof messages[0]) => {
    if (language === "en" && msg.textEn) return msg.textEn;
    if (language === "ar" && msg.textAr) return msg.textAr;
    return msg.text;
  };

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-lg bg-card border border-border shadow-sm">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {messages.map((msg) => (
            <div key={msg.id} className="min-w-full p-4">
              <p className="text-sm text-card-foreground line-clamp-2">{getText(msg)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {messages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === current ? "bg-accent" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageCarousel;
