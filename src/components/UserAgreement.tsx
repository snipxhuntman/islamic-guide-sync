import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const AGREEMENT_KEY = "user-agreement-accepted";

const content = {
  de: {
    title: "Willkommen in der\nAl Rahman Moschee App",
    body: "Diese App speichert Ihre Einstellungen lokal auf Ihrem Gerät. Es werden keine personenbezogenen Daten erhoben oder übertragen.",
    privacy: "Datenschutzerklärung",
    accept: "Ich stimme zu",
  },
  en: {
    title: "Welcome to the\nAl Rahman Mosque App",
    body: "This app stores your settings locally on your device. No personal data is collected or transmitted.",
    privacy: "Privacy Policy",
    accept: "I agree",
  },
  ar: {
    title: "مرحباً بكم في\nتطبيق مسجد الرحمن",
    body: "يحتفظ هذا التطبيق بإعداداتك محلياً على جهازك. لا يتم جمع أو إرسال أي بيانات شخصية.",
    privacy: "سياسة الخصوصية",
    accept: "أوافق",
  },
};

const UserAgreement: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [accepted, setAccepted] = useState(() => localStorage.getItem(AGREEMENT_KEY) === "true");

  if (accepted) return <>{children}</>;

  const t = content[language] || content.de;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground whitespace-pre-line">{t.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t.body}</p>
        <a
          href="https://leipziger-moschee.de/datenschutzerklaerung"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline"
        >
          {t.privacy}
        </a>
        <div>
          <Button
            className="w-full"
            onClick={() => {
              localStorage.setItem(AGREEMENT_KEY, "true");
              setAccepted(true);
            }}
          >
            {t.accept}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserAgreement;
