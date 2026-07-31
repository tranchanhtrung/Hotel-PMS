import React from "react";
import { usePms } from "../../context/PmsContext";
import { Columns2, UserCheck, Smartphone, CheckCircle2, RotateCcw, Zap } from "lucide-react";

export const SplitTerminalModal: React.FC = () => {
  const { terminalMode, setTerminalMode, rooms, updateHousekeeping, reservations } = usePms();

  if (terminalMode !== "split_terminal") return null;

  const dirtyRooms = rooms.filter((r) => r.status === "vacant_dirty" || r.status === "occupied_dirty");
  const inHouseList = reservations.filter((r) => r.status === "checked_in");

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col p-4 space-y-3">
      {/* Top Controls */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Columns2 className="w-5 h-5 text-sky-400" />
          <h2 className="font-bold text-slate-100 text-sm">Real-Time Multi-Terminal Live Simulator</h2>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
            Live SSE Channel Active
          </span>
        </div>

        <button
          onClick={() => setTerminalMode("front_desk")}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg border border-slate-700"
        >
          Exit Split Mode
        </button>
      </div>

      {/* Side-by-Side Dual Terminal Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Terminal 1: Front Desk Terminal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-sky-400 flex items-center gap-1.5 text-xs">
              <UserCheck className="w-4 h-4" />
              Terminal A: Front Desk Reception
            </span>
            <span className="text-[10px] text-slate-400">In-House: {inHouseList.length} Guests</span>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-300 block">Live Room Inventory Status:</span>
            <div className="grid grid-cols-4 gap-1.5 max-h-64 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800 font-mono">
              {rooms.slice(0, 24).map((r) => (
                <div
                  key={r.id}
                  className={`p-1.5 rounded text-center border text-[10px] ${
                    r.status === "vacant_clean"
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                      : r.status === "vacant_dirty"
                      ? "bg-amber-950/40 text-amber-300 border-amber-500/30"
                      : "bg-sky-950/40 text-sky-300 border-sky-500/30"
                  }`}
                >
                  <div className="font-bold">#{r.number}</div>
                  <div className="text-[8px] uppercase">{r.status.split("_")[1]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal 2: Housekeeping Staff Mobile Tablet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 overflow-y-auto border-l-2 border-l-amber-500">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
              <Smartphone className="w-4 h-4" />
              Terminal B: Housekeeping Maid Tablet
            </span>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
              {dirtyRooms.length} Dirty Rooms
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Tap clean below — notice how Terminal A immediately updates in real-time without reloading!
          </p>

          <div className="space-y-2 overflow-y-auto flex-1 text-xs">
            {dirtyRooms.map((r) => (
              <div
                key={r.id}
                className="bg-amber-950/20 border border-amber-500/40 p-2.5 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="font-mono font-bold text-sm text-slate-100">Room #{r.number}</div>
                  <span className="text-[10px] text-amber-400">{r.typeName} • Maid: {r.housekeeper}</span>
                </div>

                <button
                  onClick={() => updateHousekeeping(r.id, "vacant_clean", r.housekeeper)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Cleaned</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
