import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, MapPin } from "lucide-react";

interface BannerProps {
  className?: string;
}

const Banner: React.FC<BannerProps> = ({ className = "" }) => {
  const { t } = useLanguage();

  return (
    <div className={`relative rounded-xl bg-primary text-primary-foreground shadow-lg px-4 py-4 ${className}`}>
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-wide">{t("mosqueName")}</h1>
        <p className="text-sm opacity-80">{t("mosqueSubtitle")}</p>
      </div>
      <div className="absolute bottom-2 right-2 flex gap-1.5">
        <a
          href="https://leipziger-moschee.de"
          target="_blank"
          rel="noopener noreferrer"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/40 transition-colors"
          aria-label="Website"
        >
          <Globe className="w-3.5 h-3.5" />
        </a>
        <a
          href="https://maps.google.com/?q=Alrahman+Moschee+Leipzig"
          target="_blank"
          rel="noopener noreferrer"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/40 transition-colors"
          aria-label="Location"
        >
          <MapPin className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default Banner;
