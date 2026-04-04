import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, Download, Minus, Plus } from "lucide-react";
import { getPrayerTimes, savePrayerTimes } from "@/stores/dataStore";
import { PrayerDay } from "@/data/prayerTimes";
import { toast } from "sonner";
import { getHijriCorrection, setHijriCorrection, formatHijriDate } from "@/utils/hijri";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function parseCSV(text: string): PrayerDay[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have a header and at least one data row");

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["date", "fajr", "fajriqama", "shuruk", "dhuhr", "dhuhriqama", "asr", "asriqama", "maghrib", "maghribiqama", "isha", "ishaiqama"];
  const mapping: Record<string, string> = {
    date: "date", fajr: "fajr", fajriqama: "fajrIqama", shuruk: "shuruk",
    dhuhr: "dhuhr", dhuhriqama: "dhuhrIqama", asr: "asr", asriqama: "asrIqama",
    maghrib: "maghrib", maghribiqama: "maghribIqama", isha: "isha", ishaiqama: "ishaIqama",
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
  return `date,fajr,fajriqama,shuruk,dhuhr,dhuhriqama,asr,asriqama,maghrib,maghribiqama,isha,ishaiqama
2026-04-04,04:30,04:45,06:10,13:15,13:30,16:45,17:00,20:15,20:20,22:00,22:15
2026-04-05,04:28,04:45,06:08,13:15,13:30,16:46,17:01,20:16,20:21,22:01,22:16`;
}

const AdminPrayerTimes: React.FC = () => {
  const [data, setData] = useState<PrayerDay[]>(() => getPrayerTimes());
  const [hijriOffset, setHijriOffset] = useState(() => getHijriCorrection());
  const fileRef = useRef<HTMLInputElement>(null);

  const updateHijriOffset = (delta: number) => {
    const next = Math.max(-3, Math.min(3, hijriOffset + delta));
    setHijriOffset(next);
    setHijriCorrection(next);
    toast.success(`Hijri correction set to ${next > 0 ? "+" : ""}${next} day(s)`);
  };

  const todayHijri = formatHijriDate(new Date(), "en");

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Prayer Times</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadSample}>
            <Download className="w-4 h-4 mr-1" /> Sample CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
          <Button size="sm" onClick={() => fileRef.current?.click()}>
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
                    <TableHead>Iqama</TableHead>
                    <TableHead>Shuruk</TableHead>
                    <TableHead>Dhuhr</TableHead>
                    <TableHead>Iqama</TableHead>
                    <TableHead>Asr</TableHead>
                    <TableHead>Iqama</TableHead>
                    <TableHead>Maghrib</TableHead>
                    <TableHead>Iqama</TableHead>
                    <TableHead>Isha</TableHead>
                    <TableHead>Iqama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 30).map((d) => (
                    <TableRow key={d.date}>
                      <TableCell className="font-mono text-xs">{d.date}</TableCell>
                      <TableCell>{d.fajr}</TableCell>
                      <TableCell>{d.fajrIqama}</TableCell>
                      <TableCell>{d.shuruk}</TableCell>
                      <TableCell>{d.dhuhr}</TableCell>
                      <TableCell>{d.dhuhrIqama}</TableCell>
                      <TableCell>{d.asr}</TableCell>
                      <TableCell>{d.asrIqama}</TableCell>
                      <TableCell>{d.maghrib}</TableCell>
                      <TableCell>{d.maghribIqama}</TableCell>
                      <TableCell>{d.isha}</TableCell>
                      <TableCell>{d.ishaIqama}</TableCell>
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
