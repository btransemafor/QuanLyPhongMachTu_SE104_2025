import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Search,
  TrendingUp,
  Package,
  FileText,
  RotateCw,
  BarChart2,
  Coins,
  ArrowLeft,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Input, message, Table } from "antd";
import { reportsAPI } from "../../services/api";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { Column } from "@ant-design/charts";
// ============= CONSTANTS =============
const ITEMS_PER_PAGE = 10;
const TOP_MEDICINES_COUNT = 5;
const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#8b5cf6",
];

// ============= HELPER FUNCTIONS =============
const roundRate = (rate, decimals = 2) => Number(rate.toFixed(decimals));

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// ============= CUSTOM COMPONENTS =============
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
        <p className="font-semibold">{label}</p>
        <p className="text-sm">Số lượng: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm">Tỷ lệ: {payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, subtitle, icon: Icon, gradient }) => (
  <div
    className={`bg-gradient-to-br ${gradient} rounded-lg shadow-lg p-6 text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        <p className="text-white/80 text-sm mt-2">{subtitle}</p>
      </div>
      <Icon size={48} className="text-white/60" />
    </div>
  </div>
);

const handleClickRow = (id) => {

}

// ============= MAIN COMPONENT =============
const CustomMedicineUsageReport = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    period: { from: "", to: "" },
    medicine_usage: [],
    summary: {
      unique_medicines_used: 0,
      total_medicines_dispensed: 0,
      total_medicine_value: 0,
      total_prescriptions: 0,
    },
  });
  const [medicineData, setMedicineData] = useState([]); // Dữ liệu cho biểu đồ
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    from: "2025-12-01",
    to: "2025-12-05",
  });

  const onExportFile = async () => {
    try {
      // Get filtered data (same filtering as table display)
      const filteredData = reportData.medicine_usage.filter(
        (item) =>
          item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.medicine_id.toString().includes(searchTerm)
      );

      if (!filteredData || filteredData.length === 0) {
        message.warning("Không có dữ liệu để xuất");
        return;
      }

      // Format data for export with Vietnamese column names (expanded details)
      const exportData = filteredData.map((item, index) => ({
        STT: index + 1,
        "Mã thuốc": item.medicine_id || "-",
        "Tên thuốc": item.medicine_name || "-",
        "Hàm lượng": item.dosage || "-",
        "Nhà sản xuất": item.manufacturer || "-",
        "Đơn vị": item.unit_name || "-",
        "Giá/đơn vị (VNĐ)": item.unit_price || 0,
        "Số lượng sử dụng": item.total_quantity_used || 0,
        "Số lần dùng": item.prescription_count || 0,
        "Trung bình/đơn": item.average_quantity_per_prescription || "-",
        "Tổng giá trị (VNĐ)": item.total_value || 0,
        "Tỷ lệ sử dụng (%)":
          reportData.summary.total_medicines_dispensed > 0
            ? roundRate(
                (item.total_quantity_used /
                  reportData.summary.total_medicines_dispensed) *
                  100
              )
            : 0,
      }));

      // Create workbook with summary sheet
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["BÁOCÁO SỬ DỤNG THUỐC"],
        [],
        ["Kỳ báo cáo", `${dateRange.from} đến ${dateRange.to}`],
        ["Ngày tạo báo cáo", new Date().toLocaleDateString("vi-VN")],
        [],
        ["THỐNG KÊ CHUNG"],
        [
          "Tổng số loại thuốc sử dụng",
          reportData.summary.unique_medicines_used || 0,
        ],
        [
          "Tổng số lượng thuốc cấp phát",
          reportData.summary.total_medicines_dispensed || 0,
          "(đơn vị)",
        ],
        [
          "Tổng giá trị thuốc",
          formatCurrency(reportData.summary.total_medicine_value || 0),
        ],
        [
          "Tổng số đơn thuốc",
          reportData.summary.total_prescriptions || 0,
          "(đơn)",
        ],
        [],
        ["GHI CHÚ"],
        ["Báo cáo được tạo từ hệ thống quản lý phòng mạch", "", ""],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Style summary sheet
      summarySheet["!cols"] = [{ wch: 30 }, { wch: 25 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Tóm tắt");

      // Detail sheet
      const detailSheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better readability
      const colWidths = [5, 12, 25, 12, 14, 12, 15, 18, 15];
      detailSheet["!cols"] = colWidths.map((w) => ({ wch: w }));

      XLSX.utils.book_append_sheet(workbook, detailSheet, "Chi tiết");

      // Generate filename with date range
      const filename = `BaocaoSDT_${dateRange.from.replace(
        /-/g,
        ""
      )}_${dateRange.to.replace(/-/g, "")}.xlsx`;

      // Write and download
      XLSX.writeFile(workbook, filename);

      message.success("Xuất Excel thành công!");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Xuất Excel thất bại!");
    }
  };

  const location = useLocation();
  const state = location.state || {};
  const { year, month, medicine_usage_report_id } = state;

  // bây giờ em có year, month, medicine_usage_report_id
  console.log("From navigate:", year, month, medicine_usage_report_id);

  // Xử lý dữ liệu để vẽ biểu đồ (top 5 + "Khác")
  const processChartData = (data) => {
    const totalQuantity = Number(data.summary.total_medicines_dispensed);

    if (totalQuantity === 0) return [];

    const sorted = [...data.medicine_usage]
      .map((item) => ({
        ...item,
        total_quantity_used: Number(item.total_quantity_used),
      }))
      .sort((a, b) => b.total_quantity_used - a.total_quantity_used);

    const top5 = sorted.slice(0, TOP_MEDICINES_COUNT);
    const othersQuantity = sorted
      .slice(TOP_MEDICINES_COUNT)
      .reduce((sum, item) => sum + item.total_quantity_used, 0);

    const chartItems = [...top5];
    if (othersQuantity > 0) {
      chartItems.push({
        medicine_name: "Khác",
        total_quantity_used: othersQuantity,
        unit_name: "",
      });
    }

    return chartItems.map((item, index) => ({
      ...item,
      rate: roundRate((item.total_quantity_used / totalQuantity) * 100),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  };

  // Fetch dữ liệu từ API
  const fetchReport = React.useCallback(async () => {
    if (!dateRange.from || !dateRange.to) {
      message.warning("Vui lòng chọn khoảng thời gian");
      return;
    }

    try {
      setLoading(true);
      const params = {
        from: dateRange.from,
        to: dateRange.to,
      };

      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await reportsAPI.getMedicineUsageReport(params);

      if (response.data.success) {
        const data = response.data.data;
        setReportData(data);
        setMedicineData(processChartData(data));
      } else {
        message.error("Dữ liệu báo cáo không hợp lệ");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      message.error("Không thể tải báo cáo. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, searchTerm]);

  // Tự động fetch khi thay đổi dateRange hoặc searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchReport]);

  // Reset form
  const handleReset = () => {
    const today = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];

    setDateRange({ from: firstDayOfMonth, to: today });
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Lọc và phân trang dữ liệu bảng
  const filteredData = reportData.medicine_usage.filter(
    (item) =>
      item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.medicine_id.toString().includes(searchTerm)
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mx-auto max-w-8xl">
        {/* Header */}
        <div className="flex rounded-lg mb-8 justify-between items-center gap-6">
          <div className="flex items-center gap-3">
          {/*  // <FileText className="text-blue-600" size={32} /> */}
             <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mr-2">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Báo cáo sử dụng thuốc
              </h1>
              <p className="text-gray-600 mt-1">
                Từ {dateRange.from} đến {dateRange.to}
              </p>
            </div>
          </div>

          <button
            onClick={() => window.history.back()}
            className="px-5 py-2.5 bg-white font-medium rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-medium mb-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, from: e.target.value })
                  }
                  className="w-full h-11 px-4 text-sm rounded-xl border-2 border-slate-200 hover:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-medium mb-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, to: e.target.value })
                  }
                  className="w-full h-11 px-4 text-sm rounded-xl border-2 border-slate-200 hover:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm disabled:opacity-60"
              >
                <TrendingUp className="w-4 h-4" />
                {loading ? "Đang tải..." : "Xem báo cáo"}
              </button>

              <button
                onClick={handleReset}
                className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all flex items-center gap-2 text-sm"
              >
                <RotateCw className="w-4 h-4" />
                Đặt lại
              </button>

              <button
                onClick={onExportFile}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Xuất Excel
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Tổng số lượng thuốc"
            value={Number(
              reportData.summary.total_medicines_dispensed
            ).toLocaleString()}
            subtitle="đơn vị"
            icon={Package}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Tổng giá trị"
            value={formatCurrency(reportData.summary.total_medicine_value)}
            subtitle="VNĐ"
            icon={Coins}
            gradient="from-green-500 to-green-600"
          />
          <StatCard
            title="Tổng đơn thuốc"
            value={Number(
              reportData.summary.total_prescriptions
            ).toLocaleString()}
            subtitle="đơn"
            icon={BarChart2}
            gradient="from-orange-500 to-orange-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Top thuốc theo số lượng sử dụng
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={medicineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="medicine_name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="total_quantity_used"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Tỷ lệ sử dụng thuốc
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={medicineData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) =>
                    entry.medicine_name === "Khác"
                      ? "Khác"
                      : `${entry.medicine_name}: ${entry.rate}%`
                  }
                  outerRadius={110}
                  dataKey="rate"
                  nameKey="medicine_name"
                >
                  {medicineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detail Table */}
           {/* Detail Table */}
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-900">
                Chi tiết sử dụng thuốc ({filteredData.length})
              </h2>
              <div className="relative w-full max-w-md">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
                <Input
                  placeholder="Tìm kiếm tên hoặc mã thuốc..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 py-2.5"
                  allowClear
                />
              </div>
            </div>

            <Table
              dataSource={filteredData}
              rowKey="medicine_id"
              pagination={{
                current: currentPage,
                pageSize: ITEMS_PER_PAGE,
                total: filteredData.length,
                showSizeChanger: false,
                onChange: (page) => setCurrentPage(page),
                locale: { items_per_page: "/ trang" },
              }}
              locale={{
                emptyText: searchTerm
                  ? "Không tìm thấy thuốc phù hợp"
                  : "Không có dữ liệu",
              }}
              onRow={(record) => ({
                onClick: () => handleClickRow(record.medicine_id),
                className: "cursor-pointer hover:bg-blue-50 transition-colors",
              })}
              scroll={{ x: 800 }} // Responsive cho mobile
              className="shadow-sm"
            >
              <Column
                title="STT"
                width={70}
                render={(text, record, index) =>
                  (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                }
              />
              <Column
                title="Mã thuốc"
                dataIndex="medicine_id"
                width={100}
                sorter={(a, b) => a.medicine_id - b.medicine_id}
              />
              <Column
                title="Tên thuốc"
                dataIndex="medicine_name"
                sorter={(a, b) =>
                  a.medicine_name.localeCompare(b.medicine_name)
                }
                width={140}
              />
              <Column title="Đơn vị" dataIndex="unit_name" width={100} />
              <Column
                title="Số lượng"
                dataIndex="total_quantity_used"
                sorter={(a, b) => a.total_quantity_used - b.total_quantity_used}
                render={(value) => value?.toLocaleString() || 0}
               // align="right"
                width={100}
              />
              <Column
                title="Số lần dùng"
                dataIndex="prescription_count"
                sorter={(a, b) => a.prescription_count - b.prescription_count}
               // align="right"
                width={100}
              />
              <Column
                title="Giá trị"
                dataIndex="total_value"
                sorter={(a, b) => a.total_value - b.total_value}
                render={(value) => formatCurrency(value)}
               // align="right"
                width={130}
              />
            </Table>
          </div>
      </div>
    </div>
  );
};

export default CustomMedicineUsageReport;
