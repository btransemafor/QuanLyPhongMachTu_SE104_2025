import React, { useEffect, useState } from "react";
import { Badge } from "antd";
import { BellOutlined, MessageOutlined } from "@ant-design/icons";
import { notificationAPI } from "../services/api"; 
import { MessageCircleHeart, MessageCircleOff } from "lucide-react";

const NotificationIcon = () => {
  const [count, setCount] = useState(10);

  // Lấy số thông báo từ API
/*   const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setCount(response.data.unread_count); 
      }
    } catch (error) {
      console.error("Fetch notifications failed:", error);
    }
  }; */

  useEffect(() => {
    //fetchNotifications();

    // Auto refresh mỗi 30 giây (nếu cần)
    //const interval = setInterval(fetchNotifications, 30000);
    //return () => clearInterval(interval);
  }, []);

  return (
    <Badge count={count} overflowCount={99} style={{marginRight: "10px", color: 'white'}}>
      <MessageOutlined style={{ fontSize: 24, cursor: "pointer",  color: 'white' }} />
    </Badge>
  );
};

export default NotificationIcon;
