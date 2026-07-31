import React, { useState } from "react";
import { usePms } from "../../context/PmsContext";
import {
  CalendarDays,
  Plus,
  Search,
  Globe,
  User,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText
} from "lucide-react";
import { Reservation } from "../../types";
import { formatVND } from "../../utils/formatters";

export const ReservationsView: React.FC = () => {
  const {
    reservations,
    roomTypes,
    rooms,
    createReservation,
    updateReservation,
    deleteReservation,
    businessDate,
    language,
    t
  } = usePms();

  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

  // New Booking Form state
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("std-single");
  const [checkInDate, setCheckInDate] = useState(businessDate);
  const [checkOutDate, setCheckOutDate] = useState("2026-08-02");
  const [channel, setChannel] = useState("Agoda");
  const [adults, setAdults] = useState(1);

  // Edit Booking Form state
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [editGuestName, setEditGuestName] = useState("");
  const [editGuestPhone, setEditGuestPhone] = useState("");
  const [editGuestEmail, setEditGuestEmail] = useState("");
  const [editRoomTypeId, setEditRoomTypeId] = useState("");
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editCheckInDate, setEditCheckInDate] = useState("");
  const [editCheckOutDate, setEditCheckOutDate] = useState("");
  const [editChannel, setEditChannel] = useState("");
  const [editStatus, setEditStatus] = useState<"confirmed" | "checked_in" | "checked_out">("confirmed");
  const [editAdults, setEditAdults] = useState(1);
  const [editNotes, setEditNotes] = useState("");

  // Delete Confirmation state
  const [deletingRes, setDeletingRes] = useState<Reservation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredReservations = reservations.filter((r) => {
    if (channelFilter !== "all" && r.channel !== channelFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!r.guestName.toLowerCase().includes(q) && !r.confirmationCode.toLowerCase().includes(q) && !r.roomNumber.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return alert("Please enter guest name");

    setIsSubmitting(true);
    await createReservation({
      guestName,
      guestPhone,
      guestEmail,
      roomTypeId,
      checkInDate,
      checkOutDate,
      adults,
      channel
    });

    setIsSubmitting(false);
    setIsNewBookingModalOpen(false);
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
  };

  const openEditModal = (resv: Reservation) => {
    setEditingRes(resv);
    setEditGuestName(resv.guestName || "");
    setEditGuestPhone(resv.guestPhone || "");
    setEditGuestEmail(resv.guestEmail || "");
    const foundType = roomTypes.find((t) => t.name === resv.roomTypeName);
    setEditRoomTypeId(foundType ? foundType.id : roomTypes[0]?.id || "");
    setEditRoomNumber(resv.roomNumber || "");
    setEditCheckInDate(resv.checkInDate || businessDate);
    setEditCheckOutDate(resv.checkOutDate || "2026-08-02");
    setEditChannel(resv.channel || "Agoda");
    setEditStatus(resv.status as any);
    setEditAdults(resv.adults || 1);
    setEditNotes(resv.notes || "");
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRes || !editGuestName.trim()) return;

    setIsSubmitting(true);
    await updateReservation({
      id: editingRes.id,
      guestName: editGuestName,
      guestPhone: editGuestPhone,
      guestEmail: editGuestEmail,
      roomTypeId: editRoomTypeId,
      roomNumber: editRoomNumber,
      checkInDate: editCheckInDate,
      checkOutDate: editCheckOutDate,
      channel: editChannel,
      status: editStatus,
      adults: editAdults,
      notes: editNotes
    });

    setIsSubmitting(false);
    setEditingRes(null);
  };

  const handleDeleteBooking = async () => {
    if (!deletingRes) return;
    setIsSubmitting(true);
    await deleteReservation(deletingRes.id);
    setIsSubmitting(false);
    setDeletingRes(null);
  };

  return (
    <div className="space-y-5">
      {/* Control Header */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Channel filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">{language === "en" ? "OTA Channel:" : "Kênh OTA:"}</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">{language === "en" ? "All Sources" : "Tất cả nguồn"}</option>
              <option value="Booking.com" className="bg-slate-900">Booking.com</option>
              <option value="Agoda" className="bg-slate-900">Agoda</option>
              <option value="Expedia" className="bg-slate-900">Expedia</option>
              <option value="Direct Web" className="bg-slate-900">Direct Web</option>
              <option value="Walk-In" className="bg-slate-900">Walk-In Desk</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <span className="text-slate-400">{language === "en" ? "Status:" : "Trạng thái:"}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">{language === "en" ? "All Statuses" : "Tất cả trạng thái"}</option>
              <option value="confirmed" className="bg-slate-900 text-amber-400">{language === "en" ? "Confirmed" : "Đã xác nhận"}</option>
              <option value="checked_in" className="bg-slate-900 text-sky-400">{language === "en" ? "Checked In" : "Đã nhận phòng"}</option>
              <option value="checked_out" className="bg-slate-900 text-emerald-400">{language === "en" ? "Checked Out" : "Đã trả phòng"}</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder={language === "en" ? "Search booking code, guest, room..." : "Tìm mã đặt, tên khách, số phòng..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-60"
            />
          </div>
        </div>

        {/* Create Booking Button */}
        <button
          onClick={() => setIsNewBookingModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>{language === "en" ? "+ New Booking" : "Tạo Đặt Phòng Mới"}</span>
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">{language === "en" ? "Code & Guest" : "Mã & Khách Hàng"}</th>
                <th className="p-3">{language === "en" ? "Room & Type" : "Loại & Số Phòng"}</th>
                <th className="p-3">{language === "en" ? "Stay Duration" : "Thời Gian Lưu Trú"}</th>
                <th className="p-3">{language === "en" ? "Channel" : "Kênh Đặt"}</th>
                <th className="p-3">{language === "en" ? "Status" : "Trạng Thái"}</th>
                <th className="p-3 text-right">{language === "en" ? "Total Amount" : "Tổng Tiền"}</th>
                <th className="p-3 text-center">{language === "en" ? "Action" : "Thao Tác"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    {language === "en" ? "No reservations found." : "Không tìm thấy đặt phòng nào."}
                  </td>
                </tr>
              ) : (
                filteredReservations.map((resv) => (
                  <tr key={resv.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-semibold text-slate-100">{resv.guestName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {resv.confirmationCode} {resv.guestPhone ? `• ${resv.guestPhone}` : ""}
                      </div>
                      {resv.guests && resv.guests.length > 1 && (
                        <div className="text-[10px] text-amber-400/80">
                          {language === "en" ? `+${resv.guests.length - 1} acc. guests` : `+${resv.guests.length - 1} khách đi cùng`}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-amber-300">#{resv.roomNumber}</span>
                      <span className="block text-[10px] text-slate-400">{resv.roomTypeName}</span>
                    </td>
                    <td className="p-3 text-slate-300 font-mono">
                      {resv.checkInDate} → {resv.checkOutDate}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {resv.channel}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          resv.status === "checked_in"
                            ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                            : resv.status === "confirmed"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {resv.status === "checked_in"
                          ? (language === "en" ? "CHECKED IN" : "ĐÃ NHẬN PHÒNG")
                          : resv.status === "confirmed"
                          ? (language === "en" ? "CONFIRMED" : "ĐÃ XÁC NHẬN")
                          : (language === "en" ? "CHECKED OUT" : "ĐÃ TRẢ PHÒNG")}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-100">
                      {formatVND(resv.totalAmount)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(resv)}
                          title={language === "en" ? "Edit Booking" : "Sửa Đặt Phòng"}
                          className="bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 p-1.5 rounded-lg transition flex items-center gap-1 text-[11px] font-medium"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{language === "en" ? "Edit" : "Sửa"}</span>
                        </button>
                        <button
                          onClick={() => setDeletingRes(resv)}
                          title={language === "en" ? "Delete Booking" : "Xóa Đặt Phòng"}
                          className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 p-1.5 rounded-lg transition flex items-center gap-1 text-[11px] font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{language === "en" ? "Delete" : "Xóa"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Booking Modal */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-400" />
                {language === "en" ? "New Booking Reservation" : "Tạo Đặt Phòng Mới"}
              </h3>
              <button
                onClick={() => setIsNewBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Guest Full Name *" : "Họ & Tên Khách *"}</label>
                <input
                  type="text"
                  required
                  placeholder={language === "en" ? "e.g. John Smith..." : "Họ và tên..."}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Phone Number" : "Điện Thoại"}</label>
                  <input
                    type="text"
                    placeholder="+84 901234567"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Email Address" : "Email"}</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Room Category" : "Loại Phòng"}</label>
                  <select
                    value={roomTypeId}
                    onChange={(e) => setRoomTypeId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} ({formatVND(rt.baseRate)}{language === "en" ? "/night" : "/đêm"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Guests (Max 3)" : "Số Khách (Tối đa 3)"}</label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Math.min(3, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>{language === "en" ? "1 Guest" : "1 Khách"}</option>
                    <option value={2}>{language === "en" ? "2 Guests" : "2 Khách"}</option>
                    <option value={3}>{language === "en" ? "3 Guests (Max)" : "3 Khách (Tối đa)"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Channel" : "Kênh Đặt"}</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Agoda">Agoda OTA</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Expedia">Expedia</option>
                  <option value="Direct Web">Direct Website</option>
                  <option value="Walk-In">Walk-In Desk</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Check-In Date" : "Ngày Đến"}</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Check-Out Date" : "Ngày Đi"}</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition shadow disabled:opacity-50"
                >
                  {isSubmitting
                    ? (language === "en" ? "Processing..." : "Đang xử lý...")
                    : (language === "en" ? "Confirm Reservation" : "Xác Nhận Tạo Đặt Phòng")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700"
                >
                  {language === "en" ? "Cancel" : "Hủy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingRes && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2 text-sky-400">
                  <Pencil className="w-5 h-5 text-sky-400" />
                  {language === "en" ? "Modify Booking Reservation" : "Chỉnh Sửa Đặt Phòng"}
                </h3>
                <p className="text-[11px] text-slate-400">{language === "en" ? "Code: " : "Mã xác nhận: "}<span className="font-mono text-amber-300">{editingRes.confirmationCode}</span></p>
              </div>
              <button onClick={() => setEditingRes(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleUpdateBooking} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Guest Full Name *" : "Họ & Tên Khách *"}</label>
                <input
                  type="text"
                  required
                  value={editGuestName}
                  onChange={(e) => setEditGuestName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Phone Number" : "Điện Thoại"}</label>
                  <input
                    type="text"
                    value={editGuestPhone}
                    onChange={(e) => setEditGuestPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Email Address" : "Email"}</label>
                  <input
                    type="email"
                    value={editGuestEmail}
                    onChange={(e) => setEditGuestEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Room Type" : "Hạng Phòng"}</label>
                  <select
                    value={editRoomTypeId}
                    onChange={(e) => setEditRoomTypeId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    {roomTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({formatVND(t.baseRate)}{language === "en" ? "/night" : "/đêm"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Assign Room #" : "Gán Số Phòng"}</label>
                  <select
                    value={editRoomNumber}
                    onChange={(e) => setEditRoomNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.number}>
                        {language === "en" ? `Room #${r.number} (${r.typeName})` : `Phòng #${r.number} (${r.typeName})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Check-In Date" : "Ngày Đến"}</label>
                  <input
                    type="date"
                    value={editCheckInDate}
                    onChange={(e) => setEditCheckInDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Check-Out Date" : "Ngày Đi"}</label>
                  <input
                    type="date"
                    value={editCheckOutDate}
                    onChange={(e) => setEditCheckOutDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Guests (Max 3)" : "Số Khách (Tối đa 3)"}</label>
                  <select
                    value={editAdults}
                    onChange={(e) => setEditAdults(Math.min(3, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold focus:outline-none focus:border-sky-500"
                  >
                    <option value={1}>{language === "en" ? "1 Guest" : "1 Khách"}</option>
                    <option value={2}>{language === "en" ? "2 Guests" : "2 Khách"}</option>
                    <option value={3}>{language === "en" ? "3 Guests (Max)" : "3 Khách (Tối đa)"}</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Channel" : "Kênh"}</label>
                  <select
                    value={editChannel}
                    onChange={(e) => setEditChannel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Agoda">Agoda OTA</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Expedia">Expedia</option>
                    <option value="Direct Web">Direct Website</option>
                    <option value="Walk-In">Walk-In Desk</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Status" : "Trạng Thái"}</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="confirmed">{language === "en" ? "Confirmed" : "Đã xác nhận"}</option>
                    <option value="checked_in">{language === "en" ? "Checked In" : "Đã nhận phòng"}</option>
                    <option value="checked_out">{language === "en" ? "Checked Out" : "Đã trả phòng"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">{language === "en" ? "Notes" : "Ghi Chú"}</label>
                <textarea
                  rows={2}
                  placeholder={language === "en" ? "Booking notes..." : "Ghi chú đặt phòng..."}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 rounded-xl transition shadow disabled:opacity-50"
                >
                  {isSubmitting
                    ? (language === "en" ? "Saving..." : "Đang lưu...")
                    : (language === "en" ? "Save Changes" : "Lưu Thay Đổi")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRes(null)}
                  className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700"
                >
                  {language === "en" ? "Cancel" : "Hủy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRes && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-400">
                  {language === "en" ? "Confirm Booking Deletion" : "Xác Nhận Xóa Đặt Phòng"}
                </h3>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
              <p><strong className="text-slate-400">{language === "en" ? "Booking Code:" : "Mã Đặt:"}</strong> <span className="font-mono text-amber-300 font-bold">{deletingRes.confirmationCode}</span></p>
              <p><strong className="text-slate-400">{language === "en" ? "Guest:" : "Khách Hàng:"}</strong> <span className="font-semibold">{deletingRes.guestName}</span></p>
              <p><strong className="text-slate-400">{language === "en" ? "Room:" : "Phòng:"}</strong> #{deletingRes.roomNumber} ({deletingRes.roomTypeName})</p>
              <p><strong className="text-slate-400">{language === "en" ? "Duration:" : "Thời Gian:"}</strong> {deletingRes.checkInDate} → {deletingRes.checkOutDate}</p>
            </div>

            <p className="text-xs text-slate-300">
              {language === "en"
                ? "Are you sure you want to delete this booking reservation? This action cannot be undone."
                : "Bạn có chắc chắn muốn xóa đơn đặt phòng này khỏi hệ thống không? Thao tác này không thể hoàn tác."}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDeleteBooking}
                disabled={isSubmitting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl transition shadow disabled:opacity-50"
              >
                {isSubmitting
                  ? (language === "en" ? "Deleting..." : "Đang xóa...")
                  : (language === "en" ? "Delete Booking" : "Xóa Đặt Phòng")}
              </button>
              <button
                onClick={() => setDeletingRes(null)}
                className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700"
              >
                {language === "en" ? "Cancel" : "Hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
