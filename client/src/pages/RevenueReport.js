import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import {
  FileText,
  Download,
  FileSpreadsheet,
  Coins,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { message, Space, Table } from "antd";
import { reportsAPI } from "../services/api";
import moment from "moment";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { Area } from "@ant-design/charts";
// ============ CONSTANTS ============
const DEFAULT_PAGE_SIZE = 15;
const PAGE_SIZE_OPTIONS = [10, 15, 20, 30, 50];

// ============ UTILITIES ============
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const formatChartValue = (value) => {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return `${(value / 1000).toFixed(0)}K`;
};

const formatDate = (date, format = "DD-MM-YYYY") => moment(date).format(format);

// ============ CUSTOM HOOKS ============
const useDateFilters = (year, month) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const firstDay = moment(`${year}-${month}-01`).format("YYYY-MM-DD");
    const lastDay = moment(`${year}-${month}-01`)
      .endOf("month")
      .format("YYYY-MM-DD");
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, [year, month]);

  return { startDate, endDate, setStartDate, setEndDate };
};

const useRevenueData = (year, month) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    summary: { total_revenue: 0, total_patient_count: 0 },
    dailyData: [],
  });
  const [maxRevenueDay, setMaxRevenueDay] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await reportsAPI.getRevenueReport({ month, year });

        if (res.data?.success && res.data.data?.daily_revenue?.length > 0) {
          const daily = res.data.data.daily_revenue;
          const highest = daily.reduce((a, b) =>
            parseFloat(a.revenue) > parseFloat(b.revenue) ? a : b
          );

          setData({
            summary: res.data.data.monthly_summary || {},
            dailyData: daily,
          });
          setMaxRevenueDay(highest);
        } else {
          setData({ summary: {}, dailyData: [] });
          setMaxRevenueDay(null);
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        setData({ summary: {}, dailyData: [] });
        setMaxRevenueDay(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month]);

  return { loading, data, maxRevenueDay };
};

// ============ COMPONENTS ============

// Header Component
const DashboardHeader = ({
  selectedYear,
  selectedMonth,
  onMonthChange,
  onExportFile,
}) => (
  <div className="bg-white rounded-2xl shadow-sm p-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FileText className="text-blue-600" size={36} />
          Báo cáo doanh thu tháng {selectedMonth}/{selectedYear}
        </h1>
        <p className="text-gray-600 mt-1">Tổng quan doanh thu và bệnh nhân</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="month"
          value={`${selectedYear}-${selectedMonth}`}
          onChange={onMonthChange}
          className="px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
        />

        <div className="flex gap-3">
          {/*           <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl transition">
            <Download size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button> */}
          <button
            onClick={onExportFile}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl transition"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline"> Xuất Excel</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Summary Card Component
const SummaryCard = ({ title, value, icon: Icon, gradient, iconColor }) => (
  <div className={`${gradient} rounded-2xl shadow-lg p-6 text-white`}>
    <div className="flex justify-between items-start">
      <div>
        <p className={`${iconColor} text-sm`}>{title}</p>
        <p className="text-4xl font-bold mt-2">{value}</p>
      </div>
      <Icon size={48} className="opacity-80" />
    </div>
  </div>
);

// Summary Cards Container
const SummaryCards = ({ summary, maxRevenueDay }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <SummaryCard
      title="Tổng doanh thu"
      value={formatCurrency(summary.total_revenue || 0)}
      icon={Coins}
      gradient="bg-gradient-to-br from-orange-600 to-orange-800"
      iconColor="text-orange-100"
    />
    <SummaryCard
      title="Tổng bệnh nhân"
      value={summary.total_patient_count || 0}
      icon={Users}
      gradient="bg-gradient-to-br from-green-500 to-emerald-600"
      iconColor="text-green-100"
    />
    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-purple-100 text-sm">Ngày doanh thu cao nhất</p>
          <p className="text-3xl font-bold mt-2">
            {maxRevenueDay
              ? formatDate(maxRevenueDay.report_date, "DD/MM/YYYY")
              : "Chưa có dữ liệu"}
          </p>
          {maxRevenueDay && (
            <p className="text-purple-200 text-sm mt-1">
              {formatCurrency(maxRevenueDay.revenue)}
            </p>
          )}
        </div>
        <Calendar size={48} className="opacity-80" />
      </div>
    </div>
  </div>
);

// Date Filter Component
const DateFilter = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  min,
  max,
}) => (
  <div className="flex items-center gap-3 mt-2">
    <input
      type="date"
      value={startDate}
      onChange={(e) => onStartChange(e.target.value)}
      min={min}
      max={max}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    />
    <span className="text-gray-400">→</span>
    <input
      type="date"
      value={endDate}
      onChange={(e) => onEndChange(e.target.value)}
      min={min}
      max={max}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);

