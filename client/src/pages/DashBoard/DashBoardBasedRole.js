// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import moment from "moment";
import { message, Typography, Card, Row, Col } from "antd";
import { useAuth } from "../../contexts/AuthContext";

import AdminDashboard from "./AdminDashBoard";
import DoctorDashboard from "./DoctorDashboard";
import ReceptionistDashboard from "./ReceptionistDashboard";

import { reportsAPI, appointmentsAPI } from "../../services/api";

const { Title, Text } = Typography;

// ------------------------
// Header Component
// ------------------------
const Header = ({ username, roleName }) => (
  <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-10">
    <div className="flex items-center space-x-3">
      <div className="bg-blue-600 text-white rounded-lg p-2">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h-4m-6 0H5"
          />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Phòng Mạch OMGNICE</h1>
        <p className="text-sm text-gray-600">
          Chào <strong>{username}</strong> • {roleName}
        </p>
      </div>
    </div>

    <div className="text-gray-600">{moment().format("dddd, DD/MM/YYYY")}</div>
  </header>
);

// --------------------------------------------------
// Main Component
// --------------------------------------------------
export default function DashboardBasedRole() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    today: {
      appointments: {
        total_appointments: 0,
        waiting_count: 0,
        examined_count: 0,
        completed_count: 0,
      },
      revenue: { invoices_count: 0, total_revenue: 0 },
      unpaid: { unpaid_count: 0, unpaid_total: 0 },
    },
    monthly: {
      revenue: { invoices_count: 0, total_revenue: 0 },
    },
  });

  // ---------------------------
  // Fetch Dashboard Data
  // ---------------------------
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      //  Fetch Today's Appointments
      const appointmentsRes = await appointmentsAPI.getDailyAppointments({
        date: moment().format("YYYY-MM-DD"),
      });

      const appointments = appointmentsRes?.data?.data || [];

      const appointmentStats = {
        total_appointments: appointments.length,
        waiting_count: appointments.filter((x) => x.status === "waiting")
          .length,
        examined_count: appointments.filter((x) => x.status === "examined")
          .length,
        completed_count: appointments.filter((x) => x.status === "completed")
          .length,
      };

      //  Fetch Revenue (only Admin + Receptionist)
      let revenueToday = { invoices_count: 0, total_revenue: 0 };
      let revenueMonthly = { invoices_count: 0, total_revenue: 0 };
      let unpaid = { unpaid_count: 0, unpaid_total: 0 };

      if (["admin", "receptionist"].includes(user.role_name.toLowerCase())) {
        const revenueRes = await reportsAPI.getDashboardStats();

        if (revenueRes.data.success) {
          const rep = revenueRes.data.data;

          revenueToday = rep.today.revenue;
          revenueMonthly = rep.monthly.revenue;

          unpaid = rep.today.unpaid;
        }
      }

      setDashboardData({
        today: {
          appointments: appointmentStats,
          revenue: revenueToday,
          unpaid: unpaid,
        },
        monthly: { revenue: revenueMonthly },
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      message.error("Không thể tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = (role) => {
    switch (role) {
      case "receptionist":
        return "Lễ tân";
      case "doctor":
        return "Bác sĩ";
      case "admin":
        return "Quản trị viên";
      default:
        return "Người dùng";
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ---------------------------
  // Determine Role UI
  // ---------------------------
  const roleMap = {
    admin: <AdminDashboard />,
    doctor: <DoctorDashboard data={dashboardData} />,
    receptionist: <ReceptionistDashboard data={dashboardData} />,
  };

  const roleTitle = {
    admin: "Quản trị viên",
    doctor: "Bác sĩ",
    receptionist: "Lễ tân",
  };

  if (!user) return <div className="p-10 text-center">Đang tải...</div>;

  const roleName = user.role_name?.toLowerCase();

  return (
    <div className="min-h-screen">
      {roleMap[roleName] ?? <div className="p-5">Không có quyền truy cập</div>}

      {/* Hướng dẫn sử dụng */}
      <Card
        bordered={false}
        style={{
          marginTop: 20,
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          marginLeft: 10, 
          marginRight:10
        }}
        title={
          <Title level={4} style={{ margin: 0, color: "#0e1182ff" }}>
            Hướng dẫn sử dụng • {getRoleTitle(user?.role_name.toLowerCase())}
          </Title>
        }
      >
        <Row gutter={[24, 24]}>
          {user?.role_name.toLowerCase() === "receptionist" && (
            <Col xs={24} md={12}>
              <Card size="small" 
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}>
                <Title level={5} /* style={{ color: "#1890ff" }} */>
                  Công việc chính
                </Title>
                <ul style={{ margin: "16px 0", paddingLeft: 20 }}>
                  <li>Quản lý bệnh nhân</li>
                  <li>Thêm bệnh nhân vào danh sách khám</li>
                  <li>Lập và in hóa đơn thanh toán</li>
                  <li>Theo dõi trạng thái khám bệnh</li>
                  <li>Hỗ trợ bệnh nhân nhanh chóng</li>
                </ul>
              </Card>
            </Col>
          )}

          {user?.role_name.toLowerCase() === "doctor" && (
            <Col xs={24} md={12}>
              <Card
                size="small"
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <Title level={5} /* style={{ color: "#52c41a" }} */>
                  Công việc chính
                </Title>
                <ul style={{ margin: "16px 0", paddingLeft: 20 }}>
                  <li>Xem danh sách bệnh nhân chờ khám</li>
                  <li>Lập phiếu khám & kê đơn thuốc</li>
                  <li>Cập nhật kết quả khám</li>
                  <li>Tra cứu lịch sử bệnh án</li>
                  <li>Ho Completable trạng thái khám</li>
                </ul>
              </Card>
            </Col>
          )}

          {user?.role_name.toLowerCase() === "admin" && (
            <Col xs={24} md={12}>
              <Card
                size="small"
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <Title level={5} style={{ }}>
                  Quyền quản trị
                </Title>
                <ul style={{ margin: "16px 0", paddingLeft: 20 }}>
                  <li>Quản lý tài khoản người dùng</li>
                  <li>Cấu hình hệ thống</li>
                  <li>Xem báo cáo doanh thu chi tiết</li>
                  <li>Giám sát hoạt động toàn hệ thống</li>
                  <li>Sao lưu & bảo mật dữ liệu</li>
                </ul>
              </Card>
            </Col>
          )}

          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{
                marginBottom: 16,
                borderRadius: 8,
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <Title level={5} style={{ /* color: "#0e1182ff"  */}}>
                Thông tin hệ thống
              </Title>
              <ul style={{ margin: "16px 0", paddingLeft: 20 }}>
                <li>Hệ thống quản lý phòng khám tư nhân</li>
                <li>Hỗ trợ đầy đủ 3 vai trò người dùng</li>
                <li>Quản lý lịch khám & bệnh án điện tử</li>
                <li>Tự động tính tiền & in hóa đơn</li>
                <li>Báo cáo thống kê trực quan</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
