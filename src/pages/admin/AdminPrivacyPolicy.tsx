import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getPrivacyPolicy, savePrivacyPolicy, PrivacyPolicyContent } from "@/stores/dataStore";
import { toast } from "sonner";
import { useAdminLang } from "./AdminLayout";
import { ShieldCheck } from "lucide-react";

const i18n = {
  en: {
    title: "Privacy Policy",
    german: "German",
    english: "English",
    arabic: "Arabic",
    save: "Save",
    saved: "Privacy policy saved",
    hint: "You can use HTML for formatting and links. Example: <a href=\"https://example.com\">Link text</a>",
  },
  de: {
    title: "Datenschutzerklärung",
    german: "Deutsch",
    english: "Englisch",
    arabic: "Arabisch",
    save: "Speichern",
    saved: "Datenschutzerklärung gespeichert",
    hint: "Sie können HTML für Formatierung und Links verwenden. Beispiel: <a href=\"https://example.com\">Linktext</a>",
  },
};

const AdminPrivacyPolicy: React.FC = () => {
  const { lang } = useAdminLang();
  const t = i18n[lang];
  const [policy, setPolicy] = useState<PrivacyPolicyContent>(() => getPrivacyPolicy());

  const handleSave = () => {
    savePrivacyPolicy(policy);
    toast.success(t.saved);
  };

  const fields: { key: keyof PrivacyPolicyContent; label: string; dir?: string }[] = [
    { key: "de", label: t.german },
    { key: "en", label: t.english },
    { key: "ar", label: t.arabic, dir: "rtl" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <ShieldCheck className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">{t.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">{t.hint}</p>
          {fields.map(({ key, label, dir }) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <Textarea
                value={policy[key]}
                onChange={(e) => setPolicy((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={6}
                dir={dir}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">{t.save}</Button>
    </div>
  );
};

export default AdminPrivacyPolicy;
