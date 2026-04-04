import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/i18n/translations";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { prayerKeys } from "@/data/prayerTimes";
import { Globe, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getHourFormat, setHourFormat, HourFormat } from "@/utils/timeFormat";

interface NotifSettings {
  all: boolean;
  prayer: boolean;
  ringtone: string;
  prayerAlerts: Record<string, number>;
  classes: boolean;
  classCancellations: boolean;
  messages: boolean;
}

const defaultSettings: NotifSettings = {
  all: true,
  prayer: true,
  ringtone: "adhan1",
  prayerAlerts: {
    fajr: 15, shuruk: 10, dhuhr: 15, asr: 15, maghrib: 10, isha: 15,
  },
  classes: true,
  classCancellations: true,
  messages: true,
};

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hourFormat, setHourFormatState] = useState<HourFormat>(() => getHourFormat());

  const handleHourFormatChange = (fmt: HourFormat) => {
    setHourFormatState(fmt);
    setHourFormat(fmt);
  };

  const [notif, setNotif] = useState<NotifSettings>(() => {
    const saved = localStorage.getItem("notif-settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("notif-settings", JSON.stringify(notif));
  }, [notif]);

  const updateNotif = (key: keyof NotifSettings, value: any) => {
    setNotif((prev) => ({ ...prev, [key]: value }));
  };

  const updatePrayerAlert = (prayer: string, mins: number) => {
    setNotif((prev) => ({
      ...prev,
      prayerAlerts: { ...prev.prayerAlerts, [prayer]: mins },
    }));
  };

  const languages: { key: Language; label: string }[] = [
    { key: "de", label: t("german") },
    { key: "en", label: t("english") },
    { key: "ar", label: t("arabic") },
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-app mx-auto pb-20">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-foreground">{t("settings")}</h1>
      </div>

      <div className="px-4 mt-4 space-y-6">
        {/* Language */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t("language")}</h2>
          <div className="flex gap-2">
            {languages.map((l) => (
              <button
                key={l.key}
                onClick={() => setLanguage(l.key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  language === l.key
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>

        {/* Time Format */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t("timeFormat")}</h2>
          <div className="flex gap-2">
            {(["24", "12"] as HourFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleHourFormatChange(fmt)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  hourFormat === fmt
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {fmt === "24" ? t("format24h") : t("format12h")}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t("notifications")}</h2>
          <div className="space-y-3 bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{t("allNotifications")}</span>
              <Switch checked={notif.all} onCheckedChange={(v) => updateNotif("all", v)} />
            </div>

            {notif.all && (
              <>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-foreground">{t("prayerNotifications")}</span>
                  <Switch checked={notif.prayer} onCheckedChange={(v) => updateNotif("prayer", v)} />
                </div>

                {notif.prayer && (
                  <>
                    <div className="flex items-center justify-between ps-4">
                      <span className="text-xs text-muted-foreground">{t("ringtone")}</span>
                      <Select value={notif.ringtone} onValueChange={(v) => updateNotif("ringtone", v)}>
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adhan1">{t("adhan1")}</SelectItem>
                          <SelectItem value="adhan2">{t("adhan2")}</SelectItem>
                          <SelectItem value="ring">{t("ring")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {prayerKeys.map((key) => (
                      <div key={key} className="flex items-center justify-between ps-4">
                        <span className="text-xs text-muted-foreground">{t(key)}</span>
                        <Select
                          value={String(notif.prayerAlerts[key] || 15)}
                          onValueChange={(v) => updatePrayerAlert(key, Number(v))}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20, 30].map((m) => (
                              <SelectItem key={m} value={String(m)}>
                                {m} {t("alertBefore")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </>
                )}

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-foreground">{t("classNotifications")}</span>
                  <Switch checked={notif.classes} onCheckedChange={(v) => updateNotif("classes", v)} />
                </div>

                {notif.classes && (
                  <div className="flex items-center justify-between ps-4">
                    <span className="text-xs text-muted-foreground">{t("classCancellationAlerts")}</span>
                    <Switch checked={notif.classCancellations} onCheckedChange={(v) => updateNotif("classCancellations", v)} />
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-foreground">{t("messageNotifications")}</span>
                  <Switch checked={notif.messages} onCheckedChange={(v) => updateNotif("messages", v)} />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Links */}
        <section className="space-y-2">
          <a
            href="https://leipziger-moschee.de"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <Globe className="w-5 h-5 text-accent" />
            <span className="text-sm text-foreground">{t("website")}</span>
          </a>

          <button
            onClick={() => navigate("/privacy")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <Shield className="w-5 h-5 text-accent" />
            <span className="text-sm text-foreground">{t("privacyPolicy")}</span>
          </button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
