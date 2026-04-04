import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, Download, Minus, Plus } from "lucide-react";
import { getPrayerTimes, savePrayerTimes, getIqamaSettings, saveIqamaSettings, IqamaSetting, IqamaSettings, computeIqama } from "@/stores/dataStore";
import { PrayerDay } from "@/data/prayerTimes";
import { toast } from "sonner";
import { getHijriCorrection, setHijriCorrection, formatHijriDate } from "@/utils/hijri";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const IQAMA_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const PRAYER_LABELS: Record<string, string> = {
  fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha",
};

function parseCSV(text: string): PrayerDay[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have a header and at least one data row");

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["date", "fajr", "shuruk", "dhuhr", "asr", "maghrib", "isha"];
  const mapping: Record<string, string> = {
    date: "date", fajr: "fajr", shuruk: "shuruk", dhuhr: "dhuhr", asr: "asr", maghrib: "maghrib", isha: "isha",
  };

  for (const r of required) {
    if (!header.includes(r)) throw new Error(`Missing column: ${r}`);
  }

  return lines.slice(1).filter(l => l.trim()).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      if (mapping[h]) row[mapping[h]] = values[i] || "";
    });
    return row as unknown as PrayerDay;
  });
}

function generateSampleCSV(): string {
  return `date,fajr,shuruk,dhuhr,asr,maghrib,isha
2026-04-04,04:30,06:10,13:15,16:45,20:15,22:00
2026-04-05,04:28,06:08,13:15,16:46,20:16,22:01`;
}

const offsetOptions = Array.from({ length: 19 }, (_, i) => i * 5); // 0,5,10,...90

/** 24h time input — uses two selects (HH and MM) to guarantee 24h regardless of browser locale */
const Time24Input: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [hh, mm] = (value || "00:00").split(":").map((s) => s.padStart(2, "0"));
  return (
    <div className="flex gap-1 items-center">
      <select
        className="flex h-9 w-14 rounded-md border border-input bg-background px-1.5 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        value={hh}
        onChange={(e) => onChange(`${e.target.value}:${mm}`)}
      >
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-foreground font-bold">:</span>
      <select
        className="flex h-9 w-14 rounded-md border border-input bg-background px-1.5 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        value={mm}
        onChange={(e) => onChange(`${hh}:${e.target.value}`)}
      >
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
};

const AdminPrayerTimes: React.FC = () => {
  const [data, setData] = useState<PrayerDay[]>(() => getPrayerTimes());
  const [hijriOffset, setHijriOffset] = useState(() => getHijriCorrection());
  const [iqama, setIqama] = useState<IqamaSettings>(() => getIqamaSettings());
  const fileRef = useRef<HTMLInputElement>(null);

  const updateHijriOffset = (delta: number) => {
    const next = Math.max(-3, Math.min(3, hijriOffset + delta));
    setHijriOffset(next);
    setHijriCorrection(next);
    toast.success(`Hijri correction set to ${next > 0 ? "+" : ""}${next} day(s)`);
  };

  const todayHijri = formatHijriDate(new Date(), "en");

  const updateIqamaSetting = (prayer: string, update: Partial<IqamaSetting>) => {
    const next = { ...iqama, [prayer]: { ...iqama[prayer], ...update } };
    setIqama(next);
    saveIqamaSettings(next);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target?.result as string);
        savePrayerTimes(parsed);
        setData(parsed);
        toast.success(`Loaded ${parsed.length} days of prayer times`);
      } catch (err: any) {
        toast.error(err.message || "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClear = () => {
    savePrayerTimes([]);
    setData([]);
    toast.success("Prayer times cleared");
  };

  const handleDownloadSample = () => {
    const blob = new Blob([generateSampleCSV()], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "prayer_times_sample.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Prayer Times</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadSample} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-1" /> Sample CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear} className="w-full sm:w-auto">
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
          <Button size="sm" onClick={() => fileRef.current?.click()} className="w-full sm:w-auto">
            <Upload className="w-4 h-4 mr-1" /> Upload CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Hijri Calendar Correction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => updateHijriOffset(-1)} disabled={hijriOffset <= -3}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-mono text-lg min-w-[3ch] text-center">
                {hijriOffset > 0 ? "+" : ""}{hijriOffset}
              </span>
              <Button size="icon" variant="outline" onClick={() => updateHijriOffset(1)} disabled={hijriOffset >= 3}>
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">day(s)</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Today: <span className="font-semibold text-foreground">{todayHijri}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Adjust if the Hijri date doesn't match your local moon sighting. Range: -3 to +3 days.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Iqama Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Set iqama as minutes after adhan (offset) or a fixed time for each prayer.
          </p>
          {IQAMA_PRAYERS.map((prayer) => {
            const s = iqama[prayer];
            return (
              <div key={prayer} className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium w-20">{PRAYER_LABELS[prayer]}</span>
                <Select
                  value={s.mode}
                  onValueChange={(v) => updateIqamaSetting(prayer, { mode: v as "offset" | "fixed" })}
                >
                  <SelectTrigger className="w-28 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offset">Offset</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
                {s.mode === "offset" ? (
                  <Select
                    value={String(s.offsetMinutes)}
                    onValueChange={(v) => updateIqamaSetting(prayer, { offsetMinutes: Number(v) })}
                  >
                    <SelectTrigger className="w-24 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {offsetOptions.map((m) => (
                        <SelectItem key={m} value={String(m)}>+{m} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={s.fixedTime}
                    onValueChange={(v) => updateIqamaSetting(prayer, { fixedTime: v })}
                  >
                    <SelectTrigger className="w-28 h-9 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeOptions.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{data.length} days loaded</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No prayer times loaded. Upload a CSV file.</p>
          ) : (
            <div className="max-h-[500px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fajr</TableHead>
                    <TableHead>Shuruk</TableHead>
                    <TableHead>Dhuhr</TableHead>
                    <TableHead>Asr</TableHead>
                    <TableHead>Maghrib</TableHead>
                    <TableHead>Isha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 30).map((d) => (
                    <TableRow key={d.date}>
                      <TableCell className="font-mono text-xs">{d.date}</TableCell>
                      <TableCell>{d.fajr}</TableCell>
                      <TableCell>{d.shuruk}</TableCell>
                      <TableCell>{d.dhuhr}</TableCell>
                      <TableCell>{d.asr}</TableCell>
                      <TableCell>{d.maghrib}</TableCell>
                      <TableCell>{d.isha}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.length > 30 && (
                <p className="text-xs text-muted-foreground text-center py-2">Showing first 30 of {data.length} days</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPrayerTimes;
