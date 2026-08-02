import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// --- In-Memory Initial Seed Data for Economy Hotel (<100 rooms) ---
// Total 72 Rooms across 4 Floors (101-118, 201-218, 301-318, 401-418)
let roomTypesData = [
  { id: "std-single", name: "Standard Single", baseRate: 450, maxGuests: 1, total: 24, description: "Phòng đơn tiêu chuẩn 16m², giường đơn, máy lạnh, bàn làm việc, phòng tắm riêng" },
  { id: "std-double", name: "Standard Double", baseRate: 600, maxGuests: 2, total: 28, description: "Phòng đôi tiêu chuẩn 22m², giường đôi Queen, TV thông minh, tủ lạnh mini" },
  { id: "dlx-twin", name: "Deluxe Twin", baseRate: 750, maxGuests: 3, total: 14, description: "Phòng đôi cao cấp 28m², 2 giường đơn, hướng phố, máy pha cà phê" },
  { id: "eco-suite", name: "Economy Suite", baseRate: 1100, maxGuests: 3, total: 6, description: "Phòng Suite tiết kiệm 38m², phòng khách riêng, giường King, bồn tắm (Tối đa 3 khách)" }
];

interface RatePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  rates: Record<string, number>;
  multiplier: number;
  isDefault: boolean;
  notes: string;
}

// Seasonal & Multi-Period Rate Settings
let ratePeriodsData: RatePeriod[] = [
  {
    id: "period-default",
    name: "Mùa Tiêu Chuẩn (Standard Base)",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    rates: {
      "std-single": 450,
      "std-double": 600,
      "dlx-twin": 750,
      "eco-suite": 1100
    },
    multiplier: 1.0,
    isDefault: true,
    notes: "Bảng giá tiêu chuẩn mặc định quanh năm"
  },
  {
    id: "period-summer-peak",
    name: "Mùa Cao Điểm Hè (Summer Peak)",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    rates: {
      "std-single": 650,
      "std-double": 850,
      "dlx-twin": 1100,
      "eco-suite": 1600
    },
    multiplier: 1.35,
    isDefault: false,
    notes: "Tăng giá mùa du lịch hè (+35%)"
  },
  {
    id: "period-holidays",
    name: "Cao Điểm Lễ Tết (Festive Peak)",
    startDate: "2026-12-20",
    endDate: "2027-01-05",
    rates: {
      "std-single": 800,
      "std-double": 1000,
      "dlx-twin": 1300,
      "eco-suite": 2000
    },
    multiplier: 1.6,
    isDefault: false,
    notes: "Tăng giá dịp Giáng Sinh & Tết (+60%)"
  },
  {
    id: "period-low-autumn",
    name: "Khuyến Mãi Mùa Thấp Điểm (Low Season)",
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    rates: {
      "std-single": 380,
      "std-double": 500,
      "dlx-twin": 650,
      "eco-suite": 950
    },
    multiplier: 0.85,
    isDefault: false,
    notes: "Ưu đãi giảm giá mùa thấp điểm (-15%)"
  }
];

// Configured Tariff Rates for Services & Extra Fees
let serviceRatesData = [
  // Water / Minibar
  { id: "srv-water-1", category: "water", name: "Nước suối Aquafina 500ml", unit: "chai", rate: 20, description: "Nước suối đóng chai minibar phòng", isAvailable: true },
  { id: "srv-water-2", category: "water", name: "Nước khoáng Perrier 330ml", unit: "chai", rate: 50, description: "Nước khoáng thiên nhiên có ga", isAvailable: true },
  { id: "srv-water-3", category: "water", name: "Nước ngọt (Coca-Cola / Pepsi / RedBull)", unit: "lon", rate: 30, description: "Đồ uống giải khát minibar", isAvailable: true },
  { id: "srv-water-4", category: "water", name: "Bia Saigon Special / Tiger 330ml", unit: "lon", rate: 40, description: "Bia ướp lạnh minibar", isAvailable: true },

  // Laundry
  { id: "srv-laundry-1", category: "laundry", name: "Giặt sấy quần áo thông thường", unit: "kg", rate: 40, description: "Giặt sấy gấp gọn trong ngày (nhận trước 12:00)", isAvailable: true },
  { id: "srv-laundry-2", category: "laundry", name: "Giặt hấp & Ủi sơ mi / Quần tây", unit: "cái", rate: 60, description: "Giặt hấp cao cấp bảo vệ chất liệu vải", isAvailable: true },
  { id: "srv-laundry-3", category: "laundry", name: "Giặt khô Vest / Đầm dạ hội", unit: "bộ", rate: 120, description: "Giặt khô bảo quản trang phục cao cấp", isAvailable: true },

  // Late Checkout
  { id: "srv-checkout-1", category: "late_checkout", name: "Trả phòng muộn 1 - 2 giờ (Đến 14:00)", unit: "phòng", rate: 100, description: "Phụ thu trả phòng muộn dưới 2 tiếng", isAvailable: true },
  { id: "srv-checkout-2", category: "late_checkout", name: "Trả phòng muộn 3 - 5 giờ (Đến 17:00)", unit: "phòng", rate: 300, description: "Phụ thu 50% tiền phòng theo quy định", isAvailable: true },
  { id: "srv-checkout-3", category: "late_checkout", name: "Trả phòng sau 18:00 (Nguyên ngày)", unit: "phòng", rate: 600, description: "Tính 100% giá đêm phòng hiện tại", isAvailable: true },

  // Extra Bed
  { id: "srv-extrabed-1", category: "extra_bed", name: "Giường phụ nệm lót Extra Bed", unit: "đêm", rate: 250, description: "Kèm chăn ga gối nệm tiêu chuẩn 5 sao", isAvailable: true },
  { id: "srv-extrabed-2", category: "extra_bed", name: "Phụ thu Khách thứ 3 (Không kèm giường)", unit: "người/đêm", rate: 150, description: "Phụ thu người lớn phát sinh ngoài định mức", isAvailable: true },
  { id: "srv-extrabed-3", category: "extra_bed", name: "Bộ chăn gối phụ em bé", unit: "đêm", rate: 100, description: "Bộ chăn gối mềm dành cho trẻ nhỏ", isAvailable: true },

  // Other Services
  { id: "srv-other-1", category: "other", name: "Đưa đón sân bay (Xe 4 chỗ)", unit: "chuyến", rate: 350, description: "Đón tiễn sân bay Tân Sơn Nhất / Nội Bài", isAvailable: true },
  { id: "srv-other-2", category: "other", name: "Thuê xe máy tay ga (24 giờ)", unit: "chiếc/ngày", rate: 150, description: "Bao gồm 2 mũ bảo hiểm & bản đồ du lịch", isAvailable: true },
  { id: "srv-other-3", category: "other", name: "Phụ thu thú cưng nhỏ (< 5kg)", unit: "lượt", rate: 200, description: "Chi phí khử trùng vệ sinh phòng chuyên dụng", isAvailable: true },
  { id: "srv-other-4", category: "other", name: "In ấn / Photo tài liệu A4", unit: "trang", rate: 5, description: "Hỗ trợ in ấn photo tại quầy lễ tân", isAvailable: true }
];

