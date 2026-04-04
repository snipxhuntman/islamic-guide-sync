import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { getClasses, saveClasses } from "@/stores/dataStore";
import { ClassItem } from "@/data/classes";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const emptyForm = (): Omit<ClassItem, "id"> => ({
  title: "", titleEn: "", titleAr: "",
  day: "monday",
  description: "", descriptionEn: "", descriptionAr: "",
  isCancelled: false,
  timingMode: "auto",
  manualStart: "",
  manualEnd: "",
  links: { youtube: "", instagram: "", telegram: "", facebook: "", tiktok: "" },
});

const AdminClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>(() => getClasses());
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<ClassItem, "id">>(emptyForm());

  const persist = (updated: ClassItem[]) => {
    setClasses(updated);
    saveClasses(updated);
  };

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error("German title is required"); return; }
    const item: ClassItem = { ...form, id: String(Date.now()) };
    persist([...classes, item]);
    setForm(emptyForm());
    setShowAdd(false);
    toast.success("Class added");
  };

  const handleDelete = (id: string) => {
    persist(classes.filter((c) => c.id !== id));
    toast.success("Class deleted");
  };

  const startEdit = (c: ClassItem) => {
    setEditing(c.id);
    const { id, ...rest } = c;
    setForm({ ...rest, links: { youtube: "", instagram: "", telegram: "", facebook: "", tiktok: "", ...rest.links } });
  };

  const handleSaveEdit = (id: string) => {
    persist(classes.map((c) => (c.id === id ? { ...form, id } : c)));
    setEditing(null);
    setForm(emptyForm());
    toast.success("Class updated");
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  const ClassForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Title (DE)</label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Title (EN)</label>
          <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Title (AR)</label>
          <Input dir="rtl" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Description (DE)</label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Description (EN)</label>
          <Input value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Description (AR)</label>
          <Input dir="rtl" value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Day</label>
          <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2 pb-1">
          <label className="text-xs font-medium text-muted-foreground">Cancelled</label>
          <Switch checked={form.isCancelled} onCheckedChange={(v) => setForm({ ...form, isCancelled: v })} />
        </div>
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
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Classes</h1>
        <Button size="sm" onClick={() => { setShowAdd(true); setForm(emptyForm()); }}>
          <Plus className="w-4 h-4 mr-1" /> New Class
        </Button>
      </div>

      {showAdd && (
        <Card><CardContent className="pt-4"><ClassForm onSubmit={handleAdd} submitLabel="Add" /></CardContent></Card>
      )}

      <div className="space-y-3">
        {classes.map((c) => (
          <Card key={c.id} className={c.isCancelled ? "opacity-70 border-destructive/30" : ""}>
            <CardContent className="pt-4">
              {editing === c.id ? (
                <ClassForm onSubmit={() => handleSaveEdit(c.id)} submitLabel="Save" />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className={`font-medium text-foreground ${c.isCancelled ? "line-through" : ""}`}>{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.titleEn} · {c.titleAr}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.day} · {c.description}</p>
                    {c.isCancelled && <span className="text-xs text-destructive font-medium">CANCELLED</span>}
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
          <p className="text-center text-muted-foreground py-8">No classes yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminClasses;
