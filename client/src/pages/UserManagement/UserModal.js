import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Tag,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

const UserModal = ({
  modalVisible,
  editingUser,
  form,
  handleSubmit,
  onCancel,
  roles,
}) => {
  // Khi editingUser thay đổi, fill form tự động
  useEffect(() => {
    if (editingUser) {
      form.setFieldsValue({
        full_name: editingUser.full_name,
        username: editingUser.username,
        email: editingUser.email,
        phone: editingUser.phone,
        role_id: editingUser.role_id,
        is_active: editingUser.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
      });
    }
  }, [editingUser, form]);

  return (
    <Modal
      title={
        <div
          style={{
            padding: "8px 0",
            borderBottom: "2px solid #f0f0f0",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#1a1a1a",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <UserOutlined style={{ fontSize: "20px" }} />
            </div>
            {editingUser ? "Chỉnh sửa thông tin người dùng" : "Thêm người dùng mới"}
          </div>
        </div>
      }
      open={modalVisible}
      onCancel={onCancel}
      footer={null}
      centered
      width={550}
      style={{
        borderRadius: "16px",
        overflow: "hidden",
      }}
      styles={{
        body: { padding: 0 },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          is_active: true,
        }}
        style={{ marginTop: "10px" }}
      >
        <Form.Item
          label={
            <span style={{ fontWeight: 500, fontSize: "14px" }}>Họ và tên</span>
          }
          name="full_name"
          rules={[{ required: true, message: "Vui lòng nhập họ tên!" }, 
          { max: 100, message: "Họ tên không được vượt quá 100 ký tự!" }
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Nhập họ và tên đầy đủ"
            size="large"
            style={{
              borderRadius: "8px",
              border: "1.5px solid #e0e0e0",
            }}
          />
        </Form.Item>

        <Form.Item
          label={
            <span style={{ fontWeight: 500, fontSize: "14px" }}>
              Tên đăng nhập
            </span>
          }
          name="username"
          rules={[
            { required: true, message: "Vui lòng nhập tên đăng nhập!" }, 
            // max, min 
            { min: 4, message: "Tên đăng nhập phải có ít nhất 4 ký tự!" },
            { max: 50, message: "Tên đăng nhập không được vượt quá 50 ký tự!" },
          ]}
        >
          <Input
            prefix={<SafetyOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Nhập tên đăng nhập"
            size="large"
            style={{
              borderRadius: "8px",
              border: "1.5px solid #e0e0e0",
            }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 500, fontSize: "14px" }}>Email</span>
              }
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                // email 
                { type: 'email', message: "Email không hợp lệ!" },
                { max: 100, message: "Email không được vượt quá 100 ký tự!" },

                /*  { type: 'email', message: "Email không hợp lệ!" } */
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="email@example.com"
                size="large"
                style={{
                  borderRadius: "8px",
                  border: "1.5px solid #e0e0e0",
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 500, fontSize: "14px" }}>
                  Số điện thoại
                </span>
              }
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Số điện thoại phải có 10 chữ số!",
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="0912345678"
                size="large"
                style={{
                  borderRadius: "8px",
                  border: "1.5px solid #e0e0e0",
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {!editingUser && (
          <Form.Item
            label={
              <span style={{ fontWeight: 500, fontSize: "14px" }}>
                Mật khẩu
              </span>
            }
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }, 

              // Ít nhất 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt, min 8 ký tự
              { 
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!" 

              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Nhập mật khẩu mạnh"
              size="large"
              style={{
                borderRadius: "8px",
                border: "1.5px solid #e0e0e0",
              }}
            />
          </Form.Item>
        )}

        <Form.Item
          label={
            <span style={{ fontWeight: 500, fontSize: "14px" }}>Vai trò</span>
          }
          name="role_id"
          rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
        >
          <Select
            placeholder="Chọn vai trò phù hợp"
            size="large"
            style={{
              borderRadius: "8px",
            }}
          >
            {roles.map((role) => (
              <Select.Option key={role.role_id} value={role.role_id}>
                <Tag
                  color={
                    role.role_name === "Admin"
                      ? "red"
                      : role.role_name === "Manager"
                      ? "blue"
                      : "green"
                  }
                >
                  {role.role_name}
                </Tag>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <span style={{ fontWeight: 500, fontSize: "14px" }}>
              Trạng thái hoạt động
            </span>
          }
          name="is_active"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <div
            style={{
              background: "#f8f9fa",
              padding: "16px",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                Kích hoạt tài khoản
              </div>
              <div style={{ fontSize: "13px", color: "#666" }}>
                Cho phép người dùng đăng nhập vào hệ thống
              </div>
            </div>

            {/* Switch PHẢI để trong Form.Item NO STYLE */}
            <Form.Item name="is_active" valuePropName="checked" noStyle>
              <Switch checkedChildren={<CheckCircleOutlined />} />
            </Form.Item>
          </div>
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              onClick={onCancel}
              size="large"
              style={{
                borderRadius: "8px",
                minWidth: "100px",
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{
                borderRadius: "8px",
                minWidth: "120px",
                background: "#0e1182ff",
                border: "none",
                fontWeight: 500,
              }}
            >
              {editingUser ? "Cập nhật" : "Thêm mới"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserModal;
