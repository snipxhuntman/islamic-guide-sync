import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPrivacyPolicy } from "@/stores/dataStore";

const PrivacyPolicy: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const policy = getPrivacyPolicy();
  const content = policy[language];

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
          <div
            className="text-sm text-card-foreground leading-relaxed prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:my-0.5 [&_p]:my-2"
            dir={language === "ar" ? "rtl" : "ltr"}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
