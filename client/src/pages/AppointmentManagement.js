import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  DatePicker,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Select,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  DollarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Calendar } from "lucide-react";
import {
  appointmentsAPI,
  patientsAPI,
  invoicesAPI,
  settingsAPI,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import moment from "moment";
import ConfirmInvoiceModal from "./invoices/confirm_invoice_modal";
import FileDropdown from "../components/FileDropdown";
import { useToast } from "../contexts/ToastContext";
const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const AppointmentManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [searchText, setSearchText] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [formAddPatient] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [record, setRecord] = useState(null);
  const [openAddPatient, setOpenAddPatient] = useState(false);
  const [statusFilter, setStatusFilter] = useState({
    waiting: true,
    examined: true,
    completed: true,
  });

  const {toast} = useToast()

  const [isRefresh, setIsRefresh] = useState(false);
  /// Fetch số bệnh tối da
  const [MaxPatientsPerDay, setMaxPatientsPerDay] = useState(0);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, isRefresh]);

  useEffect(() => {
    applyFilters();
  }, [appointments, searchText]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const activeStatuses = Object.keys(statusFilter)
        .filter((key) => statusFilter[key])
        .join(",");

      const response = await appointmentsAPI.getDailyAppointments({
        date: selectedDate?.format("YYYY-MM-DD"),
        status: activeStatuses || undefined, // nếu không chọn gì → gửi undefined
      });

      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách khám bệnh");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];
    if (searchText) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.full_name?.toLowerCase().includes(lower) ||
          item.phone?.toLowerCase().includes(lower)
      );
    }
    setFilteredAppointments(filtered);
  };

  const fetchPatientsForSelect = async (value = "") => {
    try {
      setPatientSearchLoading(true);
      const response = await patientsAPI.getPatients({
        search: value,
        limit: 20,
      });
      if (response.data.success) {
        setPatients(response.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPatientSearchLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      if (response.data.success) {
        const data = response.data.data;
        setMaxPatientsPerDay(parseFloat(data.MaxPatientsPerDay?.value || 10));
      }
    } catch (error) {
      toast.error("Không thể tải cài đặt tài chính");
    } finally {
    }
  };

  const handleAddPatient = () => {
    setAddModalVisible(true);
    form.resetFields();
    fetchPatientsForSelect();
  };

  const handleAddToAppointment = async (values) => {
    try {
      const response = await appointmentsAPI.addAppointment({
        patient_id: values.patient_id,
        appointment_date: selectedDate?.format("YYYY-MM-DD"),
      });

      if (response.data.success) {
        toast.success("Thêm bệnh nhân vào danh sách khám thành công");
        setAddModalVisible(false);
        form.resetFields();
        fetchAppointments();
      } else {
        toast.error(response.data.message || "Thêm thất bại");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm bệnh nhân");
    }
  };

  const handleRemoveAppointment = async (id) => {
    try {
      const res = await appointmentsAPI.removeAppointment(id);
      if (res.data.success) {
        toast.success("Đã xóa khỏi danh sách khám");
        fetchAppointments();
      }
    } catch (err) {
      toast.error("Không thể xóa");
    }
  };

  const handleCreateInvoice = async (record) => {
    if (!["receptionist", "admin"].includes(user?.role_name?.toLowerCase())) {
      toast.error("Chỉ lễ tân hoặc admin mới được tạo hóa đơn");
      return;
    }
    if (!record.medical_record_id) {
      toast.error("Bệnh nhân chưa có hồ sơ khám");
      return;
    }

    try {
      const res = await invoicesAPI.createInvoice({
        patient_id: record.patient_id,
        medical_record_id: record.medical_record_id,
        daily_appointment_id: record.daily_appointment_id,
      });
      if (res.data.success) {
        toast.success("Tạo hóa đơn thành công");
        // navigate(`/invoices/${res.data.data.id}`);
        setIsRefresh(true);
        setModalVisible(false);
      }
    } catch (err) {
      toast.error("Không thể tạo hóa đơn");
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "waiting":
        return <Tag color="orange">Chờ khám</Tag>;
      case "examined":
        return <Tag color="blue">Đã khám</Tag>;
      case "completed":
        return <Tag color="green">Hoàn thành</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const handleEditMedicalRecord = (medical_record_id) => {
    navigate(`/medical-records/edit/${medical_record_id}`);
  };

  const handleSubmit = async (values) => {
    try {
      const patientData = {
        ...values,
        date_of_birth: values.date_of_birth.format("YYYY-MM-DD"),
      };
      let response;
      response = await patientsAPI.createPatient(patientData);
      if (response.data.success) {
        toast.success("Thêm bệnh nhân thành công!");
        setOpenAddPatient(false);
        form.resetFields();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error saving patient:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi lưu bệnh nhân"
      );
    }
  };

  const stats = {
    total: filteredAppointments.length,
    waiting: filteredAppointments.filter((a) => a.status === "waiting").length,
    examined: filteredAppointments.filter((a) => a.status === "examined")
      .length,
    completed: filteredAppointments.filter((a) => a.status === "completed")
      .length,
  };

  const columns = [
    {
      title: "STT",
      width: 60,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Họ tên",
      dataIndex: "full_name",
      key: "full_name",
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "#262626", marginBottom: 4 }}>
            <UserOutlined style={{ marginRight: 6, color: "#1890ff" }} />
            {text}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {record.patient_id}
          </Text>
        </div>
      ),
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      width: 90,
      render: (g) => (
        <Tag color={g === "Nam" ? "blue" : "pink"}>{g || "-"}</Tag>
      ),
    },
    {
      title: "Ngày sinh",
      dataIndex: "date_of_birth",
      width: 120,
      render: (d) => (d ? moment(d).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) =>
        moment(a.date_of_birth).valueOf() - moment(b.date_of_birth).valueOf(),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      width: 180,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 130,
    },

    // Cột Thời gian tạo
    {
      title: "Thời gian tạo",
      dataIndex: "created_at",
      width: 150,
      render: (_, record) =>
        moment(record.created_at).format("DD-MM-YYYY HH:mm:ss"),
      sorter: (a, b) => {
        // Ưu tiên trạng thái
        const statusPriority = (s) => {
          if (s === "waiting") return 0; // chưa khám
          if (s === "examined") return 1; // đã khám nhưng chưa lập hóa đơn
          if (s === "completed") return 2; // đã hoàn tất
          return 3; // khác
        };

        const aPriority = statusPriority(a.status);
        const bPriority = statusPriority(b.status);

        if (aPriority !== bPriority) return aPriority - bPriority;

        // Nếu cùng trạng thái, sắp xếp theo thời gian cũ trước
        return moment(a.created_at).valueOf() - moment(b.created_at).valueOf();
      },
      defaultSortOrder: "ascend", //  mặc định sắp xếp
    },

    // Cột Trạng thái
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: getStatusTag,
      sorter: (a, b) => {
        const statusPriority = (s) => {
          if (s === "waiting") return 0;
          if (s === "examined") return 1;
          if (s === "completed") return 2;
          return 3;
        };

        const aPriority = statusPriority(a.status);
        const bPriority = statusPriority(b.status);

        if (aPriority !== bPriority) return aPriority - bPriority;

        // Nếu cùng trạng thái, sắp xếp theo thời gian cũ trước
        return moment(a.created_at).valueOf() - moment(b.created_at).valueOf();
      },
      defaultSortOrder: "ascend", //  mặc định sắp xếp
    },

    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space
          size="small"
          style={{ display: "flex", justifyContent: "center", width: "100%" }}
        >
          {record.status === "waiting" &&
            user.role_name?.toLowerCase() !== "receptionist" && (
              <Button
                type="primary"
                size="small"
                icon={<FileTextOutlined />}
                style={{
                  backgroundColor: "#0e1182ff",
                  borderColor: "#0e1182ff",
                }}
                onClick={() =>
                  navigate(`/medical-record/${record.daily_appointment_id}/new`)
                }
              >
                Khám bệnh
              </Button>
            )}

          {record.status === "completed" &&
            user.role_name !== "receptionist" && (
              <Tooltip title="Xem chi tiết">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    navigate(
                      `/medical-record-details/${record.medical_record_id}`
                    )
                  }
                  style={{
                    backgroundColor: "#0e1182ff",
                    borderColor: "#0e1182ff",
                    color: "white",
                  }}
                />
              </Tooltip>
            )}

          {record.status === "examined" && record.medical_record_id != null && (
            <Tooltip title="Xem chi tiết">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() =>
                  navigate(
                    `/medical-record-details/${record.medical_record_id}`
                  )
                }
                style={{
                  backgroundColor: "#0e1182ff",
                  borderColor: "#0e1182ff",
                  color: "white",
                }}
              />
            </Tooltip>
          )}

          {record.status === "examined" &&
            record.invoice_id == null &&
            (user?.role_name?.toLowerCase() === "receptionist" ||
              user?.role_name?.toLowerCase() === "admin") && (
              <Space>
                {/* ADMIN: được sửa */}
                {user?.role_name?.toLowerCase() === "admin" && (
                  <Tooltip title="Sửa">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        handleEditMedicalRecord(record.medical_record_id);
                      }}
                    />
                  </Tooltip>
                )}

                {/* Cả Admin & Lễ tân: được lập hóa đơn */}
                <Button
                  type="primary"
                  size="small"
                  icon={<DollarOutlined />}
                  style={{
                    backgroundColor: "#0e1182ff",
                    borderColor: "#0e1182ff",
                  }}
                  onClick={() => {
                    setModalVisible(true);
                    setRecord(record);
                    console.log("Thong tin de lap hoa don: ", record);
                  }}
                >
                  Lập hóa đơn
                </Button>
              </Space>
            )}

          {record.status === "waiting" && (
            <Popconfirm
              title="Xóa bệnh nhân khỏi danh sách khám hôm nay?"
              onConfirm={() =>
                handleRemoveAppointment(record.daily_appointment_id)
              }
              okText="Xóa"
              cancelText="Hủy"
            >
              <Tooltip title="Xóa">
                <Button danger size="small" icon={<DeleteOutlined />}></Button>
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  useEffect(() => {
    let filtered = [...appointments];

    // Lọc theo trạng thái
    const activeStatuses = Object.keys(statusFilter).filter(
      (key) => statusFilter[key]
    );
    if (activeStatuses.length > 0 && activeStatuses.length < 3) {
      filtered = filtered.filter((item) =>
        activeStatuses.includes(item.status)
      );
    }

    // Lọc theo tìm kiếm
    if (searchText) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.full_name?.toLowerCase().includes(query) ||
          item.phone?.includes(query)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, statusFilter, searchText]);

  return (
    <div style={{ padding: "4px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Header */}
      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex justify-between items-center">
          {/* Left: Title + Export */}
          <Space>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-1">
              Quản Lý Lịch Khám Hằng Ngày
            </h1>

            <FileDropdown
              dataExport={filteredAppointments}
              nameFile={`Danh_Sach_LichKham_${moment().format(
                "YYYY-MM-DD_HH-mm-ss"
              )}`}
            />
          </Space>

          {/* Right: Max patients per day */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl shadow-sm text-sm font-medium">
            <span>Số bệnh nhân tối đa / ngày:</span>
            <span className="font-semibold">{MaxPatientsPerDay}</span>
          </div>
        </div>

        <Text className="text-gray-600 mt-3 ml-1">
          Phòng mạch tư nhân • {selectedDate?.format("DD/MM/YYYY")}
        </Text>

        <div wrap className="w-full mb-2 flex mt-3">
          <Space>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              format="DD/MM/YYYY"
              style={{ width: 180, borderRadius: 6 }}
              suffixIcon={<CalendarOutlined />}
            />

            <Search
              placeholder="Tìm tên hoặc số điện thoại..."
              allowClear
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 320 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddPatient}
              style={{
                borderRadius: "6px",

                background: "#0e1182ff",
                border: "none",
              }}
            >
              Thêm bệnh nhân
            </Button>
          </Space>

          <Space className="ml-auto">
            <Space className="ml-auto">
              {[
                { key: "waiting", label: "Chờ khám", color: "orange" },
                { key: "examined", label: "Đã khám", color: "blue" },
                { key: "completed", label: "Hoàn thành", color: "green" },
              ].map(({ key, label, color }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={statusFilter[key]}
                    onChange={() =>
                      setStatusFilter((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                    className={`w-5 h-5 rounded border-2 border-${color}-500 checked:bg-${color}-500 focus:outline-none`}
                  />
                  <span className="font-medium">{label}</span>
                  <Tag color={color}>
                    {
                      filteredAppointments.filter((a) => a.status === key)
                        .length
                    }
                  </Tag>
                </label>
              ))}
            </Space>
          </Space>
        </div>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm">Đã tiếp nhận</p>
                <p className="text-4xl font-bold mt-2">{stats.total}</p>
              </div>
              <UserOutlined style={{ fontSize: 48, opacity: 0.8 }} />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-100 text-sm">Chờ khám</p>
                <p className="text-4xl font-bold mt-2">{stats.waiting}</p>
              </div>
              <ClockCircleOutlined style={{ fontSize: 48, opacity: 0.8 }} />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-sm">Đã khám</p>
                <p className="text-4xl font-bold mt-2">{stats.examined}</p>
              </div>
              <CheckCircleOutlined style={{ fontSize: 48, opacity: 0.8 }} />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="bg-gradient-to-br from-purple-500 to-purple-900 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm">Hoàn thành</p>
                <p className="text-4xl font-bold mt-2">{stats.completed}</p>
              </div>
              <DollarCircleOutlined style={{ fontSize: 48, opacity: 0.8 }} />
            </div>
          </div>
        </Col>
      </Row>

      {/* Table */}
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <Table
          columns={columns}
          dataSource={filteredAppointments}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            total: filteredAppointments.length,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} bệnh nhân`,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            style: { marginTop: 16 },
          }}
          style={{ borderRadius: 8 }}
          rowClassName="table-row-hover"
        />
      </Card>

      {/* Modal thêm bệnh nhân */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: "#1890ff", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              Thêm bệnh nhân vào danh sách khám
            </span>
          </Space>
        }
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddToAppointment}>
          <Form.Item
            name="patient_id"
            label="Chọn bệnh nhân"
            rules={[{ required: true, message: "Vui lòng chọn bệnh nhân" }]}
          >
            <Select
              showSearch
              placeholder="Gõ tên hoặc số điện thoại để tìm..."
              loading={patientSearchLoading}
              onSearch={fetchPatientsForSelect}
              filterOption={false}
              notFoundContent={
                patientSearchLoading ? "Đang tìm..." : "Không tìm thấy"
              }
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div
                    style={{
                      padding: 8,
                      display: "flex",
                      justifyContent: "center",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => setOpenAddPatient(true)}
                    >
                      Thêm bệnh nhân mới
                    </Button>
                  </div>
                </>
              )}
            >
              {patients.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.full_name} - {p.phone}{" "}
                  {p.date_of_birth &&
                    `(${moment(p.date_of_birth).format("DD/MM/YYYY")})`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => setAddModalVisible(false)}
                style={{ borderRadius: 6 }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ borderRadius: 6 }}
              >
                Thêm vào danh sách
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ============================================ */}
      {/* MODAL THÊM/SỬA BỆNH NHÂN */}
      {/* ============================================ */}
      <Modal
        title={"Thêm bệnh nhân mới"}
        open={openAddPatient}
        onCancel={() => {
          setOpenAddPatient(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        maskClosable={false}
      >
        <Form
          form={formAddPatient}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Họ tên"
                rules={[
                  { required: true, message: "Vui lòng nhập họ tên!" },
                  { min: 2, message: "Họ tên phải có ít nhất 2 ký tự!" },
                  { max: 100, message: "Họ tên không được quá 100 ký tự!" },
                  {
                    pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
                    message: "Họ tên chỉ được chứa chữ cái và khoảng trắng!",
                  },
                ]}
              >
                <Input placeholder="Nhập họ tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[
                  { required: true, message: "Vui lòng chọn giới tính!" },
                ]}
              >
                <Select placeholder="Chọn giới tính">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date_of_birth"
                label="Năm sinh"
                rules={[
                  { required: true, message: "Vui lòng chọn năm sinh!" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();

                      const today = moment().endOf("day");

                      if (value.isAfter(today)) {
                        return Promise.reject(
                          "Ngày sinh không được lớn hơn ngày hiện tại!"
                        );
                      }

                      if (value.isBefore(moment("1900-01-01"))) {
                        return Promise.reject("Năm sinh không hợp lệ!");
                      }

                      const age = moment().diff(value, "years");
                      if (age > 150) {
                        return Promise.reject("Tuổi không hợp lệ!");
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  placeholder="Chọn ngày sinh"
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  disabledDate={(current) => {
                    // Disable tất cả ngày trong tương lai
                    return current && current > moment().endOf("day");
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ!",
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email (Nếu có)"
            rules={[
              {
                type: "email",
                message: "Email không hợp lệ",
              },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ max: 300, message: "Địa chỉ không được quá 500 ký tự!" }]}
          >
            <Input.TextArea placeholder="Nhập địa chỉ" rows={3} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setOpenAddPatient(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: "#0e1182ff",
                  border: "none",
                }}
              >
                {"Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {modalVisible && (
        <ConfirmInvoiceModal
          isAtAppointmentList={true}
          onCreateINV={() => handleCreateInvoice(record)}
          onClose={() => setModalVisible(false)}
          appointmentData={record}
        />
      )}

      <style jsx>{`
        .table-row-hover:hover {
          background-color: #fafafa !important;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default AppointmentManagement;
