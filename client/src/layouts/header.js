import React from "react";
import { Layout as AntLayout, Button, Tooltip } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import UserDropdown from "./hooks/userDropdown";
import NotificationIcon from "../components/notificationIcon";
import TopMenu from "./topMenu.js";
import logo from "../assets/LOGO.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
const { Header: AntHeader } = AntLayout;

const Header = ({ collapsed, onToggle, onChangePassword, onDisplayInfo }) => {
  const navigate = useNavigate();
  const {user} = useAuth(); 
  return (
    <AntHeader
      style={{
        height: 60,
        position: "fixed",
        padding: "0 32px",
        /*    background:
          "linear-gradient(135deg, rgba(15, 44, 173, 1) 0%, rgb(118, 75, 162) 100%)", */
        /*  background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", */
        background: "linear-gradient(150deg, #3568E8 40%, #614AFA 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        //position: "sticky",
        top: 0,
        /*  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", */
        color: "#fff",
        fontWeight: 600,
        zIndex: 1000,
        width: "100%",
      }}
    >
      <div
        style={{
          height: 60,
          margin: 0,
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: collapsed ? 18 : 20,
          letterSpacing: "1px",
          borderBottom: "3px solid rgba(255, 255, 255, 0.1)",
          transition: "all 0.3s ease",
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ width: 40, height: 40, objectFit: "contain" }}
          />
          <span style={{ marginLeft: "10px", fontWeight: 600, fontSize: 18 }}>
            OMGNICE
          </span>
        </div>
      </div>

      {/* Left: toggle + top menu */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <TopMenu userRole={user.role_name?.toLowerCase()}/>
      </div>

      {/* Right: notifications + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            position: "relative",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            transition: "background 0.3s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
        {/*   <NotificationIcon /> */}
        </div>

        <UserDropdown
          onChangePassword={onChangePassword}
          onDisplayInfo={onDisplayInfo}
        />

        <Tooltip title="Trợ giúp">
          <QuestionCircleOutlined
            onClick={() => {
              navigate("/help");
            }}
          />
        </Tooltip>
      </div>
    </AntHeader>
  );
};

export default Header;
