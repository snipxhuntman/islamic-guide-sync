import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin } from "lucide-react";
import { getSiteLinks } from "@/stores/dataStore";
import logo from "@/assets/igs-am-logo.webp";

interface BannerProps {
  className?: string;
}

const Banner: React.FC<BannerProps> = ({ className = "" }) => {
  const { t } = useLanguage();
  const links = getSiteLinks();

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-900 text-primary-foreground shadow-lg px-4 py-4 ${className}`}
    >
      <div className="relative flex items-center gap-3">
        <img
          src={logo}
          alt="IGS-AM e.V."
          className="h-20 w-20 shrink-0 object-contain"
          style={{ filter: "invert(1) brightness(2)" }}
        />
        <div className="flex-1 text-center pr-10">
          <h1 className="text-xl font-bold tracking-wide">{t("mosqueName")}</h1>
          <p className="text-sm opacity-80">{t("mosqueSubtitle")}</p>
        </div>
      </div>
      <div className="absolute bottom-2 right-2 z-10">
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
