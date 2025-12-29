import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Calendar,
  Download,
  RotateCw,
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import dayjs from "dayjs";
import { DatePicker, Table, Spin, Empty, message, Pagination } from "antd"; // Thêm Table, Spin, Empty
import "dayjs/locale/vi";
import locale from "antd/locale/vi_VN";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import { reportsAPI } from "../../services/api";
import moment from "moment";

const { RangePicker } = DatePicker;
// ============ CONSTANTS ============
const DEFAULT_PAGE_SIZE = 15;
const PAGE_SIZE_OPTIONS = [10, 15, 20, 30, 50];

const formatDate = (date, format = "DD-MM-YYYY") => moment(date).format(format);

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-xl">
      <p className="text-slate-900 font-bold text-sm mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600 text-sm">{entry.name}:</span>
          <span className="font-bold text-slate-900">
            {entry.name === "Doanh thu"
              ? formatCurrency(entry.value)
              : entry.value.toLocaleString("vi-VN")}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function CustomReportRevenuePage() {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [loading, setLoading] = useState(false);

  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalPatients: 0,
    dailyAverage: 0,
    details: [],
  });

  const fetchReport = useCallback(async () => {
    console.log("fetching report");
    if (!dateRange[0] || !dateRange[1]) {
      return alert("Vui lòng chọn khoảng thời gian");
    }

    setLoading(true);
    try {
      const [start, end] = dateRange;
      const res = await reportsAPI.getCustomRevenueReport({
        from: start.format("YYYY-MM-DD"),
        to: end.format("YYYY-MM-DD"),
      });

      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi tải báo cáo");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Tự động load khi mở trang lần đầu
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const onExportFile = async () => {
    // =================== Xuất file ( các record ) ====================== //
    try {
      if (!reportData || reportData.length === 0) {
        message.warning("Không có dữ liệu để xuất");
        return;
      }

      console.log("Data", reportData);

      const formattedData = reportData.details.map((item) => {
        const newItem = { ...item };

        // Format diseases
        if (Array.isArray(item.diseases)) {
          newItem.diseases = item.diseases
            .map((d) => `${d.disease_name} (${d.severity}) - ${d.disease_note}`)
            .join(", ");
        }

        // Format prescriptions
        if (Array.isArray(item.prescriptions)) {
          newItem.prescriptions = item.prescriptions
            .map((p) => `${p.medicine_name} - ${p.unit} - ${p.usage_method}`)
            .join(", ");
        }

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

  // Chart data
  const chartData = useMemo(() => {
    return (
      reportData?.details?.map((d) => ({
        date: dayjs(d.date).format("DD/MM"),
        revenue: d.revenue,
        invoices: d.invoices,
        patients: d.patients,
        revenue_rate: d.revenue_rate,
      })) || []
    );
  }, [reportData.details]);

  const stats = {
    revenue: reportData?.totalRevenue || 0,
    invoices: reportData?.totalInvoices || 0,
    patients: reportData?.totalPatients || 0,
    avgDaily: reportData?.dailyAverage || 0,
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return reportData.details.slice(start, start + itemsPerPage);
  }, [reportData.details, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(reportData.details.length / itemsPerPage);

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

  // ==================== ANT DESIGN TABLE COLUMNS ====================
  const columns = [
    {
      title: "STT",
      key: "index",
      width: 80,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      width: 140,
    },
    {
      title: "Số hoá đơn",
      dataIndex: "invoices",
      key: "invoices",
      sorter: (a, b) => a.invoices - b.invoices,
      align: "center",
      render: (val) => <span>{val}</span>,
      width: 120,
    },
    {
      title: "Số bệnh nhân",
      dataIndex: "patients",
      key: "patients",
      sorter: (a, b) => a.patients - b.patients,
      align: "center",
      render: (val) => <span>{val}</span>,
      width: 130,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a, b) => a.revenue - b.revenue,
      align: "right",
      render: (val) => <span>{formatCurrency(val)}</span>,
      width: 180,
    },
    {
      title: "Tỷ lệ (%)",
      dataIndex: "revenue_rate",
      key: "revenue_rate",
      sorter: (a, b) => (a.revenue_rate || 0) - (b.revenue_rate || 0),
      align: "right",
      render: (val) => <span>{val != null ? `${val}%` : "-"}</span>,
      width: 120,
    },
  ];

  const tableData = useMemo(() => {
    return reportData.details.map((item, idx) => ({
      ...item,
      key: item.date || idx, // AntD yêu cầu key
    }));
  }, [reportData.details]);

  const handleReset = () => {
    console.log("reset");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="max-w-8xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Báo Cáo Doanh Thu Tùy chỉnh 
              </h1>
              <p className="text-slate-600 mt-1">
                Phân tích chi tiết doanh thu, hoá đơn và bệnh nhân
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
            <div className="flex-1">
              <label className="flex items-center gap-2 text-slate-700 font-medium mb-2 text-sm">
                <Calendar className="w-4 h-4" />
                Chọn khoảng thời gian
              </label>
              <RangePicker
                value={dateRange}
                allowClear={false}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
                locale={locale.DatePicker}
                className="w-full h-11 text-sm rounded-xl border-2 border-slate-200 hover:border-blue-500 transition-all"
              />
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatusCard
            title="Tổng doanh thu"
            value={formatCurrency(stats.revenue)}
            icon={<DollarSign className="w-8 h-8" />}
            color="bg-gradient-to-br from-blue-600 to-blue-500"
          />
          <StatusCard
            title="Số hóa đơn"
            value={stats.invoices.toLocaleString("vi-VN")}
            icon={<FileText className="w-8 h-8" />}
            color="bg-gradient-to-br from-orange-600 to-orange-500"
          />
          <StatusCard
            title="Số bệnh nhân"
            value={stats.patients.toLocaleString("vi-VN")}
            icon={<Users className="w-8 h-8" />}
            color="bg-gradient-to-br from-yellow-600 to-yellow-500"
          />
          <StatusCard
            title="Trung bình / Ngày"
            value={formatCurrency(stats.avgDaily)}
            icon={<BarChart3 className="w-8 h-8" />}
            color="bg-gradient-to-br from-green-600 to-green-500"
          />
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Xu hướng doanh thu & hoạt động
            </h3>
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold text-sm">
              Tổng: {formatCurrency(stats.revenue)}
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#64748b" />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  fill="#1890ff"
                  name="Doanh thu"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="invoices"
                  stroke="#52c41a"
                  name="Hoá đơn"
                  strokeWidth={2}
                  dot={{ fill: "#52c41a", r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="patients"
                  stroke="#faad14"
                  name="Bệnh nhân"
                  strokeWidth={2}
                  dot={{ fill: "#faad14", r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <div className="text-center text-slate-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  Chọn khoảng thời gian và xem báo cáo để hiển thị biểu đồ
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ant Design Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900">
              Chi tiết doanh thu theo ngày
            </h3>
          </div>

          <div className="p-4">
            <Spin spinning={loading}>
              <Table
                bordered
                columns={columns}
                dataSource={tableData}
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "15", "20", "30", "50", "100"],
                  showTotal: (total, range) =>
                    `Hiển thị ${range[0]}-${range[1]} trong tổng ${total} ngày`,
                  locale: { items_per_page: "dòng/trang" },
                }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Không có dữ liệu"
                    />
                  ),
                }}
                scroll={{ x: 800 }}
                rowClassName="hover:bg-slate-50 transition-colors"
              />
            </Spin>
          </div>

          {reportData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={reportData.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </div>
    </div>
  );

  function StatusCard({ title, value, icon, color }) {
    return (
      <div
        className={`${color} text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 font-medium">{title}</p>
            <p className="text-2xl font-bold mt-3">{value}</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            {icon}
          </div>
        </div>
      </div>
    );
  }
}
