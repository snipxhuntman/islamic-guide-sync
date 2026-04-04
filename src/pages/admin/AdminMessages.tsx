import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { getMessages, saveMessages } from "@/stores/dataStore";
import { Message } from "@/data/messages";
import { toast } from "sonner";

const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => getMessages());
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ text: "", textEn: "", textAr: "" });

  const persist = (updated: Message[]) => {
    setMessages(updated);
    saveMessages(updated);
  };

  const handleAdd = () => {
    if (!form.text.trim()) { toast.error("German text is required"); return; }
    const msg: Message = {
      id: String(Date.now()),
      text: form.text,
      textEn: form.textEn || undefined,
      textAr: form.textAr || undefined,
      timestamp: new Date().toISOString(),
    };
    persist([msg, ...messages]);
    setForm({ text: "", textEn: "", textAr: "" });
    setShowAdd(false);
    toast.success("Message added");
  };

  const handleDelete = (id: string) => {
    persist(messages.filter((m) => m.id !== id));
    toast.success("Message deleted");
  };

  const startEdit = (m: Message) => {
    setEditing(m.id);
    setForm({ text: m.text, textEn: m.textEn || "", textAr: m.textAr || "" });
  };

  const handleSaveEdit = (id: string) => {
    persist(messages.map((m) =>
      m.id === id ? { ...m, text: form.text, textEn: form.textEn || undefined, textAr: form.textAr || undefined } : m
    ));
    setEditing(null);
    setForm({ text: "", textEn: "", textAr: "" });
    toast.success("Message updated");
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ text: "", textEn: "", textAr: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <Button size="sm" onClick={() => { setShowAdd(true); setForm({ text: "", textEn: "", textAr: "" }); }}>
          <Plus className="w-4 h-4 mr-1" /> New Message
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">German (required)</label>
              <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">English</label>
              <Textarea value={form.textEn} onChange={(e) => setForm({ ...form, textEn: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Arabic</label>
              <Textarea dir="rtl" value={form.textAr} onChange={(e) => setForm({ ...form, textAr: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {messages.map((m) => (
          <Card key={m.id}>
            <CardContent className="pt-4">
              {editing === m.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">German</label>
                    <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">English</label>
                    <Textarea value={form.textEn} onChange={(e) => setForm({ ...form, textEn: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Arabic</label>
                    <Textarea dir="rtl" value={form.textAr} onChange={(e) => setForm({ ...form, textAr: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(m.id)}><Check className="w-4 h-4 mr-1" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground">{m.text}</p>
                    {m.textEn && <p className="text-xs text-muted-foreground">EN: {m.textEn}</p>}
                    {m.textAr && <p className="text-xs text-muted-foreground" dir="rtl">AR: {m.textAr}</p>}
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
          <p className="text-center text-muted-foreground py-8">No messages yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