function generateSeedRooms() {
  const rooms = [];
  const floors = [1, 2, 3, 4];
  
  for (const floor of floors) {
    for (let num = 1; num <= 18; num++) {
      const roomNum = `${floor}${num < 10 ? '0' : ''}${num}`;
      let roomTypeId = "std-single";
      let rate = 45;

      if (num <= 6) {
        roomTypeId = "std-single";
        rate = 450;
      } else if (num <= 13) {
        roomTypeId = "std-double";
        rate = 600;
      } else if (num <= 16) {
        roomTypeId = "dlx-twin";
        rate = 750;
      } else {
        roomTypeId = "eco-suite";
        rate = 1100;
      }

      // Assign initial varied statuses
      let status: "vacant_clean" | "vacant_dirty" | "occupied_clean" | "occupied_dirty" | "out_of_order" = "vacant_clean";
      let housekeeper = "Unassigned";

      // Make realistic mix
      if (num % 5 === 0) status = "occupied_clean";
      else if (num % 7 === 0) status = "occupied_dirty";
      else if (num % 9 === 0) status = "vacant_dirty";
      else if (floor === 4 && num === 18) status = "out_of_order";

      if (status === "vacant_dirty" || status === "occupied_dirty") {
        housekeeper = (num % 2 === 0) ? "Maria Santos" : "John Doe";
      }

      rooms.push({
        id: `room-${roomNum}`,
        number: roomNum,
        floor,
        typeId: roomTypeId,
        typeName: roomTypesData.find(r => r.id === roomTypeId)?.name || "Standard",
        rate,
        status,
        housekeeper,
        notes: status === "out_of_order" ? "Air conditioner compressor repair pending" : "",
        lastCleanedAt: new Date(Date.now() - (num * 3600000)).toISOString()
      });
    }
  }
  return rooms;
}

let roomsData = generateSeedRooms();

// Seed Housekeepers / Room Attendants
let housekeepersData = [
  { id: "hk-1", name: "Maria Santos", phone: "+1 555-0101", status: "Active" },
  { id: "hk-2", name: "John Doe", phone: "+1 555-0102", status: "Active" },
  { id: "hk-3", name: "Anna Smith", phone: "+1 555-0103", status: "Active" },
  { id: "hk-4", name: "David Miller", phone: "+1 555-0104", status: "Active" }
];

// Business Date state
let businessDate = "2026-07-30";

// Seed Guests & Reservations
let reservationsData: any[] = [
  {
    id: "res-1001",
    confirmationCode: "GS-8912",
    guestName: "Alexander Wright",
    guestPhone: "+1 555-0192",
    guestEmail: "alex.wright@example.com",
    guestIdNumber: "PASSPORT-A98124",
    roomId: "room-105",
    roomNumber: "105",
    roomTypeName: "Standard Single",
    checkInDate: "2026-07-29",
    checkOutDate: "2026-08-02",
    status: "checked_in", // confirmed, checked_in, checked_out, cancelled
    totalAmount: 1800,
    paidAmount: 1800,
    channel: "Walk-In",
    adults: 1,
    children: 0,
    keycardAssigned: "KC-105-A",
    depositAmount: 500,
    createdAt: "2026-07-29T14:20:00Z"
  },
  {
    id: "res-1002",
    confirmationCode: "GS-4421",
    guestName: "Elena Rostova",
    guestPhone: "+1 555-0341",
    guestEmail: "elena.r@example.com",
    guestIdNumber: "DL-908231",
    roomId: "room-210",
    roomNumber: "210",
    roomTypeName: "Standard Double",
    checkInDate: "2026-07-30",
    checkOutDate: "2026-08-01",
    status: "checked_in",
    totalAmount: 1200,
    paidAmount: 1200,
    channel: "Booking.com",
    adults: 2,
    children: 0,
    keycardAssigned: "KC-210-A",
    depositAmount: 500,
    createdAt: "2026-07-28T09:15:00Z"
  },
  {
    id: "res-1003",
    confirmationCode: "GS-5510",
    guestName: "David Chen",
    guestPhone: "+1 555-0823",
    guestEmail: "dchen@example.com",
    guestIdNumber: "PASSPORT-C7721",
    roomId: "room-315",
    roomNumber: "315",
    roomTypeName: "Deluxe Twin",
    checkInDate: "2026-07-30",
    checkOutDate: "2026-08-03",
    status: "confirmed", // expected arrival today
    totalAmount: 3000,
    paidAmount: 0,
    channel: "Agoda",
    adults: 2,
    children: 1,
    keycardAssigned: "",
    depositAmount: 0,
    createdAt: "2026-07-25T18:40:00Z"
  },
  {
    id: "res-1004",
    confirmationCode: "GS-6692",
    guestName: "Sarah Jenkins",
    guestPhone: "+1 555-0451",
    guestEmail: "s.jenkins@example.com",
    guestIdNumber: "DL-334120",
    roomId: "room-417",
    roomNumber: "417",
    roomTypeName: "Economy Suite",
    checkInDate: "2026-07-28",
    checkOutDate: "2026-07-30",
    status: "checked_in", // expected departure today
    totalAmount: 2200,
    paidAmount: 2200,
    channel: "Direct Web",
    adults: 2,
    children: 0,
    keycardAssigned: "KC-417-A",
    depositAmount: 1000,
    createdAt: "2026-07-20T11:00:00Z"
  }
];

// Seed Folios (Bill breakdown)
let foliosData = [
  {
    id: "fol-1001",
    reservationId: "res-1001",
    guestName: "Alexander Wright",
    roomNumber: "105",
    items: [
      { id: "item-1", date: "2026-07-29", description: "Room Charge - Std Single", unitPrice: 450, quantity: 1, amount: 450, category: "room" },
      { id: "item-3", date: "2026-07-29", description: "Minibar - Bottled Mineral Water", unitPrice: 20, quantity: 2, amount: 40, category: "minibar" },
      { id: "item-4", date: "2026-07-30", description: "Room Charge - Std Single", unitPrice: 450, quantity: 1, amount: 450, category: "room" }
    ],
    payments: [
      { id: "pay-1", date: "2026-07-29", description: "Credit Card Payment (Initial)", amount: 985, method: "Credit Card" },
      { id: "pay-2", date: "2026-07-29", description: "Security Deposit Hold", amount: 500, method: "Credit Card" }
    ]
  },
  {
    id: "fol-1002",
    reservationId: "res-1002",
    guestName: "Elena Rostova",
    roomNumber: "210",
    items: [
      { id: "item-10", date: "2026-07-30", description: "Room Charge - Std Double", unitPrice: 600, quantity: 1, amount: 600, category: "room" },
      { id: "item-12", date: "2026-07-30", description: "Express Laundry Service", unitPrice: 120, quantity: 1, amount: 120, category: "laundry" }
    ],
    payments: [
      { id: "pay-10", date: "2026-07-30", description: "Cash Payment", amount: 750, method: "Cash" }
    ]
  }
];

// Hotel Profile Data
let hotelInfoData = {
  name: "Grand Stay Hotel & Suites",
  address: "123 Vo Van Kiet Boulevard, District 1, Ho Chi Minh City",
  phone: "+84 28 3822 9999",
  email: "info@grandstayhotel.vn",
  starRating: 4,
  checkInTime: "14:00",
  checkOutTime: "12:00",
  currency: "VND",
  taxRate: 10,
  serviceCharge: 5,
  totalRooms: 72
};

