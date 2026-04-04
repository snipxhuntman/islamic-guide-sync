import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLiveBroadcasts, Broadcast } from "@/data/broadcasts";

const MessageCarousel: React.FC = () => {
  const { language } = useLanguage();
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const broadcasts = getLiveBroadcasts();

  useEffect(() => {
    if (broadcasts.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % broadcasts.length);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [broadcasts.length]);

  const getText = (b: Broadcast) => {
    if (language === "en" && b.textEn) return b.textEn;
    if (language === "ar" && b.textAr) return b.textAr;
    return b.text;
  };

  if (broadcasts.length === 0) return null;

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-lg bg-card border border-border shadow-sm">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {broadcasts.map((b) => (
            <div key={b.id} className="min-w-full p-4">
              {b.imageUrl && (
                <img src={b.imageUrl} alt="" className="rounded-lg mb-2 max-h-32 w-full object-contain" />
              )}
              {getText(b) && <p className="text-sm text-card-foreground line-clamp-2">{getText(b)}</p>}
            </div>
          ))}
        </div>
      </div>
      {broadcasts.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {broadcasts.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? "bg-accent" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageCarousel;
