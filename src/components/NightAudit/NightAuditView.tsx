import React, { useState } from "react";
import { usePms } from "../../context/PmsContext";
import {
  ShieldAlert,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  ListFilter,
  ArrowRight,
  FileText
} from "lucide-react";

export const NightAuditView: React.FC = () => {
  const { businessDate, auditLogs, stats, runNightAudit, rooms, reservations } = usePms();

  const [running, setRunning] = useState(false);

  const handleAuditRun = async () => {
    setRunning(true);
    await runNightAudit();
    setRunning(false);
  };

  const activeInHouse = reservations.filter((r) => r.status === "checked_in");

  return (
    <div className="space-y-5">
      {/* Night Audit Banner & Runner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl border border-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Automated Night Audit Runner</h2>
              <p className="text-xs text-slate-400">
                Current Business Date: <span className="text-amber-300 font-mono font-bold">{businessDate}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleAuditRun}
            disabled={running}
            id="btn-run-night-audit-page"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-lg text-xs flex items-center gap-2"
          >
            {running ? (
              <>Processing Night Audit...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Execute Night Audit & Advance Date</span>
              </>
            )}
          </button>
        </div>

        {/* Audit Impact Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400">In-House Rooms to Auto-Post</span>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">{activeInHouse.length} Rooms</div>
            <p className="text-[10px] text-slate-500">Nightly room rate + 5% tax</p>
          </div>

          <div>
            <span className="text-slate-400">Estimated Nightly Posting</span>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
              ${activeInHouse.reduce((acc, r) => acc + (r.totalAmount / 2), 0).toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500">Auto-credited to active guest folios</p>
          </div>

          <div>
            <span className="text-slate-400">Next Business Date</span>
            <div className="text-lg font-bold font-mono text-sky-300 mt-0.5 flex items-center gap-1">
              <span>{businessDate}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {new Date(new Date(businessDate).getTime() + 86400000).toISOString().split("T")[0]}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Rolls date forward 24h</p>
          </div>
        </div>
      </div>

      {/* Key Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <span className="text-xs text-slate-400">Occupancy Rate</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{stats.occupancyRate}%</div>
          <span className="text-[10px] text-slate-500">{stats.occupiedCount} of 72 rooms occupied</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <span className="text-xs text-slate-400">Average Daily Rate (ADR)</span>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">${stats.adr.toFixed(2)}</div>
          <span className="text-[10px] text-slate-500">Average price per occupied room</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <span className="text-xs text-slate-400">RevPAR</span>
          <div className="text-2xl font-bold font-mono text-sky-300 mt-1">${stats.revpar.toFixed(2)}</div>
          <span className="text-[10px] text-slate-500">Revenue per available room</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <span className="text-xs text-slate-400">Today Revenue</span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">${stats.todayRevenue.toFixed(2)}</div>
          <span className="text-[10px] text-slate-500">Room charges + Extra POS items</span>
        </div>
      </div>

      {/* System Audit Activity Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Audit Trail & System Log History
          </h3>
          <span className="text-xs text-slate-500">{auditLogs.length} Entries Recorded</span>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="text-amber-400 font-mono">[{log.action}]</span>
                  <span>{log.details}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Staff: {log.staff}</div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
