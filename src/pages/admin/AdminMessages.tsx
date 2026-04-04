import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Check, X, ImagePlus } from "lucide-react";
import { getMessages, saveMessages } from "@/stores/dataStore";
import { Message } from "@/data/messages";
import { toast } from "sonner";
import { useAdminLang } from "./AdminLayout";

const i18n = {
  en: {
    messages: "Messages",
    newMessage: "New Message",
    germanRequired: "German (required)",
    english: "English",
    arabic: "Arabic",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    noMessages: "No messages yet.",
    textRequired: "German text is required",
    added: "Message added",
    updated: "Message updated",
    deleted: "Message deleted",
    addImage: "Add Image",
    removeImage: "Remove Image",
    imagePreview: "Image preview",
    linkUrl: "Link URL",
    linkLabel: "Link Label (DE)",
    linkLabelEn: "Link Label (EN)",
    linkLabelAr: "Link Label (AR)",
  },
  de: {
    messages: "Nachrichten",
    newMessage: "Neue Nachricht",
    germanRequired: "Deutsch (erforderlich)",
    english: "Englisch",
    arabic: "Arabisch",
    add: "Hinzufügen",
    save: "Speichern",
    cancel: "Abbrechen",
    noMessages: "Noch keine Nachrichten.",
    textRequired: "Deutscher Text ist erforderlich",
    added: "Nachricht hinzugefügt",
    updated: "Nachricht aktualisiert",
    deleted: "Nachricht gelöscht",
    addImage: "Bild hinzufügen",
    removeImage: "Bild entfernen",
    imagePreview: "Bildvorschau",
    linkUrl: "Link-URL",
    linkLabel: "Link-Text (DE)",
    linkLabelEn: "Link-Text (EN)",
    linkLabelAr: "Link-Text (AR)",
  },
};

const AdminMessages: React.FC = () => {
  const { lang } = useAdminLang();
  const t = i18n[lang];
  const [messages, setMessages] = useState<Message[]>(() => getMessages());
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", linkUrl: "", linkLabel: "", linkLabelEn: "", linkLabelAr: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const persist = (updated: Message[]) => {
    setMessages(updated);
    saveMessages(updated);
  };

  const handleImageUpload = (file: File, callback: (dataUrl: string) => void) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => callback(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!form.text.trim() && !form.imageUrl) {
      toast.error(t.textRequired);
      return;
    }
    const msg: Message = {
      id: String(Date.now()),
      text: form.text,
      textEn: form.textEn || undefined,
      textAr: form.textAr || undefined,
      imageUrl: form.imageUrl || undefined,
      imageSize: form.imageUrl ? form.imageSize : undefined,
      linkUrl: form.linkUrl || undefined,
      linkLabel: form.linkLabel || undefined,
      linkLabelEn: form.linkLabelEn || undefined,
      linkLabelAr: form.linkLabelAr || undefined,
      timestamp: new Date().toISOString(),
    };
    persist([msg, ...messages]);
    setForm({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", linkUrl: "", linkLabel: "", linkLabelEn: "", linkLabelAr: "" });
    setShowAdd(false);
    toast.success(t.added);
  };

  const handleDelete = (id: string) => {
    persist(messages.filter((m) => m.id !== id));
    toast.success(t.deleted);
  };

  const startEdit = (m: Message) => {
    setEditing(m.id);
    setForm({ text: m.text, textEn: m.textEn || "", textAr: m.textAr || "", imageUrl: m.imageUrl || "", imageSize: m.imageSize || "medium", linkUrl: m.linkUrl || "", linkLabel: m.linkLabel || "", linkLabelEn: m.linkLabelEn || "", linkLabelAr: m.linkLabelAr || "" });
  };

  const handleSaveEdit = (id: string) => {
    persist(messages.map((m) =>
      m.id === id
        ? { ...m, text: form.text, textEn: form.textEn || undefined, textAr: form.textAr || undefined, imageUrl: form.imageUrl || undefined, linkUrl: form.linkUrl || undefined, linkLabel: form.linkLabel || undefined, linkLabelEn: form.linkLabelEn || undefined, linkLabelAr: form.linkLabelAr || undefined }
        : m
    ));
    setEditing(null);
    setForm({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", linkUrl: "", linkLabel: "", linkLabelEn: "", linkLabelAr: "" });
    toast.success(t.updated);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", linkUrl: "", linkLabel: "", linkLabelEn: "", linkLabelAr: "" });
  };

  const renderImageSection = (inputRef: React.RefObject<HTMLInputElement>) => (
    <div className="space-y-2">
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
          <p className="text-xs font-medium text-muted-foreground">{t.imagePreview}</p>
          <img src={form.imageUrl} alt="Preview" className="max-h-40 rounded-lg border border-border object-contain" />
          <Button size="sm" variant="outline" onClick={() => setForm({ ...form, imageUrl: "" })}>
            <X className="w-3 h-3 mr-1" /> {t.removeImage}
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="w-4 h-4 mr-1" /> {t.addImage}
        </Button>
      )}
    </div>
  );

  const renderMessageForm = (onSubmit: () => void, submitLabel: string, inputRef: React.RefObject<HTMLInputElement>) => (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t.germanRequired}</label>
        <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t.english}</label>
        <Textarea value={form.textEn} onChange={(e) => setForm({ ...form, textEn: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t.arabic}</label>
        <Textarea dir="rtl" value={form.textAr} onChange={(e) => setForm({ ...form, textAr: e.target.value })} />
      </div>
      {renderImageSection(inputRef)}
      {/* Hyperlink fields */}
      <div className="space-y-2 border-t border-border pt-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.linkUrl}</label>
          <Input value={form.linkUrl} placeholder="https://..." onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
        </div>
        {form.linkUrl && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.linkLabel}</label>
              <Input value={form.linkLabel} placeholder="Mehr erfahren" onChange={(e) => setForm({ ...form, linkLabel: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.linkLabelEn}</label>
              <Input value={form.linkLabelEn} placeholder="Learn more" onChange={(e) => setForm({ ...form, linkLabelEn: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.linkLabelAr}</label>
              <Input dir="rtl" value={form.linkLabelAr} placeholder="اقرأ المزيد" onChange={(e) => setForm({ ...form, linkLabelAr: e.target.value })} />
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit}>
          <Check className="w-4 h-4 mr-1" /> {submitLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); cancelEdit(); }}>
          <X className="w-4 h-4 mr-1" /> {t.cancel}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t.messages}</h1>
        <Button size="sm" onClick={() => { setShowAdd(true); setForm({ text: "", textEn: "", textAr: "", imageUrl: "", imageSize: "medium" as "small" | "medium" | "large" | "full", linkUrl: "", linkLabel: "", linkLabelEn: "", linkLabelAr: "" }); }}>
          <Plus className="w-4 h-4 mr-1" /> {t.newMessage}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-4">
            {renderMessageForm(handleAdd, t.add, fileInputRef)}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {messages.map((m) => (
          <Card key={m.id}>
            <CardContent className="pt-4">
              {editing === m.id ? (
                renderMessageForm(() => handleSaveEdit(m.id), t.save, editFileInputRef)
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground">{m.text}</p>
                    {m.textEn && <p className="text-xs text-muted-foreground">EN: {m.textEn}</p>}
                    {m.textAr && <p className="text-xs text-muted-foreground" dir="rtl">AR: {m.textAr}</p>}
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="Attached" className="max-h-32 rounded-lg border border-border object-contain mt-1" />
                    )}
                    <p className="text-[10px] text-muted-foreground">{new Date(m.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(m)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground py-8">{t.noMessages}</p>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
