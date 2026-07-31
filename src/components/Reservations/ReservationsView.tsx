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
  ArrowRight
} from "lucide-react";
import { Reservation } from "../../types";

export const ReservationsView: React.FC = () => {
  const { reservations, roomTypes, createReservation, businessDate } = usePms();

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
    if (!guestName.trim()) return alert("Enter guest name");

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

    setIsNewBookingModalOpen(false);
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
  };

  return (
    <div className="space-y-5">
      {/* Control Header */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Channel filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">OTA Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Sources</option>
              <option value="Booking.com" className="bg-slate-900">Booking.com</option>
              <option value="Agoda" className="bg-slate-900">Agoda</option>
              <option value="Expedia" className="bg-slate-900">Expedia</option>
              <option value="Direct Web" className="bg-slate-900">Direct Web</option>
              <option value="Walk-In" className="bg-slate-900">Walk-In Desk</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="confirmed" className="bg-slate-900 text-amber-400">Confirmed (Upcoming)</option>
              <option value="checked_in" className="bg-slate-900 text-sky-400">Checked In</option>
              <option value="checked_out" className="bg-slate-900 text-emerald-400">Checked Out</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, guest name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-56"
            />
          </div>
        </div>

        {/* Create Booking Button */}
        <button
          onClick={() => setIsNewBookingModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Code & Guest</th>
                <th className="p-3">Room Type & Number</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Source Channel</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReservations.map((resv) => (
                <tr key={resv.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3">
                    <div className="font-semibold text-slate-100">{resv.guestName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{resv.confirmationCode} • {resv.guestPhone}</div>
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
                      {resv.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-100">
                    ${resv.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
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
                Create New Advance Booking
              </h3>
              <button onClick={() => setIsNewBookingModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Guest full name..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Room Category</label>
                  <select
                    value={roomTypeId}
                    onChange={(e) => setRoomTypeId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {roomTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} (${t.baseRate}/night)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Booking Source Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Agoda">Agoda OTA</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Expedia">Expedia</option>
                    <option value="Direct Web">Direct Website</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Check-In Date</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Check-Out Date</label>
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
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition shadow"
                >
                  Create Reservation
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700"
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
