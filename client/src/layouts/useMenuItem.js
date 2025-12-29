import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  DollarOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Badge, Calendar } from "antd";
import {
  Archive,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  FolderArchive,
  Pill,
  Stethoscope,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { IoMedicalOutline } from "react-icons/io5";

export const useMenuItems = (user) => {
  const getMenuItems = () => {
    /*      {
          key: "/dashboard",
          icon: <DashboardOutlined />,
          label: "Tổng quan",
        }, */
    const roleName = user?.role_name?.toLowerCase();

    const baseItems = [];

    if (roleName === "admin") {
      /*  baseItems.push({
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: "Tổng quan",
      }); */
    }

    baseItems.push(

      {
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: "Tổng quan",
      },

      {
        key: "/appointments",
        icon: <CalendarOutlined />,
        label: "Danh sách khám bệnh",
      }
    );
    /*   {
        key: "/",
        icon: <DashboardOutlined />,
        label: "Tổng quan",
      },
 */

    // Menu cho Receptionist và Admin
    if (roleName === "receptionist" || roleName === "admin") {
      baseItems.push(
        {
          key: "/patients",
          icon: <UserOutlined />,
          label: "Quản lý bệnh nhân",
        },
        {
          key: "/invoices",
          icon: <DollarOutlined />,
          label: "Quản lý hóa đơn",
          children: [
            {
              key: '/invoices', 
              label: "Danh sách hóa đơn"
            },
            {
              key: '/invoices/create', 
              label: "Tạo hóa đơn"
            }
          ]
        }
      );
    }

    // Menu hồ sơ bệnh án cho Doctor và Admin

    if (roleName === "doctor" || roleName === "admin") {

      const medicalChildren = [];

      if (roleName === "doctor") {
        baseItems.push({
          key: "/diseases",
          icon: <FileSearchOutlined />,
          label: "Quản lý loại bệnh",
        });
        medicalChildren.push(
         /*  {
            key: "/doctor-medical-history",
            label: "Lịch sử khám bệnh",
          }, */

          {
            key: "/medical-records",
            label: "Quản lý hồ sơ bệnh án",
          }
        );
      } else if (roleName === "admin") {
        medicalChildren.push(
        /*   {
            key: "/medical-history",
            label: "Lịch sử khám bệnh",
          }, */
          {
            key: "/medical-records",
            label: "Quản lý hồ sơ bệnh án",
          }
        );
      }

      baseItems.push({
        key: "medical",
        icon: <FileTextOutlined />,
        label: "Hồ sơ bệnh nhân",
        children: medicalChildren,
      });
    }

    // Menu chỉ dành cho Admin
    if (roleName === "admin") {
      baseItems.push(
        {
          key: "/receipts",
          icon: <MedicineBoxOutlined />,
          label: "Quản lý nhập thuốc",
        },
        {
          key: "master-data",
          icon: <DatabaseOutlined />,
          label: "Dữ liệu gốc",
          children: [
            {
              key: "/medicines",
              icon: <MedicineBoxOutlined />,
              label: "Quản lý thuốc",
            },
            {
              key: "/diseases",
              icon: <FileSearchOutlined />,
              label: "Quản lý loại bệnh",
            },
            {
              key: "/units",
              icon: <DatabaseOutlined />,
              label: "Quản lý đơn vị",
            },
            {
              key: "/usage-methods",
              icon: <DatabaseOutlined />,
              label: "Quản lý cách dùng",
            },
          ],
        },

        {
          key: "reports",
          icon: <BarChartOutlined />,
          label: (
            <div className="flex items-center gap-3">
              <span className="font-semibold">Báo cáo & Thống kê</span>
            </div>
          ),
          children: [
            {
              key: "/reports/revenue-overview",
              icon: <DollarOutlined />,
              label: "Báo cáo doanh thu",
            },
            {
              key: "/reports/medicine-usage-overview",
              icon: <MedicineBoxOutlined />,
              label: "Báo cáo sử dụng thuốc",
            },
          ],
        },

        {
          key: "management",
          icon: <TeamOutlined />,
          label: "Quản lý hệ thống",
          children: [
            {
              key: "/users",
              icon: <UserOutlined />,
              label: "Quản lý người dùng",
            },
            {
              key: "/settings",
              icon: <SettingOutlined />,
              label: "Cấu hình hệ thống",
            },
          ],
        }
      );
    }

    return baseItems;
  };

  return { menuItems: getMenuItems() };
};
