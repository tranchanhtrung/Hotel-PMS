import React, { useState } from "react";
import { usePms } from "../../context/PmsContext";
import {
  Receipt,
  Plus,
  DollarSign,
  Printer,
  CreditCard,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Coffee,
  Shirt
} from "lucide-react";
import { formatVND } from "../../utils/formatters";

export const FolioModal: React.FC = () => {
  const {
    isFolioModalOpen,
    setIsFolioModalOpen,
    activeFolioReservation,
    folios,
    serviceRates,
    addFolioCharge,
    checkOut,
    businessDate
  } = usePms();

  const [extraDesc, setExtraDesc] = useState("Minibar - Bottled Water x2");
  const [extraAmount, setExtraAmount] = useState(4.00);
  const [extraCat, setExtraCat] = useState<"minibar" | "laundry" | "extra" | "damage">("minibar");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Credit Card" | "Bank Transfer">("Credit Card");
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isFolioModalOpen || !activeFolioReservation) return null;

  const folio = folios.find((f) => f.reservationId === activeFolioReservation.id) || {
    id: `fol-${activeFolioReservation.id}`,
    reservationId: activeFolioReservation.id,
    guestName: activeFolioReservation.guestName,
    roomNumber: activeFolioReservation.roomNumber,
    items: [],
    payments: []
  };

  const totalCharges = folio.items.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = folio.payments.reduce((sum, pay) => sum + pay.amount, 0);
  const balanceDue = totalCharges - totalPaid; // > 0: Guest owes money; < 0: Refund owed to guest

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraAmount || extraAmount <= 0) return;
    await addFolioCharge({
      reservationId: activeFolioReservation.id,
      description: extraDesc,
      amount: extraAmount,
      category: extraCat
    });
    setExtraDesc("Minibar - Bottled Water x2");
    setExtraAmount(4.00);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || paymentAmount <= 0) return;
    await addFolioCharge({
      reservationId: activeFolioReservation.id,
      description: `Folio Payment (${paymentMethod})`,
      amount: paymentAmount,
      category: "payment",
      paymentMethod
    });
    setPaymentAmount(0);
  };

  const handleSettleAndCheckout = async () => {
    setIsCheckingOut(true);
    const success = await checkOut({
      reservationId: activeFolioReservation.id,
      settlementMethod: paymentMethod,
      finalPaymentAmount: balanceDue
    });
    setIsCheckingOut(false);
    setShowCheckoutConfirm(false);
    if (success) {
      setIsFolioModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/10 text-amber-400 p-2 rounded-lg border border-amber-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                Guest Folio - Room #{activeFolioReservation.roomNumber}
              </h3>
              <p className="text-xs text-slate-400">
                {activeFolioReservation.guestName}
                {activeFolioReservation.guests && activeFolioReservation.guests.length > 1 && (
                  <span className="ml-1 text-amber-400 text-[11px]">
                    (+{activeFolioReservation.guests.length - 1} {activeFolioReservation.guests.length === 2 ? 'khách' : 'khách'})
                  </span>
                )}
                {" "}• Conf: {activeFolioReservation.confirmationCode}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsFolioModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 text-lg p-1"
          >
            ✕
          </button>
        </div>

        {/* Print Preview Mode vs Edit Mode */}
        {isPrintPreview ? (
          <div className="bg-white text-slate-900 p-6 rounded-xl space-y-4 font-mono text-xs">
            <div className="text-center border-b pb-3">
              <h2 className="font-bold text-base">GRAND STAY HOTEL</h2>
              <p className="text-[10px] text-slate-600">Economy Hotel Management System</p>
              <p className="text-[10px] text-slate-600">Date: {businessDate}</p>
            </div>

            <div className="flex justify-between text-[11px] border-b pb-2">
              <div>
                <p><strong>Guest:</strong> {activeFolioReservation.guestName}</p>
                {activeFolioReservation.guests && activeFolioReservation.guests.length > 1 && (
                  <p className="text-[10px] text-slate-600">
                    <strong>Accompanying Guests:</strong> {activeFolioReservation.guests.slice(1).map(g => g.fullName).join(", ")}
                  </p>
                )}
                <p><strong>Room #:</strong> {activeFolioReservation.roomNumber}</p>
              </div>
              <div className="text-right">
                <p><strong>Code:</strong> {activeFolioReservation.confirmationCode}</p>
                <p><strong>Dates:</strong> {activeFolioReservation.checkInDate} to {activeFolioReservation.checkOutDate}</p>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-[10px] uppercase">
                  <th className="py-1">Date</th>
                  <th className="py-1">Description</th>
                  <th className="py-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {folio.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1">{item.date}</td>
                    <td className="py-1">{item.description}</td>
                    <td className="py-1 text-right">{formatVND(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t pt-2 space-y-1 text-right">
              <p>Subtotal Charges: <strong>{formatVND(totalCharges)}</strong></p>
              <p>Total Paid / Deposited: <strong>{formatVND(totalPaid)}</strong></p>
              {balanceDue > 0 && (
                <p className="text-sm font-bold border-t pt-1 text-rose-700">
                  Balance Due: {formatVND(balanceDue)}
                </p>
              )}
              {balanceDue < 0 && (
                <p className="text-sm font-bold border-t pt-1 text-emerald-700">
                  Refund Due to Guest: {formatVND(Math.abs(balanceDue))}
                </p>
              )}
              {balanceDue === 0 && (
                <p className="text-sm font-bold border-t pt-1 text-emerald-700">
                  Balance: 0.000 VNĐ (Fully Settled)
                </p>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-4 border-t">
              Thank you for staying at Grand Stay Hotel!
            </div>

            <div className="flex gap-2 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 text-white font-sans py-2 rounded-lg text-xs"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setIsPrintPreview(false)}
                className="bg-slate-200 text-slate-800 font-sans px-4 py-2 rounded-lg text-xs"
              >
                Back to Edit
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Folio Items Table */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-800 overflow-hidden text-xs">
              <div className="p-3 bg-slate-800/80 font-semibold text-slate-300 flex justify-between items-center">
                <span>Chi Tiết Phí & Dịch Vụ / Itemized Charges</span>
                <span className="text-amber-400 font-mono">{formatVND(totalCharges)}</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                {folio.items.map((item) => (
                  <div key={item.id} className="p-2.5 flex justify-between items-center text-slate-300 hover:bg-slate-800/30">
                    <div>
                      <div className="font-medium text-slate-100">{item.description}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{item.date} • {item.category}</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-100">{formatVND(item.amount)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Add Extra POS Charge */}
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px]">
                Ghi Phụ Phí / Dịch Vụ POS Bổ Sung (Đơn vị: 1.000 VNĐ)
              </span>

              {/* Quick Presets from Configured Service Rates */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-900/60 rounded-lg border border-slate-800">
                {serviceRates && serviceRates.filter(s => s.isAvailable).length > 0 ? (
                  serviceRates.filter(s => s.isAvailable).map((srv) => {
                    let icon = "🏷️";
                    if (srv.category === "water") icon = "💧";
                    else if (srv.category === "laundry") icon = "🧺";
                    else if (srv.category === "late_checkout") icon = "⏰";
                    else if (srv.category === "extra_bed") icon = "🛏️";

                    let catKey: "minibar" | "laundry" | "extra" | "damage" = "extra";
                    if (srv.category === "water") catKey = "minibar";
                    else if (srv.category === "laundry") catKey = "laundry";

                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => {
                          setExtraDesc(srv.name);
                          setExtraAmount(srv.rate);
                          setExtraCat(catKey);
                        }}
                        className="bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/40 px-2 py-1 rounded border border-slate-700/80 text-[11px] text-slate-200 transition flex items-center gap-1"
                        title={`${srv.name} (${formatVND(srv.rate)} / ${srv.unit})`}
                      >
                        <span>{icon}</span>
                        <span className="font-medium truncate max-w-[120px]">{srv.name}</span>
                        <span className="text-amber-400 font-mono font-bold">({srv.rate}.000đ)</span>
                      </button>
                    );
                  })
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setExtraDesc("Nước suối đóng chai x2"); setExtraAmount(40); setExtraCat("minibar"); }}
                      className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 text-[11px] text-slate-300"
                    >
                      🥤 Nước Suối (40.000đ)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExtraDesc("Dịch vụ giặt ủi lấy liền"); setExtraAmount(100); setExtraCat("laundry"); }}
                      className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 text-[11px] text-slate-300"
                    >
                      👕 Giặt ủi (100.000đ)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExtraDesc("Phí Trả Phòng Trễ (2 giờ)"); setExtraAmount(150); setExtraCat("extra"); }}
                      className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 text-[11px] text-slate-300"
                    >
                      ⏰ Late Checkout (150.000đ)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExtraDesc("Thêm Giường Phụ & Bộ Khăn"); setExtraAmount(120); setExtraCat("extra"); }}
                      className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 text-[11px] text-slate-300"
                    >
                      🛏️ Thêm Giường/Khăn (120.000đ)
                    </button>
                  </>
                )}
              </div>

              <form onSubmit={handleAddCharge} className="flex gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Mô tả khoản phí..."
                  value={extraDesc}
                  onChange={(e) => setExtraDesc(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="number"
                  placeholder="Số tiền (1.000đ)"
                  value={extraAmount}
                  onChange={(e) => setExtraAmount(Number(e.target.value))}
                  className="w-32 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-lg transition"
                >
                  + Thêm Phí
                </button>
              </form>
            </div>

            {/* Payments Summary */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-800 p-3.5 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Thanh Toán Đã Nhận / Payments Received</span>
                <span className="font-mono text-emerald-400 font-semibold">{formatVND(totalPaid)}</span>
              </div>

              {/* Add Payment Input */}
              <form onSubmit={handleAddPayment} className="flex gap-2">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                >
                  <option value="Credit Card">Thẻ Tín Dụng</option>
                  <option value="Cash">Tiền Mặt</option>
                  <option value="Bank Transfer">Chuyển Khoản / QR</option>
                </select>
                <input
                  type="number"
                  placeholder="Số tiền thanh toán (1.000đ)..."
                  value={paymentAmount || ""}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-lg transition"
                >
                  Ghi Nhận Thu Tiền
                </button>
              </form>
            </div>

            {/* Total Balance Due Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between transition ${
                balanceDue > 0
                  ? "bg-rose-950/30 border-rose-500/30"
                  : balanceDue < 0
                  ? "bg-emerald-950/30 border-emerald-500/30"
                  : "bg-slate-800/40 border-slate-700/40"
              }`}
            >
              <div>
                <span className="text-xs text-slate-400 block font-medium">
                  {balanceDue > 0
                    ? "Cần Thanh Toán Còn Lại / Balance Due"
                    : balanceDue < 0
                    ? "Tiền Cọc Dư (Cần Hoàn Trả Khách)"
                    : "Cân Bằng Hóa Đơn (Đã Thanh Toán Xong)"}
                </span>
                <span
                  className={`text-2xl font-bold font-mono ${
                    balanceDue > 0
                      ? "text-rose-400"
                      : balanceDue < 0
                      ? "text-emerald-300"
                      : "text-emerald-400"
                  }`}
                >
                  {balanceDue > 0
                    ? formatVND(balanceDue)
                    : balanceDue < 0
                    ? `-${formatVND(Math.abs(balanceDue))}`
                    : "0.000 VNĐ"}
                </span>
                {balanceDue < 0 && (
                  <span className="text-[11px] text-emerald-400 block mt-0.5">
                    ✓ Khách trả thừa {formatVND(Math.abs(balanceDue))}. Hoàn trả khách khi check-out.
                  </span>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {!showCheckoutConfirm ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrintPreview(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-3 py-2 rounded-xl border border-slate-700 text-xs flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>In Hóa Đơn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCheckoutConfirm(true)}
                      className={`font-bold px-4 py-2 rounded-xl text-xs transition shadow-md cursor-pointer ${
                        balanceDue < 0
                          ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                          : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      }`}
                    >
                      {balanceDue > 0
                        ? "Thanh Toán & Check-Out"
                        : balanceDue < 0
                        ? `Hoàn ${formatVND(Math.abs(balanceDue))} & Check-Out`
                        : "Check-Out Khách"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/50 p-2 rounded-xl animate-in fade-in">
                    <span className="text-[11px] text-slate-200 font-medium px-1">
                      {balanceDue > 0
                        ? `Thu ${formatVND(balanceDue)} & check-out?`
                        : balanceDue < 0
                        ? `Hoàn ${formatVND(Math.abs(balanceDue))} & check-out?`
                        : "Xác nhận check-out?"}
                    </span>
                    <button
                      type="button"
                      onClick={handleSettleAndCheckout}
                      disabled={isCheckingOut}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shadow cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingOut ? (
                        <span>Đang Check-Out...</span>
                      ) : (
                        <span>Xác Nhận Check-Out</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCheckoutConfirm(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-2.5 py-1.5 rounded-lg text-xs border border-slate-700"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
