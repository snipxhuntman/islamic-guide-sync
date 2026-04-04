import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Check, X, ImagePlus, ChevronUp, ChevronDown, Clock, CalendarDays, Repeat, Infinity } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Broadcast, BroadcastSchedule, ScheduleType, RecurringInterval, getAllBroadcasts } from "@/data/broadcasts";
import { toast } from "sonner";
import { useAdminLang } from "./AdminLayout";

const i18n = {
  en: {
    title: "Homepage Broadcasts",
    desc: "These slides appear on the homepage carousel. Toggle active/inactive per slide.",
    newSlide: "New Slide",
    textDe: "Text (DE)", textEn: "Text (EN)", textAr: "Text (AR)",
    add: "Add", save: "Save", cancel: "Cancel",
    active: "Active",
    addImage: "Add Image", removeImage: "Remove",
    added: "Slide added", updated: "Slide updated", deleted: "Slide deleted",
    noSlides: "No slides yet.",
    textRequired: "German text or image is required",
    link: "Hyperlink (optional)",
    schedule: "Schedule",
    always: "Always visible",
    recurring: "Recurring",
    once: "One-time",
    daily: "Daily", weekly: "Weekly", biweekly: "Every 2 weeks", monthly: "Monthly",
    from: "From", to: "To", at: "at",
    startDate: "Start date", endDate: "End date",
    startTime: "Start time", endTime: "End time",
    interval: "Repeats",
    dayOfWeek: "Day of week",
    endDayOfWeek: "End day",
    dayOfMonth: "Day of month",
    febNote: "Note: February has 28 days (29 in leap years), some months have 30 days.",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
  de: {
    title: "Startseiten-Broadcasts",
    desc: "Diese Folien erscheinen im Karussell auf der Startseite. Aktivieren/deaktivieren pro Folie.",
    newSlide: "Neue Folie",
    textDe: "Text (DE)", textEn: "Text (EN)", textAr: "Text (AR)",
    add: "Hinzufügen", save: "Speichern", cancel: "Abbrechen",
    active: "Aktiv",
    addImage: "Bild hinzufügen", removeImage: "Entfernen",
    added: "Folie hinzugefügt", updated: "Folie aktualisiert", deleted: "Folie gelöscht",
    noSlides: "Noch keine Folien.",
    textRequired: "Deutscher Text oder Bild erforderlich",
    link: "Hyperlink (optional)",
    schedule: "Zeitplan",
    always: "Immer sichtbar",
    recurring: "Wiederkehrend",
    once: "Einmalig",
    daily: "Täglich", weekly: "Wöchentlich", biweekly: "Alle 2 Wochen", monthly: "Monatlich",
    from: "Von", to: "Bis", at: "um",
    startDate: "Startdatum", endDate: "Enddatum",
    startTime: "Startzeit", endTime: "Endzeit",
    interval: "Wiederholung",
    dayOfWeek: "Wochentag",
    endDayOfWeek: "Endtag",
    dayOfMonth: "Tag im Monat",
    febNote: "Hinweis: Februar hat 28 Tage (29 im Schaltjahr), einige Monate haben 30 Tage.",
    days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  },
};

interface FormState {
  text: string;
  textEn: string;
  textAr: string;
  imageUrl: string;
  imageSize: "small" | "medium" | "large" | "full";
  link: string;
  active: boolean;
  scheduleType: ScheduleType;
  recurringInterval: RecurringInterval;
  startDate: string;
  endDate: string;
  startHour: string;
  endHour: string;
  dayOfWeek: string;
  endDayOfWeek: string;
  dayOfMonth: string;
}

const defaultForm: FormState = {
  text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium", link: "", active: true,
  scheduleType: "always", recurringInterval: "daily", startDate: "", endDate: "", startHour: "", endHour: "",
  dayOfWeek: "", endDayOfWeek: "", dayOfMonth: "",
};

function formFromBroadcast(b: Broadcast): FormState {
  return {
    text: b.text, textEn: b.textEn || "", textAr: b.textAr || "", imageUrl: b.imageUrl || "",
    imageSize: b.imageSize || "medium", link: b.link || "", active: b.active,
    scheduleType: b.schedule?.type || "always",
    recurringInterval: b.schedule?.recurringInterval || "daily",
    startDate: b.schedule?.startDate || "",
    endDate: b.schedule?.endDate || "",
    startHour: b.schedule?.startHour || "",
    endHour: b.schedule?.endHour || "",
    dayOfWeek: b.schedule?.dayOfWeek !== undefined ? String(b.schedule.dayOfWeek) : "",
    endDayOfWeek: b.schedule?.endDayOfWeek !== undefined ? String(b.schedule.endDayOfWeek) : "",
    dayOfMonth: b.schedule?.dayOfMonth !== undefined ? String(b.schedule.dayOfMonth) : "",
  };
}

function formToSchedule(f: FormState): BroadcastSchedule | undefined {
  if (f.scheduleType === "always") return { type: "always" };
  const sched: BroadcastSchedule = {
    type: f.scheduleType,
    startHour: f.startHour || undefined,
    endHour: f.endHour || undefined,
  };
  if (f.scheduleType === "recurring") {
    sched.recurringInterval = f.recurringInterval;
    if (f.recurringInterval === "weekly" || f.recurringInterval === "biweekly") {
      sched.dayOfWeek = f.dayOfWeek ? Number(f.dayOfWeek) : undefined;
      sched.endDayOfWeek = f.endDayOfWeek ? Number(f.endDayOfWeek) : undefined;
    }
    if (f.recurringInterval === "monthly") {
      sched.dayOfMonth = f.dayOfMonth ? Number(f.dayOfMonth) : undefined;
    }
  }
  if (f.scheduleType === "once") {
    sched.startDate = f.startDate || undefined;
    sched.endDate = f.endDate || undefined;
  }
  return sched;
}

function saveBroadcasts(data: Broadcast[]) {
  localStorage.setItem("admin-broadcasts", JSON.stringify(data));
}

function formatScheduleLabel(b: Broadcast, t: typeof i18n.en): string {
  if (!b.schedule || b.schedule.type === "always") return `⏳ ${t.always}`;
  const s = b.schedule;
  const parts: string[] = [];
  if (s.type === "recurring") {
    const intervalLabels: Record<RecurringInterval, string> = { daily: t.daily, weekly: t.weekly, biweekly: t.biweekly, monthly: t.monthly };
    parts.push(`🔁 ${intervalLabels[s.recurringInterval || "daily"]}`);
    if ((s.recurringInterval === "weekly" || s.recurringInterval === "biweekly") && s.dayOfWeek !== undefined) {
      parts.push(t.days[s.dayOfWeek]);
      if (s.endDayOfWeek !== undefined) parts.push(`→ ${t.days[s.endDayOfWeek]}`);
    }
    if (s.recurringInterval === "monthly" && s.dayOfMonth !== undefined) {
      parts.push(`${t.dayOfMonth}: ${s.dayOfMonth}`);
    }
  } else {
    parts.push(`📅 ${t.once}`);
    if (s.startDate) parts.push(`${t.from} ${s.startDate}`);
    if (s.endDate) parts.push(`${t.to} ${s.endDate}`);
  }
  if (s.startHour) parts.push(`${t.at} ${s.startHour}`);
  if (s.endHour) parts.push(`→ ${s.endHour}`);
  return parts.join(" · ");
}

const AdminBroadcasts: React.FC = () => {
  const { lang } = useAdminLang();
  const t = i18n[lang];
  const [items, setItems] = useState<Broadcast[]>(() => getAllBroadcasts());
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const persist = (updated: Broadcast[]) => {
    setItems(updated);
    saveBroadcasts(updated);
  };

  const handleImageUpload = (file: File, cb: (url: string) => void) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => cb(reader.result as string);
    reader.readAsDataURL(file);
  };

  const formToBroadcast = (id: string): Broadcast => ({
    id,
    text: form.text,
    textEn: form.textEn || undefined,
    textAr: form.textAr || undefined,
    imageUrl: form.imageUrl || undefined,
    imageSize: form.imageUrl ? form.imageSize : undefined,
    link: form.link || undefined,
    schedule: formToSchedule(form),
    active: form.active,
  });

  const handleAdd = () => {
    if (!form.text.trim() && !form.imageUrl) { toast.error(t.textRequired); return; }
    persist([...items, formToBroadcast(String(Date.now()))]);
    setForm({ ...defaultForm });
    setShowAdd(false);
    toast.success(t.added);
  };

  const handleDelete = (id: string) => {
    persist(items.filter((b) => b.id !== id));
    toast.success(t.deleted);
  };

  const startEdit = (b: Broadcast) => {
    setEditing(b.id);
    setForm(formFromBroadcast(b));
  };

  const handleSaveEdit = (id: string) => {
    persist(items.map((b) => b.id === id ? formToBroadcast(id) : b));
    setEditing(null);
    setForm({ ...defaultForm });
    toast.success(t.updated);
  };

  const toggleActive = (id: string) => {
    persist(items.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const updated = [...items];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    persist(updated);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ ...defaultForm });
  };

  const renderImageUpload = (inputRef: React.RefObject<HTMLInputElement>) => (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file, (url) => setForm((prev) => ({ ...prev, imageUrl: url })));
          e.target.value = "";
        }}
      />
      {form.imageUrl ? (
        <div className="space-y-2">
          <img src={form.imageUrl} alt="Preview" className="max-h-32 rounded-lg border border-border object-contain" />
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-medium text-muted-foreground">Size:</label>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={form.imageSize}
              onChange={(e) => setForm({ ...form, imageSize: e.target.value as "small" | "medium" | "large" | "full" })}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="full">Full Width</option>
            </select>
            <Button size="sm" variant="outline" onClick={() => setForm({ ...form, imageUrl: "" })}>
              <X className="w-3 h-3 mr-1" /> {t.removeImage}
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="w-4 h-4 mr-1" /> {t.addImage}
        </Button>
      )}
    </>
  );

  const renderScheduleForm = () => (
    <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
      <label className="text-xs font-semibold text-foreground flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" /> {t.schedule}
      </label>
      {/* Schedule type selector */}
      <div className="flex flex-wrap gap-1.5">
        {([
          { value: "always" as const, label: t.always, icon: <Infinity className="w-3.5 h-3.5" /> },
          { value: "recurring" as const, label: t.recurring, icon: <Repeat className="w-3.5 h-3.5" /> },
          { value: "once" as const, label: t.once, icon: <CalendarDays className="w-3.5 h-3.5" /> },
        ]).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setForm({ ...form, scheduleType: opt.value })}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              form.scheduleType === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-background border border-input text-foreground hover:bg-accent"
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* Recurring interval */}
      {form.scheduleType === "recurring" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.interval}</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {([
              { value: "daily" as const, label: t.daily },
              { value: "weekly" as const, label: t.weekly },
              { value: "biweekly" as const, label: t.biweekly },
              { value: "monthly" as const, label: t.monthly },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, recurringInterval: opt.value })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  form.recurringInterval === opt.value
                    ? "bg-accent text-accent-foreground"
                    : "bg-background border border-input text-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date & time range for recurring and once */}
      {(form.scheduleType === "recurring" || form.scheduleType === "once") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.startDate}</label>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="text-xs" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.startTime}</label>
            <Input type="time" value={form.startHour} onChange={(e) => setForm({ ...form, startHour: e.target.value })} className="text-xs" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.endDate}</label>
            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="text-xs" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.endTime}</label>
            <Input type="time" value={form.endHour} onChange={(e) => setForm({ ...form, endHour: e.target.value })} className="text-xs" />
          </div>
        </div>
      )}
    </div>
  );

  const renderSlideForm = (onSubmit: () => void, submitLabel: string, inputRef: React.RefObject<HTMLInputElement>) => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
        <label className="text-sm font-medium text-foreground">{t.active}</label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.textDe}</label>
          <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={2} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.textEn}</label>
          <Textarea value={form.textEn} onChange={(e) => setForm({ ...form, textEn: e.target.value })} rows={2} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.textAr}</label>
          <Textarea dir="rtl" value={form.textAr} onChange={(e) => setForm({ ...form, textAr: e.target.value })} rows={2} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t.link}</label>
        <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
      </div>
      {renderScheduleForm()}
      {renderImageUpload(inputRef)}
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.desc}</p>
        </div>
        <Button size="sm" onClick={() => { setShowAdd(true); setForm({ ...defaultForm }); }}>
          <Plus className="w-4 h-4 mr-1" /> {t.newSlide}
        </Button>
      </div>

      {showAdd && (
        <Card><CardContent className="pt-4">{renderSlideForm(handleAdd, t.add, fileRef)}</CardContent></Card>
      )}

      <div className="space-y-3">
        {items.map((b, index) => (
          <Card key={b.id} className={!b.active ? "opacity-50" : ""}>
            <CardContent className="pt-4">
              {editing === b.id ? (
                renderSlideForm(() => handleSaveEdit(b.id), t.save, editFileRef)
              ) : (
                <div className="flex items-start gap-2">
                  {/* Sort buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} onClick={() => moveSlide(index, -1)}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground text-center">{index + 1}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === items.length - 1} onClick={() => moveSlide(index, 1)}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Switch checked={b.active} onCheckedChange={() => toggleActive(b.id)} className="mt-1 shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm text-foreground break-words">{b.text}</p>
                      {b.textEn && <p className="text-xs text-muted-foreground break-words">EN: {b.textEn}</p>}
                      {b.textAr && <p className="text-xs text-muted-foreground break-words" dir="rtl">AR: {b.textAr}</p>}
                      {b.imageUrl && <img src={b.imageUrl} alt="" className="max-h-20 rounded border border-border object-contain mt-1" />}
                      {b.link && <p className="text-xs text-muted-foreground break-words">🔗 {b.link}</p>}
                      <p className="text-xs text-muted-foreground">{formatScheduleLabel(b, t)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(b)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">{t.noSlides}</p>
        )}
      </div>
    </div>
  );
};

export default AdminBroadcasts;
