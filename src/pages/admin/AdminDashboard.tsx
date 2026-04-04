import React from "react";
import { CalendarDays, MessageSquare, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrayerTimes, getMessages, getClasses } from "@/stores/dataStore";

const AdminDashboard: React.FC = () => {
  const prayerCount = getPrayerTimes().length;
  const messageCount = getMessages().length;
  const classCount = getClasses().length;

  const stats = [
    { label: "Prayer Days Loaded", value: prayerCount, icon: CalendarDays },
    { label: "Broadcast Messages", value: messageCount, icon: MessageSquare },
    { label: "Classes", value: classCount, icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
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
    </div>
  );
};

export default AdminDashboard;
