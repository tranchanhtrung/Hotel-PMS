import React, { useState } from "react";
import { usePms } from "../context/PmsContext";
import { UserRole } from "../types";
import { ShieldCheck, Lock, User, Key, CheckCircle2, ArrowRight, Sparkles, X } from "lucide-react";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    userAccounts,
    loginAsRole,
    loginWithCredentials,
    language,
    t
  } = usePms();

  const [selectedUsername, setSelectedUsername] = useState<string>("admin");
  const [pinInput, setPinInput] = useState<string>("1234");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"quick" | "pin">("quick");

  if (!isAuthModalOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const success = loginWithCredentials(selectedUsername, pinInput);
    if (!success) {
      setErrorMsg(language === "en" ? "Invalid Username or PIN!" : "Tên đăng nhập hoặc mã PIN không đúng!");
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin": return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "front_desk": return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "housekeeper": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "room_attendant": return "bg-teal-500/20 text-teal-300 border-teal-500/40";
      case "sales": return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "night_audit": return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "accounting": return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default: return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  const getRoleLabelKey = (role: UserRole) => {
    switch (role) {
      case "admin": return "roleAdmin";
      case "front_desk": return "roleFrontDesk";
      case "housekeeper": return "roleHousekeeper";
      case "room_attendant": return "roleRoomAttendant";
      case "sales": return "roleSales";
      case "night_audit": return "roleNightAudit";
      case "accounting": return "roleAccounting";
      default: return role;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{t("loginTitle")}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t("loginSubtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab("quick")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "quick"
                ? "border-amber-500 text-amber-400 font-semibold bg-slate-800/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t("quickRoleSwitch")}</span>
          </button>
          <button
            onClick={() => setActiveTab("pin")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "pin"
                ? "border-amber-500 text-amber-400 font-semibold bg-slate-800/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>{t("customPinLogin")}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === "quick" ? (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">
                {language === "en"
                  ? "Click any staff account below to switch permissions instantly and test segregated PMS functions:"
                  : "Nhấp vào bất kỳ tài khoản nhân viên nào bên dưới để chuyển đổi phân quyền ngay lập tức:"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {userAccounts.map((acc) => {
                  const isCurrent = currentUser?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => loginAsRole(acc.role)}
                      className={`p-3.5 rounded-xl border text-left flex items-start justify-between gap-3 transition cursor-pointer relative ${
                        isCurrent
                          ? "bg-slate-800 border-amber-500/80 shadow-md ring-1 ring-amber-500/30"
                          : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-700/60 shadow-inner">
                          {acc.avatar}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{acc.title}</div>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${getRoleBadgeColor(acc.role)}`}>
                              {t(getRoleLabelKey(acc.role))}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              PIN: {acc.pin}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {acc.allowedViews.length} {language === "en" ? "views" : "màn hình"}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 mt-4 inline-block" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4 max-w-md mx-auto py-4">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === "en" ? "Select Account / Username" : "Chọn Tài Khoản / Tên Đăng Nhập"}</span>
                </label>
                <select
                  value={selectedUsername}
                  onChange={(e) => {
                    setSelectedUsername(e.target.value);
                    const acc = userAccounts.find(u => u.username === e.target.value);
                    if (acc) setPinInput(acc.pin);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  {userAccounts.map(u => (
                    <option key={u.id} value={u.username}>
                      {u.name} ({u.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === "en" ? "Security PIN (e.g., 1234, 1111, 2222)" : "Mã PIN Bảo Mật (ví dụ: 1234, 1111, 2222)"}</span>
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 font-mono tracking-widest text-base text-center focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{language === "en" ? "Log In & Apply Permissions" : "Đăng Nhập & Áp Dụng Quyền"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
          <div>
            {language === "en" ? "Active User:" : "Tài khoản hiện tại:"}{" "}
            <span className="font-semibold text-amber-300">{currentUser?.name}</span> ({currentUser?.title})
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            {language === "en" ? "Close" : "Đóng"}
          </button>
        </div>

      </div>
    </div>
  );
};
