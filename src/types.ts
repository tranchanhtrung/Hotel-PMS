export type RoomStatus =
  | "vacant_clean"
  | "vacant_dirty"
  | "occupied_clean"
  | "occupied_dirty"
  | "out_of_order";

export interface RoomType {
  id: string;
  name: string;
  baseRate: number;
  maxGuests: number;
  total: number;
  description: string;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  typeId: string;
  typeName: string;
  rate: number;
  status: RoomStatus;
  housekeeper: string;
  notes?: string;
  lastCleanedAt?: string;
}

export interface GuestProfile {
  id?: string;
  fullName: string;
  dob: string;
  gender: "Nam" | "Nữ" | "Khác";
  idNumber: string;
  nationality: string;
  address: string;
  visaExpiryDate?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export type ReservationStatus = "confirmed" | "checked_in" | "checked_out" | "cancelled";

export interface Reservation {
  id: string;
  confirmationCode: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestIdNumber: string;
  guestDob?: string;
  guestGender?: string;
  guestNationality?: string;
  guestAddress?: string;
  visaExpiryDate?: string;
  guests?: GuestProfile[];
  checkInTime?: string; // Giờ, ngày đến
  checkOutTime?: string; // Giờ, ngày đi
  notes?: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  totalAmount: number;
  paidAmount: number;
  channel: string; // Walk-In, Booking.com, Agoda, Expedia, Direct Web
  adults: number;
  children: number;
  keycardAssigned?: string;
  depositAmount: number;
  createdAt: string;
}

export interface FolioItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: "room" | "minibar" | "laundry" | "extra" | "tax" | "damage";
}

export interface FolioPayment {
  id: string;
  date: string;
  description: string;
  amount: number;
  method: "Cash" | "Credit Card" | "Bank Transfer" | "Deposit";
}

export interface Folio {
  id: string;
  reservationId: string;
  guestName: string;
  roomNumber: string;
  items: FolioItem[];
  payments: FolioPayment[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  staff: string;
  action: string;
  details: string;
}

export interface Housekeeper {
  id: string;
  name: string;
  phone?: string;
  status?: "Active" | "Off Duty";
}

export interface PmsStats {
  totalRooms: number;
  occupiedCount: number;
  vacantCleanCount: number;
  vacantDirtyCount: number;
  oooCount: number;
  occupancyRate: number;
  todayRevenue: number;
  adr: number;
  revpar: number;
}

export interface ReportSubmission {
  id: string;
  reportRefNumber: string;
  reportType: "Sales & Financial Revenue" | "Housekeeping & Turnover" | "Booking & OTA Channel Analysis" | "Full End-of-Day Master Audit";
  department: "Accounting Dept" | "Audit Dept" | "General Manager" | "Financial Controller";
  businessDate: string;
  submittedAt: string;
  submittedBy: string;
  notes: string;
  status: "Transferred - Pending Audit" | "Audited & Approved" | "Archived";
  summaryData: {
    totalRevenue: number;
    roomRevenue: number;
    taxes: number;
    otherCharges: number;
    occupancyRate: number;
    adr: number;
    revpar: number;
    cleanRoomsCount: number;
    dirtyRoomsCount: number;
    oooRoomsCount: number;
    totalBookings: number;
  };
}

export interface RatePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  rates: Record<string, number>;
  multiplier?: number;
  isDefault?: boolean;
  notes?: string;
}

export type ServiceCategory = "water" | "laundry" | "late_checkout" | "extra_bed" | "other";

export interface ServiceRateItem {
  id: string;
  category: ServiceCategory;
  name: string;
  unit: string;
  rate: number;
  description?: string;
  isAvailable: boolean;
}

export type UserRole =
  | "admin"
  | "front_desk"
  | "housekeeper"
  | "room_attendant"
  | "sales"
  | "night_audit"
  | "accounting";

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  pin: string;
  avatar: string;
  allowedViews: ActiveView[];
}

export interface HotelInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  starRating: number;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  taxRate: number;
  serviceCharge: number;
  totalRooms: number;
}

export type TerminalMode = "front_desk" | "housekeeping" | "manager" | "split_terminal";
export type ActiveView = "tape_chart" | "front_desk" | "housekeeping" | "reservations" | "night_audit" | "reports" | "settings" | "admin";
