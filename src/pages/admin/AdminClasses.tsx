import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { getClasses, saveClasses } from "@/stores/dataStore";
import { ClassItem } from "@/data/classes";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

import { useAdminLang } from "./AdminLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const SOCIAL_KEYS = ["youtube", "instagram", "telegram", "facebook", "tiktok"] as const;

const DEFAULT_SOCIAL_LINKS = {
  youtube: "https://youtube.com",
  instagram: "https://instagram.com",
  telegram: "https://t.me",
  facebook: "https://facebook.com",
  tiktok: "https://tiktok.com",
};

const i18n = {
  en: {
    classes: "Classes",
    newClass: "New Class",
    titleDe: "Title (DE)", titleEn: "Title (EN)", titleAr: "Title (AR)",
    descDe: "Description (DE)", descEn: "Description (EN)", descAr: "Description (AR)",
    day: "Day", cancelled: "Cancelled", timing: "Timing",
    autoLabel: "Auto (Maghrib + offset → Isha)",
    manual: "Manual",
    startTime: "Start Time", endTime: "End Time",
    offsetLabel: "Offset after Maghrib",
    minutes: "min",
    add: "Add", save: "Save", cancel: "Cancel",
    noClasses: "No classes yet.",
    titleRequired: "German title is required",
    added: "Class added", updated: "Class updated", deleted: "Class deleted",
    monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
    thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
    socialLinks: "Social Links",
    socialAuto: "Default links (all classes)",
    socialManual: "Custom links",
    defaultLinksLabel: "Default Social Links",
    defaultLinksDesc: "These links are used for all classes set to 'Default links'.",
  },
  de: {
    classes: "Unterricht",
    newClass: "Neuer Unterricht",
    titleDe: "Titel (DE)", titleEn: "Titel (EN)", titleAr: "Titel (AR)",
    descDe: "Beschreibung (DE)", descEn: "Beschreibung (EN)", descAr: "Beschreibung (AR)",
    day: "Tag", cancelled: "Abgesagt", timing: "Zeitplanung",
    autoLabel: "Auto (Maghrib + Versatz → Isha)",
    manual: "Manuell",
    startTime: "Startzeit", endTime: "Endzeit",
    offsetLabel: "Versatz nach Maghrib",
    minutes: "Min",
    add: "Hinzufügen", save: "Speichern", cancel: "Abbrechen",
    noClasses: "Noch kein Unterricht.",
    titleRequired: "Deutscher Titel ist erforderlich",
    added: "Unterricht hinzugefügt", updated: "Unterricht aktualisiert", deleted: "Unterricht gelöscht",
    monday: "Montag", tuesday: "Dienstag", wednesday: "Mittwoch",
    thursday: "Donnerstag", friday: "Freitag", saturday: "Samstag", sunday: "Sonntag",
    socialLinks: "Social Links",
    socialAuto: "Standard-Links (alle Unterrichte)",
    socialManual: "Eigene Links",
    defaultLinksLabel: "Standard Social Links",
    defaultLinksDesc: "Diese Links werden für alle Unterrichte mit 'Standard-Links' verwendet.",
  },
};

function getDefaultLinks(): Record<string, string> {
  try {
    const raw = localStorage.getItem("admin-default-social-links");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...DEFAULT_SOCIAL_LINKS };
}

function saveDefaultLinks(links: Record<string, string>) {
  localStorage.setItem("admin-default-social-links", JSON.stringify(links));
}

