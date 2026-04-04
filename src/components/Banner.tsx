import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin } from "lucide-react";
import { getSiteLinks } from "@/stores/dataStore";

interface BannerProps {
  className?: string;
}

const Banner: React.FC<BannerProps> = ({ className = "" }) => {
  const { t } = useLanguage();
  const links = getSiteLinks();

  return (
    <div className={`relative rounded-xl bg-primary text-primary-foreground shadow-lg px-4 py-4 ${className}`}>
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-wide">{t("mosqueName")}</h1>
        <p className="text-sm opacity-80">{t("mosqueSubtitle")}</p>
      </div>
      <div className="absolute bottom-2 right-2">
        <a
          href={links.mapsUrl || "https://maps.google.com/?q=Alrahman+Moschee+Leipzig"}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/40 transition-colors"
          aria-label="Location"
        >
          <MapPin style={{ width: '1.25rem', height: '1.25rem' }} />
        </a>
      </div>
    </div>
  );
};

export default Banner;
