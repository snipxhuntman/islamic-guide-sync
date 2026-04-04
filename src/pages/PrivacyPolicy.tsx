import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen max-w-app mx-auto pb-20">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("privacyTitle")}</h1>
      </div>
      <div className="px-4 mt-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-card-foreground leading-relaxed">{t("privacyContent")}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
