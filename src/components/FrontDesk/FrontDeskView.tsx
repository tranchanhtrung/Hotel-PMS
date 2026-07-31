import React, { useState } from "react";
import { usePms } from "../../context/PmsContext";
import {
  UserCheck,
  Search,
  Receipt,
  LogOut,
  CalendarCheck,
  PlusCircle,
  CreditCard,
  Phone,
  KeyRound,
  DollarSign,
  User,
  ArrowUpDown
} from "lucide-react";
import { Reservation } from "../../types";

export const FrontDeskView: React.FC = () => {
  const {
    reservations,
    folios,
    businessDate,
    setIsCheckInModalOpen,
    setSelectedReservationForCheckIn,
    setIsFolioModalOpen,
    setActiveFolioReservation,
    checkOut
  } = usePms();

  const [activeTab, setActiveTab] = useState<"in_house" | "arrivals" | "departures">("in_house");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // In-House Guests
  const inHouseList = reservations.filter((r) => r.status === "checked_in");

  // Arrivals Today
  const arrivalsList = reservations.filter(
    (r) => r.status === "confirmed" && r.checkInDate === businessDate
  );

  // Departures Today
  const departuresList = reservations.filter(
    (r) => r.status === "checked_in" && r.checkOutDate === businessDate
  );

  // Filter list by search query
  const filterList = (list: Reservation[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.guestName.toLowerCase().includes(q) ||
        r.roomNumber.includes(q) ||
        r.confirmationCode.toLowerCase().includes(q) ||
        r.guestPhone.includes(q)
    );
  };

  // Helper to compute live balance for a reservation (positive = guest owes, negative = deposit credit/refund due)
  const getFolioBalance = (resId: string) => {
    const folio = folios.find((f) => f.reservationId === resId);
    if (!folio) return 0;
    const totalCharges = folio.items.reduce((sum, item) => sum + item.amount, 0);
    const totalPaid = folio.payments.reduce((sum, pay) => sum + pay.amount, 0);
    return totalCharges - totalPaid;
  };

  const totalPendingDue = inHouseList.reduce((acc, item) => {
    const b = getFolioBalance(item.id);
    return b > 0 ? acc + b : acc;
  }, 0);

  const totalGuestCredit = inHouseList.reduce((acc, item) => {
    const b = getFolioBalance(item.id);
    return b < 0 ? acc + Math.abs(b) : acc;
  }, 0);

  return (
    <div className="space-y-5">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("in_house")}
          className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition shadow-sm ${
            activeTab === "in_house" ? "border-sky-500 ring-1 ring-sky-500/50" : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>In-House Guests</span>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">{inHouseList.length}</div>
          <span className="text-[11px] text-sky-400">Active rooms occupied</span>
        </div>

        <div
          onClick={() => setActiveTab("arrivals")}
          className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition shadow-sm ${
            activeTab === "arrivals" ? "border-amber-500 ring-1 ring-amber-500/50" : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Arrivals Today</span>
            <CalendarCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-2">{arrivalsList.length}</div>
          <span className="text-[11px] text-amber-400/80">Pending check-ins for {businessDate}</span>
        </div>

        <div
          onClick={() => setActiveTab("departures")}
          className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition shadow-sm ${
            activeTab === "departures" ? "border-emerald-500 ring-1 ring-emerald-500/50" : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Departures Today</span>
            <LogOut className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-2">{departuresList.length}</div>
          <span className="text-[11px] text-emerald-400/80">Due check-out for {businessDate}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Folio Unsettled</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
            ${totalPendingDue.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">
            {totalGuestCredit > 0
              ? `+$${totalGuestCredit.toFixed(2)} in guest deposit credits`
              : "Pending balance across in-house"}
          </span>
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab("in_house")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "in_house" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-300 hover:text-slate-100"
            }`}
          >
            In-House ({inHouseList.length})
          </button>
          <button
            onClick={() => setActiveTab("arrivals")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "arrivals" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-300 hover:text-slate-100"
            }`}
          >
            Arrivals Today ({arrivalsList.length})
          </button>
          <button
            onClick={() => setActiveTab("departures")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "departures" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-300 hover:text-slate-100"
            }`}
          >
            Departures Today ({departuresList.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search guest name, room # or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800 border border-slate-700 pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-64"
          />
        </div>
      </div>

      {/* Guest Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Guest & Code</th>
                <th className="p-3">Room & Type</th>
                <th className="p-3">Dates (In - Out)</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Keycard</th>
                <th className="p-3 text-right">Folio Balance</th>
                <th className="p-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeTab === "in_house" &&
                filterList(inHouseList).map((resv) => {
                  const balance = getFolioBalance(resv.id);
                  return (
                    <tr key={resv.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          <span>{resv.guestName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {resv.confirmationCode} • {resv.guestPhone}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-300">
                        #{resv.roomNumber}
                        <span className="block text-[10px] font-normal text-slate-400 font-sans">
                          {resv.roomTypeName}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        <div>{resv.checkInDate} → {resv.checkOutDate}</div>
                        <div className="text-[10px] text-slate-500">{resv.adults} Adult(s)</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                          {resv.channel}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        {resv.keycardAssigned || "KC-PENDING"}
                      </td>
                      <td className="p-3 text-right">
                        <div
                          className={`font-mono font-bold ${
                            balance > 0
                              ? "text-rose-400"
                              : balance < 0
                              ? "text-sky-300"
                              : "text-emerald-400"
                          }`}
                        >
                          {balance > 0
                            ? `$${balance.toFixed(2)}`
                            : balance < 0
                            ? `-$${Math.abs(balance).toFixed(2)}`
                            : "$0.00"}
                        </div>
                        <span className="text-[9px] text-slate-400">
                          {balance > 0
                            ? "Due at checkout"
                            : balance < 0
                            ? "Deposit Credit"
                            : "Paid & Settled"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveFolioReservation(resv);
                              setIsFolioModalOpen(true);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-400" />
                            <span>Folio</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveFolioReservation(resv);
                              setIsFolioModalOpen(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-md transition text-xs flex items-center gap-1 shadow cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Settle & Print Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {activeTab === "arrivals" &&
                filterList(arrivalsList).map((resv) => (
                  <tr key={resv.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-semibold text-slate-100">{resv.guestName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{resv.confirmationCode}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-300">
                      #{resv.roomNumber}
                      <span className="block text-[10px] font-normal text-slate-400 font-sans">{resv.roomTypeName}</span>
                    </td>
                    <td className="p-3 text-slate-300">{resv.checkInDate} → {resv.checkOutDate}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                        {resv.channel}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">Unassigned</td>
                    <td className="p-3 text-right font-mono text-slate-300">${resv.totalAmount.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedReservationForCheckIn(resv);
                          setIsCheckInModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1 rounded-md transition text-xs inline-flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Check-In Now</span>
                      </button>
                    </td>
                  </tr>
                ))}

              {activeTab === "departures" &&
                filterList(departuresList).map((resv) => {
                  const balance = getFolioBalance(resv.id);
                  return (
                    <tr key={resv.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-semibold text-slate-100">{resv.guestName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{resv.confirmationCode}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-300">
                        #{resv.roomNumber}
                        <span className="block text-[10px] font-normal text-slate-400 font-sans">{resv.roomTypeName}</span>
                      </td>
                      <td className="p-3 text-slate-300">{resv.checkInDate} → {resv.checkOutDate}</td>
                      <td className="p-3 text-slate-300">{resv.channel}</td>
                      <td className="p-3 font-mono text-slate-300">{resv.keycardAssigned}</td>
                      <td className="p-3 text-right">
                        <div
                          className={`font-mono font-bold ${
                            balance > 0
                              ? "text-rose-400"
                              : balance < 0
                              ? "text-sky-300"
                              : "text-emerald-400"
                          }`}
                        >
                          {balance > 0
                            ? `$${balance.toFixed(2)}`
                            : balance < 0
                            ? `-$${Math.abs(balance).toFixed(2)}`
                            : "$0.00"}
                        </div>
                        <span className="text-[9px] text-slate-400">
                          {balance > 0
                            ? "Due at checkout"
                            : balance < 0
                            ? "Refund Owed"
                            : "Paid & Settled"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={async () => {
                            setActiveFolioReservation(resv);
                            setIsFolioModalOpen(true);
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1 rounded-md transition text-xs inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Settle & Print Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
