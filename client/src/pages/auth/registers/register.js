// src/pages/Register.tsx (phiên bản HOÀN HẢO 2025)
import React from "react";
import { Form, Input, Button, Card, message, Typography, Spin } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "../../../hooks/auth/userRegister";
import logo from "../../../assets/LOGO.png";
import { useToast } from "../../../contexts/ToastContext";
const { Title, Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const { register, loading } = useRegister();
  const navigate = useNavigate();
  const {toast} = useToast(); 

  const onFinish = async (values) => {
    // delete values.confirmPassword; // không gửi confirmPassword về backend
    try {
      await register(values);
    

      // setTimeout(() => navigate("/login"), 1500);
    } catch (e) {
      const msg = e?.response?.data?.message || "Đăng ký thất bại";
      toast.error(msg);
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
      {/* Background decor */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('https://res.cloudinary.com/dehehzz2t/image/upload/v1763373753/064bdec7d818c0bb74bc150b6f44e7b3_dbcxep.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
          filter: "blur(1px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-250px",
          left: "-250px",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
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
        <div style={{ textAlign: "center", maxWidth: 500 }}>
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

          <Title
            level={1}
            style={{ color: "white", margin: "0 0 16px", fontSize: 48 }}
          >
            Phòng Mạch Tư
          </Title>
          <Text style={{ fontSize: 20, opacity: 0.95 , color:'white'}}>
            Hệ thống quản lý chuyên nghiệp • Hiện đại • An toàn
          </Text>
        </div>
      </div>

      {/* Right Panel - Form rộng rãi hơn */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 60px 60px 20px",
        }}
      >
        {/* Card rộng hơn: 560px thay vì 480px, nhìn thoải mái hẳn */}
        <Card
          style={{
            width: "100%",
            maxWidth: "660px", // Tăng lên 560px → rộng rãi hơn
            borderRadius: "24px",
            boxShadow: "0 25px 70px rgba(0,0,0,0.3)",
            border: "none",
            backdropFilter: "blur(10px)",
            background: "rgba(255,255,255,0.98)",
          }}
          bodyStyle={{ padding: "40px 40px" }}
        >
          <Title
            level={2}
            style={{ textAlign: "center", marginBottom: 8, color: "#333" }}
          >
            Tạo tài khoản mới
          </Title>
          <Text
            type="secondary"
            style={{
              display: "block",
              textAlign: "center",
              marginBottom: 30,
              fontSize: 16,
            }}
          >
            Chỉ mất 30 giây để tham gia hệ thống quản lý phòng mạch hiện đại
          </Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ role: "user" }}
            size="large"
          >
            {/* Dùng 2 cột cho màn hình lớn để rộng rãi hơn nữa */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                style={{ flex: 1, minWidth: 240, padding: "0px" }}
                rules={[
                  { required: true, message: "Vui lòng nhập tên đăng nhập" },
                  { min: 3, message: "Tối thiểu 3 ký tự" },
                ]}
              >
                <Input
                  placeholder="Nhập tên đăng nhập"
                  style={{ borderRadius: 12, height: 50 }}
                />
              </Form.Item>

              <Form.Item
                name="fullname"
                label="Họ và tên"
                style={{ flex: 1, minWidth: 100, padding: "0px" }}
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input
                  placeholder="Nguyễn Văn A"
                  style={{ borderRadius: 12, height: 50 }}
                />
              </Form.Item>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                style={{ flex: 1, minWidth: 240 }}
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  {
                    pattern: /^[0-9]{9,11}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}
              >
                <Input
                  placeholder="0988123456"
                  style={{ borderRadius: 12, height: 50 }}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                style={{ flex: 1, minWidth: 240 }}
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input
                  placeholder="email@domain.com"
                  style={{ borderRadius: 12, height: 50 }}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 8, message: "Mật khẩu ít nhất 8 ký tự" },
                {
                  pattern: /[A-Z]/,
                  message: "Mật khẩu phải có ít nhất 1 chữ hoa",
                },
                {
                  pattern: /[a-z]/,
                  message: "Mật khẩu phải có ít nhất 1 chữ thường",
                },
                {
                  pattern: /\d/,
                  message: "Mật khẩu phải có ít nhất 1 số",
                },
                {
                  pattern: /[@$!%*?&]/,
                  message:
                    "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&)",
                },
              ]}
            >
              <Input.Password
                placeholder="Nhập mật khẩu"
                style={{ borderRadius: 12, height: 50 }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={["password"]}
              hasFeedback
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Hai mật khẩu không khớp!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Nhập lại mật khẩu"
                style={{ borderRadius: 12, height: 50 }}
              />
            </Form.Item>

            {/* Role ẩn */}
            <Form.Item name="role" hidden initialValue="user">
              <Input />
            </Form.Item>

            <Form.Item style={{ marginTop: 32, marginBottom: 20 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  height: 56,
                  borderRadius: 14,
                  fontSize: 18,
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)",
                }}
              >
                {loading ? "Đang xử lý..." : "Đăng ký ngay"}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Đã có tài khoản?{" "}
            </Text>
            <Link
              to="/login"
              style={{
                color: "#667eea",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Đăng nhập ngay
            </Link>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.9)",
          fontSize: "15px",
          fontWeight: 300,
        }}
      >
        © 2025 Phòng Mạch Tư • Hệ thống quản lý chuyên nghiệp
      </div>
    </div>
  );
};

export default Register;
