import React, { useState } from "react";
import { usePms } from "../../context/PmsContext";
import {
  Sliders,
  Building2,
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Zap,
  TrendingUp,
  Clock,
  Info,
  DollarSign,
  Users,
  Check,
  AlertCircle,
  Sparkles,
  Layers,
  Droplets,
  Shirt,
  BedDouble,
  Tag,
  Search,
  Power,
  X
} from "lucide-react";
import { RoomType, RatePeriod, ServiceCategory, ServiceRateItem } from "../../types";
import { formatVND } from "../../utils/formatters";

export const SettingsView: React.FC = () => {
  const {
    t,
    language,
    roomTypes,
    ratePeriods,
    serviceRates,
    businessDate,
    saveRoomType,
    saveRatePeriod,
    deleteRatePeriod,
    applyRatePeriod,
    saveServiceRate,
    deleteServiceRate,
    toggleServiceRate
  } = usePms();

  const [activeSubTab, setActiveSubTab] = useState<"room_types" | "rate_periods" | "rate_matrix" | "service_rates">("service_rates");

  // Helper function for localizing service item properties
  const formatUnit = (unit: string) => {
    if (language !== "en") return unit;
    const u = unit.toLowerCase().trim();
    if (u === "chai") return "bottle";
    if (u === "lon") return "can";
    if (u === "lần") return "time";
    if (u === "phòng") return "room";
    if (u === "đêm") return "night";
    if (u === "cái") return "piece";
    if (u === "bộ") return "set";
    if (u === "kg") return "kg";
    return unit;
  };

  const getLocalizedServiceName = (name: string) => {
    if (language !== "en") return name;
    if (name.includes("Nước suối Aquafina")) return "Aquafina Mineral Water 500ml";
    if (name.includes("Nước khoáng Perrier")) return "Perrier Sparkling Water 330ml";
    if (name.includes("Nước ngọt")) return "Soft Drinks (Coca / Pepsi / RedBull)";
    if (name.includes("Bia Saigon")) return "Saigon Special / Tiger Beer 330ml";
    if (name.includes("Giặt sấy quần áo thông thường")) return "Standard Laundry & Drying";
    if (name.includes("Giặt hấp & Ửi sơ mi")) return "Express Dry Cleaning & Shirt Ironing";
    if (name.includes("Trả phòng muộn 12:00 - 15:00")) return "Late Checkout 12:00 - 15:00 (30% Surcharge)";
    if (name.includes("Trả phòng muộn 15:00 - 18:00")) return "Late Checkout 15:00 - 18:00 (50% Surcharge)";
    if (name.includes("Thêm giường phụ")) return "Extra Bed Rollaway";
    if (name.includes("Phụ thu khách thứ 3")) return "3rd Guest Extra Occupancy Surcharge";
    return name;
  };

  const getLocalizedServiceDesc = (desc?: string) => {
    if (!desc) return "";
    if (language !== "en") return desc;
    if (desc.includes("minibar")) return "Chilled room minibar item";
    if (desc.includes("nhận trước 12:00")) return "Standard folded laundry service (same day)";
    if (desc.includes("bảo vệ chất liệu")) return "Premium care dry cleaning & ironing";
    if (desc.includes("phòng nghỉ")) return "Standard late checkout charge";
    if (desc.includes("nệm cao cấp")) return "Includes extra set of pillows & blankets";
    if (desc.includes("ăn sáng")) return "Includes complimentary breakfast ticket";
    return desc;
  };

  const getLocalizedPeriodName = (name: string) => {
    if (language !== "en") return name;
    if (name.includes("Mùa Tiêu Chuẩn")) return "Standard Base Season";
    if (name.includes("Mùa Cao Điểm Hè")) return "Summer Peak Season";
    if (name.includes("Cao Điểm Lễ Tết")) return "Festive Holiday Peak";
    if (name.includes("Khuyến Mãi Mùa Thấp Điểm")) return "Low Season Promotion";
    return name;
  };

  const getLocalizedPeriodNotes = (notes?: string) => {
    if (!notes) return "";
    if (language !== "en") return notes;
    if (notes.includes("tiêu chuẩn")) return "Year-round standard default rate tariff";
    if (notes.includes("du lịch hè")) return "Summer tourism peak surcharge (+35%)";
    if (notes.includes("Giáng Sinh")) return "Christmas & New Year holiday peak (+60%)";
    if (notes.includes("thấp điểm")) return "Low season special promotional discount (-15%)";
    return notes;
  };

  const getLocalizedRoomTypeName = (name: string) => {
    if (language !== "en") return name;
    if (name === "Standard Single") return "Standard Single";
    if (name === "Standard Double") return "Standard Double";
    if (name === "Deluxe Twin") return "Deluxe Twin";
    if (name === "Economy Suite") return "Economy Suite";
    return name;
  };

  const getLocalizedRoomTypeDesc = (desc: string) => {
    if (language !== "en") return desc;
    if (desc.includes("16m²")) return "Standard single room 16m², single bed, AC, desk, private bathroom";
    if (desc.includes("22m²")) return "Standard double room 22m², Queen bed, Smart TV, minibar";
    if (desc.includes("28m²")) return "Deluxe twin room 28m², 2 single beds, city view, coffee maker";
    if (desc.includes("38m²")) return "Economy Suite 38m², separate living room, King bed, bathtub (Max 3 guests)";
    return desc;
  };

  // State for Service Rates Tab
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<ServiceCategory | "all">("all");
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRateItem | null>(null);
  const [serviceFormData, setServiceFormData] = useState<{
    id: string;
    category: ServiceCategory;
    name: string;
    unit: string;
    rate: number;
    description: string;
    isAvailable: boolean;
  }>({
    id: "",
    category: "water",
    name: "",
    unit: "chai",
    rate: 20,
    description: "",
    isAvailable: true
  });

  // State for Editing Room Type
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [isAddRoomTypeOpen, setIsAddRoomTypeOpen] = useState(false);
  const [rtFormData, setRtFormData] = useState({
    id: "",
    name: "",
    baseRate: 450,
    maxGuests: 2,
    total: 10,
    description: ""
  });

  // State for Editing Rate Period
  const [editingPeriod, setEditingPeriod] = useState<RatePeriod | null>(null);
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [periodFormData, setPeriodFormData] = useState<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    rates: Record<string, number>;
    multiplier: number;
    notes: string;
    isDefault: boolean;
  }>({
    id: "",
    name: "",
    startDate: businessDate,
    endDate: "2026-12-31",
    rates: {},
    multiplier: 1.2,
    notes: "",
    isDefault: false
  });

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to check if a date range covers current business date
  const isPeriodActiveNow = (period: RatePeriod) => {
    if (!period.startDate || !period.endDate) return false;
    return businessDate >= period.startDate && businessDate <= period.endDate;
  };

  // Handler for Room Type submit
  const handleSaveRoomTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rtFormData.name || rtFormData.baseRate <= 0) {
      showNotification("Please provide a valid Room Type Name and Base Rate.", "error");
      return;
    }

    const success = await saveRoomType(rtFormData);
    if (success) {
      showNotification(`Room Type '${rtFormData.name}' saved successfully!`);
      setIsAddRoomTypeOpen(false);
      setEditingRoomType(null);
    } else {
      showNotification("Failed to save Room Type.", "error");
    }
  };

  const openEditRoomType = (rt: RoomType) => {
    setEditingRoomType(rt);
    setRtFormData({
      id: rt.id,
      name: rt.name,
      baseRate: rt.baseRate,
      maxGuests: rt.maxGuests,
      total: rt.total,
      description: rt.description
    });
    setIsAddRoomTypeOpen(true);
  };

  const openNewRoomType = () => {
    setEditingRoomType(null);
    setRtFormData({
      id: "",
      name: "",
      baseRate: 600,
      maxGuests: 2,
      total: 12,
      description: "Comfortable hotel room with essential guest amenities"
    });
    setIsAddRoomTypeOpen(true);
  };

  // Handler for Rate Period submit
  const handleSavePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodFormData.name || !periodFormData.startDate || !periodFormData.endDate) {
      showNotification("Please enter Period Name, Start Date, and End Date.", "error");
      return;
    }

    // Ensure all room types have a rate value
    const ratesObject = { ...periodFormData.rates };
    roomTypes.forEach((rt) => {
      if (ratesObject[rt.id] === undefined || ratesObject[rt.id] === 0) {
        ratesObject[rt.id] = Math.round(rt.baseRate * (periodFormData.multiplier || 1));
      }
    });

    const payload = {
      ...periodFormData,
      rates: ratesObject
    };

    const success = await saveRatePeriod(payload);
    if (success) {
      showNotification(`Rate Period '${periodFormData.name}' saved successfully!`);
      setIsAddPeriodOpen(false);
      setEditingPeriod(null);
    } else {
      showNotification("Failed to save Rate Period.", "error");
    }
  };

  const openEditPeriod = (period: RatePeriod) => {
    setEditingPeriod(period);
    setPeriodFormData({
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      rates: { ...period.rates },
      multiplier: period.multiplier || 1.0,
      notes: period.notes || "",
      isDefault: Boolean(period.isDefault)
    });
    setIsAddPeriodOpen(true);
  };

  const openNewPeriod = () => {
    setEditingPeriod(null);
    const initialRates: Record<string, number> = {};
    roomTypes.forEach((rt) => {
      initialRates[rt.id] = Math.round(rt.baseRate * 1.25);
    });

    setPeriodFormData({
      id: "",
      name: "High Season Peak 2026",
      startDate: businessDate,
      endDate: "2026-09-15",
      rates: initialRates,
      multiplier: 1.25,
      notes: "Seasonal tariff adjustment for peak demand period",
      isDefault: false
    });
    setIsAddPeriodOpen(true);
  };

  const handleDeletePeriod = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete rate period '${name}'?`)) {
      const success = await deleteRatePeriod(id);
      if (success) {
        showNotification(`Rate period '${name}' deleted.`);
      } else {
        showNotification("Failed to delete rate period.", "error");
      }
    }
  };

  const handleApplyPeriod = async (period: RatePeriod) => {
    const success = await applyRatePeriod(period.id);
    if (success) {
      showNotification(`Applied '${period.name}' tariffs to all vacant/available inventory rooms!`);
    } else {
      showNotification("Failed to apply rate period.", "error");
    }
  };

  // Helper for Category Badges
  const getCategoryBadge = (cat: ServiceCategory) => {
    switch (cat) {
      case "water":
        return {
          label: language === "en" ? "Water & Minibar" : "Nước Uống & Minibar",
          icon: <Droplets className="w-3.5 h-3.5" />,
          bg: "bg-sky-500/10 text-sky-400 border-sky-500/20"
        };
      case "laundry":
        return {
          label: language === "en" ? "Laundry & Dry Cleaning" : "Giặt Ủi & Là Sấy",
          icon: <Shirt className="w-3.5 h-3.5" />,
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20"
        };
      case "late_checkout":
        return {
          label: language === "en" ? "Late Checkout" : "Trả Phòng Muộn",
          icon: <Clock className="w-3.5 h-3.5" />,
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20"
        };
      case "extra_bed":
        return {
          label: language === "en" ? "Extra Bed & Guests" : "Giường Phụ & Khách Thêm",
          icon: <BedDouble className="w-3.5 h-3.5" />,
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        };
      case "other":
      default:
        return {
          label: language === "en" ? "Other Services" : "Dịch Vụ Khác",
          icon: <Tag className="w-3.5 h-3.5" />,
          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
        };
    }
  };

  const handleOpenAddService = (category: ServiceCategory = "water") => {
    setEditingService(null);
    setServiceFormData({
      id: "",
      category,
      name: "",
      unit: category === "water" ? "chai" : category === "laundry" ? "kg" : category === "late_checkout" ? "phòng" : category === "extra_bed" ? "đêm" : "lần",
      rate: 20,
      description: "",
      isAvailable: true
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (item: ServiceRateItem) => {
    setEditingService(item);
    setServiceFormData({
      id: item.id,
      category: item.category,
      name: item.name,
      unit: item.unit,
      rate: item.rate,
      description: item.description || "",
      isAvailable: item.isAvailable
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.name || serviceFormData.rate < 0) {
      showNotification("Vui lòng nhập Tên Dịch Vụ và Đơn Giá hợp lệ.", "error");
      return;
    }
    const success = await saveServiceRate(serviceFormData);
    if (success) {
      showNotification(`Đã lưu bảng giá dịch vụ '${serviceFormData.name}' thành công!`);
      setIsServiceModalOpen(false);
    } else {
      showNotification("Lỗi khi lưu bảng giá dịch vụ.", "error");
    }
  };

  const handleDeleteService = async (item: ServiceRateItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa dịch vụ '${item.name}'?`)) {
      const success = await deleteServiceRate(item.id);
      if (success) {
        showNotification(`Đã xóa dịch vụ '${item.name}'.`);
      } else {
        showNotification("Lỗi khi xóa dịch vụ.", "error");
      }
    }
  };

  const handleToggleService = async (item: ServiceRateItem) => {
    const success = await toggleServiceRate(item.id);
    if (success) {
      showNotification(`Đã cập nhật trạng thái dịch vụ '${item.name}'.`);
    }
  };

  // Filtered Services List
  const filteredServices = serviceRates.filter(item => {
    const matchesCategory = serviceCategoryFilter === "all" || item.category === serviceCategoryFilter;
    const matchesQuery = item.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(serviceSearchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-semibold animate-bounce ${
            notification.type === "success"
              ? "bg-emerald-950 text-emerald-200 border-emerald-500/50"
              : "bg-rose-950 text-rose-200 border-rose-500/50"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Room Types & Multi-Period Rate Settings
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure room categories, base tariffs, and multi-period seasonal rate rules for different calendar dates.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-xl text-slate-300">
            <span className="text-[10px] text-slate-400 block">Current Business Date</span>
            <span className="font-mono font-bold text-amber-300">{businessDate}</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-xl text-slate-300">
            <span className="text-[10px] text-slate-400 block">Configured Room Types</span>
            <span className="font-mono font-bold text-emerald-400">{roomTypes.length} Categories</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-xl text-slate-300">
            <span className="text-[10px] text-slate-400 block">Multi-Period Rules</span>
            <span className="font-mono font-bold text-sky-400">{ratePeriods.length} Defined Periods</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 flex-wrap">
        <button
          onClick={() => setActiveSubTab("service_rates")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeSubTab === "service_rates"
              ? "border-amber-500 text-amber-400 bg-slate-900/60 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Droplets className="w-4 h-4 text-sky-400" />
          <span>{t("subTabServiceRates")} ({serviceRates.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("rate_periods")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeSubTab === "rate_periods"
              ? "border-amber-500 text-amber-400 bg-slate-900/60 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Multi-Period Seasonal Rates ({ratePeriods.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("room_types")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeSubTab === "room_types"
              ? "border-amber-500 text-amber-400 bg-slate-900/60 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Room Types & Base Rates ({roomTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("rate_matrix")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeSubTab === "rate_matrix"
              ? "border-amber-500 text-amber-400 bg-slate-900/60 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Period Rate Comparison Matrix</span>
        </button>
      </div>

      {/* --- TAB: SERVICE & EXTRA FEE RATES --- */}
      {activeSubTab === "service_rates" && (
        <div className="space-y-5">
          {/* Top Action & Category Filters */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 shadow-lg">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-sky-400" />
                  {language === "en" ? "Hotel Service & Surcharge Rate Configuration" : "Cấu Hình Bảng Giá Dịch Vụ & Phụ Thu Dịch Vụ Khách Sạn"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {language === "en" ? "Set tariffs for Minibar Water, Laundry, Late Checkout, Extra Bed, and Other services. Auto-synced with Front Desk & Folio billing." : "Thiết lập đơn giá cho các dịch vụ Nước uống / Minibar, Giặt ủi, Trả phòng muộn, Giường phụ và Dịch vụ khác. Tự động đồng bộ với Quầy lễ tân & Folio thanh toán."}
                </p>
              </div>

              <button
                onClick={() => handleOpenAddService(serviceCategoryFilter === "all" ? "water" : serviceCategoryFilter)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/10"
              >
                <Plus className="w-4 h-4" />
                <span>{language === "en" ? "+ Add New Service" : "+ Thêm Dịch Vụ Mới"}</span>
              </button>
            </div>

            {/* Category Filter Tabs & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setServiceCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    serviceCategoryFilter === "all"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{language === "en" ? "All" : "Tất Cả"} ({serviceRates.length})</span>
                </button>

                <button
                  onClick={() => setServiceCategoryFilter("water")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    serviceCategoryFilter === "water"
                      ? "bg-sky-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>{language === "en" ? "Water & Minibar" : "Nước Uống & Minibar"} ({serviceRates.filter(s => s.category === "water").length})</span>
                </button>

                <button
                  onClick={() => setServiceCategoryFilter("laundry")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    serviceCategoryFilter === "laundry"
                      ? "bg-purple-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Shirt className="w-3.5 h-3.5 text-purple-400" />
                  <span>{language === "en" ? "Laundry" : "Giặt Ủi"} ({serviceRates.filter(s => s.category === "laundry").length})</span>
                </button>

                <button
                  onClick={() => setServiceCategoryFilter("late_checkout")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    serviceCategoryFilter === "late_checkout"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === "en" ? "Late Checkout" : "Trả Phòng Muộn"} ({serviceRates.filter(s => s.category === "late_checkout").length})</span>
                </button>

                <button
                  onClick={() => setServiceCategoryFilter("extra_bed")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    serviceCategoryFilter === "extra_bed"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <BedDouble className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === "en" ? "Extra Bed" : "Giường Phụ"} ({serviceRates.filter(s => s.category === "extra_bed").length})</span>
                </button>

                <button
                  onClick={() => setServiceCategoryFilter("other")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    serviceCategoryFilter === "other"
                      ? "bg-indigo-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{language === "en" ? "Other" : "Khác"} ({serviceRates.filter(s => s.category === "other").length})</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === "en" ? "Search services..." : "Tìm kiếm dịch vụ..."}
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Service Items Grid */}
          {filteredServices.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Tag className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">{language === "en" ? "No services match the current filter." : "Chưa có dịch vụ nào phù hợp với bộ lọc hiện tại."}</p>
              <button
                onClick={() => handleOpenAddService(serviceCategoryFilter === "all" ? "water" : serviceCategoryFilter)}
                className="mt-3 text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 px-3 py-1.5 rounded-xl font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {language === "en" ? "Create New Service" : "Tạo Dịch Vụ Mới"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((item) => {
                const badge = getCategoryBadge(item.category);
                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900 border rounded-2xl p-4 space-y-3 relative flex flex-col justify-between transition hover:border-slate-700 shadow-lg ${
                      item.isAvailable ? "border-slate-800" : "border-slate-800/60 opacity-60 bg-slate-900/50"
                    }`}
                  >
                    <div>
                      {/* Top Category Badge & Status */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>

                        <button
                          onClick={() => handleToggleService(item)}
                          title={language === "en" ? "Toggle availability" : "Bật/Tắt khả năng cung cấp"}
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1 transition ${
                            item.isAvailable
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{item.isAvailable ? (language === "en" ? "Available" : "Đang Bán") : (language === "en" ? "Unavailable" : "Tạm Ngưng")}</span>
                        </button>
                      </div>

                      {/* Service Name & Description */}
                      <h3 className="font-bold text-slate-100 text-sm">{getLocalizedServiceName(item.name)}</h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{getLocalizedServiceDesc(item.description)}</p>
                      )}
                    </div>

                    {/* Price & Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">{language === "en" ? "Rate" : "Đơn giá"}</span>
                        <div className="text-amber-400 font-mono font-extrabold text-base">
                          {formatVND(item.rate)}
                          <span className="text-slate-400 font-normal text-xs ml-1">/ {formatUnit(item.unit)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditService(item)}
                          className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition"
                          title={language === "en" ? "Edit service" : "Chỉnh sửa dịch vụ"}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteService(item)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                          title={language === "en" ? "Delete service" : "Xóa dịch vụ"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 1: MULTI-PERIOD SEASONAL RATES --- */}
      {activeSubTab === "rate_periods" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Calendar Date Periods & Dynamic Pricing Rules
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set seasonal tariffs (Summer Peak, Holidays, Low Season, Weekends) that adjust room rates automatically based on guest stay date ranges.
              </p>
            </div>

            <button
              onClick={openNewPeriod}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rate Period</span>
            </button>
          </div>

          {/* Rate Periods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratePeriods.map((period) => {
              const activeNow = isPeriodActiveNow(period);
              return (
                <div
                  key={period.id}
                  className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition relative overflow-hidden ${
                    activeNow
                      ? "border-amber-500/80 shadow-lg shadow-amber-500/5 bg-slate-900/95"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-100 text-sm">{getLocalizedPeriodName(period.name)}</h3>
                        {activeNow && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {language === "en" ? "Active for Today" : "Đang Áp Dụng Hôm Nay"}
                          </span>
                        )}
                        {period.isDefault && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                            {language === "en" ? "Base Default" : "Mặc Định Trực Tiếp"}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono text-slate-200">{period.startDate}</span>
                        <span>{language === "en" ? "to" : "đến"}</span>
                        <span className="font-mono text-slate-200">{period.endDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditPeriod(period)}
                        title={language === "en" ? "Edit Period Rules" : "Sửa Quy Tắc Thời Điểm"}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!period.isDefault && (
                        <button
                          onClick={() => handleDeletePeriod(period.id, period.name)}
                          title={language === "en" ? "Delete Rate Period" : "Xóa Thời Điểm"}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition border border-slate-700 hover:border-rose-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {period.notes && (
                    <p className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 italic">
                      "{getLocalizedPeriodNotes(period.notes)}"
                    </p>
                  )}

                  {/* Room Type Rates Grid for this Period */}
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {language === "en" ? "Period Nightly Rates per Room Category" : "Bảng Giá Đêm Theo Loại Phòng"}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {roomTypes.map((rt) => {
                        const periodRate = period.rates && period.rates[rt.id] !== undefined
                          ? period.rates[rt.id]
                          : Math.round(rt.baseRate * (period.multiplier || 1));
                        
                        const diffPct = Math.round(((periodRate - rt.baseRate) / rt.baseRate) * 100);

                        return (
                          <div
                            key={rt.id}
                            className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-xl flex justify-between items-center text-xs"
                          >
                            <div>
                              <span className="font-medium text-slate-300 block text-[11px]">{getLocalizedRoomTypeName(rt.name)}</span>
                              <span className="text-[10px] text-slate-500">{language === "en" ? "Base: " : "Gốc: "}{formatVND(rt.baseRate)}{language === "en" ? "/night" : "/đêm"}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-amber-300 text-xs block">
                                {formatVND(periodRate)}
                                <span className="text-[10px] font-normal text-slate-400">{language === "en" ? "/night" : "/đêm"}</span>
                              </span>
                              {diffPct !== 0 && (
                                <span
                                  className={`text-[9px] font-bold ${
                                    diffPct > 0 ? "text-emerald-400" : "text-sky-400"
                                  }`}
                                >
                                  {diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Apply Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleApplyPeriod(period)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-semibold px-3 py-1.5 rounded-xl border border-slate-700 text-xs transition"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Apply Tariff to Inventory</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 2: ROOM TYPES & BASE RATES --- */}
      {activeSubTab === "room_types" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Hotel Room Categories & Standard Base Rates
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Define core room categories, max guest capacity, total physical inventory units, and default base rates.
              </p>
            </div>

            <button
              onClick={openNewRoomType}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room Type</span>
            </button>
          </div>

          {/* Room Types Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roomTypes.map((rt) => (
              <div
                key={rt.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-slate-100 text-sm">{getLocalizedRoomTypeName(rt.name)}</h3>
                    <button
                      onClick={() => openEditRoomType(rt)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 text-xl font-bold font-mono text-amber-400 flex items-baseline gap-1">
                    {formatVND(rt.baseRate)}
                    <span className="text-xs font-normal text-slate-400">{language === "en" ? "/ night" : "/ đêm"}</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{getLocalizedRoomTypeDesc(rt.description)}</p>
                </div>

                <div className="border-t border-slate-800 pt-3 text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {language === "en" ? "Max Capacity:" : "Sức chứa tối đa:"}
                    </span>
                    <span className="font-semibold text-slate-200">{rt.maxGuests} {language === "en" ? "Guests" : "Khách"}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {language === "en" ? "Physical Inventory:" : "Tổng số phòng:"}
                    </span>
                    <span className="font-semibold text-emerald-400">{rt.total} {language === "en" ? "Units" : "Phòng"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: PERIOD RATE COMPARISON MATRIX --- */}
      {activeSubTab === "rate_matrix" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  {language === "en" ? "Multi-Period Rate Comparison Matrix" : "Ma Trận So Sánh Bảng Giá Theo Thời Điểm"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === "en" ? "Side-by-side tariff matrix comparing base rates with multi-period seasonal prices." : "Bảng so sánh trực quan giá phòng cơ bản và giá áp dụng theo từng thời điểm mùa vụ."}
                </p>
              </div>

              <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                {language === "en" ? "Business Date: " : "Ngày kinh doanh: "}<span className="font-mono text-amber-300 font-bold">{businessDate}</span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 bg-slate-950/60 rounded-tl-xl">{language === "en" ? "Room Category" : "Loại Phòng"}</th>
                    <th className="py-3 px-3 bg-slate-950/60 text-right">{language === "en" ? "Standard Base" : "Giá Gốc Mặc Định"}</th>
                    {ratePeriods.map((period) => {
                      const active = isPeriodActiveNow(period);
                      return (
                        <th
                          key={period.id}
                          className={`py-3 px-3 text-right ${
                            active
                              ? "bg-amber-950/30 text-amber-300 border-x border-amber-500/30 font-bold"
                              : "bg-slate-950/40 text-slate-300"
                          }`}
                        >
                          <div>{getLocalizedPeriodName(period.name)}</div>
                          <div className="text-[9px] font-mono text-slate-400 font-normal">
                            {period.startDate} → {period.endDate}
                          </div>
                          {active && (
                            <span className="text-[9px] text-emerald-400 block uppercase font-bold">
                              {language === "en" ? "★ Current Active" : "★ Đang Áp Dụng"}
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {roomTypes.map((rt) => (
                    <tr key={rt.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-100 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <div>
                          <span>{getLocalizedRoomTypeName(rt.name)}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {language === "en" ? `Max ${rt.maxGuests} guests • ${rt.total} rooms` : `Tối đa ${rt.maxGuests} khách • ${rt.total} phòng`}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                        {formatVND(rt.baseRate)}{language === "en" ? "/night" : "/đêm"}
                      </td>

                      {ratePeriods.map((period) => {
                        const active = isPeriodActiveNow(period);
                        const periodRate = period.rates && period.rates[rt.id] !== undefined
                          ? period.rates[rt.id]
                          : Math.round(rt.baseRate * (period.multiplier || 1));
                        
                        const diffPct = Math.round(((periodRate - rt.baseRate) / rt.baseRate) * 100);

                        return (
                          <td
                            key={period.id}
                            className={`py-3 px-3 text-right font-mono ${
                              active ? "bg-amber-950/20 border-x border-amber-500/20 font-bold" : ""
                            }`}
                          >
                            <span className="text-slate-100 font-bold text-xs">{formatVND(periodRate)}</span>
                            <span className="text-[10px] text-slate-400">{language === "en" ? "/night" : "/đêm"}</span>
                            {diffPct !== 0 && (
                              <span
                                className={`block text-[9px] font-bold ${
                                  diffPct > 0 ? "text-emerald-400" : "text-sky-400"
                                }`}
                              >
                                ({diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`})
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
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT ROOM TYPE --- */}
      {isAddRoomTypeOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                {editingRoomType ? "Edit Room Category" : "Add New Room Type"}
              </h3>
              <button
                onClick={() => setIsAddRoomTypeOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoomTypeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Room Type Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Premier Suite"
                  value={rtFormData.name}
                  onChange={(e) => setRtFormData({ ...rtFormData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Giá gốc (x1.000đ)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 450"
                    value={rtFormData.baseRate}
                    onChange={(e) => setRtFormData({ ...rtFormData, baseRate: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={rtFormData.maxGuests}
                    onChange={(e) => setRtFormData({ ...rtFormData, maxGuests: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Inventory Units</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={rtFormData.total}
                    onChange={(e) => setRtFormData({ ...rtFormData, total: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Amenities</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of room dimensions, bed types, and amenities..."
                  value={rtFormData.description}
                  onChange={(e) => setRtFormData({ ...rtFormData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRoomTypeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Room Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD / EDIT SEASONAL RATE PERIOD --- */}
      {isAddPeriodOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-400" />
                {editingPeriod ? "Edit Seasonal Rate Period" : "Configure New Rate Period"}
              </h3>
              <button
                onClick={() => setIsAddPeriodOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePeriodSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Period Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer High Season Peak"
                  value={periodFormData.name}
                  onChange={(e) => setPeriodFormData({ ...periodFormData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={periodFormData.startDate}
                    onChange={(e) => setPeriodFormData({ ...periodFormData, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={periodFormData.endDate}
                    onChange={(e) => setPeriodFormData({ ...periodFormData, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Rate Multiplier / Custom Price per Room Category */}
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">Custom Nightly Rates per Category</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Auto Multiplier:</span>
                    <select
                      value={periodFormData.multiplier}
                      onChange={(e) => {
                        const mult = Number(e.target.value);
                        const newRates: Record<string, number> = {};
                        roomTypes.forEach((rt) => {
                          newRates[rt.id] = Math.round(rt.baseRate * mult);
                        });
                        setPeriodFormData({
                          ...periodFormData,
                          multiplier: mult,
                          rates: newRates
                        });
                      }}
                      className="bg-slate-800 border border-slate-700 text-amber-300 rounded-lg px-2 py-1 font-mono text-xs focus:outline-none"
                    >
                      <option value="0.80">0.80x (-20% Low Season)</option>
                      <option value="0.90">0.90x (-10% Promo)</option>
                      <option value="1.00">1.00x (Standard Base)</option>
                      <option value="1.15">1.15x (+15% High)</option>
                      <option value="1.25">1.25x (+25% Peak)</option>
                      <option value="1.50">1.50x (+50% Festival)</option>
                      <option value="1.75">1.75x (+75% Holiday)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {roomTypes.map((rt) => {
                    const currentRate = periodFormData.rates[rt.id] !== undefined
                      ? periodFormData.rates[rt.id]
                      : Math.round(rt.baseRate * (periodFormData.multiplier || 1));

                    return (
                      <div
                        key={rt.id}
                        className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800"
                      >
                        <div>
                          <span className="font-semibold text-slate-200 text-xs block">{rt.name}</span>
                          <span className="text-[10px] text-slate-500">Giá gốc: {formatVND(rt.baseRate)}/đêm</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={currentRate}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setPeriodFormData({
                                ...periodFormData,
                                rates: {
                                  ...periodFormData.rates,
                                  [rt.id]: val
                                }
                              });
                            }}
                            className="w-24 bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold px-2 py-1 rounded-lg text-right focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-slate-400 font-mono text-[10px]">.000 VNĐ</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Internal Notes / Revenue Strategy</label>
                <input
                  type="text"
                  placeholder="e.g. Summer holiday tourist surge pricing strategy..."
                  value={periodFormData.notes}
                  onChange={(e) => setPeriodFormData({ ...periodFormData, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPeriodOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Rate Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT SERVICE RATE ITEM --- */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                {editingService
                  ? (language === "en" ? "Edit Service Tariff" : "Chỉnh Sửa Giá Dịch Vụ")
                  : (language === "en" ? "Add New Service / Surcharge" : "Thêm Dịch Vụ / Phụ Thu Mới")}
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceSubmit} className="space-y-4 text-xs">
              {/* Category */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === "en" ? "Service Category" : "Phân Loại Dịch Vụ"} <span className="text-rose-400">*</span>
                </label>
                <select
                  value={serviceFormData.category}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value as ServiceCategory })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="water">{language === "en" ? "💧 Drinking Water / Minibar" : "💧 Nước Uống / Đồ Uống Minibar"}</option>
                  <option value="laundry">{language === "en" ? "🧺 Laundry & Dry Cleaning" : "🧺 Giặt Ủi & Là Sấy"}</option>
                  <option value="late_checkout">{language === "en" ? "⏰ Late Checkout Surcharge" : "⏰ Trả Phòng Muộn (Late Checkout)"}</option>
                  <option value="extra_bed">{language === "en" ? "🛏️ Extra Bed & Guest" : "🛏️ Giường Phụ & Khách Thêm"}</option>
                  <option value="other">{language === "en" ? "🧰 Other Services" : "🧰 Dịch Vụ Khác"}</option>
                </select>
              </div>

              {/* Service Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === "en" ? "Service / Surcharge Name" : "Tên Dịch Vụ / Tên Phụ Thu"} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === "en" ? "e.g. Mineral Water 500ml, Late Checkout (12h - 15h)..." : "Ví dụ: Nước suối Lavie 500ml, Trả phòng muộn (12h - 15h)..."}
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Rate & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === "en" ? "Unit Rate (x 1,000 VND)" : "Đơn Giá (x 1.000 VNĐ)"} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={serviceFormData.rate}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, rate: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-16 py-2 text-slate-100 font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">.000 VNĐ</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                    = {formatVND(serviceFormData.rate)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === "en" ? "Unit of Measurement" : "Đơn Vị Tính"} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "en" ? "bottle, can, kg, piece, room, night..." : "chai, lon, kg, cái, phòng, đêm, lần..."}
                    value={serviceFormData.unit}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, unit: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === "en" ? "Description / Detailed Notes" : "Mô Tả / Ghi Chú Chi Tiết"}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === "en" ? "Description or terms for this service..." : "Mô tả quy định hoặc thông tin chi tiết dịch vụ..."}
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Is Available Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isAvailableService"
                  checked={serviceFormData.isAvailable}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, isAvailable: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isAvailableService" className="text-slate-300 font-medium select-none cursor-pointer">
                  {language === "en" ? "Active / Available for hotel guests (Ready for billing)" : "Đang cung cấp tại khách sạn (Sẵn sàng tính phí)"}
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium"
                >
                  {language === "en" ? "Cancel" : "Hủy Bỏ"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {editingService
                    ? (language === "en" ? "Update Service" : "Cập Nhật")
                    : (language === "en" ? "Save Service" : "Lưu Dịch Vụ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
