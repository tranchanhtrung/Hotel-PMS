import React from "react";
import { usePms } from "../context/PmsContext";
import { formatVND } from "../utils/formatters";
import {
  Hotel,
  Calendar,
  Sparkles,
  UserCheck,
  Zap,
  LayoutGrid,
  ShieldAlert,
  CalendarDays,
  Smartphone,
  Columns2,
  Clock,
  FileText,
  Sliders,
  Globe,
  Lock,
  User,
  ShieldCheck,
  Building2,
  Sun,
  Moon
} from "lucide-react";
import { ActiveView, TerminalMode } from "../types";

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    t,
    businessDate,
    stats,
    isConnected,
    activeView,
    setActiveView,
    terminalMode,
    setTerminalMode,
    setIsCheckInModalOpen,
    setSelectedReservationForCheckIn,
    setIsAiModalOpen,
    runNightAudit,
    currentUser,
    setIsAuthModalOpen,
    canAccessView
  } = usePms();

  const handleQuickWalkIn = () => {
    setSelectedReservationForCheckIn(null);
    setIsCheckInModalOpen(true);
  };

  const navItems: { id: ActiveView; labelKey: any; defaultLabel: string; icon: React.ReactNode }[] = [
    { id: "tape_chart", labelKey: "tapeChart", defaultLabel: "Rack View / Tape Chart", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "front_desk", labelKey: "frontDesk", defaultLabel: "Front Desk & Folios", icon: <UserCheck className="w-4 h-4" /> },
    { id: "housekeeping", labelKey: "housekeeping", defaultLabel: "Housekeeping", icon: <Zap className="w-4 h-4" /> },
    { id: "reservations", labelKey: "bookingsOta", defaultLabel: "Bookings & OTA", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "reports", labelKey: "reports", defaultLabel: "Reports & Audit", icon: <FileText className="w-4 h-4" /> },
    { id: "settings", labelKey: "settings", defaultLabel: "Room & Period Rates", icon: <Sliders className="w-4 h-4" /> },
    { id: "admin", labelKey: "admin", defaultLabel: "Admin Setup", icon: <Building2 className="w-4 h-4" /> },
    { id: "night_audit", labelKey: "nightAudit", defaultLabel: "Night Audit & Logs", icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  const getRoleLabelKey = (role: string) => {
    switch (role) {
      case "admin": return "roleAdmin";
      case "front_desk": return "roleFrontDesk";
      case "housekeeper": return "roleHousekeeper";
      case "room_attendant": return "roleRoomAttendant";
      case "sales": return "roleSales";
      case "night_audit": return "roleNightAudit";
      case "accounting": return "roleAccounting";
      default: return role;
    }
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top bar: Stats & Real-Time Sync status */}
      <div className="max-w-7xl mx-auto px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Hotel className="w-5 h-5 text-amber-500" />
            <span>{t("hotelName")}</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              {t("roomsEconomy")}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{t("businessDate")}:</span>
            <span className="font-mono font-medium text-amber-200">{businessDate}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{t("checkInTimeHeader")}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Logged in User Badge & Switch Role */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            id="btn-user-role-badge"
            title="Click to Switch Staff Account or Permission Role"
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 text-slate-100 px-2.5 py-1 rounded-lg border border-amber-500/40 shadow-sm transition group cursor-pointer"
          >
            <span className="text-base leading-none">{currentUser?.avatar}</span>
            <div className="text-left leading-tight">
              <div className="font-semibold text-amber-300 text-[11px] group-hover:text-amber-200 flex items-center gap-1">
                <span>{currentUser?.name}</span>
                <span className="text-[9px] bg-slate-900 text-slate-300 px-1 py-0.2 rounded border border-slate-700 font-mono uppercase">
                  {currentUser?.role}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[130px] hidden sm:block">
                {t(getRoleLabelKey(currentUser?.role || "admin"))}
              </div>
            </div>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded ml-1 group-hover:bg-amber-400 transition">
              {t("switchRoleBtn")}
            </span>
          </button>

          {/* Language Selector Toggle */}
          <button
            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
            id="btn-language-toggle"
            title="Switch Language / Chuyển Đổi Ngôn Ngữ"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-2.5 py-1 rounded-md border border-slate-700 text-xs transition shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}</span>
          </button>

          {/* Theme Mode Toggle */}
          <button
            onClick={toggleTheme}
            id="btn-theme-toggle"
            title={language === "vi" ? "Chuyển giao diện sáng/tối" : "Toggle Light/Dark Theme"}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-2.5 py-1 rounded-md border border-slate-700 text-xs transition shadow-sm cursor-pointer"
          >
            {theme === "light" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{t("lightMode")}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>{t("darkMode")}</span>
              </>
            )}
          </button>

          {/* Realtime Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
            <span className="text-[11px] text-slate-300">
              {isConnected ? t("realTimeSync") : "Connecting..."}
            </span>
          </div>

          {/* Quick Metrics Header Stats */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-800/60 px-3 py-1 rounded-md text-slate-300">
            <div>
              Occ: <span className="text-emerald-400 font-semibold">{stats.occupancyRate}%</span> ({stats.occupiedCount}/72)
            </div>
            <div className="text-slate-600">|</div>
            <div>
              ADR: <span className="text-amber-300 font-semibold">{formatVND(stats.adr)}</span>
            </div>
            <div className="text-slate-600">|</div>
            <div>
              RevPAR: <span className="text-sky-300 font-semibold">{formatVND(stats.revpar)}</span>
            </div>
          </div>

          {/* AI Briefing Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            id="btn-ai-insights"
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold px-3 py-1 rounded-md transition shadow-sm text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("aiBriefing")}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar & Controls */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const isAllowed = canAccessView(item.id);

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  isActive
                    ? "bg-slate-800 text-amber-400 border border-slate-700 shadow-inner"
                    : isAllowed
                    ? "text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                    : "text-slate-500 hover:text-slate-400 bg-slate-950/40 opacity-70"
                }`}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
                {!isAllowed && (
                  <Lock className="w-3 h-3 text-rose-400 ml-0.5" title="Access Restricted for current role" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action controls & Terminal Mode Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Terminal Mode Selector */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setTerminalMode("front_desk")}
              title="Front Desk Terminal"
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                terminalMode === "front_desk" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("deskMode")}</span>
            </button>
            <button
              onClick={() => {
                setTerminalMode("housekeeping");
                setActiveView("housekeeping");
              }}
              title="Housekeeping Tablet View"
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                terminalMode === "housekeeping" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("maidTablet")}</span>
            </button>
            <button
              onClick={() => setTerminalMode("split_terminal")}
              title="Multi-Terminal Live Simulator"
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                terminalMode === "split_terminal" ? "bg-sky-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("liveMultiTerminal")}</span>
            </button>
          </div>

          {/* Quick Walk-In Button */}
          <button
            onClick={handleQuickWalkIn}
            id="btn-quick-walkin"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            <span>{t("walkInCheckIn")}</span>
          </button>

          {/* Quick Night Audit Runner */}
          <button
            onClick={async () => {
              if (confirm(`Run Night Audit for business date ${businessDate}? This will auto-post room charges and advance date to next day.`)) {
                await runNightAudit();
              }
            }}
            id="btn-quick-nightaudit"
            className="hidden lg:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("auditButton")}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
