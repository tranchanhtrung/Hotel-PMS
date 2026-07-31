import React, { useState } from "react";
import { usePms } from "../../context/PmsContext";
import {
  Filter,
  Search,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Info,
  Layers,
  Calendar
} from "lucide-react";
import { Room, RoomStatus } from "../../types";
import { formatVND } from "../../utils/formatters";

export const TapeChart: React.FC = () => {
  const {
    rooms,
    reservations,
    businessDate,
    updateHousekeeping,
    setIsCheckInModalOpen,
    setSelectedReservationForCheckIn,
    setIsFolioModalOpen,
    setActiveFolioReservation,
    checkOut
  } = usePms();

  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<Room | null>(null);

  // Generate 14-day calendar column dates starting from business date
  const startDate = new Date(businessDate);
  const daysList = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + idx);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    return { dateStr, dayName, dayNum, monthName, isToday: idx === 0 };
  });

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    if (floorFilter !== "all" && room.floor !== floorFilter) return false;
    if (typeFilter !== "all" && room.typeId !== typeFilter) return false;
    if (statusFilter !== "all" && room.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!room.number.includes(q) && !room.typeName.toLowerCase().includes(q) && !room.housekeeper.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Helper status color styling
  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case "vacant_clean":
        return {
          label: "Vacant Clean",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-500"
        };
      case "vacant_dirty":
        return {
          label: "Vacant Dirty",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          dot: "bg-amber-500"
        };
      case "occupied_clean":
        return {
          label: "Occupied Clean",
          bg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
          dot: "bg-sky-500"
        };
      case "occupied_dirty":
        return {
          label: "Occupied Dirty",
          bg: "bg-orange-500/10 text-orange-400 border-orange-500/30",
          dot: "bg-orange-500"
        };
      case "out_of_order":
        return {
          label: "Out of Order",
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          dot: "bg-purple-500"
        };
      default:
        return { label: status, bg: "bg-slate-800 text-slate-300 border-slate-700", dot: "bg-slate-500" };
    }
  };

  // Find reservation occupying a room on a given date
  const getReservationForRoomAndDate = (roomNumber: string, dateStr: string) => {
    return reservations.find(
      (res) =>
        res.roomNumber === roomNumber &&
        res.status !== "cancelled" &&
        dateStr >= res.checkInDate &&
        dateStr < res.checkOutDate
    );
  };

  return (
    <div className="space-y-4">
      {/* Control / Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Floor filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Floor:</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-100">All Floors (1-4)</option>
              <option value={1} className="bg-slate-900 text-slate-100">Floor 1 (101-118)</option>
              <option value={2} className="bg-slate-900 text-slate-100">Floor 2 (201-218)</option>
              <option value={3} className="bg-slate-900 text-slate-100">Floor 3 (301-318)</option>
              <option value={4} className="bg-slate-900 text-slate-100">Floor 4 (401-418)</option>
            </select>
          </div>

          {/* Room Type filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-100">All Room Types</option>
              <option value="std-single" className="bg-slate-900 text-slate-100">Standard Single (450.000đ)</option>
              <option value="std-double" className="bg-slate-900 text-slate-100">Standard Double (600.000đ)</option>
              <option value="dlx-twin" className="bg-slate-900 text-slate-100">Deluxe Twin (750.000đ)</option>
              <option value="eco-suite" className="bg-slate-900 text-slate-100">Economy Suite (1.100.000đ)</option>
            </select>
          </div>

          {/* Housekeeping Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-100">All Statuses</option>
              <option value="vacant_clean" className="bg-slate-900 text-emerald-400">Vacant Clean</option>
              <option value="vacant_dirty" className="bg-slate-900 text-amber-400">Vacant Dirty</option>
              <option value="occupied_clean" className="bg-slate-900 text-sky-400">Occupied Clean</option>
              <option value="occupied_dirty" className="bg-slate-900 text-orange-400">Occupied Dirty</option>
              <option value="out_of_order" className="bg-slate-900 text-purple-400">Out of Order</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search room # or housekeeper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 pl-8 pr-3 py-1.5 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 overflow-x-auto py-1">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Clean</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Dirty</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>OOO</span>
          </div>
        </div>
      </div>

      {/* Rack / Tape Chart Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-3 font-semibold w-40 sticky left-0 bg-slate-950 z-20 border-r border-slate-800 shadow-md">
                  Room / Type
                </th>
                {daysList.map((day) => (
                  <th
                    key={day.dateStr}
                    className={`p-2 font-medium text-center min-w-[72px] border-r border-slate-800/60 ${
                      day.isToday ? "bg-amber-500/10 text-amber-300 font-bold border-t-2 border-t-amber-500" : ""
                    }`}
                  >
                    <div className="text-[10px] uppercase text-slate-500">{day.dayName}</div>
                    <div className="text-sm font-semibold">{day.dayNum}</div>
                    <div className="text-[10px] text-slate-400">{day.monthName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-slate-500">
                    No rooms found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const badge = getStatusBadge(room.status);
                  const activeResvToday = reservations.find(
                    (r) => r.roomNumber === room.number && r.status === "checked_in"
                  );

                  return (
                    <tr key={room.id} className="hover:bg-slate-800/40 transition group">
                      {/* Room Header Column */}
                      <td
                        onClick={() => setSelectedRoomDetail(room)}
                        className="p-2.5 sticky left-0 bg-slate-900 group-hover:bg-slate-850 z-10 border-r border-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100 font-mono">#{room.number}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] rounded border ${badge.bg}`}>
                              {room.typeName.split(" ")[0]}
                            </span>
                          </div>
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} title={badge.label} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>Floor {room.floor} • ${room.rate}/n</span>
                          <span className="text-slate-500 truncate max-w-[80px]">
                            {room.housekeeper !== "Unassigned" ? room.housekeeper : "No Maid"}
                          </span>
                        </div>
                      </td>

                      {/* 14 Calendar Day Grid Cells */}
                      {daysList.map((day) => {
                        const resv = getReservationForRoomAndDate(room.number, day.dateStr);

                        if (room.status === "out_of_order" && day.isToday) {
                          return (
                            <td key={day.dateStr} className="p-1 border-r border-slate-800/60 bg-purple-950/20">
                              <div
                                onClick={() => setSelectedRoomDetail(room)}
                                className="h-10 rounded border border-purple-500/40 bg-purple-900/30 p-1 flex flex-col justify-center items-center text-[10px] text-purple-300 cursor-pointer"
                                title="Out of Order"
                              >
                                <Wrench className="w-3.5 h-3.5 mb-0.5 text-purple-400" />
                                <span className="font-medium">OOO</span>
                              </div>
                            </td>
                          );
                        }

                        if (resv) {
                          const isStart = resv.checkInDate === day.dateStr;
                          return (
                            <td key={day.dateStr} className="p-0.5 border-r border-slate-800/60">
                              <div
                                onClick={() => {
                                  if (resv.status === "checked_in") {
                                    setActiveFolioReservation(resv);
                                    setIsFolioModalOpen(true);
                                  } else {
                                    setSelectedReservationForCheckIn(resv);
                                    setIsCheckInModalOpen(true);
                                  }
                                }}
                                className={`h-10 rounded px-1.5 py-1 flex flex-col justify-between text-[11px] cursor-pointer transition shadow-sm border ${
                                  resv.status === "checked_in"
                                    ? "bg-sky-950/80 border-sky-500/50 text-sky-200 hover:border-sky-400"
                                    : "bg-amber-950/60 border-amber-500/40 text-amber-200 hover:border-amber-400"
                                }`}
                                title={`${resv.guestName} (${resv.confirmationCode}) - ${resv.status}`}
                              >
                                <div className="font-semibold truncate text-[10px] leading-tight flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                                  <span className="truncate">{resv.guestName.split(" ")[0]}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-slate-300/80">
                                  <span className="font-mono">{resv.confirmationCode}</span>
                                  <span className="uppercase text-[8px] px-1 bg-black/40 rounded">
                                    {resv.status === "checked_in" ? "In-House" : "Arr"}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        // Empty / Available cell
                        return (
                          <td key={day.dateStr} className="p-0.5 border-r border-slate-800/60 hover:bg-slate-800/80 transition">
                            <div
                              onClick={() => {
                                if (day.isToday) {
                                  setSelectedRoomDetail(room);
                                } else {
                                  // Quick reserve for future date
                                  setSelectedRoomDetail(room);
                                }
                              }}
                              className="h-10 rounded border border-dashed border-slate-800/80 hover:border-amber-500/50 flex items-center justify-center cursor-pointer group/cell"
                            >
                              <span className="opacity-0 group-hover/cell:opacity-100 text-[10px] text-amber-400 font-medium">
                                +Book
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Room Detail Drawer / Modal */}
      {selectedRoomDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 text-amber-400 p-2.5 rounded-xl border border-amber-500/20 font-mono font-bold text-lg">
                  #{selectedRoomDetail.number}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedRoomDetail.typeName}</h3>
                  <p className="text-xs text-slate-400">Tầng {selectedRoomDetail.floor} • Giá gốc {formatVND(selectedRoomDetail.rate)}/đêm</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoomDetail(null)}
                className="text-slate-400 hover:text-slate-200 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Room Current Status Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[11px]">Housekeeping Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadge(selectedRoomDetail.status).bg}`}>
                    {getStatusBadge(selectedRoomDetail.status).label}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[11px]">Assigned Maid</span>
                <p className="font-medium text-slate-200 mt-1">
                  {selectedRoomDetail.housekeeper !== "Unassigned" ? selectedRoomDetail.housekeeper : "None Assigned"}
                </p>
              </div>
            </div>

            {/* Notes if OOO */}
            {selectedRoomDetail.notes && (
              <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl text-xs text-purple-200">
                <span className="font-semibold block mb-0.5">Maintenance Notes:</span>
                {selectedRoomDetail.notes}
              </div>
            )}

            {/* Quick Status Action Toggles */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Quick Housekeeping Override:</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={async () => {
                    await updateHousekeeping(selectedRoomDetail.id, "vacant_clean", selectedRoomDetail.housekeeper);
                    setSelectedRoomDetail({ ...selectedRoomDetail, status: "vacant_clean" });
                  }}
                  className="bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 p-2 rounded-lg font-medium transition text-center"
                >
                  ✓ Mark Clean
                </button>
                <button
                  onClick={async () => {
                    await updateHousekeeping(selectedRoomDetail.id, "vacant_dirty", selectedRoomDetail.housekeeper);
                    setSelectedRoomDetail({ ...selectedRoomDetail, status: "vacant_dirty" });
                  }}
                  className="bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 p-2 rounded-lg font-medium transition text-center"
                >
                  ⚡ Mark Dirty
                </button>
                <button
                  onClick={async () => {
                    await updateHousekeeping(selectedRoomDetail.id, "out_of_order", "Maintenance", "Flagged Out of Order");
                    setSelectedRoomDetail({ ...selectedRoomDetail, status: "out_of_order" });
                  }}
                  className="bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 p-2 rounded-lg font-medium transition text-center"
                >
                  🔧 Set OOO
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedReservationForCheckIn(null);
                  setIsCheckInModalOpen(true);
                  setSelectedRoomDetail(null);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 rounded-xl transition text-xs shadow-md text-center"
              >
                Walk-In Check-In to #{selectedRoomDetail.number}
              </button>

              <button
                onClick={() => setSelectedRoomDetail(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2.5 rounded-xl transition text-xs border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
