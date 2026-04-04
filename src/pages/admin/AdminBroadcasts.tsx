import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Check, X, ImagePlus, ChevronUp, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Broadcast, getAllBroadcasts } from "@/data/broadcasts";
import { toast } from "sonner";
import { useAdminLang } from "./AdminLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  },
};

function saveBroadcasts(data: Broadcast[]) {
  localStorage.setItem("admin-broadcasts", JSON.stringify(data));
}

const AdminBroadcasts: React.FC = () => {
  const { lang } = useAdminLang();
  const t = i18n[lang];
  const [items, setItems] = useState<Broadcast[]>(() => getAllBroadcasts());
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", link: "", active: true });
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

  const handleAdd = () => {
    if (!form.text.trim() && !form.imageUrl) { toast.error(t.textRequired); return; }
    const item: Broadcast = {
      id: String(Date.now()),
      text: form.text,
      textEn: form.textEn || undefined,
      textAr: form.textAr || undefined,
      imageUrl: form.imageUrl || undefined,
      imageSize: form.imageUrl ? form.imageSize : undefined,
      link: form.link || undefined,
      active: form.active,
    };
    persist([...items, item]);
    setForm({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", link: "", active: true });
    setShowAdd(false);
    toast.success(t.added);
  };

  const handleDelete = (id: string) => {
    persist(items.filter((b) => b.id !== id));
    toast.success(t.deleted);
  };

  const startEdit = (b: Broadcast) => {
    setEditing(b.id);
    setForm({ text: b.text, textEn: b.textEn || "", textAr: b.textAr || "", imageUrl: b.imageUrl || "", imageSize: b.imageSize || "medium", link: b.link || "", active: b.active });
  };

  const handleSaveEdit = (id: string) => {
    persist(items.map((b) =>
      b.id === id
        ? { ...b, text: form.text, textEn: form.textEn || undefined, textAr: form.textAr || undefined, imageUrl: form.imageUrl || undefined, imageSize: form.imageUrl ? form.imageSize : undefined, active: form.active }
        : b
    ));
    setEditing(null);
    setForm({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", active: true });
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
    setForm({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", active: true });
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
          <div className="flex items-center gap-2">
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
        <Button size="sm" onClick={() => { setShowAdd(true); setForm({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", active: true }); }}>
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
