import React, { useState, useEffect } from "react";
import { usePms } from "../../context/PmsContext";
import {
  Building2,
  Sliders,
  Users,
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Save,
  Key,
  Layers,
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  DollarSign,
  Percent,
  Bed,
  Check,
  AlertTriangle,
  X,
  Lock,
  Eye,
  EyeOff,
  UserPlus
} from "lucide-react";
import { RoomType, Room, UserAccount, UserRole, ActiveView, HotelInfo } from "../../types";
import { formatVND } from "../../utils/formatters";

export const AdminView: React.FC = () => {
  const {
    t,
    language,
    hotelInfo,
    updateHotelInfo,
    roomTypes,
    saveRoomType,
    deleteRoomType,
    rooms,
    savePhysicalRoom,
    deletePhysicalRoom,
    userAccounts,
    saveUserAccount,
    deleteUserAccount,
    currentUser
  } = usePms();

  const [activeTab, setActiveTab] = useState<"hotel_profile" | "room_categories" | "room_assignment" | "users_security" | "permission_matrix">("hotel_profile");

  // Notification / Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- HOTEL PROFILE FORM STATE ---
  const [profileForm, setProfileForm] = useState<HotelInfo>({ ...hotelInfo });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (hotelInfo) {
      setProfileForm({ ...hotelInfo });
    }
  }, [hotelInfo]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const success = await updateHotelInfo(profileForm);
    setIsSavingProfile(false);
    if (success) {
      showToast(language === "vi" ? "Đã lưu thông tin cấu hình khách sạn thành công!" : "Hotel profile updated successfully!");
    }
  };

  // --- ROOM CATEGORY MODAL STATE ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<RoomType> | null>(null);

  const handleOpenCategoryModal = (cat?: RoomType) => {
    if (cat) {
      setEditingCategory({ ...cat });
    } else {
      setEditingCategory({
        id: `rt-${Date.now()}`,
        name: "",
        baseRate: 600,
        maxGuests: 2,
        total: 10,
        description: ""
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    const success = await saveRoomType(editingCategory);
    if (success) {
      setIsCategoryModalOpen(false);
      showToast(language === "vi" ? `Đã lưu loại phòng ${editingCategory.name}` : `Saved room category ${editingCategory.name}`);
    }
  };

  const handleDeleteCategory = async (cat: RoomType) => {
    if (window.confirm(language === "vi" ? `Bạn có chắc muốn xóa loại phòng "${cat.name}"?` : `Delete room category "${cat.name}"?`)) {
      const success = await deleteRoomType(cat.id);
      if (success) {
        showToast(language === "vi" ? `Đã xóa loại phòng ${cat.name}` : `Deleted room category ${cat.name}`);
      }
    }
  };

  // --- ROOM INVENTORY ASSIGNMENT MODAL STATE ---
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);

  const handleOpenRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom({ ...room });
    } else {
      const defaultCategory = roomTypes[0] || { id: "std-double", name: "Standard Double", baseRate: 600 };
      setEditingRoom({
        id: `room-${Date.now()}`,
        number: "",
        floor: 1,
        typeId: defaultCategory.id,
        typeName: defaultCategory.name,
        rate: defaultCategory.baseRate,
        status: "vacant_clean",
        housekeeper: "Unassigned",
        notes: ""
      });
    }
    setIsRoomModalOpen(true);
  };

  const handleCategorySelectForRoom = (typeId: string) => {
    const selected = roomTypes.find(t => t.id === typeId);
    if (selected && editingRoom) {
      setEditingRoom({
        ...editingRoom,
        typeId: selected.id,
        typeName: selected.name,
        rate: selected.baseRate
      });
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom?.number || !editingRoom.typeId) return;
    const success = await savePhysicalRoom(editingRoom);
    if (success) {
      setIsRoomModalOpen(false);
      showToast(language === "vi" ? `Đã cập nhật sơ đồ phòng #${editingRoom.number}` : `Updated room #${editingRoom.number}`);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (room.status.startsWith("occupied")) {
      alert(language === "vi" ? "Không thể xóa phòng đang có khách ở!" : "Cannot delete room with in-house guests!");
      return;
    }
    if (window.confirm(language === "vi" ? `Bạn có chắc chắn muốn xóa phòng #${room.number}?` : `Delete room #${room.number}?`)) {
      const success = await deletePhysicalRoom(room.id);
      if (success) {
        showToast(language === "vi" ? `Đã xóa phòng #${room.number}` : `Deleted room #${room.number}`);
      }
    }
  };

  // --- USER & PIN MANAGEMENT MODAL STATE ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserAccount> | null>(null);
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});

  const togglePinVisibility = (userId: string) => {
    setShowPin(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenUserModal = (user?: UserAccount) => {
    if (user) {
      setEditingUser({ ...user, allowedViews: [...user.allowedViews] });
    } else {
      setEditingUser({
        id: `usr_${Date.now()}`,
        username: "",
        name: "",
        role: "front_desk",
        title: "Front Desk Receptionist",
        department: "Front Office",
        pin: "1234",
        avatar: "👤",
        allowedViews: ["tape_chart", "front_desk", "reservations"]
      });
    }
    setIsUserModalOpen(true);
  };

  const toggleUserAllowedView = (view: ActiveView) => {
    if (!editingUser) return;
    const currentViews = editingUser.allowedViews || [];
    let nextViews: ActiveView[];
    if (currentViews.includes(view)) {
      nextViews = currentViews.filter(v => v !== view);
    } else {
      nextViews = [...currentViews, view];
    }
    setEditingUser({ ...editingUser, allowedViews: nextViews });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.name || !editingUser.username || !editingUser.pin) {
      alert(language === "vi" ? "Vui lòng điền đầy đủ Tên, Username và Mã PIN!" : "Please fill Name, Username, and PIN!");
      return;
    }
    saveUserAccount(editingUser);
    setIsUserModalOpen(false);
    showToast(language === "vi" ? `Đã lưu tài khoản nhân viên ${editingUser.name}` : `Saved user account ${editingUser.name}`);
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      alert(language === "vi" ? "Không thể xóa tài khoản đang đăng nhập!" : "Cannot delete currently logged in account!");
      return;
    }
    if (window.confirm(language === "vi" ? `Xóa tài khoản nhân viên ${user.name}?` : `Delete staff user ${user.name}?`)) {
      deleteUserAccount(user.id);
      showToast(language === "vi" ? `Đã xóa tài khoản ${user.name}` : `Deleted user ${user.name}`);
    }
  };

  const availableViewsList: { id: ActiveView; labelVi: string; labelEn: string }[] = [
    { id: "tape_chart", labelVi: "Rack View / Tape Chart", labelEn: "Rack View / Tape Chart" },
    { id: "front_desk", labelVi: "Lễ Tân & Folio", labelEn: "Front Desk & Folios" },
    { id: "housekeeping", labelVi: "Buồng Phòng (Housekeeping)", labelEn: "Housekeeping" },
    { id: "reservations", labelVi: "Đặt Phòng & Kênh OTA", labelEn: "Bookings & OTA" },
    { id: "reports", labelVi: "Báo Cáo & Kiểm Đêm", labelEn: "Reports & Audit" },
    { id: "settings", labelVi: "Cấu Hình Giá Mùa", labelEn: "Seasonal Rates" },
    { id: "admin", labelVi: "Quản Trị Hotel (Admin)", labelEn: "Admin Setup" },
    { id: "night_audit", labelVi: "Kiểm Đêm & Logs", labelEn: "Night Audit" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 px-4 py-3 rounded-lg shadow-xl font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 p-6 rounded-2xl border border-amber-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <span>{t("adminPanel")}</span>
                <span className="text-xs font-mono uppercase bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
                  Administrator
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {t("adminSubtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-300">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>{language === "vi" ? "Logged in as:" : "Logged in as:"}</span>
          <span className="font-bold text-amber-300">{currentUser?.name} ({currentUser?.role})</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("hotel_profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === "hotel_profile"
              ? "bg-amber-500 text-slate-950 shadow-md font-bold"
              : "bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. {t("hotelProfile")}</span>
        </button>

        <button
          onClick={() => setActiveTab("room_categories")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === "room_categories"
              ? "bg-amber-500 text-slate-950 shadow-md font-bold"
              : "bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. {t("roomCategories")}</span>
        </button>

        <button
          onClick={() => setActiveTab("room_assignment")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === "room_assignment"
              ? "bg-amber-500 text-slate-950 shadow-md font-bold"
              : "bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>3. {t("roomInventory")} ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("users_security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === "users_security"
              ? "bg-amber-500 text-slate-950 shadow-md font-bold"
              : "bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. {t("userManagement")} ({userAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("permission_matrix")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === "permission_matrix"
              ? "bg-amber-500 text-slate-950 shadow-md font-bold"
              : "bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>5. {t("permissionMatrix")}</span>
        </button>
      </div>

      {/* --- TAB 1: HOTEL PROFILE & INFO --- */}
      {activeTab === "hotel_profile" && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{t("hotelProfile")}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "vi"
                  ? "Cấu hình tên thương hiệu khách sạn, địa chỉ, số điện thoại, quy định giờ Check-in/Check-out và VAT"
                  : "Configure hotel property name, address, contact info, check-in policies, and taxes"}
              </p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? "Saving..." : t("saveHotelInfo")}</span>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hotel Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "vi" ? "Tên Khách Sạn / Resort" : "Property / Hotel Name"}</span>
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Star Rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "vi" ? "Xếp Hạng Sao (Star Rating)" : "Star Rating"}</span>
              </label>
              <select
                value={profileForm.starRating}
                onChange={e => setProfileForm({ ...profileForm, starRating: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value={2}>2 ⭐⭐ (Economy / Boutique)</option>
                <option value={3}>3 ⭐⭐⭐ (Standard Hotel)</option>
                <option value={4}>4 ⭐⭐⭐⭐ (Luxury Hotel & Suites)</option>
                <option value={5}>5 ⭐⭐⭐⭐⭐ (5-Star Premium Resort)</option>
              </select>
            </div>

            {/* Address */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "vi" ? "Địa Chỉ Khách Sạn" : "Full Address"}</span>
              </label>
              <input
                type="text"
                required
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "vi" ? "Số Điện Thoại Hotline" : "Hotline / Telephone"}</span>
              </label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "vi" ? "Email Lễ Tân / Liên Hệ" : "Contact Email"}</span>
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Check-In Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === "vi" ? "Giờ Check-in Quy Định" : "Standard Check-in Time"}</span>
              </label>
              <input
                type="text"
                value={profileForm.checkInTime}
                onChange={e => setProfileForm({ ...profileForm, checkInTime: e.target.value })}
                placeholder="14:00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Check-Out Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>{language === "vi" ? "Giờ Check-out Quy Định" : "Standard Check-out Time"}</span>
              </label>
              <input
                type="text"
                value={profileForm.checkOutTime}
                onChange={e => setProfileForm({ ...profileForm, checkOutTime: e.target.value })}
                placeholder="12:00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "vi" ? "Đơn Vị Tiền Tệ Mặc Định" : "Base Currency"}</span>
              </label>
              <select
                value={profileForm.currency}
                onChange={e => setProfileForm({ ...profileForm, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="VND">VNĐ (Việt Nam Đồng - x1,000)</option>
                <option value="USD">USD ($ - United States Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
            </div>

            {/* VAT Tax Rate (%) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-sky-400" />
                <span>{language === "vi" ? "Thuế Giá Trị Gia Tăng - VAT (%)" : "Value Added Tax - VAT Rate (%)"}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={profileForm.taxRate}
                  onChange={e => setProfileForm({ ...profileForm, taxRate: Number(e.target.value) })}
                  placeholder="10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Service Charge Rate (%) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "vi" ? "Phụ Phí Dịch Vụ Khách Sạn (%)" : "Hotel Service Charge Rate (%)"}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={profileForm.serviceCharge}
                  onChange={e => setProfileForm({ ...profileForm, serviceCharge: Number(e.target.value) })}
                  placeholder="5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Total Rooms Count */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "vi" ? "Tổng Số Lượng Phòng Khách Sạn (Total Room Inventory)" : "Total Hotel Room Inventory Count"}</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={profileForm.totalRooms}
                  onChange={e => setProfileForm({ ...profileForm, totalRooms: Number(e.target.value) })}
                  className="w-48 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-bold text-amber-300"
                />
                <span className="text-xs text-slate-400">
                  {language === "vi"
                    ? `Hiện tại có ${rooms.length} phòng vật lý đã được tạo trong sơ đồ.`
                    : `Currently ${rooms.length} physical rooms created in inventory.`}
                </span>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* --- TAB 2: ROOM CATEGORIES --- */}
      {activeTab === "room_categories" && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>{t("roomCategories")}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "vi"
                  ? "Cấu hình danh mục loại phòng, sức chứa tối đa và mô tả tiện nghi"
                  : "Manage category names, max guest occupancy, and descriptions"}
              </p>
            </div>
            <button
              onClick={() => handleOpenCategoryModal()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("addRoomCategory")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {roomTypes.map(cat => {
              const assignedRoomsCount = rooms.filter(r => r.typeId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 space-y-3 transition shadow-sm group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-100 text-base group-hover:text-amber-300 transition">
                          {cat.name}
                        </h3>
                        <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                          {cat.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {cat.description || (language === "vi" ? "Chưa có mô tả" : "No description")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenCategoryModal(cat)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950/80 text-rose-400 rounded-lg transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">{language === "vi" ? "Sức Chứa" : "Max Capacity"}</div>
                      <div className="font-bold text-slate-200 text-sm">{cat.maxGuests} {language === "vi" ? "khách" : "guests"}</div>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">{language === "vi" ? "Đã Gán" : "Allocated"}</div>
                      <div className="font-bold text-sky-400 text-sm">{assignedRoomsCount} {language === "vi" ? "phòng" : "rooms"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: ROOM INVENTORY & CATEGORY ASSIGNMENT --- */}
      {activeTab === "room_assignment" && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Bed className="w-5 h-5 text-amber-400" />
                <span>{t("roomInventory")}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "vi"
                  ? "Quản lý danh sách phòng vật lý, tầng, gán loại phòng và cập nhật ghi chú phòng"
                  : "Manage physical room numbers, floor assignment, category linking, and room notes"}
              </p>
            </div>
            <button
              onClick={() => handleOpenRoomModal()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("addPhysicalRoom")}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3 font-semibold">{t("roomNumber")}</th>
                  <th className="p-3 font-semibold">{language === "vi" ? "Tầng" : "Floor"}</th>
                  <th className="p-3 font-semibold">{t("roomType")}</th>
                  <th className="p-3 font-semibold">{t("ratePerNight")}</th>
                  <th className="p-3 font-semibold">{t("status")}</th>
                  <th className="p-3 font-semibold">{language === "vi" ? "Phụ Trách / Ghi Chú" : "Attendant & Notes"}</th>
                  <th className="p-3 font-semibold text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rooms.map(room => (
                  <tr key={room.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-slate-100 text-sm">
                      <span className="bg-slate-800 text-amber-300 px-2 py-1 rounded-md border border-slate-700 font-mono">
                        {room.number}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-medium">
                      {language === "vi" ? `Tầng ${room.floor}` : `Floor ${room.floor}`}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-sky-300 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/50">
                        {room.typeName}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-amber-300">
                      {formatVND(room.rate)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          room.status === "vacant_clean"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : room.status === "occupied_clean" || room.status === "occupied_dirty"
                            ? "bg-sky-950 text-sky-300 border-sky-800"
                            : room.status === "out_of_order"
                            ? "bg-rose-950 text-rose-300 border-rose-800"
                            : "bg-amber-950 text-amber-300 border-amber-800"
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      <div className="text-slate-300 font-medium">{room.housekeeper}</div>
                      {room.notes && <div className="text-[11px] text-slate-500 italic truncate max-w-[200px]">{room.notes}</div>}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenRoomModal(room)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/80 text-rose-400 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: USER & SECURITY PIN MANAGEMENT --- */}
      {activeTab === "users_security" && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>{t("userManagement")}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "vi"
                  ? "Quản lý danh sách tài khoản nhân viên, đổi mã PIN bảo mật, gán chức vụ và phân quyền màn hình"
                  : "Manage staff accounts, credentials, security PINs, job titles, and allowed view permissions"}
              </p>
            </div>
            <button
              onClick={() => handleOpenUserModal()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("addUserAccount")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userAccounts.map(user => {
              const isMasked = !showPin[user.id];
              return (
                <div
                  key={user.id}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 space-y-4 transition shadow-sm group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-slate-900 p-2 rounded-xl border border-slate-800 leading-none">
                        {user.avatar}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-300 transition">
                          {user.name}
                        </h3>
                        <div className="text-xs text-slate-400">@{user.username}</div>
                        <div className="text-[10px] text-amber-400/90 font-medium mt-0.5">{user.title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenUserModal(user)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 bg-slate-900 hover:bg-rose-950/80 text-rose-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{language === "vi" ? "Vai Trò (Role):" : "Role:"}</span>
                      <span className="font-mono uppercase font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                        {user.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{language === "vi" ? "Mã PIN Đăng Nhập:" : "Security PIN:"}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400 text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {isMasked ? "••••" : user.pin}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(user.id)}
                          className="text-slate-400 hover:text-slate-200 transition"
                        >
                          {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Allowed Views Badges */}
                  <div>
                    <div className="text-[10px] text-slate-400 mb-1.5 font-medium">
                      {language === "vi" ? "Chức Năng Được Phép TRUY CẬP:" : "Allowed Function Views:"}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {user.allowedViews.map(view => (
                        <span
                          key={view}
                          className="text-[9px] bg-slate-900 text-sky-300 px-2 py-0.5 rounded border border-slate-800"
                        >
                          {view}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 5: PERMISSION MATRIX --- */}
      {activeTab === "permission_matrix" && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <span>{t("permissionMatrix")}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === "vi"
                ? "Ma trận tổng quan xem vai trò nào được phép mở những màn hình chức năng nào trong hệ thống PMS"
                : "Overview matrix showing function view access permissions per staff role"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3 font-semibold">{language === "vi" ? "Tài Khoản / Vai Trò" : "Staff User / Role"}</th>
                  {availableViewsList.map(v => (
                    <th key={v.id} className="p-3 font-semibold text-center whitespace-nowrap">
                      {v.labelVi}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userAccounts.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{u.avatar}</span>
                        <div>
                          <div className="text-amber-300 font-bold">{u.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">{u.role}</div>
                        </div>
                      </div>
                    </td>

                    {availableViewsList.map(v => {
                      const isAllowed = u.allowedViews.includes(v.id);
                      return (
                        <td key={v.id} className="p-3 text-center">
                          {isAllowed ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-slate-600 border border-slate-800">
                              -
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CATEGORY EDIT / ADD MODAL --- */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>{editingCategory.id ? (language === "vi" ? "Sửa Loại Phòng" : "Edit Room Category") : t("addRoomCategory")}</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Tên Loại Phòng" : "Category Name"}</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ""}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. Deluxe Double King"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Sức Chứa Khách Maximum" : "Max Guest Occupancy"}</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editingCategory.maxGuests || 2}
                  onChange={e => setEditingCategory({ ...editingCategory, maxGuests: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Mô Tả Chi Tiết" : "Description"}</label>
                <textarea
                  rows={3}
                  value={editingCategory.description || ""}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder={language === "vi" ? "Diện tích, thiết bị, tiện nghi phòng..." : "Room size, amenities..."}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PHYSICAL ROOM INVENTORY EDIT / ADD MODAL --- */}
      {isRoomModalOpen && editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Bed className="w-5 h-5 text-amber-400" />
                <span>{editingRoom.id ? (language === "vi" ? "Sửa Thông Tin Phòng" : "Edit Room") : t("addPhysicalRoom")}</span>
              </h3>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Số Phòng" : "Room Number"}</label>
                  <input
                    type="text"
                    required
                    value={editingRoom.number || ""}
                    onChange={e => setEditingRoom({ ...editingRoom, number: e.target.value })}
                    placeholder="e.g. 101"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Tầng" : "Floor"}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingRoom.floor || 1}
                    onChange={e => setEditingRoom({ ...editingRoom, floor: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Assign Room Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Gán Loại Phòng (Category)" : "Assign Room Category"}</label>
                <select
                  value={editingRoom.typeId}
                  onChange={e => handleCategorySelectForRoom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {roomTypes.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({formatVND(cat.baseRate)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Giá Niêm Yết Đêm (VNĐ)" : "Nightly Rate"}</label>
                <input
                  type="number"
                  value={editingRoom.rate || 0}
                  onChange={e => setEditingRoom({ ...editingRoom, rate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Ghi Chú Đặc Thù Phòng" : "Room Notes / Special Features"}</label>
                <input
                  type="text"
                  value={editingRoom.notes || ""}
                  onChange={e => setEditingRoom({ ...editingRoom, notes: e.target.value })}
                  placeholder="e.g. Balcony city view, extra quiet"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md"
                >
                  Save Physical Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- USER & SECURITY PIN EDIT / ADD MODAL --- */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>{editingUser.id ? (language === "vi" ? "Sửa Tài Khoản Nhân Viên" : "Edit Staff Account") : t("addUserAccount")}</span>
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Họ & Tên Nhân Viên" : "Full Name"}</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name || ""}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    placeholder="Nguyen Van A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Username</label>
                  <input
                    type="text"
                    required
                    value={editingUser.username || ""}
                    onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                    placeholder="reception1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Mã PIN Bảo Mật (4 Số)" : "Security PIN (4 Digits)"}</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={editingUser.pin || ""}
                    onChange={e => setEditingUser({ ...editingUser, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-emerald-400 font-bold font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Biểu Tượng Avatar" : "Avatar Emoji"}</label>
                  <select
                    value={editingUser.avatar || "👤"}
                    onChange={e => setEditingUser({ ...editingUser, avatar: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="👑">👑 Admin / Manager</option>
                    <option value="🛎️">🛎️ Front Desk / Reception</option>
                    <option value="🧹">🧹 Housekeeper Lead</option>
                    <option value="🧼">🧼 Room Attendant</option>
                    <option value="📈">📈 Sales & Revenue</option>
                    <option value="🌙">🌙 Night Auditor</option>
                    <option value="💼">💼 Accounting</option>
                    <option value="👤">👤 Generic Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Vai Trò (Role System)" : "System Role"}</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="admin">admin (Toàn Quyền Hệ Thống)</option>
                    <option value="front_desk">front_desk (Lễ Tân)</option>
                    <option value="housekeeper">housekeeper (Buồng Phòng)</option>
                    <option value="room_attendant">room_attendant (Nhân Viên Dọn)</option>
                    <option value="sales">sales (Kinh Doanh)</option>
                    <option value="night_audit">night_audit (Kiểm Đêm)</option>
                    <option value="accounting">accounting (Kế Toán)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{language === "vi" ? "Chức Danh Công Việc" : "Job Title"}</label>
                  <input
                    type="text"
                    value={editingUser.title || ""}
                    onChange={e => setEditingUser({ ...editingUser, title: e.target.value })}
                    placeholder="Supervisor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Function Permissions Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-amber-300 block">
                  {language === "vi" ? "Gán Quyền Màn Hình Được Phép TRUY CẬP (Allowed Views):" : "Assign Allowed Function Views:"}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {availableViewsList.map(v => {
                    const isChecked = (editingUser.allowedViews || []).includes(v.id);
                    return (
                      <label key={v.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-amber-300">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUserAllowedView(v.id)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                        />
                        <span>{language === "vi" ? v.labelVi : v.labelEn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md"
                >
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
