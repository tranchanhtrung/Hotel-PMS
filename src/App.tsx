import React from "react";
import { PmsProvider, usePms } from "./context/PmsContext";
import { Header } from "./components/Header";
import { TapeChart } from "./components/TapeChart/TapeChart";
import { FrontDeskView } from "./components/FrontDesk/FrontDeskView";
import { HousekeepingView } from "./components/Housekeeping/HousekeepingView";
import { ReservationsView } from "./components/Reservations/ReservationsView";
import { NightAuditView } from "./components/NightAudit/NightAuditView";
import { ReportsView } from "./components/Reports/ReportsView";
import { SettingsView } from "./components/Settings/SettingsView";
import { AdminView } from "./components/Admin/AdminView";
import { CheckInModal } from "./components/FrontDesk/CheckInModal";
import { FolioModal } from "./components/FrontDesk/FolioModal";
import { AiInsightsModal } from "./components/AiAssistant/AiInsightsModal";
import { SplitTerminalModal } from "./components/MultiTerminal/SplitTerminalModal";
import { AuthModal } from "./components/AuthModal";
import { AccessDeniedView } from "./components/AccessDeniedView";

function AppContent() {
  const { activeView, loading, canAccessView } = usePms();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading Grand Stay PMS Inventory...</p>
        </div>
      </div>
    );
  }

  const isViewAllowed = canAccessView(activeView);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {!isViewAllowed ? (
          <AccessDeniedView />
        ) : (
          <>
            {activeView === "tape_chart" && <TapeChart />}
            {activeView === "front_desk" && <FrontDeskView />}
            {activeView === "housekeeping" && <HousekeepingView />}
            {activeView === "reservations" && <ReservationsView />}
            {activeView === "reports" && <ReportsView />}
            {activeView === "settings" && <SettingsView />}
            {activeView === "admin" && <AdminView />}
            {activeView === "night_audit" && <NightAuditView />}
          </>
        )}
      </main>

      {/* Global Modals */}
      <CheckInModal />
      <FolioModal />
      <AiInsightsModal />
      <SplitTerminalModal />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <PmsProvider>
      <AppContent />
    </PmsProvider>
  );
}
