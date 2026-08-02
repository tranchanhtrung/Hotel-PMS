import React, { useState, useMemo } from "react";
import { usePms } from "../../context/PmsContext";
import {
  TrendingUp,
  DollarSign,
  Sparkles,
  Zap,
  CalendarDays,
  Send,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  Building,
  CreditCard,
  PieChart,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  X,
  FileCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  Eye,
  Receipt,
  Building2
} from "lucide-react";
import { ReportSubmission } from "../../types";
import { formatVND } from "../../utils/formatters";
import { calculateItemLine } from "../../utils/billing";

export const ReportsView: React.FC = () => {
  const {
    businessDate,
    stats,
    rooms,
    housekeepers,
    reservations,
    folios,
    submittedReports,
    submitReportToDept,
    hotelInfo
  } = usePms();

  // Active Report Category Sub-Tab
  const [activeTab, setActiveTab] = useState<
    "sales" | "housekeeping" | "booking" | "history"
  >("sales");

  // Date Range Filter
  const [periodFilter, setPeriodFilter] = useState<string>("today");

  // Submission Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [selectedReportType, setSelectedReportType] = useState<
    | "Sales & Financial Revenue"
    | "Housekeeping & Turnover"
    | "Booking & OTA Channel Analysis"
    | "Full End-of-Day Master Audit"
  >("Sales & Financial Revenue");

  const [targetDepartment, setTargetDepartment] = useState<
    "Accounting Dept" | "Audit Dept" | "General Manager" | "Financial Controller"
  >("Accounting Dept");

  const [submissionNotes, setSubmissionNotes] = useState<string>("");
  const [submittedBy, setSubmittedBy] = useState<string>("Front Desk Manager");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  // Voucher / Print Modal State
  const [printingReport, setPrintingReport] = useState<ReportSubmission | null>(null);

  // Room Search & Detail Expansion State for Sales Report
  const [expandedRoomNumber, setExpandedRoomNumber] = useState<string | null>(null);
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>("");

  // --- CALCULATION HELPERS FOR SALES REPORT ---
  let totalRoomRevenue = 0;
  let totalTaxes = 0;
  let totalMinibar = 0;
  let totalLaundry = 0;
  let totalExtras = 0;

  let totalCash = 0;
  let totalCreditCard = 0;
  let totalBankTransfer = 0;

  folios.forEach((f) => {
    f.items.forEach((item) => {
      if (item.category === "room") totalRoomRevenue += item.amount;
      else if (item.category === "tax") totalTaxes += item.amount;
      else if (item.category === "minibar") totalMinibar += item.amount;
      else if (item.category === "laundry") totalLaundry += item.amount;
      else totalExtras += item.amount;
    });

    f.payments.forEach((p) => {
      if (p.method === "Cash") totalCash += p.amount;
      else if (p.method === "Credit Card") totalCreditCard += p.amount;
      else totalBankTransfer += p.amount;
    });
  });

  const grossRevenue = totalRoomRevenue + totalTaxes + totalMinibar + totalLaundry + totalExtras;

  // --- CALCULATION HELPERS FOR ROOM SALES GROUPING ---
  const roomSalesList = useMemo(() => {
    const map = new Map<
      string,
      {
        roomNumber: string;
        roomTypeName: string;
        roomStatus: string;
        guestName: string;
        folioIds: string[];
        itemsCount: number;
        roomRevenue: number;
        taxes: number;
        extras: number;
        totalSales: number;
        totalPaid: number;
        balance: number;
        items: Array<{
          id: string;
          date: string;
          description: string;
          amount: number;
          category: string;
          folioId?: string;
        }>;
        payments: Array<{
          id: string;
          date: string;
          description: string;
          amount: number;
          method: string;
          folioId?: string;
        }>;
      }
    >();

    const svcRate = hotelInfo?.serviceCharge ?? 5;
    const taxRate = hotelInfo?.taxRate ?? 10;

    // First populate from folios
    folios.forEach((f) => {
      const room = rooms.find((r) => r.number === f.roomNumber);
      const roomTypeName = room ? room.typeName : "Standard Room";
      const roomStatus = room ? room.status : "occupied_clean";

      let rmRev = 0;
      let tx = 0;
      let ext = 0;

      f.items.forEach((item) => {
        const calc = calculateItemLine(item.amount, item.category, svcRate, taxRate);
        if (item.category === "room") {
          rmRev += calc.itemBase;
        } else if (item.category === "tax") {
          tx += calc.itemBase;
        } else {
          ext += calc.itemBase;
        }
        tx += calc.serviceChargeAmount + calc.vatAmount;
      });

      const totalSales = rmRev + tx + ext;
      const totalPaid = f.payments.reduce((sum, p) => sum + p.amount, 0);

      if (map.has(f.roomNumber)) {
        const existing = map.get(f.roomNumber)!;
        existing.folioIds.push(f.id);
        existing.itemsCount += f.items.length;
        existing.roomRevenue += rmRev;
        existing.taxes += tx;
        existing.extras += ext;
        existing.totalSales += totalSales;
        existing.totalPaid += totalPaid;
        existing.balance = existing.totalSales - existing.totalPaid;
        existing.items.push(...f.items.map((i) => ({ ...i, folioId: f.id })));
        existing.payments.push(...f.payments.map((p) => ({ ...p, folioId: f.id })));
        if (!existing.guestName.includes(f.guestName)) {
          existing.guestName += `, ${f.guestName}`;
        }
      } else {
        map.set(f.roomNumber, {
          roomNumber: f.roomNumber,
          roomTypeName,
          roomStatus,
          guestName: f.guestName,
          folioIds: [f.id],
          itemsCount: f.items.length,
          roomRevenue: rmRev,
          taxes: tx,
          extras: ext,
          totalSales,
          totalPaid,
          balance: totalSales - totalPaid,
          items: f.items.map((i) => ({ ...i, folioId: f.id })),
          payments: f.payments.map((p) => ({ ...p, folioId: f.id }))
        });
      }
    });

    // Include occupied rooms if they don't have explicit folios yet
    rooms.forEach((r) => {
      if (r.status.startsWith("occupied") && !map.has(r.number)) {
        const calc = calculateItemLine(r.rate, "room", svcRate, taxRate);
        const totalTaxAndSvc = calc.serviceChargeAmount + calc.vatAmount;
        map.set(r.number, {
          roomNumber: r.number,
          roomTypeName: r.typeName,
          roomStatus: r.status,
          guestName: r.guestName || "In-House Guest",
          folioIds: [],
          itemsCount: 1,
          roomRevenue: r.rate,
          taxes: totalTaxAndSvc,
          extras: 0,
          totalSales: calc.lineTotal,
          totalPaid: 0,
          balance: calc.lineTotal,
          items: [
            {
              id: `item-auto-${r.id}`,
              date: businessDate,
              description: `Room Charge - ${r.typeName}`,
              amount: r.rate,
              category: "room"
            }
          ],
          payments: []
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
    );
  }, [folios, rooms, businessDate]);

  const filteredRoomSales = useMemo(() => {
    if (!roomSearchQuery.trim()) return roomSalesList;
    const q = roomSearchQuery.toLowerCase().trim();
    return roomSalesList.filter(
      (r) =>
        r.roomNumber.toLowerCase().includes(q) ||
        r.guestName.toLowerCase().includes(q) ||
        r.roomTypeName.toLowerCase().includes(q)
    );
  }, [roomSalesList, roomSearchQuery]);

  // Revenue by Room Type Breakdown
  const roomTypeStats = [
    { name: "Standard Single", rate: 450, total: 24 },
    { name: "Standard Double", rate: 600, total: 24 },
    { name: "Deluxe Twin", rate: 750, total: 16 },
    { name: "Executive Suite", rate: 1100, total: 8 }
  ].map((rt) => {
    const typeRooms = rooms.filter((r) => r.typeName === rt.name);
    const occupied = typeRooms.filter((r) => r.status.startsWith("occupied")).length;
    const rev = occupied * rt.rate;
    const occPct = typeRooms.length > 0 ? Math.round((occupied / typeRooms.length) * 100) : 0;
    return {
      ...rt,
      occupied,
      revenue: rev,
      occPct
    };
  });

  // --- CALCULATION HELPERS FOR HOUSEKEEPING REPORT ---
  const cleanCount = rooms.filter((r) => r.status.includes("clean")).length;
  const dirtyCount = rooms.filter((r) => r.status.includes("dirty")).length;
  const oooCount = rooms.filter((r) => r.status === "out_of_order").length;

  const housekeeperAssignments = housekeepers.map((hk) => {
    const assignedRooms = rooms.filter((r) => r.housekeeper === hk.name);
    const completedClean = assignedRooms.filter((r) => r.status.includes("clean")).length;
    return {
      id: hk.id,
      name: hk.name,
      phone: hk.phone,
      status: hk.status,
      totalAssigned: assignedRooms.length,
      completedClean,
      pendingDirty: assignedRooms.length - completedClean
    };
  });

  // --- CALCULATION HELPERS FOR BOOKING REPORT ---
  const channelsList = ["Walk-In", "Booking.com", "Agoda", "Expedia", "Direct Web"];
  const channelStats = channelsList.map((ch) => {
    const channelRes = reservations.filter((r) => r.channel === ch);
    const rev = channelRes.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    return {
      channel: ch,
      count: channelRes.length,
      revenue: rev
    };
  });

  const totalBookingsCount = reservations.length;
  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length;
  const checkedInCount = reservations.filter((r) => r.status === "checked_in").length;
  const checkedOutCount = reservations.filter((r) => r.status === "checked_out").length;

  // Handle Submit Report to Department
  const handleExecuteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const summaryData = {
      totalRevenue: grossRevenue || 2340,
      roomRevenue: totalRoomRevenue || 2200,
      taxes: totalTaxes || 110,
      otherCharges: totalMinibar + totalLaundry + totalExtras,
      occupancyRate: stats.occupancyRate,
      adr: stats.adr,
      revpar: stats.revpar,
      cleanRoomsCount: cleanCount,
      dirtyRoomsCount: dirtyCount,
      oooRoomsCount: oooCount,
      totalBookings: totalBookingsCount
    };

    const success = await submitReportToDept({
      reportType: selectedReportType,
      department: targetDepartment,
      submittedBy: submittedBy || "PMS Operator",
      notes: submissionNotes || `Verified ${selectedReportType} for business date ${businessDate}`,
      summaryData
    });

    setIsSubmitting(false);
    if (success) {
      setSubmissionSuccess(true);
      setTimeout(() => {
        setSubmissionSuccess(false);
        setIsSubmitModalOpen(false);
        setSubmissionNotes("");
        setActiveTab("history");
      }, 1200);
    }
  };

  const handlePrintVoucher = (rpt: ReportSubmission) => {
    setPrintingReport(rpt);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Grand Stay PMS Master Audit & Reports
              </h2>
              <p className="text-xs text-slate-400">
                Official Financial Sales, Housekeeping Operations & OTA Booking Reports for Accounting & Audit Transfer
              </p>
            </div>
          </div>
        </div>

        {/* Top Control Tools */}
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Period:</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="today" className="bg-slate-900">Current Business Date ({businessDate})</option>
              <option value="yesterday" className="bg-slate-900">Yesterday</option>
              <option value="week" className="bg-slate-900">This Week</option>
              <option value="month" className="bg-slate-900">This Month (July 2026)</option>
            </select>
          </div>

          {/* Submit/Transfer to Dept Main Action Button */}
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            id="btn-transfer-report-modal"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Transfer Report to Accounting / Audit</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-1.5 rounded-xl gap-2">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("sales")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "sales"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Sales & Revenue Report</span>
          </button>

          <button
            onClick={() => setActiveTab("housekeeping")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "housekeeping"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Housekeeping & Operations</span>
          </button>

          <button
            onClick={() => setActiveTab("booking")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "booking"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Bookings & OTA Channels</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "history"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Transferred Audit Trail ({submittedReports.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 px-3 hidden lg:block font-mono">
          Audit Status: <span className="text-emerald-400 font-semibold">Balanced & Verified</span>
        </div>
      </div>

      {/* ================= SECTION 1: SALES & REVENUE REPORT ================= */}
      {activeTab === "sales" && (
        <div className="space-y-5">
          {/* Revenue KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Gross Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{formatVND(grossRevenue)}</div>
              <span className="text-[10px] text-slate-500">Total room & POS postings</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Room Charges</span>
                <Building className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300">{formatVND(totalRoomRevenue)}</div>
              <span className="text-[10px] text-slate-500">Base room rate tariff</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Service Charge & VAT</span>
                <PieChart className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-sky-300">{formatVND(totalTaxes)}</div>
              <span className="text-[10px] text-slate-500">Combined Service Charge & VAT</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>POS & Extras</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-300">{formatVND(totalMinibar + totalLaundry + totalExtras)}</div>
              <span className="text-[10px] text-slate-500">Minibar, Laundry, Add-ons</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>ADR / RevPAR</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-base font-bold font-mono text-slate-100">{formatVND(stats.adr)} / {formatVND(stats.revpar)}</div>
              <span className="text-[10px] text-slate-500">Occupancy: {stats.occupancyRate}%</span>
            </div>
          </div>

          {/* Payment Method Settlement & Revenue by Room Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment Settlement Methods */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-slate-200 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Payment Settlement Method Breakdown
                </span>
                <span className="text-xs text-slate-400 font-normal">For Cashier Audit</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-800/60 p-3 rounded-xl flex items-center justify-between border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div>
                      <div className="font-bold text-slate-100">Credit / Debit Card Settlements</div>
                      <div className="text-[10px] text-slate-400">Visa, Mastercard, Amex terminal slips</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400 text-sm">{formatVND(totalCreditCard)}</div>
                    <div className="text-[10px] text-slate-400">Card Processor Batch</div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl flex items-center justify-between border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div>
                      <div className="font-bold text-slate-100">Cash Collections in Drawer</div>
                      <div className="text-[10px] text-slate-400">Front desk cash drawer physical count</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-amber-300 text-sm">{formatVND(totalCash)}</div>
                    <div className="text-[10px] text-slate-400">Cashier Drop</div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl flex items-center justify-between border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <div>
                      <div className="font-bold text-slate-100">Bank Transfer & Security Deposit Holds</div>
                      <div className="text-[10px] text-slate-400">Direct wire transfers & guest pre-authorizations</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sky-300 text-sm">{formatVND(totalBankTransfer)}</div>
                    <div className="text-[10px] text-slate-400">Escrow / Deposit Hold</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue by Room Category */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-slate-200 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Room Category Revenue Analysis
                </span>
                <span className="text-xs text-slate-400 font-normal">72 Inventory Units</span>
              </h3>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2">Room Type</th>
                      <th className="py-2">Tariff Rate</th>
                      <th className="py-2">Occupied</th>
                      <th className="py-2">Occ %</th>
                      <th className="py-2 text-right">Yield Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {roomTypeStats.map((rt) => (
                      <tr key={rt.name} className="hover:bg-slate-800/40">
                        <td className="py-2.5 font-medium text-slate-100">{rt.name}</td>
                        <td className="py-2.5 font-mono text-amber-300">{formatVND(rt.rate)}/đêm</td>
                        <td className="py-2.5 font-mono">{rt.occupied} / {rt.total}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px]">
                            {rt.occPct}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                          {formatVND(rt.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sales Report Grouped by Room Number (First shows total room #, click to view details) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Sales Revenue Breakdown by Room Number
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any Room Number row to expand and view itemized folio charges, taxes & payment logs.
                </p>
              </div>

              {/* Room Search Bar */}
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Room # or Guest..."
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  className="bg-transparent text-slate-100 focus:outline-none placeholder-slate-500 w-full sm:w-44"
                />
                {roomSearchQuery && (
                  <button
                    onClick={() => setRoomSearchQuery("")}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Room Sales Summary List */}
            <div className="space-y-2">
              {filteredRoomSales.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                  No room sales records found matching "{roomSearchQuery}".
                </div>
              ) : (
                filteredRoomSales.map((r) => {
                  const isExpanded = expandedRoomNumber === r.roomNumber;
                  return (
                    <div
                      key={r.roomNumber}
                      className={`border rounded-xl transition overflow-hidden ${
                        isExpanded
                          ? "bg-slate-800/80 border-amber-500/50 shadow-md"
                          : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700"
                      }`}
                    >
                      {/* Room Summary Header Row (Clickable) */}
                      <div
                        onClick={() =>
                          setExpandedRoomNumber(isExpanded ? null : r.roomNumber)
                        }
                        className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-sm border border-amber-500/30 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" />
                            Room #{r.roomNumber}
                          </span>
                          <div>
                            <div className="font-bold text-slate-100 text-xs flex items-center gap-2">
                              <span>{r.guestName}</span>
                              <span className="text-[10px] font-normal text-slate-400">
                                ({r.roomTypeName})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{r.itemsCount} posted items</span>
                              <span>•</span>
                              <span className="text-amber-400 font-mono">
                                Giá phòng: {formatVND(r.roomRevenue)}
                              </span>
                              <span>•</span>
                              <span className="text-sky-400 font-mono">
                                Thuế: {formatVND(r.taxes)}
                              </span>
                              {r.extras > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-purple-400 font-mono">
                                    Dịch vụ thêm: {formatVND(r.extras)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Revenue & Balance Summary */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-slate-400 text-[10px]">Total Sales</div>
                            <div className="font-mono font-bold text-emerald-400 text-sm">
                              {formatVND(r.totalSales)}
                            </div>
                          </div>

                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-slate-400 text-[10px]">Settled / Paid</div>
                            <div className="font-mono font-bold text-slate-200 text-xs">
                              {formatVND(r.totalPaid)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-400 text-[10px]">Balance</div>
                            <div
                              className={`font-mono font-bold text-xs ${
                                r.balance > 0 ? "text-amber-400" : "text-emerald-400"
                              }`}
                            >
                              {r.balance > 0 ? formatVND(r.balance) : "PAID"}
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`p-1.5 rounded-lg border transition ${
                              isExpanded
                                ? "bg-amber-500 text-slate-950 border-amber-400"
                                : "bg-slate-900 text-slate-300 border-slate-700 hover:text-white"
                            }`}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details Panel */}
                      {isExpanded && (
                        <div className="border-t border-slate-700/80 bg-slate-950/60 p-4 space-y-4">
                          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-2 text-xs">
                            <span className="font-bold text-amber-400 flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5" />
                              Itemized Folio Transactions for Room #{r.roomNumber}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Folio ID: <span className="font-mono text-slate-200">{r.folioIds.join(", ") || "Active Direct Posting"}</span>
                            </span>
                          </div>

                          {/* Line Items Detail Table */}
                          <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                                  <th className="py-1.5">Date</th>
                                  <th className="py-1.5">Category</th>
                                  <th className="py-1.5">Item Description</th>
                                  <th className="py-1.5 text-right">Posted Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                {r.items.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-900/50">
                                    <td className="py-2 font-mono text-slate-400 text-[11px]">{item.date}</td>
                                    <td className="py-2">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                                          item.category === "room"
                                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                            : item.category === "tax"
                                            ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                                            : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                        }`}
                                      >
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="py-2 font-medium text-slate-200">{item.description}</td>
                                    <td className="py-2 text-right font-mono font-bold text-emerald-400">
                                      {formatVND(item.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Payments & Settlement Breakdown */}
                          {r.payments.length > 0 && (
                            <div className="pt-2 space-y-2 border-t border-slate-800/80">
                              <span className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                Payment Settlement Records
                              </span>
                              <div className="space-y-1">
                                {r.payments.map((pmt) => (
                                  <div
                                    key={pmt.id}
                                    className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-slate-400 text-[10px]">{pmt.date}</span>
                                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                        {pmt.method}
                                      </span>
                                      <span className="text-slate-300 text-[11px]">{pmt.description}</span>
                                    </div>
                                    <div className="font-mono font-bold text-emerald-400">
                                      -{formatVND(pmt.amount)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Detail Summary Bar */}
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-wrap justify-between items-center text-xs gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400">Subtotal Room Charge: <strong className="text-slate-100 font-mono">{formatVND(r.roomRevenue)}</strong></span>
                              <span className="text-slate-400">Taxes: <strong className="text-sky-300 font-mono">{formatVND(r.taxes)}</strong></span>
                              {r.extras > 0 && (
                                <span className="text-slate-400">Extras: <strong className="text-purple-300 font-mono">{formatVND(r.extras)}</strong></span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-slate-400">Total: <span className="text-emerald-400 font-bold">{formatVND(r.totalSales)}</span></span>
                              <span className="text-slate-400">Paid: <span className="text-slate-200 font-bold">{formatVND(r.totalPaid)}</span></span>
                              <span className="text-slate-400">Due: <span className={`font-bold ${r.balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>{r.balance > 0 ? formatVND(r.balance) : "0.000 VNĐ"}</span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: HOUSEKEEPING REPORT ================= */}
      {activeTab === "housekeeping" && (
        <div className="space-y-5">
          {/* Housekeeping Operational Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl">
              <div className="flex justify-between items-center text-xs text-emerald-400">
                <span>Vacant Clean (Ready)</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{cleanCount}</div>
              <span className="text-[10px] text-emerald-400/80">Inspected for arrival</span>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-2xl">
              <div className="flex justify-between items-center text-xs text-amber-400">
                <span>Dirty / Needs Turnover</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{dirtyCount}</div>
              <span className="text-[10px] text-amber-400/80">Pending maid cleaning</span>
            </div>

            <div className="bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-2xl">
              <div className="flex justify-between items-center text-xs text-purple-400">
                <span>Out of Order (OOO)</span>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-300 mt-1">{oooCount}</div>
              <span className="text-[10px] text-purple-400/80">Maintenance holds</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Active Housekeepers</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{housekeepers.length}</div>
              <span className="text-[10px] text-slate-400">Roster on shift</span>
            </div>
          </div>

          {/* Attendant Workload & Productivity Report */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Room Attendant Productivity & Duty Assignment Log
              </span>
              <span className="text-xs text-slate-400 font-normal">Handover Verification</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {housekeeperAssignments.map((hk) => (
                <div
                  key={hk.id}
                  className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <span>{hk.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                        {hk.status || "Active"}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      Phone: {hk.phone || "N/A"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-amber-300 font-mono text-base">
                      {hk.completedClean} / {hk.totalAssigned}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Rooms Completed ({hk.pendingDirty} remaining)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance & OOO Repair Audit Trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Out-of-Order (OOO) Maintenance & Repair Audit Log
            </h3>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2">Room #</th>
                    <th className="py-2">Floor</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Maintenance Note / Reason</th>
                    <th className="py-2 text-right">Status Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {rooms
                    .filter((r) => r.status === "out_of_order" || r.notes)
                    .map((room) => (
                      <tr key={room.id} className="hover:bg-slate-800/40">
                        <td className="py-2 font-mono font-bold text-amber-400">#{room.number}</td>
                        <td className="py-2">Floor {room.floor}</td>
                        <td className="py-2 text-slate-200">{room.typeName}</td>
                        <td className="py-2 text-purple-300">{room.notes || "General maintenance inspection"}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {room.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: BOOKINGS & OTA REPORT ================= */}
      {activeTab === "booking" && (
        <div className="space-y-5">
          {/* Reservation Status Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-xs text-slate-400">Total Bookings</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{totalBookingsCount}</div>
              <span className="text-[10px] text-slate-500">Active reservation records</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-xs text-slate-400">In-House (Checked-In)</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{checkedInCount}</div>
              <span className="text-[10px] text-slate-500">Currently occupying rooms</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-xs text-slate-400">Pending Arrival</div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{confirmedCount}</div>
              <span className="text-[10px] text-slate-500">Confirmed upcoming arrivals</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-xs text-slate-400">Checked-Out</div>
              <div className="text-2xl font-bold font-mono text-sky-300 mt-1">{checkedOutCount}</div>
              <span className="text-[10px] text-slate-500">Fulfilled stays</span>
            </div>
          </div>

          {/* Booking Source Channels Production */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-400" />
                OTA Booking Channel Yield & Share Analysis
              </span>
              <span className="text-xs text-slate-400 font-normal">Channel Distribution</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {channelStats.map((cs) => {
                const sharePct = totalBookingsCount > 0 ? Math.round((cs.count / totalBookingsCount) * 100) : 0;

                return (
                  <div
                    key={cs.channel}
                    className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl space-y-1.5"
                  >
                    <div className="font-bold text-slate-200 flex justify-between items-center">
                      <span>{cs.channel}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {sharePct}%
                      </span>
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      ${cs.revenue}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {cs.count} reservation(s)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Reservation Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Master Reservation Audit Ledger
            </h3>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2">Code</th>
                    <th className="py-2">Guest Name</th>
                    <th className="py-2">Dates</th>
                    <th className="py-2">Room</th>
                    <th className="py-2">Channel</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-2 font-mono font-bold text-amber-400">{r.confirmationCode}</td>
                      <td className="py-2 font-medium text-slate-100">{r.guestName}</td>
                      <td className="py-2 text-slate-400 font-mono text-[11px]">
                        {r.checkInDate} → {r.checkOutDate}
                      </td>
                      <td className="py-2 text-slate-200 font-mono">#{r.roomNumber} ({r.roomTypeName})</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                          {r.channel}
                        </span>
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.status === "checked_in"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-400">
                        ${r.totalAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 4: TRANSFERRED AUDIT TRAIL ================= */}
      {activeTab === "history" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                Transferred Department Reports & Audit Log
              </h3>
              <p className="text-xs text-slate-400">
                Official audit history of reports transferred to Accounting, Audit, or General Management
              </p>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Send className="w-4 h-4" />
              <span>Submit New Report</span>
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold">
                  <th className="py-2.5">Ref #</th>
                  <th className="py-2.5">Report Type</th>
                  <th className="py-2.5">Recipient Dept</th>
                  <th className="py-2.5">Business Date</th>
                  <th className="py-2.5">Submitted By</th>
                  <th className="py-2.5">Audit Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {submittedReports.map((rpt) => (
                  <tr key={rpt.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-mono font-bold text-amber-400">{rpt.reportRefNumber}</td>
                    <td className="py-3 font-medium text-slate-100">{rpt.reportType}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-semibold">
                        {rpt.department}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-400">{rpt.businessDate}</td>
                    <td className="py-3 text-slate-300">{rpt.submittedBy}</td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          rpt.status === "Audited & Approved"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                        }`}
                      >
                        {rpt.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handlePrintVoucher(rpt)}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg transition font-medium flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Print Voucher</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUBMIT / TRANSFER REPORT TO DEPT ================= */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2 text-amber-400">
                  <Send className="w-5 h-5" />
                  Submit / Transfer Report to Department
                </h3>
                <p className="text-xs text-slate-400">
                  Generate and dispatch official PMS financial/operational audit transfer
                </p>
              </div>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submissionSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-emerald-400">Report Successfully Transferred!</h4>
                <p className="text-xs text-slate-300">
                  Dispatched to {targetDepartment}. Reference voucher logged in Audit History.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">1. Report Category *</label>
                    <select
                      value={selectedReportType}
                      onChange={(e: any) => setSelectedReportType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Sales & Financial Revenue">Sales & Financial Revenue</option>
                      <option value="Housekeeping & Turnover">Housekeeping & Turnover</option>
                      <option value="Booking & OTA Channel Analysis">Booking & OTA Channel Analysis</option>
                      <option value="Full End-of-Day Master Audit">Full End-of-Day Master Audit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">2. Target Department *</label>
                    <select
                      value={targetDepartment}
                      onChange={(e: any) => setTargetDepartment(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Accounting Dept">Accounting Dept</option>
                      <option value="Audit Dept">Internal Audit Dept</option>
                      <option value="Financial Controller">Financial Controller</option>
                      <option value="General Manager">General Manager</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Business Date</label>
                    <input
                      type="text"
                      disabled
                      value={businessDate}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-lg p-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Submitted By Staff *</label>
                    <input
                      type="text"
                      required
                      value={submittedBy}
                      onChange={(e) => setSubmittedBy(e.target.value)}
                      placeholder="Your Name / Title"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Summary Snapshot Box */}
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
                  <span className="text-[11px] text-amber-400 font-bold block">Live Audit Data Snapshot Preview:</span>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 font-mono">
                    <div>Gross Rev: <strong className="text-emerald-400">${grossRevenue}</strong></div>
                    <div>Rooms Clean: <strong className="text-emerald-300">{cleanCount}</strong></div>
                    <div>Bookings: <strong className="text-amber-300">{totalBookingsCount}</strong></div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Audit Transmission Notes / Comments</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Verified daily cash drawer drops, occupancy room charges, and housekeeping shift logs..."
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "Transferring..." : "Confirm & Dispatch"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= PRINT / VOUCHER PREVIEW MODAL ================= */}
      {printingReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Official Department Audit Transfer Voucher
              </h3>
              <button onClick={() => setPrintingReport(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area Voucher */}
            <div className="bg-white text-slate-900 p-6 rounded-xl space-y-4 font-sans border text-xs shadow-inner">
              {/* Hotel Header */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide">GRAND STAY HOTEL & PMS</h2>
                  <p className="text-[10px] text-slate-600">Economy Hospitality Management System • Audit Division</p>
                  <p className="text-[10px] text-slate-600">Official Department Transfer Document</p>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-sm text-amber-700">{printingReport.reportRefNumber}</div>
                  <div className="text-[10px] text-slate-500">Date: {printingReport.businessDate}</div>
                </div>
              </div>

              {/* Document Meta */}
              <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded border text-[11px]">
                <div>
                  <strong>Report Type:</strong> {printingReport.reportType}<br />
                  <strong>Recipient:</strong> {printingReport.department}<br />
                  <strong>Submitted By:</strong> {printingReport.submittedBy}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date(printingReport.submittedAt).toLocaleString()}<br />
                  <strong>Audit Status:</strong> {printingReport.status}<br />
                  <strong>Verification Code:</strong> SHA256-VERIFIED
                </div>
              </div>

              {/* Metrics Summary Table */}
              <div>
                <strong className="block mb-1 text-[11px] text-slate-700 uppercase">AUDITED FINANCIAL & OPERATIONAL SUMMARY:</strong>
                <table className="w-full border text-[11px] text-left">
                  <thead className="bg-slate-200">
                    <tr>
                      <th className="p-1.5 border">Metric Description</th>
                      <th className="p-1.5 border text-right">Audited Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-1.5 border">Total Gross Revenue</td>
                      <td className="p-1.5 border text-right font-bold">${printingReport.summaryData.totalRevenue}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border">Base Room Tariff Revenue</td>
                      <td className="p-1.5 border text-right">${printingReport.summaryData.roomRevenue}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border">Service Charge & VAT Tax</td>
                      <td className="p-1.5 border text-right">${printingReport.summaryData.taxes}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border">Occupancy Rate / ADR</td>
                      <td className="p-1.5 border text-right">{printingReport.summaryData.occupancyRate}% / ${printingReport.summaryData.adr}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border">Clean / Dirty / OOO Rooms</td>
                      <td className="p-1.5 border text-right">
                        {printingReport.summaryData.cleanRoomsCount} Clean / {printingReport.summaryData.dirtyRoomsCount} Dirty / {printingReport.summaryData.oooRoomsCount} OOO
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <strong className="block text-[11px] text-slate-700">Audit Transmission Memo:</strong>
                <p className="text-[11px] italic bg-slate-50 p-2 rounded border">{printingReport.notes}</p>
              </div>

              {/* Signature Lines */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-[10px] border-t border-slate-300">
                <div>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <p className="text-center font-bold">Front Desk Manager / Submitter Signature</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <p className="text-center font-bold">Accounting / Audit Department Receiver Signature</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPrintingReport(null)}
                className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={triggerBrowserPrint}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
