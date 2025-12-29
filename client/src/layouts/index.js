// src/layouts/MainLayout.tsx
import React, { useState } from "react";
import { Layout, message } from "antd";
import Sidebar from "./SideBar";
import Header from "./header";
import ChangePasswordModal from "../components/ChangePasswordModal";
import InfoModal from "../components/InfoModal";
import { useAuth } from "../contexts/AuthContext";
const { Header: AntHeader, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const { user, logout } = useAuth();
  const sidebarWidth = collapsed ? 80 : 260;
  const headerHeight = 60;
  const [openInfo, setOpenInfo] = useState(false);

  const handleLogout = () => {
    logout();
    message.success("Đăng xuất thành công!");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ================= HEADER CỐ ĐỊNH ================= */}
      <AntHeader
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight,
          padding: 0,
          zIndex: 1000,
          background: "linear-gradient(135deg, #386CEF 30%, #614AFA 100%)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onChangePassword={() => setChangePasswordVisible(true)}
          onDisplayInfo={() => {
            setOpenInfo(true);
          }}
        />
      </AntHeader>

      {/* ================= SIDEBAR ================= */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={270}
        collapsedWidth={80}
        style={{
          position: "fixed",
          top: headerHeight,
          left: 0,
          bottom: 0,
          overflow: "auto",
          /*      background:
          "linear-gradient(135deg, rgba(15, 40, 149, 1) 0%, rgba(99, 34, 164, 1) 100%)", */
          background: "linear-gradient(135deg, #3568E8 40%, #614AFA 100%)",
          backdropFilter: "blur(8px)", // mờ background phía sau
          WebkitBackdropFilter: "blur(8px)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.1)",
          scrollbarWidth: "none",
        }}
      >
        <Sidebar collapsed={collapsed} />
      </Sider>

      {/* ================= CONTENT ================= */}
      <Layout
        style={{
          marginLeft: sidebarWidth,
          marginTop: headerHeight,
          minHeight: `calc(100vh - ${headerHeight}px)`,
          padding: "8px 8px 8px 8px",
          background: "#f0f2f5",
          transition: "margin-left 0.2s ease",
          overflow: "auto",
        }}
      >
        <div style={{ margin: "0 0px 0px 10px" }}>{children}</div>
      </Layout>

      {/* ================= MODAL ================= */}
      {/*  <ChangePasswordModal
        visible={changePasswordVisible}
        //  open={changePasswordVisible}
        onCancel={() => setChangePasswordVisible(false)}
      /> */}

      <ChangePasswordModal
        visible={changePasswordVisible}
        onCancel={() => setChangePasswordVisible(false)}
      />

      <InfoModal
        user={user}
        open={openInfo}
        onClose={() => setOpenInfo(false)}
      />
    </Layout>
  );
};

export default MainLayout;
