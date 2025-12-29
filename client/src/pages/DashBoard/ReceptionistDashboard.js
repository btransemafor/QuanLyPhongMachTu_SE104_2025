// pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import PatientTable from "./PatientTable";
import RealtimePanel from "./RealtimePanel";
import { DashboardAPI } from "../../services/api";
import {
  TrendingUp,
  Users,
  UserPlus,
  Calendar,
  AlertTriangle,
  FileWarning,
  Clock,
  Activity,
  Loader2,
  User,
  Clock as ClockIcon,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { MedicineBoxOutlined } from "@ant-design/icons";
import { AiOutlineMedicineBox } from "react-icons/ai";
import moment from "moment";
import { Space } from "antd";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

const formatCurrency = (value) => {
  if (!value) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function ReceptionistDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [is30Day, setIs30Day] = useState(false);

  useEffect(() => {
    loadDashboardSummary();
  }, [is30Day]);

  const normalizeDate = (isoStr) => moment(isoStr).format("YYYY-MM-DD");

  const fillMissingDates = (data, valueKey = "count", is30Day = false) => {
    const today = moment().subtract(1, "days").startOf("day"); // Lay ngay hom qua

    const result = [];

    for (let i = is30Day ? 29 : 6; i >= 0; i--) {
      const date = today.clone().subtract(i, "days");
      const dateDBFormat = date.format("YYYY-MM-DD");
      const dateDisplay = date.format("DD/MM");

      console.log("CHECK DATE:", dateDBFormat);

      const existing = data.find((d) => normalizeDate(d.date) === dateDBFormat);

      result.push({
        date: dateDisplay,
        value: existing ? existing[valueKey] : 0,
      });
    }
    console.log("FILLED DATES RESULT:", result);

    return result;
  };
  const loadDashboardSummary = async () => {
    try {
      const res = await DashboardAPI.getDashboardReceptionistSummary({
        chart: is30Day ? 30 : 7,
      });
      console.log("data", res.data.data.revenue_chart);
      setSummary(res.data.data);
    } catch (error) {
      console.error("Load dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600 font-medium">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  const s = summary;

  const capacityPercent =
    s.daily_limit > 0
      ? Math.round((s.total_appointments / s.daily_limit) * 100)
      : 0;

  const revenueData = fillMissingDates(
    s.revenue_chart || [],
    "paid_revenue",
    is30Day
  );

  console.log("Data Doanh thu", revenueData);
  const patientsData = fillMissingDates(
    s.patients_chart || [],
    "total",
    is30Day
  );
  //const medicineData = s.medicines_used_today_detail || [];

  const pieData = [
    { name: "Chờ khám", value: s.waiting_appointments || 0 },
    { name: "Đang xử lý", value: s.examined_appointments || 0 },
    { name: "Đã hoàn thành", value: s.completed_appointments || 0 },
  ].filter((d) => d.value > 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Chào mừng quay lại, Lễ Tân 👋
          </h1>
          <p className="text-gray-600 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Tổng quan hoạt động • {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* SECTION 1: HOẠT ĐỘNG KHÁM BỆNH */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">
              Hoạt động hôm nay
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatusCard
              title="Danh sách khám"
              value={s.total_appointments}
              icon={<User className="w-8 h-8" />}
              color="bg-gradient-to-br from-blue-600 to-blue-500"
            />
            <StatusCard
              title="Chờ khám"
              value={s.waiting_appointments}
              icon={<ClockIcon className="w-8 h-8" />}
              color="bg-gradient-to-br from-orange-600 to-orange-500"
            />
            <StatusCard
              title="Đã khám"
              value={(s.examined_appointments + s.completed_appointments) }
              icon={<Activity className="w-8 h-8" />}
              color="bg-gradient-to-br from-yellow-600 to-yellow-500"
            />
            <StatusCard
              title="Hoàn thành"
              value={s.completed_appointments}
              icon={<CheckCircle className="w-8 h-8" />}
              color="bg-gradient-to-br from-green-600 to-green-500"
            />
          </div>
        </section>

        {/* SECTION 2: TÀI CHÍNH & HÓA ĐƠN */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-600 to-emerald-400 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tài chính & Hóa đơn
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              label="Doanh thu dự kiến"
              value={formatCurrency(s.total_revenue)}
              icon={<TrendingUp className="w-7 h-7 text-emerald-600" />}
              bg="bg-emerald-50"
              border="border-emerald-200"
            />

            <KPICard
              label="Doanh thu thực tế"
              value={formatCurrency(s.paid_revenue)}
              icon={<TrendingUp className="w-7 h-7 text-blue-600" />}
              bg="bg-blue-50"
              border="border-blue-200"
            />

            <KPICard
              label="Hóa đơn chưa thanh toán"
              value={s.unpaid_invoices}
              icon={<FileWarning className="w-7 h-7 text-red-600" />}
              bg="bg-red-50"
              border="border-red-200"
              warning={s.unpaid_invoices > 0}
            />

            <KPICard
              label="Tổng hóa đơn"
              value={s.total_invoices}
              icon={<Calendar className="w-7 h-7 text-orange-600" />}
              bg="bg-orange-50"
              border="border-orange-200"
            />
          </div>
        </section>

        {/* SECTION 3: THÔNG TIN KHÁC */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-purple-400 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Thông tin khác</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              className="
                bg-white rounded-2xl border border-gray-200 shadow-md 
                p-6 transition-all duration-300 
                hover:shadow-xl hover:-translate-y-1"
            >
              {/* Header + Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="white"
                      className="w-7 h-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5l2 2h5a2 2 0 012 2v14a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800">
                    Phiếu khám chờ lập hóa đơn
                  </h3>
                </div>

                {/* Badge số lượng */}
                <span
                  className="
        bg-red-500 text-white text-sm font-semibold 
        px-3 py-1 rounded-full shadow-sm
      "
                >
                  {s.medical_record_uninvoices_today}
                </span>
              </div>

              {/* Content */}
              <p className="text-gray-600 text-lg font-medium leading-relaxed">
                Bạn có{" "}
                <span className="text-red-600 font-bold">
                  {s.medical_record_uninvoices_today}
                </span>{" "}
                phiếu khám bệnh cần lập hóa đơn.
              </p>
            </div>

            <KPICard
              label="Bệnh nhân mới"
              value={s.new_patients}
              icon={<UserPlus className="w-7 h-7 text-purple-600" />}
              bg="bg-purple-50"
              border="border-purple-200"
            />

            <KPICard
              label="Công suất"
              value={`${capacityPercent}%`}
              icon={<Activity className="w-7 h-7 text-gray-700" />}
              bg="bg-gray-50"
              border="border-gray-300"
              progress={capacityPercent}
            />
          </div>
        </section>

        {/* SECTION 4: BIỂU ĐỒ */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 justify-between">
            <Space>
              <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">
                Thống kê & Biểu đồ
              </h2>
            </Space>

            <div>
              <button
                className={`px-4 py-2 rounded-full font-medium border ${
                  !is30Day
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-indigo-600 border-indigo-600"
                }`}
                onClick={() => setIs30Day(false)}
              >
                7 Ngày
              </button>
              <button
                className={`ml-3 px-4 py-2 rounded-full font-medium border ${
                  is30Day
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-indigo-600 border-indigo-600"
                }`}
                onClick={() => setIs30Day(true)}
              >
                30 Ngày
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Charts Grid */}
            <div
              className={`grid grid-cols-1 ${
                is30Day ? "lg:grid-cols-1" : "lg:grid-cols-2"
              } gap-8`}
            >
              {/* Revenue Chart */}
              {/*    transition-all duration-300 transform hover:-translate-y-1 */}
              <div className="bg-white rounded-3xl border-2 border-blue-100 p-8 hover:shadow-2xl hover:border-blue-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Doanh thu {is30Day ? 30 : 7} ngày gần nhất
                    </span>
                  </h3>
                  <div className="px-4 py-2 bg-blue-50 rounded-full">
                    <span className="text-blue-700 font-bold text-sm">
                      {revenueData.reduce((sum, item) => sum + item.value, 0) /
                        1000000 >
                      1000
                        ? `${(
                            revenueData.reduce(
                              (sum, item) => sum + item.value,
                              0
                            ) / 1000000000
                          ).toFixed(1)}B`
                        : `${(
                            revenueData.reduce(
                              (sum, item) => sum + item.value,
                              0
                            ) / 1000000
                          ).toFixed(0)}M`}{" "}
                      tổng
                    </span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={revenueData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E7EB"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => d}
                      tick={{ fill: "#6B7280", fontSize: 13, fontWeight: 600 }}
                      axisLine={{ stroke: "#D1D5DB" }}
                      tickLine={{ stroke: "#D1D5DB" }}
                    />
                    <YAxis
                      tickFormatter={(v) => (v / 1000000).toFixed(1) + "M"}
                      tick={{ fill: "#6B7280", fontSize: 13, fontWeight: 600 }}
                      axisLine={{ stroke: "#D1D5DB" }}
                      tickLine={{ stroke: "#D1D5DB" }}
                    />
                    <Tooltip
                      content={<CustomRevenueTooltip />}
                      cursor={{
                        stroke: "#3B82F6",
                        strokeWidth: 2,
                        strokeDasharray: "5 5",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="url(#blueGradient)"
                      strokeWidth={4}
                      dot={<CustomDot />}
                      activeDot={{
                        r: 8,
                        fill: "#1E40AF",
                        stroke: "#ffffff",
                        strokeWidth: 3,
                      }}
                      fill="url(#colorRevenue)"
                    />
                    <defs>
                      <linearGradient
                        id="blueGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Patients Chart */}
              {/*  transition-all duration-300 transform hover:-translate-y-1 */}
              <div className="bg-white rounded-3xl border-2 border-green-100 p-8 hover:shadow-2xl hover:border-green-300 ">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Số ca khám {is30Day ? 30 : 7} ngày gần nhất
                    </span>
                  </h3>
                  <div className="px-4 py-2 bg-green-50 rounded-full">
                    <span className="text-green-700 font-bold text-sm">
                      {patientsData.reduce((sum, item) => sum + item.value, 0)}{" "}
                      ca tổng
                    </span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={patientsData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorPatients"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E7EB"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => d}
                      tick={{ fill: "#6B7280", fontSize: 13, fontWeight: 600 }}
                      axisLine={{ stroke: "#D1D5DB" }}
                      tickLine={{ stroke: "#D1D5DB" }}
                    />
                    <YAxis
                      tick={{ fill: "#6B7280", fontSize: 13, fontWeight: 600 }}
                      axisLine={{ stroke: "#D1D5DB" }}
                      tickLine={{ stroke: "#D1D5DB" }}
                    />
                    <Tooltip
                      content={<CustomPatientsTooltip />}
                      cursor={{ fill: "rgba(16, 185, 129, 0.1)" }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#colorPatients)"
                      radius={[12, 12, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grid 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Phân bố Pie */}

              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl border border-gray-300 p-6 hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="p-2.5 bg-gradient-to-br  from-black rounded-xl shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    Phân bố bệnh nhân hôm nay
                  </h3>

                  {pieData.length === 0 && (
                    <div
                      className="h-[320px] flex flex-col items-center justify-center
                                                         bg-gray-50 rounded-xl border border-dashed border-gray-300"
                    >
                      <BarChart className="w-14 h-14 text-gray-300 mb-4" />
                      <span className="text-gray-500 font-medium text-lg">
                        Chưa có dữ liệu
                      </span>
                    </div>
                  )}

                  {pieData.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `${v} bệnh nhân`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/*  Table danh sach  - Scroll */}

              {/* TABLE = 7 CỘT */}
              <div className="lg:col-span-7">
                {/* DANH SÁCH BỆNH NHÂN HÔM NAY */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 gap-2">
                      Danh sách bệnh nhân hôm nay
                    </h3>

                    <p className="mr-3">
                      Tổng số: {summary.total_appointments}
                    </p>
                  </div>

                  <div className="overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="text-left bg-gray-100">
                          <th className="px-4 py-3 text-sm font-semibold text-gray-600 min-w-[160px]">
                            Tên bệnh nhân
                          </th>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600 min-w-[120px]">
                            SĐT
                          </th>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600 min-w-[120px]">
                            Ngày sinh
                          </th>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600 min-w-[160px]">
                            Giờ khám
                          </th>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600 min-w-[160px]">
                            Trạng thái
                          </th>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600 min-w-[160px]">
                            Thanh toán
                          </th>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600 text-right min-w-[100px]">
                            Tổng tiền
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {summary.today_appointments.map((item) => (
                          <tr
                            key={item.appointment_id}
                            className="border-b hover:bg-gray-50 py-3 px-2"
                          >
                            <td className="px-4 py-2 text-sm font-medium text-gray-800">
                              {item.patient_name}
                            </td>

                            <td className="px-4 py-2 text-sm">{item.phone}</td>

                            <td className="px-4 py-2 text-sm">
                              {new Date(item.date_of_birth).toLocaleDateString(
                                "vi-VN"
                              )}
                            </td>

                            <td className="px-4 py-2 text-sm">
                              {moment(item.appointment_date).format(
                                "DD-MM-YYYY HH:mm"
                              )}
                            </td>

                            {/* STATUS KHÁM */}
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-white text-xs font-semibold
                  ${
                    item.status === "completed"
                      ? "bg-green-600"
                      : item.status === "examined"
                      ? "bg-blue-500"
                      : "bg-yellow-500"
                  }`}
                              >
                                {item.status}
                              </span>
                            </td>

                            {/* PAYMENT STATUS */}
                            <td className="px-4 py-2 text-sm">
                              {item.payment_status ? (
                                <span
                                  className={`px-3 py-1 rounded-full text-white text-xs font-semibold
                    ${
                      item.payment_status === "paid"
                        ? "bg-green-600"
                        : "bg-orange-500"
                    }`}
                                >
                                  {item.payment_status}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs italic">
                                  Không có
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-2 text-sm text-right font-semibold">
                              {item.total_amount
                                ? item.total_amount.toLocaleString("vi-VN") +
                                  " đ"
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Card lớn với gradient đẹp
function StatusCard({ title, value, icon, color }) {
  return (
    <div
      className={`${color} text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90 font-medium">{title}</p>
          <p className="text-5xl font-bold mt-3">{value}</p>
        </div>
        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Card KPI với animation
function KPICard({
  label,
  value,
  icon,
  bg,
  border,
  warning = false,
  progress,
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border-2 ${border} p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bg}`}>{icon}</div>
        {warning && (
          <AlertTriangle className="w-6 h-6 text-yellow-500 animate-pulse" />
        )}
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                progress > 90
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : progress > 70
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                  : "bg-gradient-to-r from-green-500 to-green-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right font-medium">
            {progress}% công suất
          </p>
        </div>
      )}
    </div>
  );
}
