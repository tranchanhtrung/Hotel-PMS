import React, { useState } from "react";
import { usePms } from "../../context/PmsContext";
import {
  Sliders,
  Building2,
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Zap,
  TrendingUp,
  Clock,
  Info,
  DollarSign,
  Users,
  Check,
  AlertCircle,
  Sparkles,
  Layers
} from "lucide-react";
import { RoomType, RatePeriod } from "../../types";

export const SettingsView: React.FC = () => {
  const {
    t,
    roomTypes,
    ratePeriods,
    businessDate,
    saveRoomType,
    saveRatePeriod,
    deleteRatePeriod,
    applyRatePeriod
  } = usePms();

  const [activeSubTab, setActiveSubTab] = useState<"room_types" | "rate_periods" | "rate_matrix">("rate_periods");

  // State for Editing Room Type
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [isAddRoomTypeOpen, setIsAddRoomTypeOpen] = useState(false);
  const [rtFormData, setRtFormData] = useState({
    id: "",
    name: "",
    baseRate: 50,
    maxGuests: 2,
    total: 10,
    description: ""
  });

  // State for Editing Rate Period
  const [editingPeriod, setEditingPeriod] = useState<RatePeriod | null>(null);
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [periodFormData, setPeriodFormData] = useState<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    rates: Record<string, number>;
    multiplier: number;
    notes: string;
    isDefault: boolean;
  }>({
    id: "",
    name: "",
    startDate: businessDate,
    endDate: "2026-12-31",
    rates: {},
    multiplier: 1.2,
    notes: "",
    isDefault: false
  });

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to check if a date range covers current business date
  const isPeriodActiveNow = (period: RatePeriod) => {
    if (!period.startDate || !period.endDate) return false;
    return businessDate >= period.startDate && businessDate <= period.endDate;
  };

  // Handler for Room Type submit
  const handleSaveRoomTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rtFormData.name || rtFormData.baseRate <= 0) {
      showNotification("Please provide a valid Room Type Name and Base Rate.", "error");
      return;
    }

    const success = await saveRoomType(rtFormData);
    if (success) {
      showNotification(`Room Type '${rtFormData.name}' saved successfully!`);
      setIsAddRoomTypeOpen(false);
      setEditingRoomType(null);
    } else {
      showNotification("Failed to save Room Type.", "error");
    }
  };

  const openEditRoomType = (rt: RoomType) => {
    setEditingRoomType(rt);
    setRtFormData({
      id: rt.id,
      name: rt.name,
      baseRate: rt.baseRate,
      maxGuests: rt.maxGuests,
      total: rt.total,
      description: rt.description
    });
    setIsAddRoomTypeOpen(true);
  };

  const openNewRoomType = () => {
    setEditingRoomType(null);
    setRtFormData({
      id: "",
      name: "",
      baseRate: 65,
      maxGuests: 2,
      total: 12,
      description: "Comfortable hotel room with essential guest amenities"
    });
    setIsAddRoomTypeOpen(true);
  };

  // Handler for Rate Period submit
  const handleSavePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodFormData.name || !periodFormData.startDate || !periodFormData.endDate) {
      showNotification("Please enter Period Name, Start Date, and End Date.", "error");
      return;
    }

    // Ensure all room types have a rate value
    const ratesObject = { ...periodFormData.rates };
    roomTypes.forEach((rt) => {
      if (ratesObject[rt.id] === undefined || ratesObject[rt.id] === 0) {
        ratesObject[rt.id] = Math.round(rt.baseRate * (periodFormData.multiplier || 1));
      }
    });

    const payload = {
      ...periodFormData,
      rates: ratesObject
    };

    const success = await saveRatePeriod(payload);
    if (success) {
      showNotification(`Rate Period '${periodFormData.name}' saved successfully!`);
      setIsAddPeriodOpen(false);
      setEditingPeriod(null);
    } else {
      showNotification("Failed to save Rate Period.", "error");
    }
  };

  const openEditPeriod = (period: RatePeriod) => {
    setEditingPeriod(period);
    setPeriodFormData({
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      rates: { ...period.rates },
      multiplier: period.multiplier || 1.0,
      notes: period.notes || "",
      isDefault: Boolean(period.isDefault)
    });
    setIsAddPeriodOpen(true);
  };

  const openNewPeriod = () => {
    setEditingPeriod(null);
    const initialRates: Record<string, number> = {};
    roomTypes.forEach((rt) => {
      initialRates[rt.id] = Math.round(rt.baseRate * 1.25);
    });

    setPeriodFormData({
      id: "",
      name: "High Season Peak 2026",
      startDate: businessDate,
      endDate: "2026-09-15",
      rates: initialRates,
      multiplier: 1.25,
      notes: "Seasonal tariff adjustment for peak demand period",
      isDefault: false
    });
    setIsAddPeriodOpen(true);
  };

  const handleDeletePeriod = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete rate period '${name}'?`)) {
      const success = await deleteRatePeriod(id);
      if (success) {
        showNotification(`Rate period '${name}' deleted.`);
      } else {
        showNotification("Failed to delete rate period.", "error");
      }
    }
  };

  const handleApplyPeriod = async (period: RatePeriod) => {
    const success = await applyRatePeriod(period.id);
    if (success) {
      showNotification(`Applied '${period.name}' tariffs to all vacant/available inventory rooms!`);
    } else {
      showNotification("Failed to apply rate period.", "error");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-semibold animate-bounce ${
            notification.type === "success"
              ? "bg-emerald-950 text-emerald-200 border-emerald-500/50"
              : "bg-rose-950 text-rose-200 border-rose-500/50"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Room Types & Multi-Period Rate Settings
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure room categories, base tariffs, and multi-period seasonal rate rules for different calendar dates.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-xl text-slate-300">
            <span className="text-[10px] text-slate-400 block">Current Business Date</span>
            <span className="font-mono font-bold text-amber-300">{businessDate}</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-xl text-slate-300">
            <span className="text-[10px] text-slate-400 block">Configured Room Types</span>
            <span className="font-mono font-bold text-emerald-400">{roomTypes.length} Categories</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-xl text-slate-300">
            <span className="text-[10px] text-slate-400 block">Multi-Period Rules</span>
            <span className="font-mono font-bold text-sky-400">{ratePeriods.length} Defined Periods</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab("rate_periods")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeSubTab === "rate_periods"
              ? "border-amber-500 text-amber-400 bg-slate-900/60 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Multi-Period Seasonal Rates ({ratePeriods.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("room_types")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeSubTab === "room_types"
              ? "border-amber-500 text-amber-400 bg-slate-900/60 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Room Types & Base Rates ({roomTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("rate_matrix")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeSubTab === "rate_matrix"
              ? "border-amber-500 text-amber-400 bg-slate-900/60 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Period Rate Comparison Matrix</span>
        </button>
      </div>

      {/* --- TAB 1: MULTI-PERIOD SEASONAL RATES --- */}
      {activeSubTab === "rate_periods" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Calendar Date Periods & Dynamic Pricing Rules
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set seasonal tariffs (Summer Peak, Holidays, Low Season, Weekends) that adjust room rates automatically based on guest stay date ranges.
              </p>
            </div>

            <button
              onClick={openNewPeriod}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rate Period</span>
            </button>
          </div>

          {/* Rate Periods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratePeriods.map((period) => {
              const activeNow = isPeriodActiveNow(period);
              return (
                <div
                  key={period.id}
                  className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition relative overflow-hidden ${
                    activeNow
                      ? "border-amber-500/80 shadow-lg shadow-amber-500/5 bg-slate-900/95"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-100 text-sm">{period.name}</h3>
                        {activeNow && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Active for Today
                          </span>
                        )}
                        {period.isDefault && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                            Base Default
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono text-slate-200">{period.startDate}</span>
                        <span>to</span>
                        <span className="font-mono text-slate-200">{period.endDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditPeriod(period)}
                        title="Edit Period Rules"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!period.isDefault && (
                        <button
                          onClick={() => handleDeletePeriod(period.id, period.name)}
                          title="Delete Rate Period"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition border border-slate-700 hover:border-rose-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {period.notes && (
                    <p className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 italic">
                      "{period.notes}"
                    </p>
                  )}

                  {/* Room Type Rates Grid for this Period */}
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Period Nightly Rates per Room Category
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {roomTypes.map((rt) => {
                        const periodRate = period.rates && period.rates[rt.id] !== undefined
                          ? period.rates[rt.id]
                          : Math.round(rt.baseRate * (period.multiplier || 1));
                        
                        const diffPct = Math.round(((periodRate - rt.baseRate) / rt.baseRate) * 100);

                        return (
                          <div
                            key={rt.id}
                            className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-xl flex justify-between items-center text-xs"
                          >
                            <div>
                              <span className="font-medium text-slate-300 block text-[11px]">{rt.name}</span>
                              <span className="text-[10px] text-slate-500">Base: ${rt.baseRate}/n</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-amber-300 text-xs block">
                                ${periodRate}
                                <span className="text-[10px] font-normal text-slate-400">/n</span>
                              </span>
                              {diffPct !== 0 && (
                                <span
                                  className={`text-[9px] font-bold ${
                                    diffPct > 0 ? "text-emerald-400" : "text-sky-400"
                                  }`}
                                >
                                  {diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Apply Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleApplyPeriod(period)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-semibold px-3 py-1.5 rounded-xl border border-slate-700 text-xs transition"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Apply Tariff to Inventory</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 2: ROOM TYPES & BASE RATES --- */}
      {activeSubTab === "room_types" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Hotel Room Categories & Standard Base Rates
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Define core room categories, max guest capacity, total physical inventory units, and default base rates.
              </p>
            </div>

            <button
              onClick={openNewRoomType}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room Type</span>
            </button>
          </div>

          {/* Room Types Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roomTypes.map((rt) => (
              <div
                key={rt.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-slate-100 text-sm">{rt.name}</h3>
                    <button
                      onClick={() => openEditRoomType(rt)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 text-2xl font-bold font-mono text-amber-400 flex items-baseline gap-1">
                    ${rt.baseRate}
                    <span className="text-xs font-normal text-slate-400">/ night</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{rt.description}</p>
                </div>

                <div className="border-t border-slate-800 pt-3 text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      Max Capacity:
                    </span>
                    <span className="font-semibold text-slate-200">{rt.maxGuests} Guests</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      Physical Inventory:
                    </span>
                    <span className="font-semibold text-emerald-400">{rt.total} Units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: PERIOD RATE COMPARISON MATRIX --- */}
      {activeSubTab === "rate_matrix" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Multi-Period Rate Comparison Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Side-by-side tariff matrix comparing base rates with multi-period seasonal prices.
                </p>
              </div>

              <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                Business Date: <span className="font-mono text-amber-300 font-bold">{businessDate}</span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 bg-slate-950/60 rounded-tl-xl">Room Category</th>
                    <th className="py-3 px-3 bg-slate-950/60 text-right">Standard Base</th>
                    {ratePeriods.map((period) => {
                      const active = isPeriodActiveNow(period);
                      return (
                        <th
                          key={period.id}
                          className={`py-3 px-3 text-right ${
                            active
                              ? "bg-amber-950/30 text-amber-300 border-x border-amber-500/30 font-bold"
                              : "bg-slate-950/40 text-slate-300"
                          }`}
                        >
                          <div>{period.name}</div>
                          <div className="text-[9px] font-mono text-slate-400 font-normal">
                            {period.startDate} → {period.endDate}
                          </div>
                          {active && (
                            <span className="text-[9px] text-emerald-400 block uppercase font-bold">
                              ★ Current Active
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {roomTypes.map((rt) => (
                    <tr key={rt.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-100 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <div>
                          <span>{rt.name}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Max {rt.maxGuests} guests • {rt.total} rooms
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                        ${rt.baseRate}/n
                      </td>

                      {ratePeriods.map((period) => {
                        const active = isPeriodActiveNow(period);
                        const periodRate = period.rates && period.rates[rt.id] !== undefined
                          ? period.rates[rt.id]
                          : Math.round(rt.baseRate * (period.multiplier || 1));
                        
                        const diffPct = Math.round(((periodRate - rt.baseRate) / rt.baseRate) * 100);

                        return (
                          <td
                            key={period.id}
                            className={`py-3 px-3 text-right font-mono ${
                              active ? "bg-amber-950/20 border-x border-amber-500/20 font-bold" : ""
                            }`}
                          >
                            <span className="text-slate-100 font-bold text-xs">${periodRate}</span>
                            <span className="text-[10px] text-slate-400">/n</span>
                            {diffPct !== 0 && (
                              <span
                                className={`block text-[9px] font-bold ${
                                  diffPct > 0 ? "text-emerald-400" : "text-sky-400"
                                }`}
                              >
                                ({diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`})
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT ROOM TYPE --- */}
      {isAddRoomTypeOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                {editingRoomType ? "Edit Room Category" : "Add New Room Type"}
              </h3>
              <button
                onClick={() => setIsAddRoomTypeOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoomTypeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Room Type Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Premier Suite"
                  value={rtFormData.name}
                  onChange={(e) => setRtFormData({ ...rtFormData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Base Rate ($)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rtFormData.baseRate}
                    onChange={(e) => setRtFormData({ ...rtFormData, baseRate: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={rtFormData.maxGuests}
                    onChange={(e) => setRtFormData({ ...rtFormData, maxGuests: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Inventory Units</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={rtFormData.total}
                    onChange={(e) => setRtFormData({ ...rtFormData, total: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Amenities</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of room dimensions, bed types, and amenities..."
                  value={rtFormData.description}
                  onChange={(e) => setRtFormData({ ...rtFormData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRoomTypeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Room Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD / EDIT SEASONAL RATE PERIOD --- */}
      {isAddPeriodOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-400" />
                {editingPeriod ? "Edit Seasonal Rate Period" : "Configure New Rate Period"}
              </h3>
              <button
                onClick={() => setIsAddPeriodOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePeriodSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Period Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer High Season Peak"
                  value={periodFormData.name}
                  onChange={(e) => setPeriodFormData({ ...periodFormData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={periodFormData.startDate}
                    onChange={(e) => setPeriodFormData({ ...periodFormData, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={periodFormData.endDate}
                    onChange={(e) => setPeriodFormData({ ...periodFormData, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Rate Multiplier / Custom Price per Room Category */}
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">Custom Nightly Rates per Category</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Auto Multiplier:</span>
                    <select
                      value={periodFormData.multiplier}
                      onChange={(e) => {
                        const mult = Number(e.target.value);
                        const newRates: Record<string, number> = {};
                        roomTypes.forEach((rt) => {
                          newRates[rt.id] = Math.round(rt.baseRate * mult);
                        });
                        setPeriodFormData({
                          ...periodFormData,
                          multiplier: mult,
                          rates: newRates
                        });
                      }}
                      className="bg-slate-800 border border-slate-700 text-amber-300 rounded-lg px-2 py-1 font-mono text-xs focus:outline-none"
                    >
                      <option value="0.80">0.80x (-20% Low Season)</option>
                      <option value="0.90">0.90x (-10% Promo)</option>
                      <option value="1.00">1.00x (Standard Base)</option>
                      <option value="1.15">1.15x (+15% High)</option>
                      <option value="1.25">1.25x (+25% Peak)</option>
                      <option value="1.50">1.50x (+50% Festival)</option>
                      <option value="1.75">1.75x (+75% Holiday)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {roomTypes.map((rt) => {
                    const currentRate = periodFormData.rates[rt.id] !== undefined
                      ? periodFormData.rates[rt.id]
                      : Math.round(rt.baseRate * (periodFormData.multiplier || 1));

                    return (
                      <div
                        key={rt.id}
                        className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800"
                      >
                        <div>
                          <span className="font-semibold text-slate-200 text-xs block">{rt.name}</span>
                          <span className="text-[10px] text-slate-500">Base Rate: ${rt.baseRate}/night</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-mono text-xs">$</span>
                          <input
                            type="number"
                            min="1"
                            value={currentRate}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setPeriodFormData({
                                ...periodFormData,
                                rates: {
                                  ...periodFormData.rates,
                                  [rt.id]: val
                                }
                              });
                            }}
                            className="w-20 bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold px-2 py-1 rounded-lg text-right focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Internal Notes / Revenue Strategy</label>
                <input
                  type="text"
                  placeholder="e.g. Summer holiday tourist surge pricing strategy..."
                  value={periodFormData.notes}
                  onChange={(e) => setPeriodFormData({ ...periodFormData, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPeriodOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Rate Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
