import React, { useState, useEffect } from "react";
import { usePms } from "../../context/PmsContext";
import { Sparkles, RefreshCw, Hotel, Bot, CheckCircle, TrendingUp } from "lucide-react";

export const AiInsightsModal: React.FC = () => {
  const { isAiModalOpen, setIsAiModalOpen, getAiInsights, businessDate, stats } = usePms();

  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const loadBriefing = async () => {
    setLoading(true);
    const text = await getAiInsights();
    setContent(text);
    setLoading(false);
  };

  useEffect(() => {
    if (isAiModalOpen) {
      loadBriefing();
    }
  }, [isAiModalOpen]);

  if (!isAiModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-2 rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Hotel Manager Briefing</h3>
              <p className="text-xs text-slate-400">
                Property Analysis & Dynamic Pricing • {businessDate}
              </p>
            </div>
          </div>
          <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg">
            ✕
          </button>
        </div>

        {/* Content Box */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-xs">Analyzing 72-room inventory, occupancy metrics, and rates...</p>
          </div>
        ) : (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-200 space-y-3 leading-relaxed">
            <div className="whitespace-pre-wrap font-sans">{content}</div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <button
            onClick={loadBriefing}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium px-3.5 py-2 rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh AI Forecast</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(false)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