// Custom Tooltip cho Revenue
const CustomRevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 py-4 rounded-xl shadow-2xl border-2 border-blue-400">
        <p className="font-bold text-sm mb-2 text-blue-100">Ngày {label}</p>
        <p className="text-lg font-extrabold">
          {formatCurrency(payload[0].value)}
        </p>
        <div className="mt-2 pt-2 border-t border-blue-400">
          <p className="text-xs text-blue-200">Doanh thu trong ngày</p>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip cho Patients
const CustomPatientsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white px-5 py-4 rounded-xl shadow-2xl border-2 border-green-400">
        <p className="font-bold text-sm mb-2 text-green-100">Ngày {label}</p>
        <p className="text-lg font-extrabold">{payload[0].value} ca khám</p>
        <div className="mt-2 pt-2 border-t border-green-400">
          <p className="text-xs text-green-200">Số lượng bệnh nhân</p>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Dot cho Line Chart
const CustomDot = (props) => {
  const { cx, cy, value } = props;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#3B82F6"
        stroke="#ffffff"
        strokeWidth={2}
      />
      <circle cx={cx} cy={cy} r={3} fill="#1E40AF" />
    </g>
  );
};

// Chart Tooltip Component
const ChartTooltip = ({ contentStyle, labelStyle, ...props }) => (
  <Tooltip
    cursor={{ fill: "transparent" }}
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      border: "none",
      borderRadius: "12px",
      padding: "8px 12px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
      ...contentStyle,
    }}
    labelStyle={{
      color: "#e2e8f0",
      fontWeight: "bold",
      ...labelStyle,
    }}
    {...props}
  />
);

