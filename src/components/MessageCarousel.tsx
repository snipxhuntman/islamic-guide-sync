import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLiveBroadcasts, Broadcast } from "@/data/broadcasts";

const MessageCarousel: React.FC = () => {
  const { language } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Load broadcasts reactively and re-check periodically
  useEffect(() => {
    const load = () => setBroadcasts(getLiveBroadcasts());
    load();
    // Re-check every 30s for schedule changes or admin updates
    const poll = setInterval(load, 30000);
    return () => clearInterval(poll);
  }, []);

  // Reset slide index when broadcasts change
  useEffect(() => {
    setCurrent(0);
  }, [broadcasts.length]);

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

  const renderSlideContent = (b: Broadcast) => (
    <>
      {b.imageUrl && (
        <img src={b.imageUrl} alt="" className={`rounded-lg mb-2 object-contain ${
          b.imageSize === "small" ? "max-h-16" :
          b.imageSize === "large" ? "max-h-48 w-full" :
          b.imageSize === "full" ? "max-h-none w-full" :
          "max-h-32 w-full"
        }`} />
      )}
      {getText(b) && <p className="text-sm text-card-foreground line-clamp-2">{getText(b)}</p>}
    </>
  );

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-lg bg-card border border-border shadow-sm">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {broadcasts.map((b) => (
            <div key={b.id} className="min-w-full p-4">
              {b.link ? (
                <a href={b.link} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                  {renderSlideContent(b)}
                </a>
              ) : (
                renderSlideContent(b)
              )}
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
