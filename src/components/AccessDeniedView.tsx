import React from "react";
import { usePms } from "../context/PmsContext";
import { ShieldAlert, UserX, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

export const AccessDeniedView: React.FC = () => {
  const { currentUser, setIsAuthModalOpen, t, language, canAccessView } = usePms();

  const roleLabel = t(
    currentUser.role === "admin" ? "roleAdmin" :
    currentUser.role === "front_desk" ? "roleFrontDesk" :
    currentUser.role === "housekeeper" ? "roleHousekeeper" :
    currentUser.role === "room_attendant" ? "roleRoomAttendant" :
    currentUser.role === "sales" ? "roleSales" :
    currentUser.role === "night_audit" ? "roleNightAudit" :
    currentUser.role === "accounting" ? "roleAccounting" : currentUser.role
  );

  return (
    <div className="max-w-4xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center space-y-6 text-slate-100">
      <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-100">{t("accessDenied")}</h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          {t("accessDeniedDesc")}
        </p>
      </div>

      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 max-w-md mx-auto text-left text-xs space-y-2">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-slate-400">{language === "en" ? "Logged In Staff:" : "Nhân viên hiện tại:"}</span>
          <span className="font-semibold text-amber-300 flex items-center gap-1">
            <span>{currentUser.avatar}</span>
            <span>{currentUser.name}</span>
          </span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-slate-400">{language === "en" ? "Role & Department:" : "Quyền & Bộ phận:"}</span>
          <span className="font-medium text-slate-200">{roleLabel}</span>
        </div>
        <div className="pt-1">
          <span className="text-slate-400 block mb-1">
            {language === "en" ? "Allowed Modules for Your Role:" : "Các phân hệ được phép truy cập:"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {currentUser.allowedViews.map((v) => (
              <span key={v} className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{v.replace("_", " ").toUpperCase()}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition shadow-lg inline-flex items-center gap-2 text-sm cursor-pointer"
        >
          <UserX className="w-4 h-4" />
          <span>{language === "en" ? "Switch to Authorized Account" : "Chuyển Sang Tài Khoản Có Quyền"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
