import React, { useState } from "react";
import { CalendarDays, MessageSquare, BookOpen, Link2, Globe, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPrayerTimes, getMessages, getClasses, getSiteLinks, saveSiteLinks, SiteLinks } from "@/stores/dataStore";
import { toast } from "sonner";
import { useAdminLang } from "./AdminLayout";

const i18n = {
  en: {
    dashboard: "Dashboard",
    prayerDays: "Prayer Days Loaded",
    broadcastMessages: "Broadcast Messages",
    classes: "Classes",
    socialLinks: "Social Media Links",
    donationLinks: "Donation Links",
    websiteLinks: "Website Links",
    mapsUrl: "Google Maps Address",
    saved: "Links saved",
    german: "German",
    english: "English",
    arabic: "Arabic",
  },
  de: {
    dashboard: "Dashboard",
    prayerDays: "Gebetstage geladen",
    broadcastMessages: "Broadcast-Nachrichten",
    classes: "Unterricht",
    socialLinks: "Social-Media-Links",
    donationLinks: "Spenden-Links",
    websiteLinks: "Webseiten-Links",
    save: "Speichern",
    saved: "Links gespeichert",
    german: "Deutsch",
    english: "Englisch",
    arabic: "Arabisch",
    mapsUrl: "Google Maps Adresse",
  },
};

const AdminDashboard: React.FC = () => {
  const { lang } = useAdminLang();
  const t = i18n[lang];
  const prayerCount = getPrayerTimes().length;
  const messageCount = getMessages().length;
  const classCount = getClasses().length;

  const [links, setLinks] = useState<SiteLinks>(() => getSiteLinks());

  const stats = [
    { label: t.prayerDays, value: prayerCount, icon: CalendarDays },
    { label: t.broadcastMessages, value: messageCount, icon: MessageSquare },
    { label: t.classes, value: classCount, icon: BookOpen },
  ];

  const handleSave = () => {
    saveSiteLinks(links);
    toast.success(t.saved);
  };

  const updateSocial = (key: keyof SiteLinks["socials"], val: string) => {
    setLinks((prev) => ({ ...prev, socials: { ...prev.socials, [key]: val } }));
  };

  const updateDonation = (key: "de" | "en" | "ar", val: string) => {
    setLinks((prev) => ({ ...prev, donation: { ...prev.donation, [key]: val } }));
  };

  const updateWebsite = (key: "de" | "en" | "ar", val: string) => {
    setLinks((prev) => ({ ...prev, website: { ...prev.website, [key]: val } }));
  };

  const socialLabels: { key: keyof SiteLinks["socials"]; label: string }[] = [
    { key: "youtube", label: "YouTube" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "telegram", label: "Telegram" },
    { key: "tiktok", label: "TikTok" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t.dashboard}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Social Links */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Link2 className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">{t.socialLinks}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {socialLabels.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <Input
                value={links.socials[key]}
                onChange={(e) => updateSocial(key, e.target.value)}
                placeholder={`https://${key}.com`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Donation Links */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Heart className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">{t.donationLinks}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["de", "en", "ar"] as const).map((l) => (
            <div key={l}>
              <label className="text-xs font-medium text-muted-foreground">
                {l === "de" ? t.german : l === "en" ? t.english : t.arabic}
              </label>
              <Input
                value={links.donation[l]}
                onChange={(e) => updateDonation(l, e.target.value)}
                placeholder="https://..."
                dir={l === "ar" ? "ltr" : undefined}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Website Links */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Globe className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">{t.websiteLinks}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["de", "en", "ar"] as const).map((l) => (
            <div key={l}>
              <label className="text-xs font-medium text-muted-foreground">
                {l === "de" ? t.german : l === "en" ? t.english : t.arabic}
              </label>
              <Input
                value={links.website[l]}
                onChange={(e) => updateWebsite(l, e.target.value)}
                placeholder="https://..."
                dir={l === "ar" ? "ltr" : undefined}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">{t.save}</Button>
    </div>
  );
};

export default AdminDashboard;
