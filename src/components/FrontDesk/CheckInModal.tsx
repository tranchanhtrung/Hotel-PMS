import React, { useState, useEffect } from "react";
import { usePms } from "../../context/PmsContext";
import { UserCheck, Shield, KeyRound, CreditCard, Hotel, DollarSign, Calendar, Globe, MapPin, Clock, FileText } from "lucide-react";

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
    businessDate
  } = usePms();

  // 1. Họ và tên khách
  const [guestName, setGuestName] = useState("");
  // 2. Ngày tháng năm sinh
  const [guestDob, setGuestDob] = useState("1995-05-20");
  // 3. Nam/ Nữ
  const [guestGender, setGuestGender] = useState<"Nam" | "Nữ" | "Khác">("Nam");
  // 4. Số CMND/ CCCD hoặc Hộ chiếu
  const [guestIdNumber, setGuestIdNumber] = useState("");
  // 5. Quốc tịch
  const [guestNationality, setGuestNationality] = useState("Việt Nam");
  // 6. Nơi thường trú/ Tạm trú
  const [guestAddress, setGuestAddress] = useState("");
  // 7. Số phòng (roomId)
  const [roomId, setRoomId] = useState("");
  // 8. Thời gian lưu trú (Giờ, ngày đến)
  const [checkInTime, setCheckInTime] = useState(`${businessDate}T14:00`);
  // 9. Thời gian lưu trú (Giờ, ngày đi)
  const [checkOutTime, setCheckOutTime] = useState("");
  // 10. Ngày hết hạn visa
  const [visaExpiryDate, setVisaExpiryDate] = useState("");
  // 11. Ghi chú
  const [notes, setNotes] = useState("");

  // Ancillary fields
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [nights, setNights] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Credit Card" | "Bank Transfer">("Credit Card");
  const [depositAmount, setDepositAmount] = useState(50);
  const [keycardAssigned, setKeycardAssigned] = useState("");
  const [channel, setChannel] = useState("Walk-In");
  const [submitting, setSubmitting] = useState(false);

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
      setGuestName(selectedReservationForCheckIn.guestName || "");
      setGuestPhone(selectedReservationForCheckIn.guestPhone || "");
      setGuestEmail(selectedReservationForCheckIn.guestEmail || "");
      setGuestIdNumber(
        selectedReservationForCheckIn.guestIdNumber && selectedReservationForCheckIn.guestIdNumber !== "PENDING"
          ? selectedReservationForCheckIn.guestIdNumber
          : "012345678901"
      );
      setGuestDob(selectedReservationForCheckIn.guestDob || "1992-08-15");
      setGuestGender((selectedReservationForCheckIn.guestGender as any) || "Nam");
      setGuestNationality(selectedReservationForCheckIn.guestNationality || "Việt Nam");
      setGuestAddress(selectedReservationForCheckIn.guestAddress || "123 Đường Lê Lợi, Q.1, TP. Hồ Chí Minh");
      setVisaExpiryDate(selectedReservationForCheckIn.visaExpiryDate || "");
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
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setGuestIdNumber("");
      setGuestDob("1995-05-20");
      setGuestGender("Nam");
      setGuestNationality("Việt Nam");
      setGuestAddress("");
      setVisaExpiryDate("");
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

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const roomRate = selectedRoom ? selectedRoom.rate : 50;
  const roomTotal = roomRate * nights;
  const tax = roomTotal * 0.05;
  const grandTotal = roomTotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    if (!roomId) return;

    setSubmitting(true);
    const success = await checkIn({
      reservationId: selectedReservationForCheckIn?.id,
      guestName,
      guestPhone,
      guestEmail,
      guestIdNumber,
      guestDob,
      guestGender,
      guestNationality,
      guestAddress,
      visaExpiryDate,
      checkInTime,
      checkOutTime,
      notes,
      roomId,
      nights,
      paymentMethod,
      depositAmount,
      channel,
      keycardAssigned
    });
    setSubmitting(false);

    if (success) {
      setIsCheckInModalOpen(false);
      setSelectedReservationForCheckIn(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
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
          {/* SECTION 1: THÔNG TIN CÁ NHÂN & ĐĂNG KÝ LƯU TRÚ (Guest Identity) */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <UserCheck className="w-4 h-4" />
                {t("sec1Title")}
              </span>
              <span className="text-[10px] text-slate-400">{t("sec1Subtitle")}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Họ và tên khách */}
              <div className="md:col-span-2">
                <label className="text-slate-300 block mb-1 font-medium">{t("field1Name")}</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: NGUYỄN VĂN A"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 uppercase font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 3. Nam / Nữ */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("field3Gender")}</label>
                <select
                  value={guestGender}
                  onChange={(e) => setGuestGender(e.target.value as any)}
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
                  value={guestDob}
                  onChange={(e) => setGuestDob(e.target.value)}
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
                  value={guestIdNumber}
                  onChange={(e) => setGuestIdNumber(e.target.value)}
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
                  value={guestNationality}
                  onChange={(e) => setGuestNationality(e.target.value)}
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
                  value={guestAddress}
                  onChange={(e) => setGuestAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 10. Ngày hết hạn visa (Dành cho khách nước ngoài) */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t("field10VisaExpiry")}</label>
                <input
                  type="date"
                  value={visaExpiryDate}
                  onChange={(e) => setVisaExpiryDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Số điện thoại phụ */}
              <div>
                <label className="text-slate-400 block mb-1">{t("fieldPhone")}</label>
                <input
                  type="text"
                  placeholder="+84 901234567"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Email liên hệ */}
              <div>
                <label className="text-slate-400 block mb-1">{t("fieldEmail")}</label>
                <input
                  type="email"
                  placeholder="khachhang@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
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
                      Phòng #{r.number} - {r.typeName} (${r.rate}/đêm) {r.status === "vacant_dirty" ? `[${t("vacantDirty")}]` : ""}
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
          <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">{t("roomRateNights")} ({nights} nights @ ${roomRate}/night)</span>
              <span className="font-mono font-semibold text-slate-100">${roomTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>{t("taxCityFee")}</span>
              <span className="font-mono">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-amber-500/20 pt-2 flex justify-between items-center text-sm font-bold text-amber-300">
              <span>{t("totalAmountToPay")}</span>
              <span className="font-mono text-base">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment & Security Deposit */}
          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-slate-300 block mb-1 font-medium">{t("depositLabel")}</label>
              <input
                type="number"
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
