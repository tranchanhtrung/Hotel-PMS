import React, { useState } from "react";
import { usePms } from "../../context/PmsContext";
import {
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Users,
  UserPlus,
  Smartphone,
  Layers,
  RotateCcw,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  X,
  UserCheck,
  Sparkles,
  Filter
} from "lucide-react";
import { Room, RoomStatus, Housekeeper } from "../../types";

export const HousekeepingView: React.FC = () => {
  const {
    rooms,
    housekeepers,
    updateHousekeeping,
    bulkAssignHousekeeping,
    addHousekeeper,
    updateHousekeeper,
    deleteHousekeeper,
    terminalMode
  } = usePms();

  // Filters & Modes
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [attendantFilter, setAttendantFilter] = useState<string>("all");
  const [isTabletView, setIsTabletView] = useState<boolean>(terminalMode === "housekeeping");
  
  // Modals
  const [reportingRoom, setReportingRoom] = useState<Room | null>(null);
  const [maintenanceNote, setMaintenanceNote] = useState<string>("");

  const [isAttendantsModalOpen, setIsAttendantsModalOpen] = useState<boolean>(false);
  const [newAttendantName, setNewAttendantName] = useState<string>("");
  const [newAttendantPhone, setNewAttendantPhone] = useState<string>("");
  const [editingAttendant, setEditingAttendant] = useState<Housekeeper | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("Active");

  // Bulk Assign Modal
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState<boolean>(false);
  const [bulkSelectedAttendant, setBulkSelectedAttendant] = useState<string>("Maria Santos");
  const [bulkSelectedRoomIds, setBulkSelectedRoomIds] = useState<string[]>([]);
  const [bulkStatusChange, setBulkStatusChange] = useState<string>("keep"); // keep, vacant_clean, vacant_dirty
  const [bulkModalFloorFilter, setBulkModalFloorFilter] = useState<number | "all">("all");
  const [bulkModalStatusFilter, setBulkModalStatusFilter] = useState<string>("all");

  // Direct Grid Multi-Select Mode
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [gridSelectedRoomIds, setGridSelectedRoomIds] = useState<string[]>([]);
  const [gridAssignAttendant, setGridAssignAttendant] = useState<string>("Maria Santos");

  // Housekeepers Name List helper
  const housekeeperNames = housekeepers.map((h) => h.name);
  if (!housekeeperNames.includes("Unassigned")) {
    housekeeperNames.push("Unassigned");
  }

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (floorFilter !== "all" && r.floor !== floorFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (attendantFilter !== "all" && r.housekeeper !== attendantFilter) return false;
    return true;
  });

  const countDirty = rooms.filter((r) => r.status === "vacant_dirty" || r.status === "occupied_dirty").length;
  const countClean = rooms.filter((r) => r.status === "vacant_clean" || r.status === "occupied_clean").length;
  const countOOO = rooms.filter((r) => r.status === "out_of_order").length;

  // Single status flip
  const handleNextStatus = async (room: Room) => {
    let nextStatus: RoomStatus = "vacant_clean";
    if (room.status === "vacant_dirty") nextStatus = "vacant_clean";
    else if (room.status === "occupied_dirty") nextStatus = "occupied_clean";
    else if (room.status === "vacant_clean") nextStatus = "vacant_dirty";
    else if (room.status === "occupied_clean") nextStatus = "occupied_dirty";

    await updateHousekeeping(room.id, nextStatus, room.housekeeper);
  };

  // Flag OOO
  const handleSetMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingRoom) return;
    await updateHousekeeping(
      reportingRoom.id,
      "out_of_order",
      "Maintenance",
      maintenanceNote || "Maintenance issue reported by housekeeping"
    );
    setReportingRoom(null);
    setMaintenanceNote("");
  };

  // Attendant Management
  const handleAddAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendantName.trim()) return;
    await addHousekeeper({ name: newAttendantName, phone: newAttendantPhone });
    setNewAttendantName("");
    setNewAttendantPhone("");
  };

  const handleStartEdit = (hk: Housekeeper) => {
    setEditingAttendant(hk);
    setEditName(hk.name);
    setEditPhone(hk.phone || "");
    setEditStatus(hk.status || "Active");
  };

  const handleSaveEdit = async () => {
    if (!editingAttendant) return;
    await updateHousekeeper({
      id: editingAttendant.id,
      name: editName,
      phone: editPhone,
      status: editStatus
    });
    setEditingAttendant(null);
  };

  const handleDeleteAttendant = async (hk: Housekeeper) => {
    await deleteHousekeeper(hk.id);
  };

  // Bulk Assign Submit
  const handleExecuteBulkAssign = async (roomIdsToAssign: string[], targetAttendant: string, statusOverride?: string) => {
    if (roomIdsToAssign.length === 0) return;
    const newStatus = statusOverride && statusOverride !== "keep" ? statusOverride : undefined;
    await bulkAssignHousekeeping({
      roomIds: roomIdsToAssign,
      housekeeper: targetAttendant,
      newStatus
    });
  };

  // Preset Selectors for Bulk Assign Modal
  const handleBulkSelectPreset = (type: "all_dirty" | "all_vacant_dirty" | "floor1" | "floor2" | "floor3" | "floor4" | "clear" | "all") => {
    if (type === "clear") {
      setBulkSelectedRoomIds([]);
      return;
    }
    if (type === "all") {
      setBulkSelectedRoomIds(rooms.map((r) => r.id));
      return;
    }
    if (type === "all_dirty") {
      setBulkSelectedRoomIds(rooms.filter((r) => r.status === "vacant_dirty" || r.status === "occupied_dirty").map((r) => r.id));
      return;
    }
    if (type === "all_vacant_dirty") {
      setBulkSelectedRoomIds(rooms.filter((r) => r.status === "vacant_dirty").map((r) => r.id));
      return;
    }
    if (type.startsWith("floor")) {
      const fl = Number(type.replace("floor", ""));
      setBulkSelectedRoomIds(rooms.filter((r) => r.floor === fl).map((r) => r.id));
    }
  };

  // Grid Multi Select toggle
  const toggleGridRoomSelection = (roomId: string) => {
    setGridSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  return (
    <div className="space-y-5">
      {/* Housekeeping Operational Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span>Needs Cleaning (Dirty)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{countDirty}</div>
          <span className="text-[10px] text-amber-400/80">Priority turnovers</span>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span>Ready & Cleaned</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{countClean}</div>
          <span className="text-[10px] text-emerald-400/80">Available for check-in</span>
        </div>

        <div className="bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-purple-400 text-xs">
            <span>Out of Order (OOO)</span>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1">{countOOO}</div>
          <span className="text-[10px] text-purple-400/80">Under maintenance</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Maid Tablet Mode</span>
            <span className="text-xs text-slate-300 font-medium">Large Touch Buttons</span>
          </div>
          <button
            onClick={() => setIsTabletView(!isTabletView)}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isTabletView ? "bg-amber-500 text-slate-950 border-amber-400 font-bold" : "bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Control Tools Bar: Management & Bulk Actions */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Floor filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Floor:</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Floors (1-4)</option>
              <option value={1} className="bg-slate-900">Floor 1</option>
              <option value={2} className="bg-slate-900">Floor 2</option>
              <option value={3} className="bg-slate-900">Floor 3</option>
              <option value={4} className="bg-slate-900">Floor 4</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="vacant_dirty" className="bg-slate-900 text-amber-400">Vacant Dirty</option>
              <option value="vacant_clean" className="bg-slate-900 text-emerald-400">Vacant Clean</option>
              <option value="occupied_dirty" className="bg-slate-900 text-orange-400">Occupied Dirty</option>
              <option value="occupied_clean" className="bg-slate-900 text-sky-400">Occupied Clean</option>
              <option value="out_of_order" className="bg-slate-900 text-purple-400">Out of Order</option>
            </select>
          </div>

          {/* Attendant filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Attendant:</span>
            <select
              value={attendantFilter}
              onChange={(e) => setAttendantFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Attendants</option>
              {housekeeperNames.map((name) => (
                <option key={name} value={name} className="bg-slate-900">
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Tool Buttons */}
        <div className="flex items-center gap-2">
          {/* Manage Attendants Button */}
          <button
            onClick={() => setIsAttendantsModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Manage Attendants ({housekeepers.length})</span>
          </button>

          {/* Quick Bulk Assign Modal Tool */}
          <button
            onClick={() => {
              setBulkSelectedRoomIds([]);
              setIsBulkAssignModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Sparkles className="w-4 h-4" />
            <span>Quick Bulk Assign</span>
          </button>

          {/* Multi-Select Toggle */}
          <button
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              setGridSelectedRoomIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium border transition flex items-center gap-1.5 cursor-pointer ${
              isMultiSelectMode
                ? "bg-sky-600 text-white border-sky-400"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isMultiSelectMode ? "Exit Multi-Select" : "Multi-Select Grid"}</span>
          </button>
        </div>
      </div>

      {/* Housekeeping Rooms Grid */}
      <div
        className={`grid gap-3 ${
          isTabletView
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        }`}
      >
        {filteredRooms.map((room) => {
          const isDirty = room.status === "vacant_dirty" || room.status === "occupied_dirty";
          const isClean = room.status === "vacant_clean" || room.status === "occupied_clean";
          const isOOO = room.status === "out_of_order";
          const isSelectedInGrid = gridSelectedRoomIds.includes(room.id);

          return (
            <div
              key={room.id}
              onClick={() => {
                if (isMultiSelectMode) toggleGridRoomSelection(room.id);
              }}
              className={`rounded-2xl border p-3.5 flex flex-col justify-between transition shadow-md relative ${
                isMultiSelectMode ? "cursor-pointer select-none" : ""
              } ${
                isSelectedInGrid
                  ? "bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/50"
                  : isDirty
                  ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-400"
                  : isClean
                  ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                  : "bg-purple-950/20 border-purple-500/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {isMultiSelectMode && (
                      <div className="text-sky-400">
                        {isSelectedInGrid ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                      </div>
                    )}
                    <span className="font-mono font-extrabold text-lg text-slate-100">#{room.number}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isDirty
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : isClean
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    }`}
                  >
                    {room.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div>Type: <span className="text-slate-200 font-medium">{room.typeName}</span></div>
                  
                  {/* Maid Assignment Dropdown */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-slate-400">Maid:</span>
                    <select
                      value={room.housekeeper}
                      onChange={(e) => updateHousekeeping(room.id, room.status, e.target.value)}
                      className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {housekeeperNames.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {room.notes && (
                  <p className="mt-2 text-[10px] text-purple-300 bg-purple-950/40 p-1.5 rounded border border-purple-500/20">
                    {room.notes}
                  </p>
                )}
              </div>

              {/* Tap Actions */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleNextStatus(room)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDirty
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                      : "bg-amber-600 hover:bg-amber-500 text-white"
                  }`}
                >
                  {isDirty ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tap to Mark Clean</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Tap to Mark Dirty</span>
                    </>
                  )}
                </button>

                {!isOOO && (
                  <button
                    onClick={() => setReportingRoom(room)}
                    className="w-full text-[10px] text-purple-400 hover:text-purple-300 py-1 text-center cursor-pointer"
                  >
                    Report Issue / Set OOO
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Select Floating Action Bar at Bottom */}
      {isMultiSelectMode && gridSelectedRoomIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border-2 border-sky-500 p-3 rounded-2xl shadow-2xl flex flex-wrap items-center gap-3 text-xs text-slate-100 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 px-2 border-r border-slate-700">
            <CheckSquare className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-sky-300">{gridSelectedRoomIds.length} Rooms Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Assign to:</span>
            <select
              value={gridAssignAttendant}
              onChange={(e) => setGridAssignAttendant(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              {housekeeperNames.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>

            <button
              onClick={async () => {
                await handleExecuteBulkAssign(gridSelectedRoomIds, gridAssignAttendant);
                setGridSelectedRoomIds([]);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Apply Assignment
            </button>

            <button
              onClick={async () => {
                await handleExecuteBulkAssign(gridSelectedRoomIds, gridAssignAttendant, "vacant_clean");
                setGridSelectedRoomIds([]);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Mark Clean & Assign
            </button>

            <button
              onClick={() => setGridSelectedRoomIds([])}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 1: ATTENDANTS MANAGEMENT ----------------- */}
      {isAttendantsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-amber-400">
                <Users className="w-5 h-5" />
                Room Attendants Management
              </h3>
              <button
                onClick={() => {
                  setIsAttendantsModalOpen(false);
                  setEditingAttendant(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Attendant Form */}
            <form onSubmit={handleAddAttendant} className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-200 block flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Add New Room Attendant
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Lisa Wong)"
                  value={newAttendantName}
                  onChange={(e) => setNewAttendantName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Phone (optional)"
                  value={newAttendantPhone}
                  onChange={(e) => setNewAttendantPhone(e.target.value)}
                  className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            {/* Current Attendants List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <span className="text-xs text-slate-400 font-semibold block">Active Housekeeper Roster</span>
              {housekeepers.map((hk) => {
                const assignedCount = rooms.filter((r) => r.housekeeper === hk.name).length;
                const isEditingThis = editingAttendant?.id === hk.id;

                if (isEditingThis) {
                  return (
                    <div key={hk.id} className="bg-slate-800 border border-amber-500/50 p-3 rounded-xl space-y-2 text-xs">
                      <div className="font-bold text-amber-300">Edit Attendant: {hk.name}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Phone</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs"
                        >
                          <option value="Active">Active</option>
                          <option value="Off Duty">Off Duty</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-xs hover:bg-emerald-500"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingAttendant(null)}
                            className="bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={hk.id}
                    className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span>{hk.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded ${
                            hk.status === "Off Duty" ? "bg-slate-700 text-slate-400" : "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {hk.status || "Active"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex gap-3">
                        {hk.phone && <span>Phone: {hk.phone}</span>}
                        <span className="text-amber-400/90 font-medium">{assignedCount} room(s) currently assigned</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(hk)}
                        className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg transition"
                        title="Edit Attendant"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttendant(hk)}
                        className="p-1.5 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                        title="Remove Attendant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsAttendantsModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-xl text-xs"
              >
                Close Roster Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: QUICK BULK ROOM ASSIGNMENT ----------------- */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2 text-amber-400">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Quick Bulk Room Assignment Tool
                </h3>
                <p className="text-xs text-slate-400">Assign multiple hotel rooms to a housekeeper in 1 click</p>
              </div>
              <button onClick={() => setIsBulkAssignModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1 & Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">1. Choose Target Housekeeper *</label>
                <select
                  value={bulkSelectedAttendant}
                  onChange={(e) => setBulkSelectedAttendant(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {housekeeperNames.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">2. Optional Room Status Override</label>
                <select
                  value={bulkStatusChange}
                  onChange={(e) => setBulkStatusChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="keep">Keep Current Room Statuses</option>
                  <option value="vacant_dirty">Set All Selected to Vacant Dirty</option>
                  <option value="vacant_clean">Set All Selected to Vacant Clean</option>
                </select>
              </div>
            </div>

            {/* Quick Presets Selectors */}
            <div className="space-y-1 text-xs">
              <span className="text-slate-400 font-medium">Quick Selection Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleBulkSelectPreset("all_dirty")}
                  className="bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Select All Dirty Rooms ({rooms.filter((r) => r.status.includes("dirty")).length})
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelectPreset("all_vacant_dirty")}
                  className="bg-amber-950/40 hover:bg-amber-900/80 text-amber-200 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Vacant Dirty ({rooms.filter((r) => r.status === "vacant_dirty").length})
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelectPreset("floor1")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                >
                  Floor 1
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelectPreset("floor2")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                >
                  Floor 2
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelectPreset("floor3")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                >
                  Floor 3
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelectPreset("floor4")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                >
                  Floor 4
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelectPreset("all")}
                  className="bg-sky-950/60 hover:bg-sky-900 text-sky-300 border border-sky-500/40 px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                >
                  Select All Rooms (72)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelectPreset("clear")}
                  className="bg-slate-800 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Room Checkbox Selection Grid */}
            <div className="border border-slate-800 rounded-xl bg-slate-950 p-3 max-h-60 overflow-y-auto space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400 pb-1 border-b border-slate-800">
                <span>Check rooms to include in bulk assignment:</span>
                <span className="font-bold text-amber-400">{bulkSelectedRoomIds.length} rooms checked</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                {rooms.map((r) => {
                  const isChecked = bulkSelectedRoomIds.includes(r.id);
                  const isDirty = r.status.includes("dirty");

                  return (
                    <label
                      key={r.id}
                      className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-amber-950/50 border-amber-500/80 text-amber-200"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setBulkSelectedRoomIds((prev) =>
                              prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                            );
                          }}
                          className="accent-amber-500 rounded"
                        />
                        <span className="font-mono font-bold">#{r.number}</span>
                      </div>
                      <span className={`text-[9px] px-1 rounded ${isDirty ? "bg-amber-500/20 text-amber-300" : "text-slate-400"}`}>
                        {r.housekeeper === "Unassigned" ? "Unassigned" : r.housekeeper.split(" ")[0]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Will assign <strong className="text-amber-400">{bulkSelectedRoomIds.length}</strong> room(s) to <strong className="text-slate-200">{bulkSelectedAttendant}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkAssignModalOpen(false)}
                  className="bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={bulkSelectedRoomIds.length === 0}
                  onClick={async () => {
                    await handleExecuteBulkAssign(bulkSelectedRoomIds, bulkSelectedAttendant, bulkStatusChange);
                    setIsBulkAssignModalOpen(false);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Issue Reporting Modal */}
      {reportingRoom && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-base flex items-center gap-2 text-purple-400">
                <Wrench className="w-4 h-4" />
                Report OOO / Repair - Room #{reportingRoom.number}
              </h3>
              <button onClick={() => setReportingRoom(null)}>✕</button>
            </div>

            <form onSubmit={handleSetMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Issue Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Air Conditioner leaking, Door lock battery low..."
                  value={maintenanceNote}
                  onChange={(e) => setMaintenanceNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl transition cursor-pointer"
                >
                  Flag Out of Order
                </button>
                <button
                  type="button"
                  onClick={() => setReportingRoom(null)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
