import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, message } from "antd";
import { MailOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import styles from "./forgot_password.module.css";
import { useForgotPassword } from "../../../hooks/auth/forgotPassword";
import logo from "../../../assets/LOGO.png";

const ForgotPassword = () => {
  const { forgotPassword, loading } = useForgotPassword();
  const [form] = Form.useForm();
  const [countdown, setCountdown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onFinish = async (values) => {
    try {
      await forgotPassword({ email: values.email });
      console.log("Reset password for:", values.email);
      
      // Hiển thị thông báo thành công
      message.success("Link đặt lại mật khẩu đã được gửi đến email của bạn");
      
      // Bắt đầu countdown
      setCountdown(60);
      setEmailSent(true);
      setSentEmail(values.email);
      
    } catch (error) {
      message.error("Không thể gửi email đặt lại mật khẩu");
    }
  };

  const handleResend = async () => {
    try {
      await forgotPassword({ email: sentEmail });
      message.success("Email đã được gửi lại!");
      setCountdown(60);
    } catch (error) {
      message.error("Không thể gửi lại email");
    }
  };

  return (
    <div className={styles.container}>
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
            />
          </div>
        </div>

        <h2 className={styles.title}>Quên mật khẩu</h2>
        <p className={styles.description}>
          Nhập email của bạn để nhận link đặt lại mật khẩu
        </p>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className={styles.form}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              prefix={<MailOutlined className={styles.icon} />}
              placeholder="Email"
              size="large"
              disabled={countdown > 0}
            />
          </Form.Item>

          {/* Hiển thị thông báo thành công */}
          {emailSent && (
            <div
              style={{
                background: "#d4edda",
                border: "1px solid #c3e6cb",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircleOutlined style={{ color: "#28a745", fontSize: "18px" }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: "#155724", fontSize: "14px", fontWeight: 500 }}>
                  Email đã được gửi!
                </div>
                <div style={{ color: "#155724", fontSize: "12px" }}>
                  Vui lòng kiểm tra hộp thư của bạn
                </div>
              </div>
            </div>
          )}

          {/* Countdown timer */}
          {countdown > 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#666",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              Gửi lại sau: <strong>{countdown} giây</strong>
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className={styles.submitButton}
              disabled={countdown > 0}
            >
              {countdown > 0 ? "Đã gửi email" : "Đặt lại mật khẩu"}
            </Button>
          </Form.Item>

          {/* Nút gửi lại */}
          {emailSent && countdown === 0 && (
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <Button
                type="link"
                onClick={handleResend}
                loading={loading}
                style={{ padding: 0 }}
              >
                Gửi lại email
              </Button>
            </div>
          )}

          {/* Hướng dẫn thêm */}
          {emailSent && (
            <div
              style={{
                background: "#f8f9fa",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                <strong>Không nhận được email?</strong>
              </div>
              <ul style={{ fontSize: "12px", color: "#666", margin: 0, paddingLeft: "20px" }}>
                <li>Kiểm tra thư mục spam/rác</li>
                <li>Đảm bảo email nhập đúng</li>
                <li>Link có hiệu lực trong 15 phút</li>
              </ul>
            </div>
          )}

          <div className={styles.footer}>
            <Link to="/login" className={styles.backToLogin}>
              Quay lại đăng nhập
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPassword;