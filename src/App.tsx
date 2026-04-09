import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";
import UserAgreement from "@/components/UserAgreement";
import Index from "./pages/Index.tsx";
import PrayerTimes from "./pages/PrayerTimes.tsx";
import Messages from "./pages/Messages.tsx";
import Classes from "./pages/Classes.tsx";
import Settings from "./pages/Settings.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminPrayerTimes from "./pages/admin/AdminPrayerTimes.tsx";
import AdminMessages from "./pages/admin/AdminMessages.tsx";
import AdminClasses from "./pages/admin/AdminClasses.tsx";
import AdminBroadcasts from "./pages/admin/AdminBroadcasts.tsx";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UserAgreement>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* User App */}
              <Route path="/" element={<Index />} />
              <Route path="/prayer-times" element={<PrayerTimes />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="prayer-times" element={<AdminPrayerTimes />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="broadcasts" element={<AdminBroadcasts />} />
                
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <Routes>
              <Route path="/admin/*" element={null} />
              <Route path="*" element={<BottomNav />} />
            </Routes>
          </div>
          </UserAgreement>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
