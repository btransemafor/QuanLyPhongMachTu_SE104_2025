import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  message,
  Popconfirm,
  Tooltip,
  Select,
  Switch,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { unitsAPI } from "../services/api";
import { CircleCheck, CircleX, Eye, EyeOff } from "lucide-react";
import moment from "moment";
import FileDropdown from "../components/FileDropdown";
import ModernToastContainer from "../components/CustomToast";
const { Search } = Input;
const UnitManagement = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
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
      }, 100);
    }, duration);
  };

  const dismissToast = (id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isHiding: true } : t))
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 100);
  };

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search && String(search).trim() !== "")
        params.search = String(search).trim();
      if (filterStatus === "active") params.active_only = true;
      if (filterStatus === "inactive") params.active_only = false;
      console.log("param:", params);

      const response = await unitsAPI.getUnits(params);
      if (response.data.success) {
        console.log("Fetched units:", response.data.data);
        setUnits(response.data.data);
      }
    } catch (error) {
      message.error("Không thể tải danh sách đơn vị");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    // Fetch units when component mounts and when search/filter change
    fetchUnits();
  }, [fetchUnits]);

  let response;
  const handleSubmit = async (values) => {
    try {
      if (editingUnit) {
        response = await unitsAPI.updateUnit(editingUnit.unit_id, values);
      } else {
        response = await unitsAPI.createUnit(values);
      }
      if (response.data.success) {
        showToast(
          editingUnit ? "Cập nhật thành công!" : "Thêm mới thành công!",
          "success"
        );
        setModalVisible(false);
        form.resetFields();
        fetchUnits();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        const errorMsg =
          error.response?.data?.message || "Đơn vị tính đã tồn tại!";
        console.log("Showing error message:", errorMsg);
        message.warning({
          content: errorMsg,
          duration: 2,
          key: "medicine-error", // Key để tránh duplicate
        });
        return;
      }

      message.error("Có lỗi xảy ra!");
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
          const response = await unitsAPI.deleteUnit(id);
          if (response.data.success) {
            showToast("Xóa thành công!", "success");
            fetchUnits();
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
      console.log("unit id ", id);
      const unit = units.find((m) => m.unit_id === id);
      const newStatus = !unit.is_active;

      console.log("new status unit: ", newStatus);

      const response = await unitsAPI.updateUnit(id, {
        is_active: newStatus,
      });

      if (response.data.success) {
        showToast(
          newStatus ? "Đã kích hoạt thành công!" : "Đã vô hiệu hóa thành công!",
          newStatus ? "success" : "warning"
        );
        fetchUnits();
      }
    } catch (error) {
      showToast("Không thể cập nhật trạng thái", "error");
    }
  };

  const columns = [
    // column STT
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      width: 40,
      /* align: "center", */
    },
    {
      title: "ID",
      key: "unit_id",
      width: 70,
      dataIndex: "unit_id",
    },

    {
      title: "Tên đơn vị",
      dataIndex: "unit_name",
      key: "unit_name",
      width: 180,
    },
    {
      title: "Kích hoạt",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
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
      width: 120,
      sorter: (a, b) =>
        moment(a.created_at).valueOf() - moment(b.created_at).valueOf(),
    },

    {
      title: "Thao tác",
      key: "actions",
      width: 50,
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingUnit(record);
                form.setFieldsValue(record);
                setModalVisible(true);
              }}
            ></Button>
          </Tooltip>

          <Tooltip title="Xóa">
            <Button
              style={{
                transition: "all 0.3s ease",
                marginLeft: 8,
              }}
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => {
                handleDelete(record.unit_id);
              }}
            ></Button>
          </Tooltip>

          <Tooltip title={record.is_active ? "Vô hiệu hóa" : "Kích hoạt"}>
            <Button
              onClick={() => handleActive(record.unit_id)}
              size="small"
              icon={record.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
              style={{
              
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
    <div style={{ padding: "0px", background: "#f0f2f5", minHeight: "100vh" }}>
      <ModernToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space>
              <h1 style={{ margin: 0, fontSize: 25, fontWeight: 600 }}>
                Quản lý đơn vị tính
              </h1>

              {/*  <FileDropdown /> */}

              <FileDropdown
                dataExport={units}
                nameFile={`Danh_Sach_DVT_${moment().format(
                  "YYYY-MM-DD_HH-mm-ss"
                )}`}
              />
            </Space>
          </div>

          <Search
            placeholder="Tìm kiếm đơn vị tính ..."
            allowClear
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
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

          <Space>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => {
                setEditingUnit(null);
                form.resetFields();
                setModalVisible(true);
              }}
              style={{
                background: "#0e1182ff",
                border: "none",
              }}
            >
              Thêm mới
            </Button>
          </Space>
        </div>

        <hr className="border-t border-gray-300 my-4" />

        <Table
          columns={columns}
          dataSource={units}
          loading={loading}
          rowKey="unit_id"
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
        title={editingUnit ? "Sửa đơn vị" : "Thêm đơn vị mới"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          data-testid="form"
        >
          <Form.Item
            name="unit_name"
            label="Tên đơn vị"
            rules={[
              { required: true, message: "Vui lòng nhập tên đơn vị!" },
              { min: 1, max: 30, message: "Đơn vị tính từ 1 đến 30 ký tự" },
              {
                pattern: /^[A-Za-zÀ-ỹ\s]+$/,
                message: "Đơn vị tính chỉ được chứa chữ cái",
              },
            ]}
            data-testid="form"
          >
            <Input placeholder="Nhập tên đơn vị" />
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

              {/* Switch PHẢI để trong Form.Item NO STYLE */}
              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <Switch checkedChildren={<CheckCircleOutlined />} />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item style={{ textAlign: "right" }} data-testid="form">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit"  style={{
                background: "#0e1182ff",
                border: "none",
              }}>
                {editingUnit ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UnitManagement;
