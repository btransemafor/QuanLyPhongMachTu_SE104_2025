import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Popconfirm,
  Tooltip,
  Switch,
  Select,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
  Info,
  X,
} from "lucide-react";
import { usageMethodsAPI } from "../services/api";
import moment from "moment";
import FileDropdown from "../components/FileDropdown";

// Modern Toast Component
const ModernToastContainer = ({ toasts, onDismiss }) => {
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

  const getStyles = (type) => {
    const styles = {
      success: "from-green-500/90 to-green-600/90",
      error: "from-rose-500/90 to-red-600/90",
      warning: "from-amber-500/90 to-orange-600/90",
      info: "from-blue-500/90 to-indigo-600/90",
    };
    return styles[type] || styles.info;
  };

  return (
    <>
      <div className="fixed top-6 right-6 z-[9999] space-y-3 max-w-md pointer-events-none">
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

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </>
  );
};

const UsageMethodManagement = () => {
  const [usageMethods, setUsageMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
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

  const fetchUsageMethods = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filterStatus && filterStatus !== "all") {
        if (filterStatus === "active") {
          params.is_active = true;
        } else if (filterStatus === "inactive") {
          params.is_active = false;
        }
      }

      const response = await usageMethodsAPI.getUsageMethods(params);
      if (response.data.success) {
        setUsageMethods(response.data.data);
        setCurrentPage(1);
      }
    } catch (error) {
      showToast("Không thể tải danh sách cách dùng", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    fetchUsageMethods();
  }, [fetchUsageMethods]);

  const handleSubmit = async (values) => {
    try {
      let response;
      if (editingMethod) {
        response = await usageMethodsAPI.updateUsageMethod(
          editingMethod.usage_method_id,
          values
        );
      } else {
        response = await usageMethodsAPI.createUsageMethod(values);
      }
      if (response.data.success) {
        showToast(
          editingMethod ? "Cập nhật thành công!" : "Thêm mới thành công!",
          "success"
        );
        setModalVisible(false);
        form.resetFields();
        fetchUsageMethods();
      }
    } catch (error) {
      if (error.response?.status === 409) {
        const errorMsg =
          error.response?.data?.message ||
          "Cách dùng này đã tồn tại trong hệ thống";
        showToast(errorMsg, "warning");
        return;
      }

      showToast("Không thể lưu dữ liệu", "error");
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa bản ghi này?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await usageMethodsAPI.deleteUsageMethod(id);
          if (response.data.success) {
            showToast("Xóa thành công!", "success");
            fetchUsageMethods();
          } else {
            showToast(
              "Không thể xóa bản ghi này vì đang được sử dụng!",
              "error"
            );
          }
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message || "Không thể xóa bản ghi";

          showToast(
            <div>
              <p className="font-semibold mb-1">{errorMessage}</p>
              <p className="text-xs opacity-90">Hãy vô hiệu hóa thay vì xóa</p>
            </div>,
            "error",
            4000
          );
        }
      },
    });
  };

  const handleActive = async (id) => {
    try {
      const method = usageMethods.find((m) => m.usage_method_id === id);
      const newStatus = !method.is_active;

      const response = await usageMethodsAPI.updateUsageMethod(id, {
        is_active: newStatus,
      });

      if (response.data.success) {
        showToast(
          newStatus ? "Đã kích hoạt thành công!" : "Đã vô hiệu hóa thành công!",
          newStatus ? "success" : "warning"
        );
        fetchUsageMethods();
      }
    } catch (error) {
      showToast("Không thể cập nhật trạng thái", "error");
    }
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      width: 50,
    },
    {
      title: "ID",
      key: "usage_method_id",
      width: 70,
      dataIndex: "usage_method_id",
    },
    {
      title: "Cách dùng",
      dataIndex: "usage_method_name",
      key: "usage_method_name",
      width: 180,
    },
    {
      title: "Kích hoạt",
      dataIndex: "is_active",
      key: "is_active",
      width: 70,
      render: (_, record) => {
        return record.is_active ? (
          <CircleCheck color="green" size={20} />
        ) : (
          <CircleX color="red" size={20} />
        );
      },
    },
    {
      title: "Thời gian tạo",
      dataIndex: "created_at",
      render: (value) =>
        value ? moment(value).format("DD-MM-YYYY HH:mm") : "-",
      width: 90,
      sorter: (a, b) =>
        moment(a.created_at).valueOf() - moment(b.created_at).valueOf(),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 60,
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingMethod(record);
                form.setFieldsValue(record);
                setModalVisible(true);
              }}
              // style={{ borderRadius: 6 }}
            />
          </Tooltip>

          <Tooltip title="Xóa">
            <Button
              danger
              onClick={() => handleDelete(record.usage_method_id)}
              size="small"
              icon={<DeleteOutlined />}
              style={{ marginLeft: 8 }}
            />
          </Tooltip>

          <Tooltip title={record.is_active ? "Vô hiệu hóa" : "Kích hoạt"}>
            <Button
              onClick={() => handleActive(record.usage_method_id)}
              size="small"
              icon={record.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
              style={{
                // borderRadius: 8,
                borderColor: record.is_active ? "orange" : "#10b981",
                color: record.is_active ? "orange" : "#10b981",
                background: record.is_active ? "#fef2f2" : "#f0fdf4",
                transition: "all 0.3s ease",
                marginLeft: 8,
              }}
              className="hover:shadow-md"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Modern Toast Container */}
      <ModernToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Space>
            <h1 style={{ margin: 0, fontSize: 25, fontWeight: 600 }}>
              Quản lý cách dùng thuốc
            </h1>
            <FileDropdown
              dataExport={usageMethods}
              nameFile={`Danh_Sach_Cach_Dung_${moment().format(
                "YYYY-MM-DD_HH-mm-ss"
              )}`}
            />
          </Space>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            <Input.Search
              placeholder="Tìm kiếm theo tên cách dùng"
              allowClear
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val);
                setCurrentPage(1);
              }}
              style={{ width: 180, marginLeft: 12 }}
              options={[
                { label: "Tất cả", value: "all" },
                { label: "Đang hoạt động", value: "active" },
                { label: "Đã vô hiệu hóa", value: "inactive" },
              ]}
            />
          </div>

          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            style={{
              background: "#0e1182ff",
              border: "none",
            }}
            onClick={() => {
              setEditingMethod(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Thêm mới
          </Button>
        </div>

        <hr className="border-t border-gray-300 my-4" />

        <Table
          columns={columns}
          dataSource={usageMethods}
          loading={loading}
          rowKey="usage_method_id"
          data-testid="table"
          size="middle"
          rowStyle={(record) => ({
            backgroundColor: record.is_active ? "#f6ffed" : "#fafafa",
          })}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <Modal
        maskClosable={false}
        title={editingMethod ? "Sửa cách dùng" : "Thêm cách dùng mới"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          data-testid="form"
        >
          <Form.Item
            name="usage_method_name"
            label="Cách dùng"
            rules={[
              { required: true, message: "Vui lòng nhập cách dùng!" },
              { min: 10, max: 100, message: "Cách dùng từ 10 đến 100 ký tự" },
            
            ]}
          >
            <Input placeholder="Nhập cách dùng thuốc" />
          </Form.Item>

          <Form.Item
            name="is_active"
            valuePropName="checked"
            style={{ marginBottom: 0 }}
          >
            <div className="flex">
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: "4px",
                  marginRight: "10px",
                }}
              >
                Kích hoạt
              </div>

              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <Switch checkedChildren={<CheckCircleOutlined />} />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit"
               style={{
                  background: "#0e1182ff",
                  border: "none",
                }}
              
              >
                {editingMethod ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsageMethodManagement;
