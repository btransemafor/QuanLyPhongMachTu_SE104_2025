import React, { useState } from "react";
import {
  Calendar,
  TrendingUp,
  Clock,
  FileBarChart,
  Download,
  Search,
  ChevronRight,
  BarChart3,
  Activity,
  Archive,
  Sparkles,
} from "lucide-react";
import { reportsAPI } from "../../services/api";
import moment from "moment";
import { useNavigate } from "react-router-dom";
const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const RevenueOverviewReport = () => {
  const [activeTab, setActiveTab] = useState("periodic");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [reportType, setReportType] = useState("revenue");
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [periodicReports, setPeriodicReports] = useState([]);
  const navigate = useNavigate();

  const fetchMonthlyRevenueReports = async () => {
    try {
      // Fetch revenue reports logic here
      const res = await reportsAPI.getMonthlyRevenueReports({
        year: selectedYear === "all" ? null : selectedYear,
      });

      if (res.data.success) {
        console.log("Fetched revenue reports:", res.data.data);
        // Process and set the fetched data as needed
        setPeriodicReports(
          res.data.data.map((item) => ({
            ...item,
            revenue: formatCurrency(item.revenue),
            created: moment(item.created_at).format("DD/MM/YYYY HH:mm"),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching revenue reports:", error);
    }
  };

  React.useEffect(() => {
    fetchMonthlyRevenueReports();
  }, [selectedYear]);

  const availableYears = [
    "all",
    ...Array.from(new Set(periodicReports.map((r) => r.year)))
      .sort()
      .reverse(),
  ];

  const filteredReports = periodicReports.filter((report) => {
    const matchesYear = selectedYear === "all" || report.year === selectedYear;
    const matchesSearch =
      searchQuery === "" ||
      `${report.month}/${report.year}`.includes(searchQuery) ||
      report.created.includes(searchQuery);
    return matchesYear && matchesSearch;
  });

  const reportsByYear = filteredReports.reduce((acc, report) => {
    if (!acc[report.year]) acc[report.year] = [];
    acc[report.year].push(report);
    return acc;
  }, {});

  const handleGenerateReport = () => {
    setIsGenerating(true);

    // Navigate to report page with date range as state or query params
    navigate("/reports/revenue", {
      state: { from: dateRange.from, to: dateRange.to },
    });

    setTimeout(() => {
      setIsGenerating(false);

      setShowResults(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm rounded-xl m-2">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Báo cáo Doanh Thu
              </h1>
              <p className="text-slate-600 text-base">
                Theo dõi và phân tích hiệu suất hoạt động phòng khám
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl shadow-sm m-2 mt-5">
        <div className="max-w-8xl mx-auto px-6 py-8">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6 flex gap-2">
            <button
              onClick={() => {
                setActiveTab("periodic");
                setShowResults(false);
              }}
              className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                activeTab === "periodic"
                  ? "bg-[#0e1182ff] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Archive className="w-5 h-5" />
              <div className="text-left">
                <div className="text-base font-semibold">Báo cáo định kỳ</div>
                <div
                  className={`text-xs ${
                    activeTab === "periodic"
                      ? "text-white-100"
                      : "text-slate-500"
                  }`}
                >
                  Tự động tạo hàng tháng
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab("realtime");
                setShowResults(false);
              }}
              className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                activeTab === "realtime"
                  ? "bg-[#0e1182ff] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <div className="text-left">
                <div className="text-base font-semibold">
                  Báo cáo doanh thu tùy chỉnh
                </div>
                <div
                  className={`text-xs ${
                    activeTab === "realtime" ? "text-white" : "text-slate-500"
                  }`}
                >
                  Tính toán theo thời gian thực
                </div>
              </div>
            </button>
          </div>

          {/* Content */}
          {activeTab === "periodic" ? (
            <div className="space-y-6">
              {/* Search & Filter Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 ">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      Lịch sử báo cáo
                    </h3>
                    <p className="text-sm text-slate-500">
                      Các báo cáo được tạo tự động vào 0h ngày đầu mỗi tháng
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                    <Archive className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {filteredReports.length} báo cáo
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 font-medium"
                  >
                    <option value="all">Tất cả các năm</option>
                    {availableYears
                      .filter((y) => y !== "all")
                      .map((year) => (
                        <option key={year} value={year}>
                          Năm {year}
                        </option>
                      ))}
                  </select>

                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tháng/năm hoặc ngày tạo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Reports List - Grouped by Year */}
              <div className="space-y-4">
                {Object.keys(reportsByYear).length > 0 ? (
                  Object.keys(reportsByYear)
                    .sort()
                    .reverse()
                    .map((year) => (
                      <div
                        key={year}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                      >
                        {selectedYear === "all" && (
                          <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-400">
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-semibold text-blue-900">
                                Năm {year}
                              </h4>
                              <span className="text-sm text-blue-700 font-medium">
                                {reportsByYear[year].length} báo cáo
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="divide-y divide-slate-100">
                          {reportsByYear[year].map((report) => (
                            <div
                              key={report.id}
                              className="px-6 py-5 hover:bg-slate-50 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5 flex-1">
                                  <div className="bg-gradient-to-br from-[#0e1182ff] to-[#0e1182ff] p-3 rounded-xl shadow-md">
                                    <Calendar className="w-6 h-6 text-white" />
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-lg font-semibold text-slate-900">
                                        Tháng {report.month}/{report.year}
                                      </h4>
                                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                        Đã lưu
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-slate-600">
                                      <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        Tạo: {report.created}
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4" />
                                        {report.revenue}
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <Activity className="w-4 h-4" />
                                        {report.patients} bệnh nhân
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    className="px-5 py-2 bg-[#0e1182ff] text-white rounded-lg hover:bg-[#383cb3] transition-all text-sm font-medium flex items-center gap-2 group-hover:shadow-md group-hover:scale-105"
                                    onClick={() => {
                                      console.log(
                                        "Navigating to report:",
                                        report
                                      );
                                      navigate(
                                        `/reports/revenue?year=${report.year}&month=${report.month}`,
                                        {
                                          state: {
                                            year: report.year,
                                            month: report.month,
                                          },
                                        }
                                      );
                                    }}
                                  >
                                    Xem chi tiết
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-16 text-center">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">
                      Không tìm thấy báo cáo phù hợp
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Thử tìm kiếm với từ khóa khác hoặc chọn năm khác
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Custom Report Builder */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      Tạo báo cáo tùy chỉnh
                    </h3>
                    <p className="text-sm text-slate-500">
                      Dữ liệu được tính toán theo thời gian thực khi bạn nhấn
                      "Xem báo cáo"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Thời gian thực</span>
                  </div>
                </div>

                <div
                  className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => navigate("/reports/custom-revenue")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Báo cáo doanh thu tùy chỉnh
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Xem chi tiết theo khoảng thời gian bất kỳ
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-blue-600 font-medium">
                    Xem ngay
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueOverviewReport;
