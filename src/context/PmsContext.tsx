import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  Room,
  RoomType,
  Reservation,
  Folio,
  AuditLog,
  PmsStats,
  ActiveView,
  TerminalMode,
  UserRole,
  UserAccount,
  Housekeeper,
  ReportSubmission,
  RatePeriod,
  ServiceRateItem,
  HotelInfo
} from "../types";

import { Language, translations } from "../i18n/translations";

export const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  {
    id: "usr_admin",
    username: "admin",
    name: "Sarah Jenkins",
    role: "admin",
    title: "General Manager & System Admin",
    department: "Executive Office",
    pin: "1234",
    avatar: "👑",
    allowedViews: ["tape_chart", "front_desk", "housekeeping", "reservations", "reports", "settings", "admin", "night_audit"]
  },
  {
    id: "usr_frontdesk",
    username: "reception",
    name: "Nguyen Van A",
    role: "front_desk",
    title: "Front Desk Supervisor",
    department: "Front Office",
    pin: "1111",
    avatar: "🛎️",
    allowedViews: ["tape_chart", "front_desk", "reservations"]
  },
  {
    id: "usr_housekeeper",
    username: "housekeeper",
    name: "Tran Thi B",
    role: "housekeeper",
    title: "Executive Housekeeper",
    department: "Housekeeping",
    pin: "2222",
    avatar: "🧹",
    allowedViews: ["housekeeping", "tape_chart"]
  },
  {
    id: "usr_attendant",
    username: "attendant",
    name: "Le Van C",
    role: "room_attendant",
    title: "Senior Room Attendant",
    department: "Housekeeping",
    pin: "3333",
    avatar: "🧼",
    allowedViews: ["housekeeping"]
  },
  {
    id: "usr_sales",
    username: "sales",
    name: "Pham Minh D",
    role: "sales",
    title: "Sales & Revenue Manager",
    department: "Sales & Marketing",
    pin: "4444",
    avatar: "📈",
    allowedViews: ["reservations", "tape_chart", "settings", "reports"]
  },
  {
    id: "usr_nightaudit",
    username: "audit",
    name: "Hoang Van E",
    role: "night_audit",
    title: "Night Auditor & Duty Manager",
    department: "Night Audit",
    pin: "5555",
    avatar: "🌙",
    allowedViews: ["night_audit", "reports", "front_desk", "tape_chart"]
  },
  {
    id: "usr_accounting",
    username: "accounting",
    name: "Vo Thi F",
    role: "accounting",
    title: "Chief Accountant & Controller",
    department: "Finance & Accounting",
    pin: "6666",
    avatar: "💼",
    allowedViews: ["reports", "front_desk", "night_audit"]
  }
];

interface PmsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  t: (key: keyof typeof translations.vi) => string;
  hotelInfo: HotelInfo;
  businessDate: string;
  roomTypes: RoomType[];
  ratePeriods: RatePeriod[];
  serviceRates: ServiceRateItem[];
  rooms: Room[];
  housekeepers: Housekeeper[];
  reservations: Reservation[];
  folios: Folio[];
  auditLogs: AuditLog[];
  submittedReports: ReportSubmission[];
  stats: PmsStats;
  loading: boolean;
  isConnected: boolean;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  terminalMode: TerminalMode;
  setTerminalMode: (mode: TerminalMode) => void;
  selectedRoom: Room | null;
  setSelectedRoom: (room: Room | null) => void;
  
  // Auth & Roles
  currentUser: UserAccount;
  userAccounts: UserAccount[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginAsRole: (role: UserRole) => void;
  loginWithCredentials: (username: string, pin: string) => boolean;
  logout: () => void;
  canAccessView: (view: ActiveView) => boolean;
  saveUserAccount: (user: Partial<UserAccount>) => boolean;
  deleteUserAccount: (id: string) => boolean;

  // Modals
  isCheckInModalOpen: boolean;
  setIsCheckInModalOpen: (open: boolean) => void;
  selectedReservationForCheckIn: Reservation | null;
  setSelectedReservationForCheckIn: (res: Reservation | null) => void;
  
  isFolioModalOpen: boolean;
  setIsFolioModalOpen: (open: boolean) => void;
  activeFolioReservation: Reservation | null;
  setActiveFolioReservation: (res: Reservation | null) => void;

  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;

  // Actions
  fetchState: () => Promise<void>;
  updateHotelInfo: (info: Partial<HotelInfo>) => Promise<boolean>;
  deleteRoomType: (id: string) => Promise<boolean>;
  savePhysicalRoom: (data: any) => Promise<boolean>;
  deletePhysicalRoom: (id: string) => Promise<boolean>;
  checkIn: (data: any) => Promise<boolean>;
  checkOut: (data: any) => Promise<boolean>;
  updateHousekeeping: (roomId: string, newStatus: string, housekeeper?: string, notes?: string) => Promise<boolean>;
  bulkAssignHousekeeping: (data: { roomIds: string[]; housekeeper: string; newStatus?: string }) => Promise<boolean>;
  addHousekeeper: (data: { name: string; phone?: string }) => Promise<boolean>;
  updateHousekeeper: (data: { id: string; name?: string; phone?: string; status?: string }) => Promise<boolean>;
  deleteHousekeeper: (id: string) => Promise<boolean>;
  addFolioCharge: (data: any) => Promise<boolean>;
  createReservation: (data: any) => Promise<boolean>;
  updateReservation: (data: any) => Promise<boolean>;
  deleteReservation: (id: string) => Promise<boolean>;
  runNightAudit: () => Promise<boolean>;
  submitReportToDept: (data: any) => Promise<boolean>;
  saveRoomType: (data: any) => Promise<boolean>;
  saveRatePeriod: (data: any) => Promise<boolean>;
  deleteRatePeriod: (id: string) => Promise<boolean>;
  applyRatePeriod: (periodId: string) => Promise<boolean>;
  saveServiceRate: (data: any) => Promise<boolean>;
  deleteServiceRate: (id: string) => Promise<boolean>;
  toggleServiceRate: (id: string) => Promise<boolean>;
  getAiInsights: () => Promise<string>;
}


const PmsContext = createContext<PmsContextType | undefined>(undefined);

export const PmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("pms_lang") as Language) || "vi";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("pms_lang", lang);
  };

  const [theme, setThemeState] = useState<"dark" | "light">(
    () => (localStorage.getItem("pms_theme") as "dark" | "light") || "dark"
  );

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, [theme]);

  const setTheme = (newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    localStorage.setItem("pms_theme", newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const t = (key: keyof typeof translations.vi): string => {
    const dict = translations[language] || translations.vi;
    return dict[key] || translations.vi[key] || key;
  };

  const [hotelInfo, setHotelInfo] = useState<HotelInfo>({
    name: "Grand Stay Hotel & Suites",
    address: "123 Vo Van Kiet Boulevard, District 1, Ho Chi Minh City",
    phone: "+84 28 3822 9999",
    email: "info@grandstayhotel.vn",
    starRating: 4,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    currency: "VND",
    taxRate: 10,
    serviceCharge: 5,
    totalRooms: 72
  });

  const [businessDate, setBusinessDate] = useState<string>("2026-07-30");
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [ratePeriods, setRatePeriods] = useState<RatePeriod[]>([]);
  const [serviceRates, setServiceRates] = useState<ServiceRateItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [folios, setFolios] = useState<Folio[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [submittedReports, setSubmittedReports] = useState<ReportSubmission[]>([]);
  const [stats, setStats] = useState<PmsStats>({
    totalRooms: 72,
    occupiedCount: 0,
    vacantCleanCount: 0,
    vacantDirtyCount: 0,
    oooCount: 0,
    occupancyRate: 0,
    todayRevenue: 0,
    adr: 0,
    revpar: 0
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ActiveView>("tape_chart");
  const [terminalMode, setTerminalMode] = useState<TerminalMode>("front_desk");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Auth & Role Segregation State
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem("pms_user_accounts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_USER_ACCOUNTS;
  });

  const saveUserAccount = useCallback((accountData: Partial<UserAccount>): boolean => {
    setUserAccounts(prev => {
      const existingIdx = prev.findIndex(u => u.id === accountData.id);
      let next: UserAccount[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...accountData } as UserAccount;
      } else {
        const newAcc: UserAccount = {
          id: accountData.id || `usr_${Date.now()}`,
          username: accountData.username || "staff",
          name: accountData.name || "New Staff",
          role: accountData.role || "front_desk",
          title: accountData.title || "Staff Member",
          department: accountData.department || "Front Office",
          pin: accountData.pin || "1234",
          avatar: accountData.avatar || "👤",
          allowedViews: accountData.allowedViews || ["tape_chart", "front_desk"]
        };
        next = [...prev, newAcc];
      }
      localStorage.setItem("pms_user_accounts", JSON.stringify(next));
      return next;
    });
    return true;
  }, []);

  const deleteUserAccount = useCallback((id: string): boolean => {
    setUserAccounts(prev => {
      const next = prev.filter(u => u.id !== id);
      localStorage.setItem("pms_user_accounts", JSON.stringify(next));
      return next;
    });
    return true;
  }, []);
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem("pms_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = DEFAULT_USER_ACCOUNTS.find(a => a.id === parsed.id || a.role === parsed.role);
        if (match) return match;
      } catch (e) {}
    }
    return DEFAULT_USER_ACCOUNTS[0]; // Admin default
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const canAccessView = useCallback((view: ActiveView): boolean => {
    if (!currentUser) return false;
    return currentUser.allowedViews.includes(view);
  }, [currentUser]);

  const loginAsRole = useCallback((role: UserRole) => {
    const account = userAccounts.find(u => u.role === role) || DEFAULT_USER_ACCOUNTS[0];
    setCurrentUser(account);
    localStorage.setItem("pms_user", JSON.stringify(account));
    setIsAuthModalOpen(false);

    // If current activeView is not allowed for this role, switch to their primary allowed view
    if (!account.allowedViews.includes(activeView)) {
      setActiveView(account.allowedViews[0] || "tape_chart");
    }

    // Auto set appropriate terminal mode for room attendant or housekeeper
    if (role === "room_attendant") {
      setTerminalMode("housekeeping");
    } else if (role === "front_desk") {
      setTerminalMode("front_desk");
    }
  }, [userAccounts, activeView]);

  const loginWithCredentials = useCallback((username: string, pin: string): boolean => {
    const match = userAccounts.find(
      u => (u.username.toLowerCase() === username.toLowerCase() || u.name.toLowerCase().includes(username.toLowerCase())) && u.pin === pin
    );
    if (match) {
      setCurrentUser(match);
      localStorage.setItem("pms_user", JSON.stringify(match));
      setIsAuthModalOpen(false);
      if (!match.allowedViews.includes(activeView)) {
        setActiveView(match.allowedViews[0] || "tape_chart");
      }
      return true;
    }
    return false;
  }, [userAccounts, activeView]);

  const logout = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  // Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);

  const [selectedReservationForCheckIn, setSelectedReservationForCheckIn] = useState<Reservation | null>(null);
  const [isFolioModalOpen, setIsFolioModalOpen] = useState<boolean>(false);
  const [activeFolioReservation, setActiveFolioReservation] = useState<Reservation | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Fetch complete PMS state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/pms/state");
      if (!res.ok) throw new Error("Failed to fetch state");
      const data = await res.json();
      if (data.hotelInfo) setHotelInfo(data.hotelInfo);
      setBusinessDate(data.businessDate);
      setRoomTypes(data.roomTypes || []);
      setRatePeriods(data.ratePeriods || []);
      setServiceRates(data.serviceRates || []);
      setRooms(data.rooms || []);
      setHousekeepers(data.housekeepers || []);
      setReservations(data.reservations || []);
      setFolios(data.folios || []);
      setAuditLogs(data.auditLogs || []);
      setSubmittedReports(data.submittedReports || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Fetch State Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect SSE real-time stream
  useEffect(() => {
    fetchState();

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/pms/events");

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "CONNECTED") {
            setIsConnected(true);
            return;
          }

          // Real-time synchronization event triggered from any terminal!
          fetchState();
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.error("SSE setup error", e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchState]);

  // Actions
  const checkIn = async (data: any) => {
    try {
      const res = await fetch("/api/pms/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Check-in failed:", err.error);
        return false;
      }
      await fetchState();
      return true;
    } catch (e) {
      console.error("Checkin error", e);
      return false;
    }
  };

  const checkOut = async (data: any) => {
    try {
      const res = await fetch("/api/pms/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Check-out failed:", err.error);
        return false;
      }
      await fetchState();
      return true;
    } catch (e) {
      console.error("Checkout error", e);
      return false;
    }
  };

  const updateHousekeeping = async (roomId: string, newStatus: string, housekeeper?: string, notes?: string) => {
    try {
      const res = await fetch("/api/pms/housekeeping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, newStatus, housekeeper, notes })
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Housekeeping update error", e);
      return false;
    }
  };

  const bulkAssignHousekeeping = async (data: { roomIds: string[]; housekeeper: string; newStatus?: string }) => {
    try {
      const res = await fetch("/api/pms/housekeeping/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Bulk housekeeping assign error", e);
      return false;
    }
  };

  const addHousekeeper = async (data: { name: string; phone?: string }) => {
    try {
      const res = await fetch("/api/pms/housekeepers/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Add housekeeper error", e);
      return false;
    }
  };

  const updateHousekeeper = async (data: { id: string; name?: string; phone?: string; status?: string }) => {
    try {
      const res = await fetch("/api/pms/housekeepers/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Update housekeeper error", e);
      return false;
    }
  };

  const deleteHousekeeper = async (id: string) => {
    try {
      const res = await fetch("/api/pms/housekeepers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Delete housekeeper error", e);
      return false;
    }
  };

  const addFolioCharge = async (data: any) => {
    try {
      const res = await fetch("/api/pms/folio/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Folio update error", e);
      return false;
    }
  };

  const createReservation = async (data: any) => {
    try {
      const res = await fetch("/api/pms/reservation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Reservation create error", e);
      return false;
    }
  };

  const updateReservation = async (data: any) => {
    try {
      const res = await fetch("/api/pms/reservation/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Reservation update error", e);
      return false;
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      const res = await fetch("/api/pms/reservation/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Reservation delete error", e);
      return false;
    }
  };

  const runNightAudit = async () => {
    try {
      const res = await fetch("/api/pms/night-audit", { method: "POST" });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Night Audit error", e);
      return false;
    }
  };

  const submitReportToDept = async (data: any) => {
    try {
      const res = await fetch("/api/pms/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Submit Report error", e);
      return false;
    }
  };

  const updateHotelInfo = async (data: Partial<HotelInfo>) => {
    try {
      const res = await fetch("/api/pms/hotel-info/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Update hotel info error", e);
      return false;
    }
  };

  const deleteRoomType = async (id: string) => {
    try {
      const res = await fetch("/api/pms/settings/room-types/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Delete room type error", e);
      return false;
    }
  };

  const savePhysicalRoom = async (data: any) => {
    try {
      const res = await fetch("/api/pms/admin/rooms/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Save room inventory error", e);
      return false;
    }
  };

  const deletePhysicalRoom = async (id: string) => {
    try {
      const res = await fetch("/api/pms/admin/rooms/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Delete room error", e);
      return false;
    }
  };

  const saveRoomType = async (data: any) => {
    try {
      const res = await fetch("/api/pms/settings/room-types/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Save room type error", e);
      return false;
    }
  };

  const saveRatePeriod = async (data: any) => {
    try {
      const res = await fetch("/api/pms/settings/rate-periods/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Save rate period error", e);
      return false;
    }
  };

  const deleteRatePeriod = async (id: string) => {
    try {
      const res = await fetch("/api/pms/settings/rate-periods/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Delete rate period error", e);
      return false;
    }
  };

  const applyRatePeriod = async (periodId: string) => {
    try {
      const res = await fetch("/api/pms/settings/apply-period-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId })
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Apply rate period error", e);
      return false;
    }
  };

  const saveServiceRate = async (data: any) => {
    try {
      const res = await fetch("/api/pms/settings/service-rates/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Save service rate error", e);
      return false;
    }
  };

  const deleteServiceRate = async (id: string) => {
    try {
      const res = await fetch("/api/pms/settings/service-rates/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Delete service rate error", e);
      return false;
    }
  };

  const toggleServiceRate = async (id: string) => {
    try {
      const res = await fetch("/api/pms/settings/service-rates/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return false;
      await fetchState();
      return true;
    } catch (e) {
      console.error("Toggle service rate error", e);
      return false;
    }
  };

  const getAiInsights = async () => {
    try {
      const res = await fetch("/api/pms/ai-insights", { method: "POST" });
      const data = await res.json();
      return data.insights || "No response received";
    } catch (e) {
      console.error("AI Insights error", e);
      return "Unable to retrieve AI insights right now.";
    }
  };

  return (
    <PmsContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        toggleTheme,
        t,
        hotelInfo,
        businessDate,
        roomTypes,
        ratePeriods,
        serviceRates,
        rooms,
        housekeepers,
        reservations,
        folios,
        auditLogs,
        submittedReports,
        stats,
        loading,
        isConnected,
        activeView,
        setActiveView,
        terminalMode,
        setTerminalMode,
        selectedRoom,
        setSelectedRoom,
        currentUser,
        userAccounts,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginAsRole,
        loginWithCredentials,
        logout,
        canAccessView,
        saveUserAccount,
        deleteUserAccount,
        isCheckInModalOpen,

        setIsCheckInModalOpen,
        selectedReservationForCheckIn,
        setSelectedReservationForCheckIn,
        isFolioModalOpen,
        setIsFolioModalOpen,
        activeFolioReservation,
        setActiveFolioReservation,
        isAiModalOpen,
        setIsAiModalOpen,
        fetchState,
        updateHotelInfo,
        deleteRoomType,
        savePhysicalRoom,
        deletePhysicalRoom,
        checkIn,
        checkOut,
        updateHousekeeping,
        bulkAssignHousekeeping,
        addHousekeeper,
        updateHousekeeper,
        deleteHousekeeper,
        addFolioCharge,
        createReservation,
        updateReservation,
        deleteReservation,
        runNightAudit,
        submitReportToDept,
        saveRoomType,
        saveRatePeriod,
        deleteRatePeriod,
        applyRatePeriod,
        saveServiceRate,
        deleteServiceRate,
        toggleServiceRate,
        getAiInsights
      }}
    >
      {children}
    </PmsContext.Provider>
  );
};

export const usePms = () => {
  const context = useContext(PmsContext);
  if (!context) throw new Error("usePms must be used within a PmsProvider");
  return context;
};
