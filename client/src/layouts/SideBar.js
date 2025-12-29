// src/layouts/Sidebar.tsx
import React from "react";
import { Layout, Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useMenuItems } from "./useMenuItem";
import { useAuth } from "../contexts/AuthContext";

const { Sider } = Layout;

const Sidebar = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { menuItems } = useMenuItems(user);

  return (
    <Sider
      /* collapsible */
      collapsed={collapsed}
      onCollapse={onCollapse} 
      width={270}
      collapsedWidth={80}
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        overflowY: "auto",
        overflowX: "hidden",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(28, 23, 60, 0.45)",
        borderRight: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "8px 0 24px rgba(0,0,0,0.25)",
        scrollbarWidth: "none"
      }}
    >
      {/* MENU */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={menuItems
          .filter((item) => item.children)
          .map((item) => item.key)}
        items={menuItems}
        onClick={({ key }) => {
          if (key.startsWith("/")) navigate(key);
        }}
        style={{
          background: "transparent",
          borderRight: "none",
          padding: "12px 4px",
          fontSize: 16,
          fontWeight: 500,
        }}
        styles={{
          itemSelected: {
            background: "rgba(167, 139, 250, 0.25)",
            borderRadius: 10,
            margin: "4px 10px",
            fontWeight: 600,
            border: "1px solid rgba(167, 139, 250, 0.4)",
            backdropFilter: "blur(8px)",
          },
          itemHover: {
            background: "rgba(167, 139, 250, 0.15)",
            borderRadius: 10,
            margin: "4px 10px",
          },
        }}
      />
    </Sider>
  );
};

export default Sidebar;