// Audit & Activity Logs
let auditLogs = [
  { id: "log-1", timestamp: new Date(Date.now() - 7200000).toISOString(), staff: "Front Desk (John)", action: "Check-In", details: "Checked in Elena Rostova to Room 210 with deposit $50" },
  { id: "log-2", timestamp: new Date(Date.now() - 3600000).toISOString(), staff: "Housekeeping (Maria)", action: "Room Cleaned", details: "Marked Room 102 as Vacant Clean" },
  { id: "log-3", timestamp: new Date(Date.now() - 1800000).toISOString(), staff: "System", action: "Night Audit Completed", details: "Night audit posted $2,480 room revenue for 2026-07-29" }
];

// Submitted Reports to Accounting/Audit Dept
let submittedReportsData = [
  {
    id: "rpt-101",
    reportRefNumber: "RPT-20260729-AUDIT",
    reportType: "Full End-of-Day Master Audit" as const,
    department: "Accounting Dept" as const,
    businessDate: "2026-07-29",
    submittedAt: "2026-07-29T23:45:00Z",
    submittedBy: "Night Auditor (Sarah)",
    notes: "Daily revenue & room charge settlement transferred for accounting audit.",
    status: "Audited & Approved" as const,
    summaryData: {
      totalRevenue: 2480,
      roomRevenue: 2300,
      taxes: 115,
      otherCharges: 65,
      occupancyRate: 35,
      adr: 62.50,
      revpar: 21.80,
      cleanRoomsCount: 45,
      dirtyRoomsCount: 22,
      oooRoomsCount: 5,
      totalBookings: 25
    }
  },
  {
    id: "rpt-102",
    reportRefNumber: "RPT-20260730-HK",
    reportType: "Housekeeping & Turnover" as const,
    department: "Internal Audit Dept" as const,
    businessDate: "2026-07-30",
    submittedAt: "2026-07-30T16:30:00Z",
    submittedBy: "Housekeeping Lead (Maria)",
    notes: "Shift handover report with 18 turnovers completed and 5 OOO maintenance logs.",
    status: "Transferred - Pending Audit" as const,
    summaryData: {
      totalRevenue: 0,
      roomRevenue: 0,
      taxes: 0,
      otherCharges: 0,
      occupancyRate: 29,
      adr: 62.50,
      revpar: 18.10,
      cleanRoomsCount: 46,
      dirtyRoomsCount: 21,
      oooRoomsCount: 5,
      totalBookings: 21
    }
  }
];

// SSE Clients broadcast pool
let sseClients: express.Response[] = [];

function broadcastUpdate(eventType: string, payload: any) {
  const dataString = `data: ${JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(dataString);
    } catch (e) {
      // client disconnected
    }
  });
}

// --- SSE Endpoint ---
app.get("/api/pms/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseClients.push(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "Live PMS SSE channel ready" })}\n\n`);

  req.on("close", () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// --- GET full PMS state ---
app.get("/api/pms/state", (req, res) => {
  const occupiedCount = roomsData.filter(r => r.status === "occupied_clean" || r.status === "occupied_dirty").length;
  const vacantCleanCount = roomsData.filter(r => r.status === "vacant_clean").length;
  const vacantDirtyCount = roomsData.filter(r => r.status === "vacant_dirty").length;
  const oooCount = roomsData.filter(r => r.status === "out_of_order").length;
  const totalRooms = roomsData.length;
  const occupancyRate = Math.round((occupiedCount / (totalRooms - oooCount)) * 100);

  res.json({
    businessDate,
    hotelInfo: hotelInfoData,
    roomTypes: roomTypesData,
    ratePeriods: ratePeriodsData,
    serviceRates: serviceRatesData,
    rooms: roomsData,
    housekeepers: housekeepersData,
    reservations: reservationsData,
    folios: foliosData,
    auditLogs,
    submittedReports: submittedReportsData,
    stats: {
      totalRooms,
      occupiedCount,
      vacantCleanCount,
      vacantDirtyCount,
      oooCount,
      occupancyRate,
      todayRevenue: 2340,
      adr: 62.50,
      revpar: Math.round(62.50 * (occupancyRate / 100) * 10) / 10
    }
  });
});

// --- SETTINGS: Update or Add Room Type ---
app.post("/api/pms/settings/room-types/save", (req, res) => {
  const { id, name, baseRate, maxGuests, total, description } = req.body;
  if (!name || baseRate === undefined) {
    return res.status(400).json({ error: "Name and Base Rate are required" });
  }

  let existingIndex = roomTypesData.findIndex(rt => rt.id === id);
  let updatedRoomType;
  const numBaseRate = Number(baseRate);

  if (existingIndex >= 0) {
    roomTypesData[existingIndex] = {
      ...roomTypesData[existingIndex],
      name,
      baseRate: numBaseRate,
      maxGuests: Number(maxGuests) || roomTypesData[existingIndex].maxGuests,
      total: Number(total) || roomTypesData[existingIndex].total,
      description: description || roomTypesData[existingIndex].description
    };
    updatedRoomType = roomTypesData[existingIndex];
  } else {
    const newId = id || `rt-${Date.now()}`;
    updatedRoomType = {
      id: newId,
      name,
      baseRate: numBaseRate,
      maxGuests: Number(maxGuests) || 2,
      total: Number(total) || 10,
      description: description || ""
    };
    roomTypesData.push(updatedRoomType);
  }

  // Automatically update all seasonal rate periods based on their multipliers
  ratePeriodsData.forEach(period => {
    if (!period.rates) period.rates = {};
    if (period.isDefault || period.id === "period-standard-base") {
      period.rates[updatedRoomType.id] = numBaseRate;
    } else {
      const mult = period.multiplier || 1.0;
      period.rates[updatedRoomType.id] = Math.round(numBaseRate * mult);
    }
  });

  // Sync room type name and default rate for vacant rooms
  roomsData.forEach(room => {
    if (room.typeId === updatedRoomType.id) {
      room.typeName = updatedRoomType.name;
      if (!room.status.startsWith("occupied")) {
        room.rate = updatedRoomType.baseRate;
      }
    }
  });

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Hotel Administrator",
    action: "Room Type Settings Updated",
    details: `Updated room type '${updatedRoomType.name}' (Base Rate: ${updatedRoomType.baseRate}.000 VNĐ). Automatically recalculated all seasonal rate periods.`
  };
  auditLogs.unshift(log);

  broadcastUpdate("SETTINGS_ROOM_TYPES_UPDATED", { roomTypes: roomTypesData, ratePeriods: ratePeriodsData, rooms: roomsData, log });
  res.json({ success: true, roomType: updatedRoomType, ratePeriods: ratePeriodsData });
});

// --- SETTINGS: Delete Room Type ---
app.post("/api/pms/settings/room-types/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Room type ID is required" });

  const deletedType = roomTypesData.find(t => t.id === id);
  roomTypesData = roomTypesData.filter(t => t.id !== id);

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Hotel Administrator",
    action: "Room Category Deleted",
    details: `Deleted room category '${deletedType?.name || id}'`
  };
  auditLogs.unshift(log);

  broadcastUpdate("ROOM_TYPE_DELETED", { id, roomTypes: roomTypesData, log });
  res.json({ success: true, id });
});

