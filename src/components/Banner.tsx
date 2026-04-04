import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, MapPin } from "lucide-react";

interface BannerProps {
  className?: string;
}

const Banner: React.FC<BannerProps> = ({ className = "" }) => {
  const [flipped, setFlipped] = useState(false);
  const { t } = useLanguage();

  return (
    <div
      className={`flip-card cursor-pointer ${className}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`flip-card-inner relative w-full h-20 ${flipped ? "flipped" : ""}`}>
        {/* Front */}
        <div className="flip-card-front absolute inset-0 flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-wide">{t("mosqueName")}</h1>
            <p className="text-sm opacity-80">{t("mosqueSubtitle")}</p>
          </div>
        </div>
        {/* Back */}
        <div className="flip-card-back absolute inset-0 flex items-center justify-center gap-8 rounded-xl bg-secondary text-secondary-foreground shadow-lg">
          <a
            href="https://leipziger-moschee.de"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-1 hover:text-accent transition-colors"
          >
            <Globe className="w-8 h-8" />
            <span className="text-xs">{t("website")}</span>
          </a>
          <a
            href="https://maps.google.com/?q=Alrahman+Moschee+Leipzig"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-1 hover:text-accent transition-colors"
          >
            <MapPin className="w-8 h-8" />
            <span className="text-xs">Google Maps</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Banner;