// ==================== REVENUE CHART - ĐẸP NHƯ MƠ ====================
const RevenueChart = ({ data = [] }) => {
  const isEmpty = data.length === 0;

  // Tìm ngày có doanh thu cao nhất
  const maxRevenueItem = data.reduce(
    (max, item) => (item.revenue > (max?.revenue || 0) ? item : max),
    null
  );

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white/95 backdrop-blur-lg border border-blue-200 p-5 rounded-2xl shadow-2xl">
          <p className="text-sm font-semibold text-gray-600">Ngày {label}</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {payload[0].payload.patient_count} bệnh nhân
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-blue-100 p-7 hover:shadow-2xl hover:border-blue-300 transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-gray-800 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Xu hướng doanh thu
          </span>
        </h3>

        <div className="px-5 py-2.5 bg-blue-50 rounded-full border border-blue-200">
          <span className="text-blue-700 font-bold">
            {totalRevenue >= 1_000_000_000
              ? `${(totalRevenue / 1_000_000_000).toFixed(1)} tỷ`
              : `${(totalRevenue / 1_000_000).toFixed(0)} triệu`}{" "}
            tổng
          </span>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <div className="h-96 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-2xl border-2 border-dashed border-blue-200">
          <Coins className="w-20 h-20 text-blue-200 mb-4" />
          <p className="text-blue-600 font-semibold text-lg">
            Chưa có dữ liệu doanh thu
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="highlightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E0E7FF"
              opacity={0.6}
            />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: "#64748B", fontSize: 13, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
              tick={{ fill: "#64748B", fontSize: 13, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
            />

            <Bar dataKey="revenue" radius={[16, 16, 0, 0]} maxBarSize={70}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.report_date === maxRevenueItem?.report_date
                      ? "url(#highlightGrad)"
                      : "url(#revenueGrad)"
                  }
                />
              ))}
              <LabelList
                dataKey="revenue"
                position="top"
                formatter={(v) => (v >= 10_000_000 ? formatChartValue(v) : "")}
                style={{ fill: "#1E293B", fontWeight: "bold", fontSize: 13 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

// ==================== PATIENT CHART - XANH MƯỚT MÁT FULL ====================
const PatientChart = ({ data = [] }) => {
  const isEmpty = data.length === 0;
  const totalPatients = data.reduce((sum, item) => sum + item.patient_count, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white/95 backdrop-blur-lg border border-emerald-200 p-5 rounded-2xl shadow-2xl">
          <p className="text-sm font-semibold text-gray-600">Ngày {label}</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {payload[0].value} bệnh nhân
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Doanh thu: {formatCurrency(payload[0].payload.revenue)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot cho line chart (xanh lá đẹp hơn)
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#10B981"
        stroke="#ffffff"
        strokeWidth={3}
      />
    );
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-00 p-7 hover:shadow-2xl hover:border-green-500 transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-gray-800 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl">
            <Users className="w-7 h-7 text-white" />
          </div>
          <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            Xu hướng số bệnh nhân khám
          </span>
        </h3>

        <div className="px-5 py-2.5 bg-emerald-50 rounded-full border border-emerald-200">
          <span className="text-emerald-700 font-bold text-lg">
            {totalPatients.toLocaleString()} ca
          </span>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <div className="h-96 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-2xl border-2 border-dashed border-emerald-200">
          <Users className="w-20 h-20 text-green-300 mb-4" />
          <p className="text-emerald-600 font-semibold text-lg">
            Chưa có dữ liệu bệnh nhân
          </p>
          <p className="text-emerald-500 text-sm mt-2">Dữ liệu sẽ hiển thị khi có lượt khám</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            {/* Gradient cho area fill */}
            <defs>
              <linearGradient id="colorGreenArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>

              {/* Gradient cho line */}
              <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#6EE7B7" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 6"
              stroke="#E6F4EA"
              vertical={false}
            />
            
            <XAxis
              dataKey="displayDate"
              tick={{ fill: "#059669", fontSize: 13, fontWeight: 600 }}
              axisLine={{ stroke: "#A7F3D0" }}
              tickLine={{ stroke: "#A7F3D0" }}
            />
            
            <YAxis
              tick={{ fill: "#10B981", fontSize: 13, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#10B981",
                strokeWidth: 2,
                strokeDasharray: "6 6",
              }}
            />
            
            <Line
              type="monotone"
              dataKey="patient_count"
              stroke="url(#greenGradient)"
              strokeWidth={5}
              dot={<CustomDot />}
              activeDot={{
                r: 10,
                fill: "#059669",
                stroke: "#ffffff",
                strokeWidth: 4,
              }}
            >
              {/* Area fill bên dưới line */}
              <Area
                type="monotone"
                dataKey="patient_count"
                stroke="none"
                fill="url(#colorGreenArea)"
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

        /* 
        <ResponsiveContainer width="100%" height={380}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#D1FAE5"
              opacity={0.6}
            />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: "#64748B", fontSize: 13, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748B", fontSize: 13, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
            />

            <Bar
              dataKey="patient_count"
              fill="url(#patientGrad)"
              radius={[16, 16, 0, 0]}
              maxBarSize={70}
            >
              <LabelList
                dataKey="patient_count"
                position="top"
                style={{ fill: "#1E293B", fontWeight: "bold", fontSize: 13 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
 */
  

// Patient Chart Component
// ==================== PATIENT CHART - ĐẸP LỊM TIM ====================

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageButtons = () => {
    const buttons = [];
    const maxButtons = 5;

    let startPage, endPage;
    if (totalPages <= maxButtons) {
      startPage = 1;
      endPage = totalPages;
    } else if (currentPage <= 3) {
      startPage = 1;
      endPage = maxButtons;
    } else if (currentPage > totalPages - 3) {
      startPage = totalPages - maxButtons + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - 2;
      endPage = currentPage + 2;
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
            currentPage === i
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-gray-600">
          Hiển thị{" "}
          <span className="font-semibold">
            {startItem} - {endItem}
          </span>{" "}
          trong tổng số <span className="font-semibold">{totalItems}</span> ngày
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Hiển thị</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">dòng</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Trước
          </button>

          {renderPageButtons()}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="text-gray-500">...</span>
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-10 h-10 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============
export default function MedicalRevenueDashboard() {
  const location = useLocation();
  const state = location.state || {};
  const { year, month, medicine_usage_report_id } = state;

  // bây giờ em có year, month, medicine_usage_report_id
  console.log("From navigate:", year, month, medicine_usage_report_id);
  const today = moment();

  const [searchParams] = useSearchParams();

  // Date state
  const urlYear = searchParams.get("year") || today.format("YYYY");
  const urlMonth = searchParams.get("month") || today.format("MM");
  const { dateRange } =
    searchParams.get("from") && searchParams.get("to")
      ? {
          dateRange: {
            from: searchParams.get("from"),
            to: searchParams.get("to"),
          },
        }
      : {
          dateRange: {
            from: moment().startOf("month").format("YYYY-MM-DD"),
            to: moment().endOf("month").format("YYYY-MM-DD"),
          },
        };

  const [selectedYear, setSelectedYear] = useState(urlYear);
  const [selectedMonth, setSelectedMonth] = useState(urlMonth);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

  // Custom hooks
  const { startDate, endDate, setStartDate, setEndDate } = useDateFilters(
    selectedYear,
    selectedMonth
  );
  const navigate = useNavigate();
  const {
    loading,
    data: revenueData,
    maxRevenueDay,
  } = useRevenueData(selectedYear, selectedMonth);

  // Reset page when month changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear]);

  // Computed values
  const monthStart = moment(`${selectedYear}-${selectedMonth}-01`).format(
    "YYYY-MM-DD"
  );
  const monthEnd = moment(`${selectedYear}-${selectedMonth}-01`)
    .endOf("month")
    .format("YYYY-MM-DD");

  const filteredChartData = useMemo(() => {
    return revenueData.dailyData
      .filter((item) => {
        const date = formatDate(item.report_date, "YYYY-MM-DD");
        return date >= startDate && date <= endDate;
      })
      .map((item) => ({
        ...item,
        displayDate: formatDate(item.report_date, "DD/MM"),
        revenue: parseFloat(item.revenue),
      }));
  }, [revenueData.dailyData, startDate, endDate]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return revenueData.dailyData.slice(start, start + itemsPerPage);
  }, [revenueData.dailyData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(revenueData.dailyData.length / itemsPerPage);

  // Handlers
  const handleMonthChange = useCallback((e) => {
    const [year, month] = e.target.value.split("-");
    setSelectedYear(year);
    setSelectedMonth(month);
    navigate(`/reports/revenue?year=${year}&month=${month}`);
  }, []);

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const handlePageSizeChange = useCallback((size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  }, []);

  // Xuất EXcel
  const onExportFile = async () => {
    // =================== Xuất file ( các record ) ====================== //
    try {
      if (!revenueData.dailyData || revenueData.dailyData.length === 0) {
        message.warning("Không có dữ liệu để xuất");
        return;
      }

      console.log("Data", revenueData.dailyData);

      const formattedData = revenueData.dailyData.map((item) => {
        const newItem = { ...item };
        newItem.report_date = formatDate(newItem.report_date, "DD/MM/YYYY");
        newItem.revenue = formatCurrency(newItem.revenue);
        newItem.revenue_rate = `${Number(newItem.revenue_rate).toFixed(2)}%`;
        return newItem;
      });

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      // Chuyển workbook thành binary
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      // Tạo Blob
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `BaocaoDoanhThu_${dateRange[0].format(
        "YYYYMMDD"
      )}_${dateRange[1].format("YYYYMMDD")}.xlsx`;
      link.click();

      message.success("Xuất Excel thành công!");
    } catch (error) {
      console.error(error);
      message.error("Xuất Excel thất bại!");
    }
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        title: "STT",
        width: 70,
        render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
      },
      {
        title: "Ngày",
        dataIndex: "report_date",
        render: (date) => formatDate(date),
        sorter: (a, b) => new Date(a.report_date) - new Date(b.report_date),
      },
      {
        title: "Số bệnh nhân",
        dataIndex: "patient_count",
        sorter: (a, b) => a.patient_count - b.patient_count,
      },
      {
        title: "Doanh thu",
        dataIndex: "revenue",
        render: (v) => formatCurrency(v),
        sorter: (a, b) => a.revenue - b.revenue,
      },
      {
        title: "Tỷ lệ (%)",
        dataIndex: "revenue_rate",
        render: (v) => `${Number(v).toFixed(2)}%`,
        sorter: (a, b) => a.revenue_rate - b.revenue_rate,
      },
    ],
    [currentPage, itemsPerPage]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
      <div className="mx-auto space-y-8">
        <DashboardHeader
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          onExportFile={onExportFile}
        />

        <SummaryCards
          summary={revenueData.summary}
          maxRevenueDay={maxRevenueDay}
        />

        <div className="bg-slate-100 pt-3 pl-4 pr-4 rounded-2xl pb-3">
          <div className="flex items-center justify-between mb-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200">
            <Space align="center" className="px-2 py-2">
              <span className="text-gray-600 font-semibold text-lg">Lọc:</span>

              <DateFilter
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
                min={monthStart}
                max={monthEnd}
              />
            </Space>

            <p className="text-gray-500 text-sm italic">
              (Xem được tối đa xu hướng trong 7 ngày)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <RevenueChart
              data={filteredChartData}
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              monthStart={monthStart}
              monthEnd={monthEnd}
            />
            <PatientChart data={filteredChartData} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="pl-6 pt-6 pb-2">
            <h2 className="text-xl font-bold text-gray-900">
              Chi tiết doanh thu theo ngày
            </h2>
          </div>

          <div className="overflow-x-auto p-6">
            <Table
              columns={columns}
              dataSource={paginatedData}
              pagination={false}
              loading={loading}
              bordered
              rowKey="report_date"
            />
          </div>

          {revenueData.dailyData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={revenueData.dailyData.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
