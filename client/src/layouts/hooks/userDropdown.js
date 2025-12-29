import React from "react";
import { Dropdown, Button, Avatar, message } from "antd";
import { UserOutlined, KeyOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { IoPersonOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext"

const UserDropdown = ({ onChangePassword , onDisplayInfo}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {toast} = useToast();  

  const handleLogout = () => {
    logout();
    toast.success("Đăng xuất thành công!");
    navigate('/')
  };

  const getRoleLabel = (role) => {
    if (!role) return "";  // thêm dòng này để tránh lỗi
    let roleFormat = role?.toLowerCase(); 
    console.log('ROLE CUA USER: ', role); 
    const roles = {
      admin: "Quản trị viên",
      receptionist: "Lễ tân",
      doctor: "Bác sĩ",
    };
    return roles[roleFormat] || "Người dùng";
  };

  const userMenuItems = [
    {
      key: "change-password",
      icon: <KeyOutlined />,
      label: "Đổi mật khẩu",
      onClick: onChangePassword,
    },
   
    {
      key:'info', 
      icon: <IoPersonOutline/>, 
      label:'Hồ sơ cá nhân', 
      onClick: onDisplayInfo
    }, 

     {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ color: "white" }}>
        <p>{user?.username}</p> {/* ({getRoleLabel(user?.role_name)}) */}
      </span>
      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
        <Button type="text" style={{ padding: 0 }}>
          <Avatar icon={<UserOutlined />} />
        </Button>
      </Dropdown>
    </div>
  );
};

export default UserDropdown;

