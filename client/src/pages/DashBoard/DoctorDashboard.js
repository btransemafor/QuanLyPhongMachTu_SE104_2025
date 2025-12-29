// pages/DoctorDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  FileText,
  ChevronRight,
  Search,
  Filter,
  Activity,
  Stethoscope,
  History,
  Eye,
} from "lucide-react";
import moment from "moment";
import { DatePicker, Tooltip } from "antd";
import "antd/dist/reset.css";
import { DashboardAPI } from "../../services/api";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PatientHistoryDrawer from "../PatientManagement/PatientHistoryDrawer";
const { RangePicker } = DatePicker;

const getStatusColor = (status) => {
  switch (status) {
    case "waiting":
      return "text-blue-600 bg-blue-100 border-blue-300";
    case "examining":
      return "text-orange-600 bg-orange-100 border-orange-300";
    case "completed":
      return "text-green-600 bg-green-100 border-green-300";
    default:
      return "text-gray-600 bg-gray-100 border-gray-300";
  }
};

// Mock data (thay bằng API thật sau)
const mockData = {
  selectedDate: "2025-12-07",
  appointments_total: 28,
  pending_appointments: 7,
  completed_appointments: 18,
  unfinished_records: 3,

  timeline: [
    {
      id: 1,
      time: "08:00",
      patient_name: "Nguyễn Văn An",
      avatar: "",
      status: "completed",
      late: false,
    },
    {
      id: 2,
      time: "08:30",
      patient_name: "Trần Thị Bé",
      avatar: "",
      status: "examining",
      late: false,
    },
    {
      id: 3,
      time: "09:00",
      patient_name: "Lê Văn Cường",
      avatar: "",
      status: "pending",
      late: true,
    },
    {
      id: 4,
      time: "09:15",
      patient_name: "Phạm Minh Đức",
      avatar: "",
      status: "pending",
      late: false,
    },
    // ... thêm dữ liệu
  ],

  today_patients: [
    {
      id: 1,
      name: "Nguyễn Văn An",
      age: 34,
      gender: "Nam",
      code: "BN001234",
      complaint: "Đau đầu, chóng mặt",
      checkin: "07:55",
      status: "completed",
    },
    {
      id: 2,
      name: "Trần Thị Bé",
      age: 28,
      gender: "Nữ",
      code: "BN005678",
      complaint: "Ho, sốt nhẹ",
      checkin: "08:25",
      status: "examining",
    },
    {
      id: 3,
      name: "Lê Văn Cường",
      age: 45,
      gender: "Nam",
      code: "BN009876",
      complaint: "Đau bụng trên",
      checkin: "08:50",
      status: "pending",
    },
  ],

  recent_records: [
    {
      id: 1,
      name: "Nguyễn Văn An",
      date: "07/12/2025",
      diagnosis: "Viêm họng cấp",
      avatar: "",
    },
    {
      id: 2,
      name: "Trần Thị Bé",
      date: "07/12/2025",
      diagnosis: "Viêm mũi dị ứng",
      avatar: "",
    },
    {
      id: 3,
      name: "Lê Văn Cường",
      date: "06/12/2025",
      diagnosis: "Tăng huyết áp",
      avatar: "",
    },
    {
      id: 4,
      name: "Phạm Minh Đức",
      date: "06/12/2025",
      diagnosis: "Viêm dạ dày cấp",
      avatar: "",
    },
    {
      id: 5,
      name: "Hoàng Thị Hoa",
      date: "05/12/2025",
      diagnosis: "Thiếu máu nhẹ",
      avatar: "",
    },
  ],
};

