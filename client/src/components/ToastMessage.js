import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastMessage = ({ message, duration = 4000, type = "info", onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    error: {
      icon: <AlertCircle size={20} />,
      bg: "linear-gradient(90deg, #fff1f0 0%, #fff5f5 100%)",
      borderLeft: "4px solid #ff4d4f",
      color: "#c41d1d",
    },
    success: {
      icon: <CheckCircle size={20} />,
      bg: "linear-gradient(90deg, #f6ffed 0%, #f0f9e8 100%)",
      borderLeft: "4px solid #52c41a",
      color: "#237804",
    },
    warning: {
      icon: <AlertTriangle size={20} />,
      bg: "linear-gradient(90deg, #fffbe6 0%, #fff7e6 100%)",
      borderLeft: "4px solid #fa8c16",
      color: "#d46b08",
    },
    info: {
      icon: <Info size={20} />,
      bg: "linear-gradient(90deg, #e6f7ff 0%, #bae7ff 100%)",
      borderLeft: "4px solid #1890ff",
      color: "#0050b3",
    },
  }[type] || config.info;

  return (
    <div
      style={{
         display: "flex",
        alignItems: "center",
        background: config.bg,
        border: "1px solid #d9d9d9",
        borderLeft: config.borderLeft,
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        animation: isExiting ? "slideOut 0.3s ease-out forwards" : "slideIn 0.3s ease-out forwards",
        maxWidth: "100%",
      }}
    >
      <div style={{ color: config.color, marginRight: 12 }}>{config.icon}</div>
      <span style={{ flex: 1, color: config.color, fontSize: "14px", fontWeight: 500 }}>
        {message}
      </span>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: config.color,
          opacity: 0.6,
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
};

// Animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    to { transform: translateX(100%); opacity: 0; margin: 0; padding: 0; height: 0; border: 0; }
  }
`;
document.head.appendChild(styleSheet);

export default ToastMessage;