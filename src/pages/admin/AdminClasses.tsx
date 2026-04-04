import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { getClasses, saveClasses } from "@/stores/dataStore";
import { ClassItem } from "@/data/classes";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAdminLang } from "./AdminLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const i18n = {
  en: {
    classes: "Classes",
    newClass: "New Class",
    titleDe: "Title (DE)", titleEn: "Title (EN)", titleAr: "Title (AR)",
    descDe: "Description (DE)", descEn: "Description (EN)", descAr: "Description (AR)",
    day: "Day", cancelled: "Cancelled", timing: "Timing",
    autoLabel: "Auto (Maghrib + offset → Isha)",
    manual: "Manual",
    startTime: "Start Time (24h)", endTime: "End Time (24h)",
    offsetLabel: "Offset after Maghrib",
    minutes: "min",
    add: "Add", save: "Save", cancel: "Cancel",
    noClasses: "No classes yet.",
    titleRequired: "German title is required",
    added: "Class added", updated: "Class updated", deleted: "Class deleted",
    monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
    thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
  },
  de: {
    classes: "Unterricht",
    newClass: "Neuer Unterricht",
    titleDe: "Titel (DE)", titleEn: "Titel (EN)", titleAr: "Titel (AR)",
    descDe: "Beschreibung (DE)", descEn: "Beschreibung (EN)", descAr: "Beschreibung (AR)",
    day: "Tag", cancelled: "Abgesagt", timing: "Zeitplanung",
    autoLabel: "Auto (Maghrib + Versatz → Isha)",
    manual: "Manuell",
    startTime: "Startzeit (24h)", endTime: "Endzeit (24h)",
    offsetLabel: "Versatz nach Maghrib",
    minutes: "Min",
    add: "Hinzufügen", save: "Speichern", cancel: "Abbrechen",
    noClasses: "Noch kein Unterricht.",
    titleRequired: "Deutscher Titel ist erforderlich",
    added: "Unterricht hinzugefügt", updated: "Unterricht aktualisiert", deleted: "Unterricht gelöscht",
    monday: "Montag", tuesday: "Dienstag", wednesday: "Mittwoch",
    thursday: "Donnerstag", friday: "Freitag", saturday: "Samstag", sunday: "Sonntag",
  },
};

const emptyForm = (): Omit<ClassItem, "id"> => ({
  title: "", titleEn: "", titleAr: "",
  day: "monday",
  description: "", descriptionEn: "", descriptionAr: "",
  isCancelled: false,
  timingMode: "auto",
  autoOffset: 20,
  manualStart: "",
  manualEnd: "",
  links: { youtube: "", instagram: "", telegram: "", facebook: "", tiktok: "" },
});

const AdminClasses: React.FC = () => {
  const { lang } = useAdminLang();
  const t = i18n[lang];
  const [classes, setClasses] = useState<ClassItem[]>(() => getClasses());
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<ClassItem, "id">>(emptyForm());

  const persist = (updated: ClassItem[]) => {
    setClasses(updated);
    saveClasses(updated);
  };

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error(t.titleRequired); return; }
    const item: ClassItem = { ...form, id: String(Date.now()) };
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
      links: { youtube: "", instagram: "", telegram: "", facebook: "", tiktok: "", ...rest.links },
    });
  };

  const handleSaveEdit = (id: string) => {
    persist(classes.map((c) => (c.id === id ? { ...form, id } : c)));
    setEditing(null);
    setForm(emptyForm());
    toast.success(t.updated);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  const dayLabel = (d: string) => t[d as keyof typeof t] || (d.charAt(0).toUpperCase() + d.slice(1));

  const ClassForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-3">
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
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.day}</label>
          <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => <SelectItem key={d} value={d}>{dayLabel(d)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2 pb-1">
          <label className="text-xs font-medium text-muted-foreground">{t.cancelled}</label>
          <Switch checked={form.isCancelled} onCheckedChange={(v) => setForm({ ...form, isCancelled: v })} />
        </div>
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
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t.startTime}</label>
                <Input type="time" step="60" value={form.manualStart || ""} onChange={(e) => setForm({ ...form, manualStart: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t.endTime}</label>
                <Input type="time" step="60" value={form.manualEnd || ""} onChange={(e) => setForm({ ...form, manualEnd: e.target.value })} />
              </div>
            </>
          )}
        </div>
        {form.timingMode === "auto" && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">{t.offsetLabel}</label>
              <span className="text-sm font-semibold text-foreground">{form.autoOffset ?? 20} {t.minutes}</span>
            </div>
            <Slider
              value={[form.autoOffset ?? 20]}
              onValueChange={([v]) => setForm({ ...form, autoOffset: v })}
              min={0}
              max={90}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0</span>
              <span>30</span>
              <span>60</span>
              <span>90</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {(["youtube", "instagram", "telegram", "facebook", "tiktok"] as const).map((key) => (
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
