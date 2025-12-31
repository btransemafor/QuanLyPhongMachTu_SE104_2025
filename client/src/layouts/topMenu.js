// topMenu.js – ĐÃ SỬA HOÀN CHỈNH
import React from "react";
import { Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  BarChartOutlined,
  SettingOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  TeamOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

const TopMenu = ({ userRole = "admin" }) => {
  const location = useLocation();

  const menuItems = {
    admin: [
      {
        key: "/dashboard",
        label: <Link to="/dashboard">Dashboard</Link>,
        icon: <DashboardOutlined />,
      },
      {
        key: "patients-group",
        label: "Bệnh nhân",
        icon: <UserOutlined />,
        children: [
          { key: "/patients", label: <Link to="/patients">Danh sách</Link> },
          {
            key: "/patients/add",
            label: <Link to="/patients/add">Thêm mới</Link>,
          },
          {
            key: "/medical-records",
            label: <Link to="/medical-records">Hồ sơ bệnh án</Link>,
          },
        ],
      },
      {
        key: "/appointments",
        label: <Link to="/appointments">Lịch hẹn</Link>,
        icon: <CalendarOutlined />,
      },
      {
        key: "master-data",
        label: "Dữ liệu gốc",
        icon: <DatabaseOutlined />,
        children: [
          { key: "/medicines", label: <Link to="/medicines">Thuốc</Link> },
          { key: "/diseases", label: <Link to="/diseases">Loại bệnh</Link> },
          { key: "/units", label: <Link to="/units">Đơn vị</Link> },
          {
            key: "/usage-methods",
            label: <Link to="/usage-methods">Cách dùng</Link>,
          },
        ],
      },
      {
        key: "reports",
        label: "Báo cáo",
        icon: <BarChartOutlined />,
        children: [
          {
            key: "/reports/revenue-overview",
            label: <Link to="/reports/revenue-overview">Doanh thu</Link>,
          },
          {
            key: "/reports/medicine-usage-overview",
            label: <Link to="/reports/medicine-usage-overview">Dùng thuốc</Link>,
          },
         /*  {
            key: "/reports/patient-stats",
            label: <Link to="/reports/patient-stats">Bệnh nhân</Link>,
          }, */
        ],
      },
      {
        key: "/settings",
        label: <Link to="/settings">Cấu hình</Link>,
        icon: <SettingOutlined />,
      },
    ],

    receptionist: [
      {
        key: "/dashboard",
        label: <Link to="/dashboard">Dashboard</Link>,
        icon: <DashboardOutlined />,
      },
      {
        key: "/patients",
        label: <Link to="/patients">Bệnh nhân</Link>,
        icon: <TeamOutlined />,
      },
      {
        key: "/appointments",
        label: <Link to="/appointments">Danh sách khám bệnh</Link>,
        icon: <CalendarOutlined />,
      },
      {
        key: "/invoices",
        label: <Link to="/invoices">Hóa đơn</Link>,
        icon: <FileTextOutlined />,
      },
    ],

    doctor: [
  
      {
        key: "/dashboard",
        label: <Link to="/dashboard">Tổng quan</Link>,
        icon: <DashboardOutlined />,
      },
      {
        key: "/appointments",
        label: <Link to="/appointments">Lịch khám</Link>,
        icon: <CalendarOutlined />,
      },
      {
        key: "/medical-records",
        label: <Link to="/medical-records">Hồ sơ bệnh nhân</Link>,
        icon: <FileTextOutlined />,
      },
      {
        key: "/diseases",
        label: <Link to="/diseases">Tra cứu bệnh</Link>,
        icon: <FileSearchOutlined />,
      },
    ],
  };

  const items = menuItems[userRole] || menuItems.admin;

  // Tự động chọn key hiện tại (hỗ trợ cả submenu)
  const selectedKeys = [location.pathname];
  const openKeys = items
    .filter((item) =>
      item.children?.some((child) => child.key === location.pathname)
    )
    .map((item) => item.key);

  return (
    <Menu
      mode="horizontal"
      selectedKeys={selectedKeys}
      defaultOpenKeys={openKeys} // tự động mở submenu đúng
      items={items}
      style={{
        lineHeight: "60px",
        borderBottom: "none",
        background: "transparent",
        fontWeight: 500,
        fontSize: "14.5px",
        flex: 1,
      }}
      className="custom-top-menu"
    />
  );
};

export default TopMenu;
