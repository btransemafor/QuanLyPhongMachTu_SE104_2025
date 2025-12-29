import React, { useState } from "react";
import { Card, Form, Input, Button, message, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./reset_new_password.module.css";
import logo from "../../../assets/LOGO.png";
import { useResetNewPassword } from "../../../hooks/auth/resetNewPassword";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
const getStyles = (type) => {
  const styles = {
    success: "from-green-500/90 to-green-600/90",
    error: "from-rose-500/90 to-red-600/90",
    warning: "from-amber-500/90 to-orange-600/90",
    info: "from-blue-500/90 to-indigo-600/90",
  };
  return styles[type] || styles.info;
};

const getIcon = (type) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5" />;
    case "error":
      return <AlertCircle className="w-5 h-5" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5" />;
    default:
      return <Info className="w-5 h-5" />;
  }
};
const ModernToastContainer = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
                    pointer-events-auto
                    flex items-center gap-3 p-4 pr-3 rounded-2xl
                    bg-gradient-to-r ${getStyles(toast.type)}
                    backdrop-blur-xl border border-white/20
                    shadow-2xl text-white
                    transform transition-all duration-300 ease-out
                    ${
                      toast.isHiding
                        ? "translate-x-[120%] opacity-0 scale-95"
                        : "translate-x-0 opacity-100 scale-100"
                    }
                  `}
          style={{
            animation: toast.isHiding ? "none" : "slideIn 0.3s ease-out",
          }}
        >
          <div className="flex-shrink-0 animate-pulse">
            {getIcon(toast.type)}
          </div>

          <div className="flex-1 text-sm font-medium leading-relaxed pr-2">
            {typeof toast.message === "string" ? (
              <p>{toast.message}</p>
            ) : (
              toast.message
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-white/60"
              style={{
                animation: `progress ${toast.duration}ms linear forwards`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
const ResetPasswordPage = () => {
  const { resetPassword, loading } = useResetNewPassword();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // === Di chuyển toàn bộ toast logic lên đây ===
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isHiding: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, duration);
  };

  const dismissToast = (id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isHiding: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };
  // === Kết thúc phần toast ===

  const onFinish = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      await resetPassword(token, values.newPassword);

      // Bây giờ showToast đã tồn tại trong scope
      showToast("Đặt lại mật khẩu thành công!", "success", 5000);

      setTimeout(() => {
        navigate("/login");
      }, 1000); // cho người dùng thấy toast một chút rồi mới chuyển trang
    } catch (error) {
      showToast("Không thể đặt lại mật khẩu. Vui lòng thử lại!", "error", 5000);
      // hoặc giữ message.error nếu muốn dùng Antd message
    }
  };

  return (
    <div className={styles.container}>
      <ModernToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Card className={styles.card} bordered={false}>
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div
            className="login-logo"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={logo}
              alt="Logo"
              style={{ width: "100px", height: "100px", marginRight: "8px" }}
            ></img>
          </div>
        </div>

        <h2 className={styles.title}>Đặt lại mật khẩu</h2>
        <p className={styles.description}>Vui lòng nhập mật khẩu mới của bạn</p>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className={styles.form}
        >
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 8, message: "Mật khẩu ít nhất 8 ký tự" },
              {
                pattern: /[A-Z]/,
                message: "Phải có ít nhất 1 chữ hoa",
              },
              {
                pattern: /[a-z]/,
                message: "Phải có ít nhất 1 chữ thường",
              },
              {
                pattern: /\d/,
                message: "Phải có ít nhất 1 số",
              },
              {
                pattern: /[@$!%*?&]/,
                message: "Phải có ít nhất 1 ký tự đặc biệt (@$!%*?&)",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.icon} />}
              placeholder="Mật khẩu mới"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.icon} />}
              placeholder="Xác nhận mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className={styles.submitButton}
            >
              Đặt lại mật khẩu
            </Button>
          </Form.Item>

          <div className={styles.footer}>
            <Button
              type="link"
              className={styles.backToLogin}
              onClick={() => navigate("/login")}
            >
              Quay lại đăng nhập
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
