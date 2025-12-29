import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Download,
  Search,
  TrendingUp,
  Package,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  BarChart2,
  Coins,
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
import { reportsAPI } from "../services/api";
import { useLocation, useNavigate } from "react-router-dom";
import { Column } from "@ant-design/charts";

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

const MedicineUsageReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { medicine_usage_report_id, year, month } = location.state || {};

  const [loading, setLoading] = useState(false);

  const [reportData, setReportData] = useState({
    period: { from: "", to: "" },
    medicine_usage: [],
    summary: {
      total_medicines_dispensed: 0,
      total_medicine_value: 0,
      total_prescriptions: 0,
      unique_medicines_used: 0,
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Lấy dữ liệu báo cáo đã lưu theo ID
  const fetchSavedReport = async () => {
    if (!medicine_usage_report_id) {
      message.warning("Không có ID báo cáo");
      return;
    }

    try {
      setLoading(true);
      const response = await reportsAPI.getMedicineUsageReportPeriod(
        medicine_usage_report_id
      );

      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        message.error("Không tìm thấy báo cáo");
      }
    } catch (error) {
      console.error(error);
      message.error("Không thể tải báo cáo đã lưu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedReport();
  }, [medicine_usage_report_id]);

  // Xử lý dữ liệu cho biểu đồ: top 5 + "Khác"
  const chartData = useMemo(() => {
    const total = Number(reportData.summary.total_medicines_dispensed);
    if (total === 0) return [];

    const sorted = [...reportData.medicine_usage]
      .map((item) => ({
        ...item,
        total_quantity_used: Number(item.total_quantity_used),
      }))
      .sort((a, b) => b.total_quantity_used - a.total_quantity_used);

    const top5 = sorted.slice(0, TOP_MEDICINES_COUNT);
    const others = sorted
      .slice(TOP_MEDICINES_COUNT)
      .reduce((sum, item) => sum + item.total_quantity_used, 0);

    const data = [...top5];
    if (others > 0) {
      data.push({
        medicine_name: "Khác",
        total_quantity_used: others,
        unit_name: "",
        rate: 0, // sẽ tính sau
      });
    }

    return data.map((item, index) => ({
      ...item,
      rate: Number(((item.total_quantity_used / total) * 100).toFixed(1)),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [reportData]);

  // Lọc và tìm kiếm
  const filteredData = useMemo(() => {
    return reportData.medicine_usage.filter(
      (item) =>
        item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.medicine_id).includes(searchTerm)
    );
  }, [reportData.medicine_usage, searchTerm]);

  // Phân trang
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);
  };

  const handleClickRow = (medicine_id) => {
    navigate(`/report/medical-record/by-medicine/${medicine_id}`, {
      state: { medicine_usage_report_id, period: reportData.period },
    });
  };

  const handleExportPDF = () =>
    message.info("Chức năng xuất PDF đang phát triển");
  const handleExportExcel = () =>
    message.info("Chức năng xuất Excel đang phát triển");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Đang tải báo cáo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mx-auto max-w-8xl">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FileText className="text-blue-600" size={32} />
                Báo cáo sử dụng thuốc
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Kỳ báo cáo: {month}/{year}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 transition shadow-sm"
              >
                <FileSpreadsheet size={18} />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Tổng số lượng thuốc
                </p>
                <p className="text-4xl font-bold mt-2">
                  {Number(
                    reportData.summary.total_medicines_dispensed
                  ).toLocaleString()}
                </p>
                <p className="text-blue-100 text-sm mt-1">đơn vị</p>
              </div>
              <Package size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Tổng giá trị
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(reportData.summary.total_medicine_value)}
                </p>
                <p className="text-green-100 text-sm mt-1">VNĐ</p>
              </div>
              <Coins size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">
                  Tổng đơn thuốc
                </p>
                <p className="text-4xl font-bold mt-2">
                  {Number(
                    reportData.summary.total_prescriptions
                  ).toLocaleString()}
                </p>
                <p className="text-orange-100 text-sm mt-1">đơn</p>
              </div>
              <BarChart2 size={48} className="opacity-80" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600" />
              Top thuốc theo số lượng
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="medicine_name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.[0] ? (
                      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
                        <p className="font-semibold">{label}</p>
                        <p>Số lượng: {payload[0].value.toLocaleString()}</p>
                      </div>
                    ) : null
                  }
                />
                <Bar
                  dataKey="total_quantity_used"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Tỷ lệ sử dụng thuốc
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="rate"
                  nameKey="medicine_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={(entry) =>
                    entry.medicine_name === "Khác"
                      ? "Khác"
                      : `${entry.medicine_name}: ${entry.rate}%`
                  }
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
                        <p className="font-semibold">
                          {payload[0].payload.medicine_name}
                        </p>
                        <p>Tỷ lệ: {payload[0].value}%</p>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

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
                width={120}
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
                width={150}
              />
            </Table>
          </div>
      </div>
    </div>
  );
};

export default MedicineUsageReport;
