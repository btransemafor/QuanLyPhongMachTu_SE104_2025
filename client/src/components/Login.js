import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Typography,
  Divider,
  Spin,
} from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/LOGO.png";
import { useToast } from "../contexts/ToastContext";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  ///const [toasts, setToasts] = useState([]);
   const { toast } = useToast(); // Sử dụng toast từ context

/*   const showToast = (message, type = "info", duration = 3000) => {
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
  }; */

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        toast.success("Đăng nhập thành công!");
        navigate("/");
      } else {
        toast.error(result.message)
        //message.error(result.message || "Đăng nhập thất bại");
      }
    } catch (error) {
        toast.error("Có lỗi xảy ra khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // TODO: Tích hợp Google OAuth thật ở đây
      await new Promise((resolve) => setTimeout(resolve, 1500));
      message.success("Đăng nhập Google thành công!");
      navigate("/");
    } catch (error) {
      message.error("Đăng nhập Google thất bại");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
     {/*  <ModernToastContainer toasts={toasts} onDismiss={dismissToast} /> */}

      {/* Hình nền + decor */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('https://res.cloudinary.com/dehehzz2t/image/upload/v1763373753/064bdec7d818c0bb74bc150b6f44e7b3_dbcxep.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.25,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-150px",
          right: "-150px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-200px",
          left: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }}
      />

      {/* Left Panel - Logo + Slogan */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          color: "white",
          zIndex: 2,
        }}
      >
        <div style={{ textAlign: "center", alignContent: "center" }}>
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
              style={{
                width: "120px",
                height: "120px",
                marginBottom: "24px",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            />
          </div>

          <Title level={1} style={{ color: "white", margin: "0 0 16px" }}>
            Phòng Mạch Tư
          </Title>
          <Text style={{ fontSize: "18px", opacity: 0.9, color: "white" }}>
            Hệ thống quản lý chuyên nghiệp OMGNICE
          </Text>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: "440px",
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            border: "none",
          }}
          bodyStyle={{ padding: "40px" }}
        >
          <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
            Chào mừng trở lại
          </Title>
          <Text
            type="secondary"
            style={{ display: "block", textAlign: "center", marginBottom: 32 }}
          >
            Đăng nhập để tiếp tục quản lý phòng mạch
          </Text>

          {/* Google Button */}
          <Button
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleGoogleLogin}
            loading={googleLoading}
            block
            style={{
              height: "50px",
              borderRadius: "12px",
              fontWeight: 500,
              marginBottom: 24,
              background: "white",
              border: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ marginLeft: 8 }}>Đăng nhập với Google</span>
          </Button>

          <Divider>
            <span style={{ color: "#aaa", fontSize: "14px" }}>
              Hoặc dùng tài khoản
            </span>
          </Divider>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                { min: 3, message: "Tối thiểu 3 ký tự" },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#667eea" }} />}
                placeholder="Tên đăng nhập"
                style={{ borderRadius: "10px", height: "48px" }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#667eea" }} />}
                placeholder="Mật khẩu"
                style={{ borderRadius: "10px", height: "48px" }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  height: "50px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                {loading ? <Spin /> : "Đăng nhập"}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <Button
              type="link"
              onClick={() => navigate("/forgot-password")}
              style={{ color: "#667eea", fontWeight: 500 }}
            >
              Quên mật khẩu?
            </Button>
          </div>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary">Chưa có tài khoản? </Text>
            <Button
              type="link"
              onClick={() => navigate("/register")}
              style={{ color: "#667eea", fontWeight: 600 }}
            >
              Đăng ký ngay
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.8)",
          fontSize: "14px",
        }}
      >
        © 2025 Phòng Mạch Tư - Hệ thống quản lý chuyên nghiệp
      </div>
    </div>
  );
};

export default Login;