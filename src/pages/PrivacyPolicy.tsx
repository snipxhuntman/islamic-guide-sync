import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const links = [
    {
      label: "Datenschutzerklärung",
      url: "https://www.leipziger-moschee.de/datenschutz",
    },
    {
      label: "Impressum",
      url: "https://www.leipziger-moschee.de/impressum",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-app mx-auto pb-20">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("privacyTitle")}</h1>
      </div>
      <div className="px-4 mt-4 space-y-3">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <span className="text-sm font-medium text-foreground">{link.label}</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
