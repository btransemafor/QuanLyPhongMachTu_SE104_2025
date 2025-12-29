import React, { useState, useEffect } from "react";
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
  Switch,
  Row,
  Col,
  Select,
  DatePicker,
  Badge,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { diseasesAPI, usersAPI } from "../services/api";
import { CircleCheck, CircleX, Eye, EyeOff, Option } from "lucide-react";
import moment from "moment";
import FileDropdown from "../components/FileDropdown";
import { useAuth } from "../contexts/AuthContext";
import { useRef } from "react";
import ModernToastContainer from "../components/CustomToast";

const DiseaseManagement = () => {
  // Thêm vào đầu component
  const searchInputRef = useRef(null);
  const statusSelectRef = useRef(null);
  const fromDateRef = useRef(null);
  const toDateRef = useRef(null);
  const sortSelectRef = useRef(null);
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDisease, setEditingDisease] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { user } = useAuth();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [filters, setFilters] = useState({
    active_only: undefined,
    from_date: undefined,
    to_date: undefined,
    sort_by: "disease_name",
    sort_order: "asc",
  });

  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    const params = {
      search: searchText || undefined,
      page: pagination.current,
      limit: pagination.pageSize,
      active_only: filters.active_only,
      from_date: filters.from_date,
      to_date: filters.to_date,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
    };

    // Loại bỏ các giá trị undefined
    Object.keys(params).forEach(
      (key) => params[key] === undefined && delete params[key]
    );

    fetchDiseases(params);
  }, [
    searchText,
    filters.from_date,
    filters.sort_by,
    filters.to_date,
    filters.active_only,
    pagination.current,
    pagination.pageSize,
  ]);

  const fetchDiseases = async (params) => {
    try {
      setLoading(true);

      const response = await diseasesAPI.getDiseases(params);
      if (response.data.success) {
        setDiseases(response.data.data);
        console.log("FETCHED DISEASES:", response.data.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.totalItems,
        }));
      }
    } catch (error) {
      message.error("Không thể tải danh sách loại bệnh");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      console.log("Form values:", values);
      let response;
      if (editingDisease) {
        console.log("Update Disease ID: ", editingDisease.disease_id);
        response = await diseasesAPI.updateDisease(
          editingDisease.disease_id,
          values
        );
      } else {
        response = await diseasesAPI.createDisease(values);
      }
      if (response.data.success) {
        message.success(
          editingDisease ? "Cập nhật thành công!" : "Thêm mới thành công!"
        );
        setModalVisible(false);
        form.resetFields();
        fetchDiseases();
      }
    } catch (error) {
      message.error("Không thể lưu dữ liệu");
    }
  };
  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa loại bệnh này?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await diseasesAPI.deleteDisease(id);

          if (response.data?.success) {
            showToast("Xóa thành công!", "success");
            fetchDiseases();
            return;
          }

          // Trường hợp server trả về success = false
          showToast(
            response.data?.message || "Không thể xóa loại bệnh.",
            "error"
          );
        } catch (error) {
          console.error("Delete error:", error);

          const status = error.response?.status;
          const message = error.response?.data?.message;

          let displayMessage = "Không thể xóa bản ghi.";

          // Mapping theo status backend của bé đã viết
          if (status === 404) {
            displayMessage = "Loại bệnh không tồn tại.";
          } else if (status === 400) {
            displayMessage =
              message || "Loại bệnh này đang được liên kết, không thể xóa.";
          } else if (status === 500) {
            displayMessage = "Lỗi hệ thống. Vui lòng thử lại sau.";
          }

          showToast(
            <div>
              <p className="font-semibold mb-1">{displayMessage}</p>
              {status === 400 && (
                <p className="text-xs opacity-90">
                  Hãy vô hiệu hóa thay vì xóa.
                </p>
              )}
            </div>,
            "error",
            4000
          );
        }
      },
    });
  };

  const handleClearFilters = () => {
    setFilters({
      searchText: "",
      active_only: undefined,
      from_date: undefined,
      to_date: undefined,
      sort_by: "disease_name",
      sort_order: "asc",
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleActive = async (id) => {
    try {
      console.log("Disease id ", id);
      const disease = diseases.find((m) => m.disease_id === id);
      const newStatus = !disease.is_active;

      console.log("new status disease: ", newStatus);

      const response = await diseasesAPI.updateDisease(id, {
        is_active: newStatus,
      });

      if (response.data.success) {
        showToast(
          newStatus ? "Đã kích hoạt thành công!" : "Đã vô hiệu hóa thành công!",
          newStatus ? "success" : "warning"
        );
        fetchDiseases();
      }
    } catch (error) {
      showToast("Không thể cập nhật trạng thái", "error");
    }
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1, //  Tính STT chuẩn
      width: 50,
      /*  align: "center", */
    },

    {
      title: "Tên bệnh",
      dataIndex: "disease_name",
      key: "disease_name",
      width: 100,
    },

    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      // ellipsis: true,
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
      width: 80,
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              style={{
                marginLeft: 8,
              }}
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingDisease(record);
                form.setFieldsValue(record);
                setModalVisible(true);
              }}
            ></Button>
          </Tooltip>

          {user.role_name?.toLowerCase() === "admin" ? (
            <Tooltip title="Xóa">
              <Button
                onClick={() => handleDelete(record.disease_id)}
                danger
                size="small"
                icon={<DeleteOutlined />}
                style={{
                  marginLeft: 8,
                }}
              ></Button>
            </Tooltip>
          ) : null}

          <Tooltip title={record.is_active ? "Vô hiệu hóa" : "Kích hoạt"}>
            <Button
              onClick={() => handleActive(record.disease_id)}
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
    <div>
          <ModernToastContainer toasts={toasts} onDismiss={dismissToast} />
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
                Quản lý loại bệnh
              </h1>
              {/*    <Badge count={users.length} showZero color="#0e1182ff" /> */}
              <FileDropdown
                dataExport={diseases}
                nameFile={`Danh_Sach_Loai_Benh_${moment().format(
                  "YYYY-MM-DD_HH-mm-ss"
                )}`}
              />
            </Space>
          </Col>

          <Col>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Bộ lọc
              </Button>

              <Tooltip title="Làm mới">
                <Button icon={<ReloadOutlined />} onClick={fetchDiseases} />
              </Tooltip>

              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                style={{
                  background: "#0e1182ff",
                  border: "none",
                }}
                onClick={() => {
                  setModalVisible(true);
                  setEditingDisease(null);
                  form.resetFields();
                }}
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
              marginBottom: 20,
              background: "#fafafa",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8} lg={6}>
                <Input.Search
                  ref={searchInputRef}
                  allowClear
                  placeholder="Tìm tên bệnh, mã ICD-10, mô tả..."
                  prefix={<SearchOutlined style={{ color: "#8b8b8b" }} />}
                  value={searchText} // ← QUAN TRỌNG: controlled
                  onChange={(e) => setSearchText(e.target.value)}
                  onSearch={(value) => setSearchText(value)}
                  style={{ width: "100%" }}
                  size="large"
                />
              </Col>

              {/* Trạng thái */}
              <Col xs={12} md={6} lg={4}>
                <Select
                  ref={statusSelectRef}
                  placeholder="Trạng thái"
                  allowClear
                  /*  value={filters.active_only || undefined } // ← controlled */
                  value={
                    filters.active_only === undefined
                      ? undefined
                      : filters.active_only
                  }
                  style={{ width: "100%" }}
                  size="large"
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, active_only: value }))
                  }
                >
                  <Option value={true}>Đang hoạt động</Option>
                  <Option value={false}>Đã vô hiệu</Option>
                </Select>
              </Col>

              {/* Từ ngày */}
              <Col xs={12} md={6} lg={4}>
                <DatePicker
                  ref={fromDateRef}
                  placeholder="Từ ngày"
                  value={filters.from_date ? moment(filters.from_date) : null}
                  style={{ width: "100%" }}
                  size="large"
                  format="DD/MM/YYYY"
                  onChange={(date) =>
                    setFilters((prev) => ({
                      ...prev,
                      from_date: date ? date.format("YYYY-MM-DD") : undefined,
                    }))
                  }
                />
              </Col>

              {/* Đến ngày */}
              <Col xs={12} md={6} lg={4}>
                <DatePicker
                  ref={toDateRef}
                  placeholder="Đến ngày"
                  value={filters.to_date ? moment(filters.to_date) : null}
                  style={{ width: "100%" }}
                  size="large"
                  format="DD/MM/YYYY"
                  onChange={(date) =>
                    setFilters((prev) => ({
                      ...prev,
                      to_date: date ? date.format("YYYY-MM-DD") : undefined,
                    }))
                  }
                />
              </Col>

              {/* Sắp xếp */}
              <Col xs={12} md={6} lg={4}>
                <Select
                  ref={sortSelectRef}
                  placeholder="Sắp xếp theo"
                  value={filters.sort_by}
                  style={{ width: "100%" }}
                  size="large"
                  onChange={(value) => {
                    let sort_by = "disease_name";
                    let sort_order = "asc";
                    if (value === "disease_name_desc") {
                      sort_by = "disease_name";
                      sort_order = "desc";
                    } else if (value === "created_at") {
                      sort_by = "created_at";
                      sort_order = "desc";
                    } else if (value === "created_at_asc") {
                      sort_by = "created_at";
                      sort_order = "asc";
                    } else if (value === "updated_at") {
                      sort_by = "updated_at";
                      sort_order = "desc";
                    }

                    setFilters((prev) => ({ ...prev, sort_by, sort_order }));
                  }}
                >
                  <Option value="disease_name">Tên bệnh (A → Z)</Option>
                  <Option value="disease_name_desc">Tên bệnh (Z → A)</Option>
                  <Option value="created_at">Ngày tạo (mới nhất)</Option>
                  <Option value="created_at_asc">Ngày tạo (cũ nhất)</Option>
                  <Option value="updated_at">Cập nhật gần đây</Option>
                </Select>
              </Col>

              {/* Nút làm mới */}
              <Col xs={12} md={6} lg={2}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setSearchText("");
                    setFilters({
                      active_only: undefined,
                      from_date: undefined,
                      to_date: undefined,
                      sort_by: "disease_name",
                      sort_order: "asc",
                    });
                    setPagination((prev) => ({ ...prev, current: 1 })); // quay về trang 1
                  }}
                  style={{ width: "100%", padding: 10 }}
                  size="large"
                >
                  Làm mới
                </Button>
              </Col>

              <Col xs={24}>
                <Space>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    // disabled={getActiveFiltersCount() === 0}
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
        <hr className="border-t border-gray-300 my-4" />

        <Table
          columns={columns}
          dataSource={diseases}
          loading={loading}
          rowKey="disease_id"
          data-testid="table"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} loại bệnh`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize: pageSize || prev.pageSize,
              }));
            },
          }}
        />
      </Card>

      <Modal
        title={editingDisease ? "Sửa loại bệnh" : "Thêm loại bệnh mới"}
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
            name="disease_name"
            label="Tên bệnh"
            rules={[
              { required: true, message: "Vui lòng nhập tên bệnh!" },
              {
                max: 100,
                min: 3,
                message: "Tên bệnh phải từ 3 đến 100 ký tự",
              },
            ]}
            data-testid="form"
          >
            <Input placeholder="Nhập tên bệnh" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            data-testid="form"
            rules={[
              { max: 300, message: "Mô tả không được dài quá 300 ký tự" },
            ]}
          >
            <Input.TextArea placeholder="Nhập mô tả" rows={3} />
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
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: "#0e1182ff",
                  border: "none",
                }}
              >
                {editingDisease ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DiseaseManagement;
