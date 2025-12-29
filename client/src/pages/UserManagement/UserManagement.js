import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  Badge,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  PlusCircleOutlined,
  FilterOutlined,
  ClearOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { rolesAPI, usersAPI } from "../../services/api";
import FileDropdown from "../../components/FileDropdown";
import UserModal from "./UserModal";
import moment from "moment";

// ============================================================
// Constants & Helpers
// ============================================================

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Hoạt động", value: "true" },
  { label: "Ngừng hoạt động", value: "false" },
];

const getStatusConfig = (status) => {
  const configs = {
    true: { color: "green", label: "Hoạt động" },
    false: { color: "red", label: "Ngừng hoạt động" },
  };
  return configs[status] || { color: "default", label: "Không xác định" };
};

const getChangedFields = (original, updated) => {
  const changed = {};
  for (const key in updated) {
    if (updated[key] !== original[key]) {
      changed[key] = updated[key];
    }
  }
  return changed;
};

const cleanPayload = (obj) => {
  const cleaned = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// ============================================================
// Main Component
// ============================================================

const UserManagement = () => {
  // State Management
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState("");

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ============================================================
  // Data Fetching
  // ============================================================

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      // Apply filters
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role_name = filters.role;
      if (filters.status) params.is_active = filters.status;
      console.log("Filters applied:", params);

      const response = await usersAPI.getUsers(params);

      if (response.data.success) {
        console.log("FETCHED USERS:", response.data.data);
        setUsers(response.data.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination?.totalItems || 0,
        }));
      }
    } catch (error) {
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [
    filters.role,
    filters.status,
    filters.search,
    pagination.current,
    pagination.pageSize,
  ]);

  const fetchRoles = async () => {
    try {
      const response = await rolesAPI.getRoles();
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      message.error("Không thể tải danh sách vai trò");
    }
  };

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRoles();
  }, []);

  // ============================================================
  // Action Handlers
  // ============================================================

  const handleSubmit = async (values) => {
    try {
      let payload = values;

      if (editingUser) {
        const diff = getChangedFields(editingUser, values);
        payload = cleanPayload(diff);
      }

      const response = editingUser
        ? await usersAPI.updateUser(editingUser.user_id, payload)
        : await usersAPI.createUser(payload);

      if (response.data.success) {
        message.success(
          editingUser ? "Cập nhật thành công!" : "Thêm mới thành công!"
        );
        handleCloseModal();
        fetchUsers();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể lưu dữ liệu");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await usersAPI.deleteUser(id);
      if (response.data.success) {
        message.success("Xóa thành công!");
        fetchUsers();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể xóa");
    }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      message.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      const response = await usersAPI.resetPassword(selectedUser?.user_id, {
        new_password: password,
      });

      if (response.data.success) {
        message.success("Đặt lại mật khẩu thành công!");
        setResetModalVisible(false);
        setPassword("");
        setSelectedUser(null);
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || "Không thể đặt lại mật khẩu"
      );
    }
  };

  // ============================================================
  // Modal Handlers
  // ============================================================

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      is_active: record.is_active,
      role_name: record.role_name,
      full_name: record.full_name,
      email: record.email,
      phone: record.phone,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleOpenResetModal = (record) => {
    setSelectedUser(record);
    setPassword("");
    setResetModalVisible(true);
  };

  const handleCloseResetModal = () => {
    setResetModalVisible(false);
    setSelectedUser(null);
    setPassword("");
  };

  // ============================================================
  // Filter Handlers
  // ============================================================

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({ search: "", role: "", status: "" });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter((v) => v !== "").length;
  };

  // ============================================================
  // Table Columns
  // ============================================================

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Tên đăng nhập",
      dataIndex: "username",
      key: "username",
      width: 150,
    },
    {
      title: "Họ tên",
      dataIndex: "full_name",
      key: "full_name",
      width: 200,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Vai trò",
      dataIndex: "role_name",
      key: "role_name",
      width: 120,
      render: (role) => <Tag color="blue">{role || "Chưa phân quyền"}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 130,
      align: "center",
      render: (status) => {
        const config = getStatusConfig(status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },

    {
      title: "Thời gian tạo",
      dataIndex: "created_at",
      render: (value) =>
        value ? moment(value).format("DD-MM-YYYY HH:mm") : "-",
      width: 150,
      sorter: (a, b) =>
        moment(a.created_at).valueOf() - moment(b.created_at).valueOf(),
    },

    {
      title: "Thao tác",
      key: "actions",
      width: 130,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>

          <Tooltip title="Đặt lại mật khẩu">
            <Button
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleOpenResetModal(record)}
            />
          </Tooltip>

          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa người dùng này?"
              onConfirm={() => handleDelete(record.user_id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ============================================================
  // Render
  // ============================================================

  return (
    <div>
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Space align="center">
              <h1 style={{ margin: 0, fontSize: 25, fontWeight: 600 }}>
                Quản lý người dùng
              </h1>
              <FileDropdown
                dataExport={users}
                nameFile={`Danh_Sach_User_${moment().format(
                  "YYYY-MM-DD_HH-mm-ss"
                )}`}
              />
            </Space>
          </Col>

          <Col>
            <Space>
              <Badge count={getActiveFiltersCount()} offset={[-5, 5]}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Bộ lọc
                </Button>
              </Badge>

              <Tooltip title="Làm mới">
                <Button icon={<ReloadOutlined />} onClick={fetchUsers} />
              </Tooltip>

              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                style={{
                  background: "#0e1182ff",
                  border: "none",
                }}
                onClick={handleOpenCreateModal}
              >
                Thêm mới
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Advanced Filters */}
        {showFilters && (
          <Card
            size="small"
            style={{
              marginBottom: 16,
              background: "#fafafa",
              borderRadius: 8,
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <label
                  style={{ fontWeight: 500, marginBottom: 4, display: "block" }}
                >
                  Tìm kiếm
                </label>
                <Input
                  placeholder="Tìm theo tên, email..."
                  prefix={<SearchOutlined />}
                  value={filters.search}
                  // Gioi han nhap 100 ky tu
                  maxLength={100}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  allowClear
                />
              </Col>

              <Col xs={24} sm={12} md={8}>
                <label
                  style={{ fontWeight: 500, marginBottom: 4, display: "block" }}
                >
                  Vai trò
                </label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Chọn vai trò"
                  value={filters.role}
                  onChange={(value) => handleFilterChange("role", value)}
                  allowClear
                >
                  <Select.Option value="">Tất cả</Select.Option>
                  {roles.map((role) => (
                    <Select.Option key={role.role_id} value={role.role_name}>
                      {role.role_name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <label
                  style={{ fontWeight: 500, marginBottom: 4, display: "block" }}
                >
                  Trạng thái
                </label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Chọn trạng thái"
                  value={filters.status}
                  onChange={(value) => handleFilterChange("status", value)}
                  allowClear
                >
                  {STATUS_OPTIONS.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24}>
                <Space>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    disabled={getActiveFiltersCount() === 0}
                  >
                    Xóa bộ lọc
                  </Button>
                  <span style={{ color: "#999", fontSize: 12 }}>
                    Tìm thấy {pagination.total} kết quả
                  </span>
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {/* Table */}
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="user_id"
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize: pageSize,
              }));
            },
          }}
        />
      </Card>

      {/* User Modal */}
      <UserModal
        editingUser={editingUser}
        modalVisible={modalVisible}
        roles={roles}
        handleSubmit={handleSubmit}
        onCancel={handleCloseModal}
        form={form}
      />

      {/* Reset Password Modal */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: "#0e1182ff" }} />
            <span>Đặt lại mật khẩu</span>
          </Space>
        }
        open={resetModalVisible}
        onCancel={handleCloseResetModal}
        onOk={() => form.submit()}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleResetPassword}>
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">{selectedUser?.username}</Tag>
            <span style={{ marginLeft: 8 }}>{selectedUser?.full_name}</span>
          </div>

          <Form.Item
            label="Mật khẩu mới"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
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
            <Input.Password placeholder="Nhập mật khẩu mới" size="large" />
          </Form.Item>

          <div style={{ fontSize: 12, color: "#999" }}>
            Mật khẩu ≥ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