// --- ADMIN: Save / Update Hotel Profile Info ---
app.post("/api/pms/hotel-info/save", (req, res) => {
  const { name, address, phone, email, starRating, checkInTime, checkOutTime, currency, taxRate, serviceCharge, totalRooms } = req.body;

  if (name) hotelInfoData.name = name;
  if (address !== undefined) hotelInfoData.address = address;
  if (phone !== undefined) hotelInfoData.phone = phone;
  if (email !== undefined) hotelInfoData.email = email;
  if (starRating !== undefined) hotelInfoData.starRating = Number(starRating);
  if (checkInTime !== undefined) hotelInfoData.checkInTime = checkInTime;
  if (checkOutTime !== undefined) hotelInfoData.checkOutTime = checkOutTime;
  if (currency !== undefined) hotelInfoData.currency = currency;
  if (taxRate !== undefined) hotelInfoData.taxRate = Number(taxRate);
  if (serviceCharge !== undefined) hotelInfoData.serviceCharge = Number(serviceCharge);
  if (totalRooms !== undefined) hotelInfoData.totalRooms = Number(totalRooms) || roomsData.length;

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Hotel Administrator",
    action: "Hotel Profile Updated",
    details: `Updated hotel profile: ${hotelInfoData.name}, Address: ${hotelInfoData.address}`
  };
  auditLogs.unshift(log);

  broadcastUpdate("HOTEL_INFO_UPDATED", { hotelInfo: hotelInfoData, log });
  res.json({ success: true, hotelInfo: hotelInfoData });
});

// --- ADMIN: Save / Edit Physical Room Inventory & Category Assignment ---
app.post("/api/pms/admin/rooms/save", (req, res) => {
  const { id, number, floor, typeId, rate, notes, housekeeper, status } = req.body;
  if (!number || !typeId) {
    return res.status(400).json({ error: "Room Number and Room Category are required" });
  }

  const selectedCategory = roomTypesData.find(t => t.id === typeId) || roomTypesData[0];
  const roomRate = Number(rate) || selectedCategory.baseRate;
  const roomFloor = Number(floor) || parseInt(number.charAt(0)) || 1;

  let existingIdx = roomsData.findIndex(r => r.id === id || r.number === number);
  let savedRoom;

  if (existingIdx >= 0) {
    roomsData[existingIdx] = {
      ...roomsData[existingIdx],
      number: String(number),
      floor: roomFloor,
      typeId: selectedCategory.id,
      typeName: selectedCategory.name,
      rate: roomRate,
      notes: notes !== undefined ? notes : roomsData[existingIdx].notes,
      housekeeper: housekeeper !== undefined ? housekeeper : roomsData[existingIdx].housekeeper,
      status: status || roomsData[existingIdx].status || "vacant_clean"
    };
    savedRoom = roomsData[existingIdx];
  } else {
    const newRoomId = id || `room-${Date.now()}`;
    savedRoom = {
      id: newRoomId,
      number: String(number),
      floor: roomFloor,
      typeId: selectedCategory.id,
      typeName: selectedCategory.name,
      rate: roomRate,
      status: status || "vacant_clean",
      housekeeper: housekeeper || "Unassigned",
      notes: notes || "",
      lastCleanedAt: new Date().toISOString()
    };
    roomsData.push(savedRoom);
  }

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Hotel Administrator",
    action: "Physical Room Inventory Updated",
    details: `Saved room #${savedRoom.number} assigned to category '${savedRoom.typeName}' (Floor ${savedRoom.floor})`
  };
  auditLogs.unshift(log);

  broadcastUpdate("ROOMS_UPDATED", { rooms: roomsData, log });
  res.json({ success: true, room: savedRoom, rooms: roomsData });
});

// --- ADMIN: Delete Physical Room ---
app.post("/api/pms/admin/rooms/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Room ID is required" });

  const room = roomsData.find(r => r.id === id);
  if (room && room.status.startsWith("occupied")) {
    return res.status(400).json({ error: "Cannot delete an occupied room with active in-house guests!" });
  }

  roomsData = roomsData.filter(r => r.id !== id);

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Hotel Administrator",
    action: "Room Inventory Deleted",
    details: `Deleted room #${room?.number || id} from hotel inventory`
  };
  auditLogs.unshift(log);

  broadcastUpdate("ROOMS_UPDATED", { rooms: roomsData, log });
  res.json({ success: true, id, rooms: roomsData });
});

// --- SETTINGS: Save/Update Rate Period ---
app.post("/api/pms/settings/rate-periods/save", (req, res) => {
  const { id, name, startDate, endDate, rates, multiplier, notes, isDefault } = req.body;
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: "Period Name, Start Date, and End Date are required" });
  }

  const periodId = id || `period-${Date.now()}`;
  const existingIdx = ratePeriodsData.findIndex(p => p.id === periodId);
  const isDefaultPeriod = Boolean(isDefault) || periodId === "period-standard-base";

  const updatedPeriod = {
    id: periodId,
    name,
    startDate,
    endDate,
    rates: rates || {},
    multiplier: Number(multiplier) || 1.0,
    isDefault: isDefaultPeriod,
    notes: notes || ""
  };

  if (existingIdx >= 0) {
    ratePeriodsData[existingIdx] = updatedPeriod;
  } else {
    ratePeriodsData.push(updatedPeriod);
  }

  // If this is the Standard Base period, sync new base rates back to roomTypesData and auto-update other seasonal periods
  if (isDefaultPeriod) {
    Object.keys(updatedPeriod.rates).forEach(rtId => {
      const newRate = Number(updatedPeriod.rates[rtId]);
      const rt = roomTypesData.find(t => t.id === rtId);
      if (rt && newRate > 0) {
        rt.baseRate = newRate;
      }
    });

    // Recalculate rates for all other seasonal periods using their multipliers
    ratePeriodsData.forEach(period => {
      if (!period.isDefault && period.id !== "period-standard-base") {
        if (!period.rates) period.rates = {};
        const mult = period.multiplier || 1.0;
        roomTypesData.forEach(rt => {
          period.rates[rt.id] = Math.round(rt.baseRate * mult);
        });
      }
    });
  } else {
    // Fill in any missing rates for room categories in this seasonal period using its multiplier
    roomTypesData.forEach(rt => {
      if (updatedPeriod.rates[rt.id] === undefined || updatedPeriod.rates[rt.id] === 0) {
        updatedPeriod.rates[rt.id] = Math.round(rt.baseRate * updatedPeriod.multiplier);
      }
    });
  }

  // Sync vacant room rates if active period matches
  const activePeriod = ratePeriodsData.find(p => businessDate >= p.startDate && businessDate <= p.endDate && !p.isDefault) ||
                       ratePeriodsData.find(p => p.isDefault || p.id === "period-standard-base");
  if (activePeriod && activePeriod.rates) {
    roomsData.forEach(r => {
      if (!r.status.startsWith("occupied") && activePeriod.rates[r.typeId] !== undefined) {
        r.rate = activePeriod.rates[r.typeId];
      }
    });
  }

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Revenue Manager",
    action: "Seasonal Rate Period Saved",
    details: `Configured rate period '${updatedPeriod.name}' (${updatedPeriod.startDate} to ${updatedPeriod.endDate}). Seasonal rates auto-synchronized across room categories.`
  };
  auditLogs.unshift(log);

  broadcastUpdate("SETTINGS_RATE_PERIODS_UPDATED", { ratePeriods: ratePeriodsData, roomTypes: roomTypesData, rooms: roomsData, log });
  res.json({ success: true, ratePeriod: updatedPeriod, roomTypes: roomTypesData, ratePeriods: ratePeriodsData });
});