export default function DoctorDashboard() {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [filterStatus, setFilterStatus] = useState("all");
  const [data, setData] = useState(mockData);

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isYesterday, setYesterday] = useState(false);
  const [isToday, setToday] = useState(true);

  // --- Drawer lịch sử bệnh nhân ---
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardSummary();
  }, [selectedDate]);

  const loadDashboardSummary = async () => {
    try {
      console.log("SELECTED DATE", selectedDate);
      const res = await DashboardAPI.getDashboardDoctorSummary({
        date: selectedDate.format("YYYY-MM-DD"),
      });
      console.log("data", res.data.data);
      setData(res.data.data);
    } catch (error) {
      console.error("Load dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    if (!date) return;

    const today = moment();
    const yesterday = moment().subtract(1, "day");

    // Kiểm tra ngày chọn
    const isToday = date.isSame(today, "day");
    const isYesterday = date.isSame(yesterday, "day");

    setToday(isToday);
    setYesterday(isYesterday);
    setSelectedDate(date);

    console.log("Chọn date: ", date.format("YYYY-MM-DD"));
  };

  // Lọc danh sách bệnh nhân theo trạng thái
  const filteredPatients = data.today_patients.filter(
    (p) => filterStatus === "all" || p.status === filterStatus
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "waiting":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "examined":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTimelineColor = (status, late) => {
    if (late) return "border-l-red-400 bg-red-50";
    if (status === "examining") return "border-l-blue-500 bg-blue-50";
    if (status === "pending") return "border-l-yellow-400 bg-yellow-50";
    return "border-l-green-500 bg-green-50";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Chào mừng quay lại, Bác sĩ 👋
          </h1>
          <p className="text-gray-600 text-lg flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Dashboard khám bệnh • {selectedDate.format("DD/MM/YYYY")}
          </p>
        </div>

        {/* DATE FILTER */}
        <div className="mb-8 bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-800">
                Chọn ngày xem:
              </span>
            </div>
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              format="DD/MM/YYYY"
              allowClear={true}
              className="w-48 h-12 text-lg"
              suffixIcon={<Calendar className="text-blue-600" />}
            />

            <div className="flex gap-2 ml-auto">
              <button
                className={`
    px-4 py-2 rounded-xl transition
    ${
      isToday
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }
  `}
                onClick={() => {
                  setYesterday(false);
                  setToday(true);
                  const today = moment();
                  handleDateChange(today);
                }}
              >
                Hôm nay
              </button>

              <button
                className={`
    px-4 py-2 rounded-xl transition
    ${
      isYesterday
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }
  `}
                onClick={() => {
                  setYesterday(true);
                  const yesterday = moment().subtract(1, "day");
                  handleDateChange(yesterday);
                }}
              >
                Hôm qua
              </button>

              {/*  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition">
                7 ngày gần nhất
              </button> */}
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <section className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatusCard
              title="Danh sách khám bệnh"
              value={data.appointments_total}
              icon={<Calendar className="w-9 h-9" />}
              color="bg-gradient-to-br from-blue-600 to-blue-500"
            />
            <StatusCard
              title="Đang chờ khám"
              value={data.pending_appointments}
              icon={<Clock className="w-9 h-9" />}
              color="bg-gradient-to-br from-orange-600 to-orange-500"
            />
            <StatusCard
              title="Đã khám"
              value={(data.examining_appointments + data.completed_appointments)}
              icon={<CheckCircle className="w-9 h-9" />}
              color="bg-gradient-to-br from-green-600 to-green-500"
            />
            <StatusCard
              title="Hoàn thành"
              value={data.completed_appointments}
              icon={<AlertCircle className="w-9 h-9" />}
              color="bg-gradient-to-br from-red-600 to-red-500"
              /* warning={data.unfinished_records > 0} */
            />
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* DANH SÁCH BỆNH NHÂN HÔM NAY */}
          <section className="xl:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Danh sách bệnh nhân hôm nay
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-medium text-gray-700">
                    Tổng: {data.appointments_total} ca
                  </span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả</option>
                    <option value="waiting">Đang chờ</option>
                    <option value="examined">Đã khám</option>
                    <option value="completed">Hoành thành</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center">
                        <UserOutlined className="text-gray-500 text-2xl" />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {patient.name} • {patient.age} tuổi • {patient.gender}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          patient.status
                        )}`}
                      >
                        {patient.status === "waiting"
                          ? "Đang chờ"
                          : patient.status === "examined"
                          ? "Đã khám"
                          : "Hoành thành"}
                      </span>

                      {patient.status !== "completed" &&
                      patient.status !== "examined" ? (
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                          onClick={() => {
                            navigate(`/medical-record/${patient.id}/new`);
                          }}
                        >
                          Khám ngay
                        </button>
                      ) : null}

                      <Tooltip title="Lịch sử khám bệnh">
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                          onClick={() => {
                            setSelectedPatientId(patient.patient_id);
                            setDrawerVisible(true);
                          }}
                        >
                          <History className="w-5 h-5" />
                        </button>
                      </Tooltip>

                      {patient.status !== "waiting" && (
                        <Tooltip title="">
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                            onClick={() => {
                              navigate(
                                `/medical-record-details/${patient.medical_record_id}`
                              );
                            }}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* HỒ SƠ GẦN ĐÂY */}
        <section className="mt-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-purple-400 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900">
                Hồ sơ bệnh án gần đây
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {data.recent_records.map((record) => (
                <div
                  key={record.id}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                  onClick={() => {
                    navigate(`/medical-record-details/${record.id}`);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/*  <div className="w-12 h-12 bg-purple-200 border-2 border-dashed rounded-full flex-shrink-0" /> */}
                    <div className="w-14 h-14 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center">
                      <UserOutlined className="text-gray-500 text-2xl" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">
                        {record.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {record.date}
                      </p>
                      <p className="text-sm font-medium text-purple-700 mt-2 line-clamp-2">
                        {record.diagnosis}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-600 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <PatientHistoryDrawer
        patientId={selectedPatientId}
        visible={drawerVisible}
        onClose={() => {
          setSelectedPatientId(null);
          setDrawerVisible(false);
        }}
        maskClosable={false}
      />
    </div>
  );
}

// Card KPI
function StatusCard({ title, value, icon, color, warning = false }) {
  return (
    <div
      className={`${color} text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
    >
      {warning && (
        <div className="absolute top-3 right-3 animate-pulse">
          <AlertCircle className="w-6 h-6" />
        </div>
      )}
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