/** 24h time input — uses two selects (HH and MM) to guarantee 24h regardless of browser locale */
const Time24Input: React.FC<{ value: string; onChange: (v: string) => void; label: string }> = ({ value, onChange, label }) => {
  const [hh, mm] = (value || "00:00").split(":").map((s) => s.padStart(2, "0"));
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex gap-1 items-center">
        <select
          className="flex h-10 w-16 rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={hh}
          onChange={(e) => onChange(`${e.target.value}:${mm}`)}
        >
          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-foreground font-bold">:</span>
        <select
          className="flex h-10 w-16 rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={mm}
          onChange={(e) => onChange(`${hh}:${e.target.value}`)}
        >
          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const emptyForm = (): Omit<ClassItem, "id"> => ({
  title: "", titleEn: "", titleAr: "",
  day: "monday",
  description: "", descriptionEn: "", descriptionAr: "",
  isCancelled: false,
  timingMode: "auto",
  autoOffset: 20,
  manualStart: "19:00",
  manualEnd: "20:00",
  linksMode: "auto",
  links: { youtube: "", instagram: "", telegram: "", facebook: "", tiktok: "" },
});

const AdminClasses: React.FC = () => {
  const { lang } = useAdminLang();
  const t = i18n[lang];
  const [classes, setClasses] = useState<ClassItem[]>(() => getClasses());
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<ClassItem, "id">>(emptyForm());
  const [defaultLinks, setDefaultLinksState] = useState<Record<string, string>>(getDefaultLinks);

  const persist = (updated: ClassItem[]) => {
    setClasses(updated);
    saveClasses(updated);
  };

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error(t.titleRequired); return; }
    const resolvedLinks = form.linksMode === "auto" ? { ...defaultLinks } : form.links;
    const item: ClassItem = { ...form, links: resolvedLinks, id: String(Date.now()) };
    persist([...classes, item]);
    setForm(emptyForm());
    setShowAdd(false);
    toast.success(t.added);
  };

  const handleDelete = (id: string) => {
    persist(classes.filter((c) => c.id !== id));
    toast.success(t.deleted);
  };

  const startEdit = (c: ClassItem) => {
    setEditing(c.id);
    const { id, ...rest } = c;
    setForm({
      ...rest,
      autoOffset: rest.autoOffset ?? 20,
      linksMode: rest.linksMode ?? "manual",
      links: { youtube: "", instagram: "", telegram: "", facebook: "", tiktok: "", ...rest.links },
    });
  };

  const handleSaveEdit = (id: string) => {
    const resolvedLinks = form.linksMode === "auto" ? { ...defaultLinks } : form.links;
    persist(classes.map((c) => (c.id === id ? { ...form, links: resolvedLinks, id } : c)));
    setEditing(null);
    setForm(emptyForm());
    toast.success(t.updated);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  const handleDefaultLinksChange = (key: string, value: string) => {
    const updated = { ...defaultLinks, [key]: value };
    setDefaultLinksState(updated);
    saveDefaultLinks(updated);
  };

  const dayLabel = (d: string) => t[d as keyof typeof t] || (d.charAt(0).toUpperCase() + d.slice(1));

  const ClassForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-3">
      {/* Cancelled toggle - first and prominent */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
        <Switch
          checked={form.isCancelled}
          onCheckedChange={(v) => setForm({ ...form, isCancelled: v })}
          className="scale-125"
        />
        <label className="text-sm font-medium text-foreground">{t.cancelled}</label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.titleDe}</label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.titleEn}</label>
          <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.titleAr}</label>
          <Input dir="rtl" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.descDe}</label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.descEn}</label>
          <Input value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.descAr}</label>
          <Input dir="rtl" value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t.day}</label>
        <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
          <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DAYS.map((d) => <SelectItem key={d} value={d}>{dayLabel(d)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Timing section */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.timing}</label>
            <Select value={form.timingMode} onValueChange={(v: "auto" | "manual") => setForm({ ...form, timingMode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t.autoLabel}</SelectItem>
                <SelectItem value="manual">{t.manual}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.timingMode === "manual" && (
            <>
              <Time24Input label={t.startTime} value={form.manualStart || "19:00"} onChange={(v) => setForm({ ...form, manualStart: v })} />
              <Time24Input label={t.endTime} value={form.manualEnd || "20:00"} onChange={(v) => setForm({ ...form, manualEnd: v })} />
            </>
          )}
        </div>
        {form.timingMode === "auto" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.offsetLabel}</label>
            <Select
              value={String(form.autoOffset ?? 20)}
              onValueChange={(v) => setForm({ ...form, autoOffset: Number(v) })}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 19 }, (_, i) => i * 5).map((v) => (
                  <SelectItem key={v} value={String(v)}>{v} {t.minutes}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Social links section */}
      <div className="space-y-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.socialLinks}</label>
          <Select value={form.linksMode || "auto"} onValueChange={(v: "auto" | "manual") => setForm({ ...form, linksMode: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{t.socialAuto}</SelectItem>
              <SelectItem value="manual">{t.socialManual}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.linksMode === "manual" && (
          <div className="grid grid-cols-5 gap-2">
            {SOCIAL_KEYS.map((key) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground capitalize">{key}</label>
                <Input
                  value={form.links[key] || ""}
                  placeholder="URL"
                  onChange={(e) => setForm({ ...form, links: { ...form.links, [key]: e.target.value } })}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit}><Check className="w-4 h-4 mr-1" /> {submitLabel}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); cancelEdit(); }}>
          <X className="w-4 h-4 mr-1" /> {t.cancel}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t.classes}</h1>
        <Button size="sm" onClick={() => { setShowAdd(true); setForm(emptyForm()); }}>
          <Plus className="w-4 h-4 mr-1" /> {t.newClass}
        </Button>
      </div>

      {/* Default social links card */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div>
            <h3 className="font-medium text-foreground text-sm">{t.defaultLinksLabel}</h3>
            <p className="text-xs text-muted-foreground">{t.defaultLinksDesc}</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {SOCIAL_KEYS.map((key) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground capitalize">{key}</label>
                <Input
                  value={defaultLinks[key] || ""}
                  placeholder="URL"
                  onChange={(e) => handleDefaultLinksChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showAdd && (
        <Card><CardContent className="pt-4"><ClassForm onSubmit={handleAdd} submitLabel={t.add} /></CardContent></Card>
      )}

      <div className="space-y-3">
        {classes.map((c) => (
          <Card key={c.id} className={c.isCancelled ? "opacity-70 border-destructive/30" : ""}>
            <CardContent className="pt-4">
              {editing === c.id ? (
                <ClassForm onSubmit={() => handleSaveEdit(c.id)} submitLabel={t.save} />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className={`font-medium text-foreground ${c.isCancelled ? "line-through" : ""}`}>{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.titleEn} · {c.titleAr}</p>
                    <p className="text-xs text-muted-foreground">{dayLabel(c.day)} · {c.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.timingMode === "manual"
                        ? `${c.manualStart} – ${c.manualEnd}`
                        : `Maghrib +${c.autoOffset ?? 20}${t.minutes} → Isha`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.socialLinks}: {(c.linksMode ?? "manual") === "auto" ? t.socialAuto : t.socialManual}
                    </p>
                    {c.isCancelled && <span className="text-xs text-destructive font-medium">{t.cancelled.toUpperCase()}</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(c)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {classes.length === 0 && (
          <p className="text-center text-muted-foreground py-8">{t.noClasses}</p>
        )}
      </div>
    </div>
  );
};

export default AdminClasses;