// --- SETTINGS: Delete Rate Period ---
app.post("/api/pms/settings/rate-periods/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID required" });

  ratePeriodsData = ratePeriodsData.filter(p => p.id !== id);

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Revenue Manager",
    action: "Rate Period Deleted",
    details: `Deleted seasonal rate period record ID: ${id}`
  };
  auditLogs.unshift(log);

  broadcastUpdate("SETTINGS_RATE_PERIODS_UPDATED", { ratePeriods: ratePeriodsData, log });
  res.json({ success: true });
});

// --- SETTINGS: Apply Rate Period to Active Room Inventory Rates ---
app.post("/api/pms/settings/apply-period-rates", (req, res) => {
  const { periodId } = req.body;
  const period = ratePeriodsData.find(p => p.id === periodId);
  if (!period) return res.status(404).json({ error: "Rate period not found" });

  let updatedCount = 0;
  roomsData.forEach(r => {
    // Only update non-occupied or future rates
    if (period.rates && period.rates[r.typeId] !== undefined) {
      r.rate = period.rates[r.typeId];
      updatedCount++;
    }
  });

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Revenue Manager",
    action: "Seasonal Tariff Applied",
    details: `Applied '${period.name}' tariffs to ${updatedCount} rooms in active inventory.`
  };
  auditLogs.unshift(log);

  broadcastUpdate("RATE_PERIOD_APPLIED", { period, rooms: roomsData, log });
  res.json({ success: true, updatedCount, period });
});

// --- SETTINGS: Save / Edit Service Rate ---
app.post("/api/pms/settings/service-rates/save", (req, res) => {
  const { id, category, name, unit, rate, description, isAvailable } = req.body;
  if (!name || rate === undefined || rate < 0) {
    return res.status(400).json({ error: "Service name and valid positive rate required" });
  }

  const serviceId = id || `srv-${Date.now()}`;
  const existingIdx = serviceRatesData.findIndex(s => s.id === serviceId);

  const updatedService = {
    id: serviceId,
    category: category || "other",
    name,
    unit: unit || "lần",
    rate: Number(rate),
    description: description || "",
    isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true
  };

  if (existingIdx >= 0) {
    serviceRatesData[existingIdx] = updatedService;
  } else {
    serviceRatesData.push(updatedService);
  }

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Revenue Manager",
    action: "Service Tariff Saved",
    details: `Updated service tariff '${updatedService.name}' (${updatedService.category.toUpperCase()}: ${updatedService.rate}.000 VNĐ / ${updatedService.unit})`
  };
  auditLogs.unshift(log);

  broadcastUpdate("SETTINGS_SERVICE_RATES_UPDATED", { serviceRates: serviceRatesData, log });
  res.json({ success: true, serviceRate: updatedService });
});

// --- SETTINGS: Delete Service Rate ---
app.post("/api/pms/settings/service-rates/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Service ID required" });

  const item = serviceRatesData.find(s => s.id === id);
  serviceRatesData = serviceRatesData.filter(s => s.id !== id);

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Revenue Manager",
    action: "Service Tariff Deleted",
    details: `Deleted service tariff '${item?.name || id}'`
  };
  auditLogs.unshift(log);

  broadcastUpdate("SETTINGS_SERVICE_RATES_UPDATED", { serviceRates: serviceRatesData, log });
  res.json({ success: true });
});

// --- SETTINGS: Toggle Service Availability ---
app.post("/api/pms/settings/service-rates/toggle", (req, res) => {
  const { id } = req.body;
  const item = serviceRatesData.find(s => s.id === id);
  if (!item) return res.status(404).json({ error: "Service not found" });

  item.isAvailable = !item.isAvailable;

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Revenue Manager",
    action: "Service Availability Toggled",
    details: `Toggled availability for '${item.name}' to ${item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`
  };
  auditLogs.unshift(log);

  broadcastUpdate("SETTINGS_SERVICE_RATES_UPDATED", { serviceRates: serviceRatesData, log });
  res.json({ success: true, serviceRate: item });
});

// --- Submit / Transfer Report to Department ---
app.post("/api/pms/reports/submit", (req, res) => {
  const { reportType, department, submittedBy, notes, summaryData } = req.body;

  const dateShort = businessDate.replace(/-/g, "");
  const deptCode = department === "Accounting Dept" ? "ACCT" : department === "Audit Dept" ? "AUDIT" : "MGMT";
  const refNum = `RPT-${dateShort}-${deptCode}-${Math.floor(100 + Math.random() * 900)}`;

  const newReport = {
    id: `rpt-${Date.now().toString().slice(-6)}`,
    reportRefNumber: refNum,
    reportType: reportType || "Full End-of-Day Master Audit",
    department: department || "Accounting Dept",
    businessDate,
    submittedAt: new Date().toISOString(),
    submittedBy: submittedBy || "PMS Operator",
    notes: notes || "Submitted report for department verification and audit",
    status: "Transferred - Pending Audit" as const,
    summaryData: summaryData || {
      totalRevenue: 2340,
      roomRevenue: 2200,
      taxes: 110,
      otherCharges: 30,
      occupancyRate: 29,
      adr: 62.50,
      revpar: 18.10,
      cleanRoomsCount: 46,
      dirtyRoomsCount: 21,
      oooRoomsCount: 5,
      totalBookings: 21
    }
  };

  submittedReportsData.unshift(newReport);

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: newReport.submittedBy,
    action: "Report Transferred",
    details: `Transferred ${newReport.reportType} (${newReport.reportRefNumber}) to ${newReport.department}`
  };
  auditLogs.unshift(log);

  broadcastUpdate("REPORT_SUBMITTED", { report: newReport, log });

  res.json({ success: true, report: newReport, log });
});

