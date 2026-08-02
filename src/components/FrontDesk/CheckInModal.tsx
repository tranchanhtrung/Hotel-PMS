import React, { useState, useEffect } from "react";
import { usePms } from "../../context/PmsContext";
import { UserCheck, Shield, KeyRound, CreditCard, Hotel, DollarSign, Calendar, Globe, MapPin, Clock, FileText, UserPlus, Trash2, Users } from "lucide-react";
import { GuestProfile } from "../../types";
import { formatVND } from "../../utils/formatters";
import { calculateItemLine } from "../../utils/billing";

export const CheckInModal: React.FC = () => {
  const {
    language,
    t,
    isCheckInModalOpen,
    setIsCheckInModalOpen,
    selectedReservationForCheckIn,
    setSelectedReservationForCheckIn,
    rooms,
    checkIn,
    businessDate,
    hotelInfo
  } = usePms();

  // Multi-guest list state (up to 3 guests)
  const defaultPrimaryGuest: GuestProfile = {
    fullName: "",
    dob: "1995-05-20",
    gender: "Nam",
    idNumber: "",
    nationality: "Việt Nam",
    address: "",
    visaExpiryDate: "",
    phone: "",
    email: "",
    isPrimary: true
  };

  const [guestList, setGuestList] = useState<GuestProfile[]>([defaultPrimaryGuest]);
  const [activeGuestIdx, setActiveGuestIdx] = useState<number>(0);

  // 7. Số phòng (roomId)
  const [roomId, setRoomId] = useState("");
  // 8. Thời gian lưu trú (Giờ, ngày đến)
  const [checkInTime, setCheckInTime] = useState(`${businessDate}T14:00`);
  // 9. Thời gian lưu trú (Giờ, ngày đi)
  const [checkOutTime, setCheckOutTime] = useState("");
  // 11. Ghi chú
  const [notes, setNotes] = useState("");

  // Ancillary fields
  const [nights, setNights] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Credit Card" | "Bank Transfer">("Credit Card");
  const [depositAmount, setDepositAmount] = useState(50);
  const [keycardAssigned, setKeycardAssigned] = useState("");
  const [channel, setChannel] = useState("Walk-In");
  const [submitting, setSubmitting] = useState(false);

  // Active guest helper
  const activeGuest = guestList[activeGuestIdx] || guestList[0] || defaultPrimaryGuest;

  const updateActiveGuest = (field: keyof GuestProfile, value: any) => {
    setGuestList((prev) => {
      const next = [...prev];
      if (next[activeGuestIdx]) {
        next[activeGuestIdx] = { ...next[activeGuestIdx], [field]: value };
      }
      return next;
    });
  };

  const handleAddGuest = () => {
    if (guestList.length >= 3) return;
    const newGuest: GuestProfile = {
      fullName: "",
      dob: "2000-01-01",
      gender: "Nam",
      idNumber: "",
      nationality: activeGuest.nationality || "Việt Nam",
      address: activeGuest.address || "",
      visaExpiryDate: "",
      phone: "",
      email: "",
      isPrimary: false
    };
    setGuestList((prev) => [...prev, newGuest]);
    setActiveGuestIdx(guestList.length);
  };

  const handleRemoveGuest = (index: number) => {
    if (guestList.length <= 1) return;
    setGuestList((prev) => prev.filter((_, i) => i !== index));
    if (activeGuestIdx >= index && activeGuestIdx > 0) {
      setActiveGuestIdx(activeGuestIdx - 1);
    }
  };

  // Calculate default checkOutTime based on businessDate and nights
  useEffect(() => {
    if (checkInTime) {
      const inDate = new Date(checkInTime);
      if (!isNaN(inDate.getTime())) {
        const outDate = new Date(inDate.getTime() + nights * 86400000);
        const yyyy = outDate.getFullYear();
        const mm = String(outDate.getMonth() + 1).padStart(2, '0');
        const dd = String(outDate.getDate()).padStart(2, '0');
        const hh = String(outDate.getHours()).padStart(2, '0');
        const mi = String(outDate.getMinutes()).padStart(2, '0');
        setCheckOutTime(`${yyyy}-${mm}-${dd}T${hh}:${mi}`);
      }
    }
  }, [checkInTime, nights]);

  // Selectable rooms
  const roomOptions = rooms.filter((r) => {
    if (selectedReservationForCheckIn && (r.id === selectedReservationForCheckIn.roomId || r.number === selectedReservationForCheckIn.roomNumber)) {
      return true;
    }
    return r.status === "vacant_clean" || r.status === "vacant_dirty";
  });

  useEffect(() => {
    if (selectedReservationForCheckIn) {
      if (selectedReservationForCheckIn.guests && selectedReservationForCheckIn.guests.length > 0) {
        setGuestList(selectedReservationForCheckIn.guests);
      } else {
        setGuestList([
          {
            fullName: selectedReservationForCheckIn.guestName || "",
            dob: selectedReservationForCheckIn.guestDob || "1992-08-15",
            gender: (selectedReservationForCheckIn.guestGender as any) || "Nam",
            idNumber:
              selectedReservationForCheckIn.guestIdNumber && selectedReservationForCheckIn.guestIdNumber !== "PENDING"
                ? selectedReservationForCheckIn.guestIdNumber
                : "012345678901",
            nationality: selectedReservationForCheckIn.guestNationality || "Việt Nam",
            address: selectedReservationForCheckIn.guestAddress || "123 Đường Lê Lợi, Q.1, TP. Hồ Chí Minh",
            visaExpiryDate: selectedReservationForCheckIn.visaExpiryDate || "",
            phone: selectedReservationForCheckIn.guestPhone || "",
            email: selectedReservationForCheckIn.guestEmail || "",
            isPrimary: true
          }
        ]);
      }
      setActiveGuestIdx(0);
      setNotes(selectedReservationForCheckIn.notes || "");

      const inDate = selectedReservationForCheckIn.checkInDate || businessDate;
      const outDate = selectedReservationForCheckIn.checkOutDate || businessDate;
      setCheckInTime(selectedReservationForCheckIn.checkInTime || `${inDate}T14:00`);
      setCheckOutTime(selectedReservationForCheckIn.checkOutTime || `${outDate}T12:00`);

      // Match room ID
      const reservedRoom = rooms.find(
        (r) => r.id === selectedReservationForCheckIn.roomId || r.number === selectedReservationForCheckIn.roomNumber
      );
      setRoomId(reservedRoom ? reservedRoom.id : selectedReservationForCheckIn.roomId);

      setChannel(selectedReservationForCheckIn.channel || "Walk-In");
      setDepositAmount(selectedReservationForCheckIn.depositAmount || 50);
      setKeycardAssigned(
        selectedReservationForCheckIn.keycardAssigned || `KC-${selectedReservationForCheckIn.roomNumber}-A`
      );
    } else {
      setGuestList([
        {
          fullName: "",
          dob: "1995-05-20",
          gender: "Nam",
          idNumber: "",
          nationality: "Việt Nam",
          address: "",
          visaExpiryDate: "",
          phone: "",
          email: "",
          isPrimary: true
        }
      ]);
      setActiveGuestIdx(0);
      setNotes("");

      setCheckInTime(`${businessDate}T14:00`);

      const available = rooms.filter((r) => r.status === "vacant_clean" || r.status === "vacant_dirty");
      if (available.length > 0) {
        setRoomId(available[0].id);
        setKeycardAssigned(`KC-${available[0].number}-A`);
      } else if (rooms.length > 0) {
        setRoomId(rooms[0].id);
        setKeycardAssigned(`KC-${rooms[0].number}-A`);
      }
      setNights(1);
      setChannel("Walk-In");
      setDepositAmount(50);
    }
  }, [selectedReservationForCheckIn, isCheckInModalOpen, rooms, businessDate]);

  if (!isCheckInModalOpen) return null;

  const svcRate = hotelInfo?.serviceCharge ?? 5;
  const taxRate = hotelInfo?.taxRate ?? 10;

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const roomRate = selectedRoom ? selectedRoom.rate : 50;
  const roomTotal = roomRate * nights;
  const lineCalc = calculateItemLine(roomTotal, "room", svcRate, taxRate);
  const grandTotal = lineCalc.lineTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryG = guestList[0];
    if (!primaryG || !primaryG.fullName.trim()) return;
    if (!roomId) return;

    setSubmitting(true);
    const success = await checkIn({
      reservationId: selectedReservationForCheckIn?.id,
      guestName: primaryG.fullName,
      guestPhone: primaryG.phone || "",
      guestEmail: primaryG.email || "",
      guestIdNumber: primaryG.idNumber || "",
      guestDob: primaryG.dob || "",
      guestGender: primaryG.gender || "Nam",
      guestNationality: primaryG.nationality || "Việt Nam",
      guestAddress: primaryG.address || "",
      visaExpiryDate: primaryG.visaExpiryDate || "",
      guests: guestList,
      checkInTime,
      checkOutTime,
      notes,
      roomId,
      nights,
      paymentMethod,
      depositAmount,
      channel,
      adults: guestList.length,
      keycardAssigned
    });
    setSubmitting(false);

    if (success) {
      setIsCheckInModalOpen(false);
      setSelectedReservationForCheckIn(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-3.5 sm:p-6 space-y-4 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Modal Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                {selectedReservationForCheckIn ? t("checkInTitleRes") : t("checkInTitleWalkIn")}
              </h3>
              <p className="text-xs text-slate-400">{t("policeRegSubtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsCheckInModalOpen(false);
              setSelectedReservationForCheckIn(null);
            }}
            className="text-slate-400 hover:text-slate-100 text-lg p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* SECTION 1: THÔNG TIN CÁ NHÂN & ĐĂNG KÝ LƯU TRÚ (Guest Identity - Up to 3 guests) */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/80 pb-2 gap-2">
              <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-4 h-4" />
                {t("sec1Title")}
              </span>
              <span className="text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {t("sec1Subtitle")} ({guestList.length}/3)
              </span>
            </div>

            {/* Guest Selector Tabs */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-1 border-b border-slate-800/50">
              <div className="flex items-center gap-1.5">
                {guestList.map((g, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveGuestIdx(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeGuestIdx === idx
                        ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span>{idx === 0 ? `👤 ${t("guestTabLabel")} 1 (${t("primaryGuestTag")})` : `👤 ${t("guestTabLabel")} ${idx + 1}`}</span>
                    {g.fullName ? <span className="max-w-[70px] truncate text-[10px] opacity-80">({g.fullName})</span> : null}
                  </button>
                ))}

                {guestList.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddGuest}
                    className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs transition font-semibold"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t("addGuestBtn")}</span>
                  </button>
                )}
              </div>

              {guestList.length > 1 && activeGuestIdx > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveGuest(activeGuestIdx)}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-[11px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2 py-1 rounded transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t("removeGuestBtn")}</span>
                </button>
              )}
            </div>

            {/* Active Guest Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* 1. Họ và tên khách */}
              <div className="md:col-span-2">
                <label className="text-slate-300 block mb-1 font-medium">
                  {t("field1Name")} {activeGuestIdx === 0 ? `(${t("primaryGuestTag")})` : `(${t("guestTabLabel")} ${activeGuestIdx + 1})`}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: NGUYỄN VĂN A"
                  value={activeGuest.fullName || ""}
                  onChange={(e) => updateActiveGuest("fullName", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 uppercase font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 3. Nam / Nữ */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("field3Gender")}</label>
                <select
                  value={activeGuest.gender || "Nam"}
                  onChange={(e) => updateActiveGuest("gender", e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="Nam">{t("genderMale")}</option>
                  <option value="Nữ">{t("genderFemale")}</option>
                  <option value="Khác">{t("genderOther")}</option>
                </select>
              </div>

              {/* 2. Ngày tháng năm sinh */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("field2Dob")}</label>
                <input
                  type="date"
                  required
                  value={activeGuest.dob || ""}
                  onChange={(e) => updateActiveGuest("dob", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 4. Số CMND/ CCCD hoặc Hộ chiếu */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("field4Id")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 012345678901 hoặc B1234567"
                  value={activeGuest.idNumber || ""}
                  onChange={(e) => updateActiveGuest("idNumber", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 5. Quốc tịch */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {t("field5Nationality")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Việt Nam, Hàn Quốc, Mỹ..."
                  value={activeGuest.nationality || ""}
                  onChange={(e) => updateActiveGuest("nationality", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 6. Nơi thường trú/ Tạm trú */}
              <div className="md:col-span-2">
                <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {t("field6Address")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                  value={activeGuest.address || ""}
                  onChange={(e) => updateActiveGuest("address", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 10. Ngày hết hạn visa (Dành cho khách nước ngoài) */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("field10VisaExpiry")}</label>
                <input
                  type="date"
                  value={activeGuest.visaExpiryDate || ""}
                  onChange={(e) => updateActiveGuest("visaExpiryDate", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Số điện thoại phụ */}
              <div>
                <label className="text-slate-400 block mb-1">{t("fieldPhone")}</label>
                <input
                  type="text"
                  placeholder="+84 901234567"
                  value={activeGuest.phone || ""}
                  onChange={(e) => updateActiveGuest("phone", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Email liên hệ */}
              <div>
                <label className="text-slate-400 block mb-1">{t("fieldEmail")}</label>
                <input
                  type="email"
                  placeholder="khachhang@example.com"
                  value={activeGuest.email || ""}
                  onChange={(e) => updateActiveGuest("email", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PHÒNG & THỜI GIAN LƯU TRÚ (Room & Stay Timing) */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                {t("sec2Title")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 7. Số phòng */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("field7Room")}</label>
                <select
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    const rm = rooms.find((r) => r.id === e.target.value);
                    if (rm) setKeycardAssigned(`KC-${rm.number}-A`);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {roomOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng #{r.number} - {r.typeName} ({formatVND(r.rate)}/đêm) {r.status === "vacant_dirty" ? `[${t("vacantDirty")}]` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Số đêm lưu trú */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("fieldNights")}</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={nights}
                  onChange={(e) => setNights(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 8. Thời gian lưu trú (Giờ, ngày đến) */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("field8InTime")}</label>
                <input
                  type="datetime-local"
                  required
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 9. Thời gian lưu trú (Giờ, ngày đi) */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("field9OutTime")}</label>
                <input
                  type="datetime-local"
                  required
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Mã Thẻ Từ (Keycard) */}
              <div>
                <label className="text-slate-400 block mb-1">{t("fieldKeycard")}</label>
                <input
                  type="text"
                  value={keycardAssigned}
                  onChange={(e) => setKeycardAssigned(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Kênh Đặt Phòng */}
              <div>
                <label className="text-slate-400 block mb-1">{t("fieldChannel")}</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Walk-In">Walk-In Lễ Tân</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Agoda">Agoda</option>
                  <option value="Expedia">Expedia</option>
                  <option value="Direct Web">Website Khách Sạn</option>
                </select>
              </div>
            </div>

            {/* 11. Ghi chú */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {t("field11Notes")}
              </label>
              <textarea
                rows={2}
                placeholder="Nhập ghi chú phòng, hoá đơn VAT, dịch vụ đưa đón, hoá đơn công ty..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Folio Billing Summary */}
          <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>{formatVND(roomRate)} x {nights} {language === "vi" ? "đêm" : "nights"} = {formatVND(lineCalc.itemBase)} (Unit Price x Qty = Base)</span>
              <span className="font-mono font-semibold text-slate-100">{formatVND(lineCalc.itemBase)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Phụ phí dịch vụ ({svcRate}%)</span>
              <span className="font-mono text-amber-400">{formatVND(lineCalc.serviceChargeAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Thuế VAT ({taxRate}%) - [(Phòng + Service) x VAT%]</span>
              <span className="font-mono text-sky-400">{formatVND(lineCalc.vatAmount)}</span>
            </div>
            <div className="border-t border-amber-500/20 pt-2 flex justify-between items-center text-sm font-bold text-amber-300">
              <span>{t("totalAmountToPay")}</span>
              <span className="font-mono text-base">{formatVND(grandTotal)}</span>
            </div>
          </div>

          {/* Payment & Security Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">{t("paymentMethodLabel")}</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Credit Card">Thẻ Tín Dụng (Credit Card)</option>
                <option value="Cash">Tiền Mặt (Cash)</option>
                <option value="Bank Transfer">Chuyển Khoản Ngân Hàng / QR</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Tạm Ứng / Đặt Cọc (Đơn vị: 1.000 VNĐ)</label>
              <input
                type="number"
                placeholder="Ví dụ: 50 = 50.000 VNĐ"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg text-xs uppercase tracking-wider"
            >
              {submitting ? t("processingCheckIn") : t("confirmCheckInBtn")}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCheckInModalOpen(false);
                setSelectedReservationForCheckIn(null);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-5 py-3 rounded-xl transition text-xs border border-slate-700"
            >
              {t("cancelBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