// --- Walk-In / Fast Check-In ---
app.post("/api/pms/checkin", (req, res) => {
  const {
    reservationId,
    guestName,
    guestPhone,
    guestEmail,
    guestIdNumber,
    guestDob,
    guestGender,
    guestNationality,
    guestAddress,
    visaExpiryDate,
    guests, // Array of up to 3 guest profiles
    checkInTime,
    checkOutTime,
    notes,
    roomId,
    nights,
    paymentMethod,
    depositAmount,
    channel,
    adults,
    keycardAssigned
  } = req.body;
  
  const room = roomsData.find(r => r.id === roomId);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  if (room.status === "out_of_order") {
    return res.status(400).json({ error: "Room is currently Out of Order" });
  }

  const numNights = Number(nights) || 1;
  const totalRate = room.rate * numNights;
  const tax = totalRate * 0.05;
  const grandTotal = totalRate + tax;

  // Process guests list (up to 3 guests)
  const guestsList = Array.isArray(guests) && guests.length > 0 
    ? guests.slice(0, 3) 
    : [{
        fullName: guestName || "Walk-In Guest",
        dob: guestDob || "",
        gender: guestGender || "Nam",
        idNumber: guestIdNumber || "ID-UNSPECIFIED",
        nationality: guestNationality || "Việt Nam",
        address: guestAddress || "",
        visaExpiryDate: visaExpiryDate || "",
        phone: guestPhone || "",
        email: guestEmail || "",
        isPrimary: true
      }];

  const primaryGuest = guestsList[0];

  let existingRes = reservationId ? reservationsData.find(r => r.id === reservationId) : null;
  let targetReservation;

  if (existingRes) {
    existingRes.status = "checked_in";
    existingRes.guestName = primaryGuest.fullName || guestName || existingRes.guestName;
    existingRes.guestPhone = primaryGuest.phone || guestPhone || existingRes.guestPhone;
    existingRes.guestEmail = primaryGuest.email || guestEmail || existingRes.guestEmail;
    existingRes.guestIdNumber = primaryGuest.idNumber || guestIdNumber || existingRes.guestIdNumber;
    existingRes.guestDob = primaryGuest.dob || guestDob || existingRes.guestDob;
    existingRes.guestGender = primaryGuest.gender || guestGender || existingRes.guestGender;
    existingRes.guestNationality = primaryGuest.nationality || guestNationality || existingRes.guestNationality;
    existingRes.guestAddress = primaryGuest.address || guestAddress || existingRes.guestAddress;
    existingRes.visaExpiryDate = primaryGuest.visaExpiryDate || visaExpiryDate || existingRes.visaExpiryDate;
    existingRes.guests = guestsList;
    if (checkInTime) existingRes.checkInTime = checkInTime;
    if (checkOutTime) existingRes.checkOutTime = checkOutTime;
    if (notes) existingRes.notes = notes;
    existingRes.roomId = room.id;
    existingRes.roomNumber = room.number;
    existingRes.roomTypeName = room.typeName;
    if (channel) existingRes.channel = channel;
    existingRes.keycardAssigned = keycardAssigned || existingRes.keycardAssigned || `KC-${room.number}-A`;
    existingRes.depositAmount = Number(depositAmount) || existingRes.depositAmount || 50;
    existingRes.totalAmount = grandTotal;
    existingRes.adults = guestsList.length;
    
    // Ensure checkOutDate matches stay length
    const inDate = new Date(existingRes.checkInDate || businessDate);
    const outDate = new Date(inDate.getTime() + numNights * 86400000);
    existingRes.checkOutDate = outDate.toISOString().split('T')[0];

    targetReservation = existingRes;
  } else {
    const resId = `res-${Date.now().toString().slice(-5)}`;
    const confCode = `GS-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReservation = {
      id: resId,
      confirmationCode: confCode,
      guestName: primaryGuest.fullName || guestName || "Walk-In Guest",
      guestPhone: primaryGuest.phone || guestPhone || "",
      guestEmail: primaryGuest.email || guestEmail || "",
      guestIdNumber: primaryGuest.idNumber || guestIdNumber || "ID-UNSPECIFIED",
      guestDob: primaryGuest.dob || guestDob || "",
      guestGender: primaryGuest.gender || guestGender || "Nam",
      guestNationality: primaryGuest.nationality || guestNationality || "Việt Nam",
      guestAddress: primaryGuest.address || guestAddress || "",
      visaExpiryDate: primaryGuest.visaExpiryDate || visaExpiryDate || "",
      guests: guestsList,
      checkInTime: checkInTime || `${businessDate} 14:00`,
      checkOutTime: checkOutTime || `${new Date(Date.now() + numNights * 86400000).toISOString().split('T')[0]} 12:00`,
      notes: notes || "",
      roomId: room.id,
      roomNumber: room.number,
      roomTypeName: room.typeName,
      checkInDate: businessDate,
      checkOutDate: new Date(Date.now() + numNights * 86400000).toISOString().split('T')[0],
      status: "checked_in",
      totalAmount: grandTotal,
      paidAmount: Number(depositAmount) || grandTotal,
      channel: channel || "Walk-In",
      adults: guestsList.length,
      children: 0,
      keycardAssigned: keycardAssigned || `KC-${room.number}-A`,
      depositAmount: Number(depositAmount) || 50,
      createdAt: new Date().toISOString()
    };

    reservationsData.unshift(newReservation);
    targetReservation = newReservation;
  }

  // Get or Create Folio
  let targetFolio = foliosData.find(f => f.reservationId === targetReservation.id);
  if (!targetFolio) {
    const folioId = `fol-${targetReservation.id}`;
    targetFolio = {
      id: folioId,
      reservationId: targetReservation.id,
      guestName: targetReservation.guestName,
      roomNumber: room.number,
      items: [
        { id: `item-${Date.now()}-1`, date: businessDate, description: `Room Charge (${numNights} night${numNights > 1 ? 's' : ''}) - ${room.typeName}`, unitPrice: room.rate, quantity: numNights, amount: totalRate, category: "room" as const }
      ],
      payments: [
        { id: `pay-${Date.now()}`, date: businessDate, description: `Deposit / Payment (${paymentMethod || 'Credit Card'})`, amount: Number(depositAmount) || 50, method: (paymentMethod as any) || "Credit Card" }
      ]
    };
    foliosData.unshift(targetFolio);
  } else {
    targetFolio.guestName = targetReservation.guestName;
    targetFolio.roomNumber = room.number;
    if (Number(depositAmount) > 0) {
      targetFolio.payments.push({
        id: `pay-${Date.now()}`,
        date: businessDate,
        description: `Check-In Security Deposit (${paymentMethod || 'Credit Card'})`,
        amount: Number(depositAmount),
        method: (paymentMethod as any) || "Credit Card"
      });
    }
  }

  // Update room status
  room.status = "occupied_clean";
  
  // Log action
  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Front Desk Staff",
    action: "Check-In",
    details: `Checked in ${targetReservation.guestName} to Room ${room.number} (${targetReservation.confirmationCode})`
  };
  auditLogs.unshift(log);

  // Broadcast real-time update
  broadcastUpdate("CHECKIN_COMPLETED", { room, reservation: targetReservation, folio: targetFolio, log });

  res.json({ success: true, reservation: targetReservation, folio: targetFolio, room });
});

// --- Express Check-Out ---
app.post("/api/pms/checkout", (req, res) => {
  const { reservationId, settlementMethod, finalPaymentAmount } = req.body;

  const reservation = reservationsData.find(r => r.id === reservationId);
  if (!reservation) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  reservation.status = "checked_out";

  const room = roomsData.find(r => r.id === reservation.roomId);
  if (room) {
    // Check-out turns room into Vacant Dirty for housekeeping!
    room.status = "vacant_dirty";
    room.housekeeper = "Unassigned";
  }

  // Update Folio if payment or refund added
  const folio = foliosData.find(f => f.reservationId === reservationId);
  if (folio && Number(finalPaymentAmount) !== 0) {
    const amt = Number(finalPaymentAmount);
    folio.payments.push({
      id: `pay-${Date.now()}`,
      date: businessDate,
      description: amt < 0 ? `Guest Deposit Refund (${settlementMethod || 'Cash'})` : `Settlement Payment (${settlementMethod || 'Credit Card'})`,
      amount: amt,
      method: settlementMethod || "Credit Card"
    });
  }

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Front Desk Staff",
    action: "Check-Out",
    details: `Express Check-Out for ${reservation.guestName} from Room ${reservation.roomNumber}. Room set to Vacant Dirty.`
  };
  auditLogs.unshift(log);

  broadcastUpdate("CHECKOUT_COMPLETED", { reservation, room, folio, log });

  res.json({ success: true, reservation, room, folio });
});

// --- Housekeeping Status Update ---
app.post("/api/pms/housekeeping", (req, res) => {
  const { roomId, newStatus, housekeeper, notes } = req.body;

  const room = roomsData.find(r => r.id === roomId);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  room.status = newStatus;
  if (housekeeper !== undefined) room.housekeeper = housekeeper;
  if (notes !== undefined) room.notes = notes;
  if (newStatus === "vacant_clean" || newStatus === "occupied_clean") {
    room.lastCleanedAt = new Date().toISOString();
  }

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: housekeeper || "Housekeeping Lead",
    action: "Housekeeping Update",
    details: `Room ${room.number} status updated to [${newStatus.replace('_', ' ').toUpperCase()}]. Staff: ${room.housekeeper}`
  };
  auditLogs.unshift(log);

  broadcastUpdate("HOUSEKEEPING_UPDATED", { room, log });

  res.json({ success: true, room });
});

// --- Bulk Housekeeping Room Assignment ---
app.post("/api/pms/housekeeping/bulk-assign", (req, res) => {
  const { roomIds, housekeeper, newStatus } = req.body;

  if (!Array.isArray(roomIds) || roomIds.length === 0) {
    return res.status(400).json({ error: "No room IDs provided" });
  }

  const updatedRooms = [];
  for (const roomId of roomIds) {
    const room = roomsData.find(r => r.id === roomId);
    if (room) {
      if (housekeeper !== undefined) room.housekeeper = housekeeper;
      if (newStatus) {
        room.status = newStatus;
        if (newStatus === "vacant_clean" || newStatus === "occupied_clean") {
          room.lastCleanedAt = new Date().toISOString();
        }
      }
      updatedRooms.push(room);
    }
  }

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Housekeeping Lead",
    action: "Bulk Room Assignment",
    details: `Bulk assigned ${updatedRooms.length} room(s) to attendant: ${housekeeper || 'Unassigned'}${newStatus ? ` (Status set to ${newStatus})` : ''}`
  };
  auditLogs.unshift(log);

  broadcastUpdate("HOUSEKEEPING_BULK_ASSIGNED", { updatedCount: updatedRooms.length, housekeeper, log });

  res.json({ success: true, count: updatedRooms.length, housekeeper });
});

// --- Housekeeper Management Endpoints (Add, Edit, Remove) ---
app.post("/api/pms/housekeepers/add", (req, res) => {
  const { name, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  const newHk = {
    id: `hk-${Date.now()}`,
    name: name.trim(),
    phone: phone ? phone.trim() : "",
    status: "Active"
  };

  housekeepersData.push(newHk);

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Housekeeping Lead",
    action: "Add Room Attendant",
    details: `Added new room attendant: ${newHk.name}`
  };
  auditLogs.unshift(log);

  broadcastUpdate("HOUSEKEEPER_ADDED", { housekeeper: newHk, log });

  res.json({ success: true, housekeeper: newHk });
});

app.post("/api/pms/housekeepers/update", (req, res) => {
  const { id, name, phone, status } = req.body;
  const hk = housekeepersData.find(h => h.id === id);
  if (!hk) {
    return res.status(404).json({ error: "Attendant not found" });
  }

  const oldName = hk.name;
  if (name && name.trim()) hk.name = name.trim();
  if (phone !== undefined) hk.phone = phone.trim();
  if (status !== undefined) hk.status = status;

  // If attendant name changed, update all rooms assigned to oldName
  if (name && name.trim() !== oldName) {
    roomsData.forEach(r => {
      if (r.housekeeper === oldName) {
        r.housekeeper = hk.name;
      }
    });
  }

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Housekeeping Lead",
    action: "Update Room Attendant",
    details: `Updated attendant ${oldName} -> ${hk.name} (${hk.status})`
  };
  auditLogs.unshift(log);

  broadcastUpdate("HOUSEKEEPER_UPDATED", { housekeeper: hk, log });

  res.json({ success: true, housekeeper: hk });
});

app.post("/api/pms/housekeepers/delete", (req, res) => {
  const { id } = req.body;
  const hk = housekeepersData.find(h => h.id === id);
  if (!hk) {
    return res.status(404).json({ error: "Attendant not found" });
  }

  const deletedName = hk.name;
  housekeepersData = housekeepersData.filter(h => h.id !== id);

  // Unassign rooms currently assigned to this attendant
  roomsData.forEach(r => {
    if (r.housekeeper === deletedName) {
      r.housekeeper = "Unassigned";
    }
  });

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Housekeeping Lead",
    action: "Remove Room Attendant",
    details: `Removed attendant ${deletedName}. Rooms reset to Unassigned.`
  };
  auditLogs.unshift(log);

  broadcastUpdate("HOUSEKEEPER_DELETED", { deletedId: id, deletedName, log });

  res.json({ success: true, deletedId: id });
});

// --- Add Extra POS Charge to Room Folio ---
app.post("/api/pms/folio/add", (req, res) => {
  const { reservationId, description, amount, unitPrice, quantity, category, paymentMethod } = req.body;

  let folio = foliosData.find(f => f.reservationId === reservationId);
  if (!folio) {
    const resv = reservationsData.find(r => r.id === reservationId);
    if (!resv) return res.status(404).json({ error: "Reservation not found" });
    folio = {
      id: `fol-${resv.id}`,
      reservationId: resv.id,
      guestName: resv.guestName,
      roomNumber: resv.roomNumber,
      items: [],
      payments: []
    };
    foliosData.unshift(folio);
  }

  if (category === "payment") {
    folio.payments.push({
      id: `pay-${Date.now()}`,
      date: businessDate,
      description: description || "Folio Payment",
      amount: Number(amount),
      method: paymentMethod || "Cash"
    });
  } else {
    const qty = Number(quantity) && Number(quantity) > 0 ? Number(quantity) : 1;
    const uPrice = unitPrice !== undefined && unitPrice !== null && !isNaN(Number(unitPrice))
      ? Number(unitPrice)
      : (Number(amount) ? Number(amount) / qty : 0);
    const calculatedBase = uPrice * qty;

    folio.items.push({
      id: `item-${Date.now()}`,
      date: businessDate,
      description: description || "Extra Charge",
      unitPrice: uPrice,
      quantity: qty,
      amount: calculatedBase,
      category: category || "extra"
    });
  }

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Front Desk POS",
    action: "Folio Updated",
    details: `Added ${category === 'payment' ? 'Payment' : 'Charge'} $${amount} (${description}) to Room ${folio.roomNumber}`
  };
  auditLogs.unshift(log);

  broadcastUpdate("FOLIO_UPDATED", { folio, log });

  res.json({ success: true, folio });
});

// --- Create Reservation ---
app.post("/api/pms/reservation/create", (req, res) => {
  const { guestName, guestPhone, guestEmail, roomTypeId, checkInDate, checkOutDate, adults, channel } = req.body;

  const type = roomTypesData.find(t => t.id === roomTypeId) || roomTypesData[0];
  
  // Find an available room of this type
  const availableRoom = roomsData.find(r => r.typeId === type.id && r.status !== "out_of_order") || roomsData[0];

  const checkIn = checkInDate || businessDate;
  const checkOut = checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const days = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  const rate = type.baseRate * days;
  const tax = rate * 0.05;

  const resId = `res-${Date.now().toString().slice(-5)}`;
  const confCode = `GS-${Math.floor(1000 + Math.random() * 9000)}`;

  const newRes = {
    id: resId,
    confirmationCode: confCode,
    guestName: guestName || "Guest",
    guestPhone: guestPhone || "",
    guestEmail: guestEmail || "",
    guestIdNumber: "PENDING",
    roomId: availableRoom.id,
    roomNumber: availableRoom.number,
    roomTypeName: type.name,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    status: "confirmed",
    totalAmount: rate + tax,
    paidAmount: 0,
    channel: channel || "Direct Web",
    adults: Number(adults) || 1,
    children: 0,
    keycardAssigned: "",
    depositAmount: 0,
    createdAt: new Date().toISOString()
  };

  reservationsData.unshift(newRes);

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Reservations Agent",
    action: "Booking Created",
    details: `New reservation ${confCode} for ${newRes.guestName} (${type.name}, ${days} night(s))`
  };
  auditLogs.unshift(log);

  broadcastUpdate("RESERVATION_CREATED", { reservation: newRes, log });

  res.json({ success: true, reservation: newRes });
});

// --- Update Reservation ---
app.post("/api/pms/reservation/update", (req, res) => {
  const {
    id,
    guestName,
    guestPhone,
    guestEmail,
    roomTypeId,
    checkInDate,
    checkOutDate,
    status,
    channel,
    adults,
    roomNumber,
    notes
  } = req.body;

  const resv = reservationsData.find((r) => r.id === id);
  if (!resv) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  if (guestName !== undefined) resv.guestName = guestName;
  if (guestPhone !== undefined) resv.guestPhone = guestPhone;
  if (guestEmail !== undefined) resv.guestEmail = guestEmail;
  if (checkInDate !== undefined) resv.checkInDate = checkInDate;
  if (checkOutDate !== undefined) resv.checkOutDate = checkOutDate;
  if (status !== undefined) resv.status = status;
  if (channel !== undefined) resv.channel = channel;
  if (adults !== undefined) resv.adults = Number(adults) || 1;
  if (notes !== undefined) resv.notes = notes;

  if (roomTypeId) {
    const type = roomTypesData.find((t) => t.id === roomTypeId);
    if (type) {
      resv.roomTypeName = type.name;
      const room = roomsData.find((r) => r.typeId === type.id && r.status !== "out_of_order") || roomsData[0];
      if (room && (!roomNumber || roomNumber === resv.roomNumber)) {
        resv.roomId = room.id;
        resv.roomNumber = room.number;
      }
    }
  }

  if (roomNumber !== undefined) {
    const room = roomsData.find((r) => r.number === roomNumber);
    if (room) {
      resv.roomId = room.id;
      resv.roomNumber = room.number;
    }
  }

  // Recalculate total if dates changed
  if (checkInDate && checkOutDate) {
    const days = Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000));
    const type = roomTypesData.find((t) => t.name === resv.roomTypeName) || roomTypesData[0];
    const rate = type.baseRate * days;
    const tax = rate * 0.05;
    resv.totalAmount = rate + tax;
  }

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Reservations Agent",
    action: "Booking Updated",
    details: `Updated reservation ${resv.confirmationCode} for ${resv.guestName}`
  };
  auditLogs.unshift(log);

  broadcastUpdate("RESERVATION_UPDATED", { reservation: resv, log });

  res.json({ success: true, reservation: resv });
});

// --- Delete Reservation ---
app.post("/api/pms/reservation/delete", (req, res) => {
  const { id } = req.body;
  const resv = reservationsData.find((r) => r.id === id);
  if (!resv) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  const deletedCode = resv.confirmationCode;
  const deletedGuest = resv.guestName;

  reservationsData = reservationsData.filter((r) => r.id !== id);

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Reservations Agent",
    action: "Booking Deleted",
    details: `Deleted reservation ${deletedCode} (${deletedGuest})`
  };
  auditLogs.unshift(log);

  broadcastUpdate("RESERVATION_DELETED", { id, log });

  res.json({ success: true, id });
});

// --- Night Audit Runner ---
app.post("/api/pms/night-audit", (req, res) => {
  // Advance business date by 1 day
  const currDate = new Date(businessDate);
  currDate.setDate(currDate.getDate() + 1);
  const nextBusinessDate = currDate.toISOString().split('T')[0];
  businessDate = nextBusinessDate;

  // Automatically post room charges for checked-in rooms
  let totalPosted = 0;
  let postedCount = 0;

  reservationsData.filter(r => r.status === "checked_in").forEach(resv => {
    const room = roomsData.find(r => r.id === resv.roomId);
    if (room) {
      const folio = foliosData.find(f => f.reservationId === resv.id);
      if (folio) {
        folio.items.push({
          id: `item-na-${Date.now()}-${resv.id}`,
          date: businessDate,
          description: `Night Audit Room Charge - ${room.typeName}`,
          unitPrice: room.rate,
          quantity: 1,
          amount: room.rate,
          category: "room"
        });
        totalPosted += room.rate;
        postedCount++;
      }
    }
  });

  const log = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staff: "Night Audit System",
    action: "Night Audit Run Complete",
    details: `Advanced Business Date to ${businessDate}. Auto-posted room charges for ${postedCount} active in-house rooms ($${totalPosted.toFixed(2)} posted).`
  };
  auditLogs.unshift(log);

  broadcastUpdate("NIGHT_AUDIT_COMPLETED", { businessDate, totalPosted, postedCount, log });

  res.json({ success: true, businessDate, totalPosted, postedCount, log });
});

// --- AI Insights Assistant Endpoint ---
app.post("/api/pms/ai-insights", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        insights: "Gemini API Key is missing. Using standard heuristic operational summary:\n\n• **Occupancy Rate**: Currently operating at healthy capacity.\n• **Housekeeping Turnaround**: Priority on Vacant Dirty rooms on Floor 2 and 3.\n• **Revenue Optimization**: Consider raising Standard Double weekend rates by 15% due to high demand."
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const occupiedCount = roomsData.filter(r => r.status.includes("occupied")).length;
    const vacantDirty = roomsData.filter(r => r.status === "vacant_dirty").length;
    const oooCount = roomsData.filter(r => r.status === "out_of_order").length;
    const total = roomsData.length;

    const prompt = `You are an expert Economy Hotel Property Management AI Consultant for an 72-room hotel.
Current Metrics:
- Date: ${businessDate}
- Total Rooms: ${total}
- Occupied Rooms: ${occupiedCount} (${Math.round((occupiedCount / total) * 100)}% Occupancy)
- Vacant Dirty Rooms needing cleaning: ${vacantDirty}
- Out of Order (OOO): ${oooCount}
- Active Reservations: ${reservationsData.length}

Provide a concise, professional 4-bullet executive briefing for the Hotel Owner/Manager covering:
1. **Occupancy & Demand Forecast**: Short assessment of current occupancy vs capacity.
2. **Dynamic Pricing Strategy**: Concrete rate recommendation for tonight and upcoming weekend for Standard and Deluxe rooms.
3. **Housekeeping & Staff Action Items**: Specific priority for dirty rooms or room turnovers.
4. **Guest Satisfaction & Operations**: Quick tip for front desk shift handover. Keep formatting clean with markdown bullet points.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text = response.text || "Unable to generate AI briefing at this time.";
    res.json({ insights: text });
  } catch (error: any) {
    console.error("AI Insights Error:", error);
    res.status(500).json({ error: "Failed to generate AI insights", details: error.message });
  }
});

// --- Serve Vite in Dev / Static in Prod ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Grand Stay PMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
