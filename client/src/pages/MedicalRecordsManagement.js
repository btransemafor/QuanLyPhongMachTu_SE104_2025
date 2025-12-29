import React, { useState, useEffect } from "react";

import {
  Card,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  message,
  Modal,
  Descriptions,
  Spin,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  ClearOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  medicalRecordsAPI,
  patientsAPI,
  diseasesAPI,
  usersAPI,
} from "../services/api";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import FileDropdown from "../components/FileDropdown";
import useColumnVisibility from "../components/hooks/useColumnVisibility";
import ColumnVisibilityDropdown from "../components/ColumnSetting";
import { useAuth } from "../contexts/AuthContext";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const MedicalRecordsManagement = () => {
  const [loading, setLoading] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  /*   const [filteredRecords, setFilteredRecords] = useState([]); */
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [diseases, setDiseases] = useState(null);
  const [filters, setFilters] = useState({
    search: null,
    patientId: null,
    dateRange: null,
    status: null,
    disease: null,
  });
  const [isRefresh, setIsRefresh] = useState(false);

  const [stats, setStats] = useState({
    total: 0, // Lấy từ backend
    completed: 0,
    pending: 0,
    today: 0,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  });

  // Thêm state riêng
  const [kpi, setKpi] = useState({
    total: 0,
    today: 0,
    completed: 0,
    pending: 0,
    completed_ratio: "0/0",
    pending_ratio: "0/0",
  });

  // Gọi riêng KPI
  useEffect(() => {
    const fetchKpi = async () => {
      try {
        const res = await medicalRecordsAPI.getMedicalRecordSummary(); // API mới
        if (res.data.success) {
          setKpi(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi tải KPI");
      }
    };

    fetchKpi();
    const interval = setInterval(fetchKpi, 30000); // tự động cập nhật mỗi 30s
    return () => clearInterval(interval);
  }, [isRefresh]);

  useEffect(() => {
    fetchMedicalRecords();
  }, [pagination.current, pagination.pageSize, filters]);

  // Chỉ chạy 1 lần khi mount
  useEffect(() => {
    fetchPatients();
    fetchDiseases();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);

      // Chuẩn bị params để gửi lên backend
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };

      // Thêm filters vào params nếu có
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.patientId) {
        params.patientId = filters.patientId;
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format("YYYY-MM-DD");
        params.endDate = filters.dateRange[1].format("YYYY-MM-DD");
      }
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.disease) {
        params.disease = filters.disease;
      }

      const response = await medicalRecordsAPI.getAll(params);

      if (response.data.success) {
        setMedicalRecords(response.data.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total || 0,
        }));
        console.log("Thong ke: ", stats);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
      message.error("Không thể tải danh sách hồ sơ bệnh án");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientsAPI.getPatients({ limit: 100 });
      if (response.data.success) {
        setPatients(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchDiseases = async () => {
    try {
      setLoading(true);
      const response = await diseasesAPI.getDiseases();
      const data = response.data.data;
      setDiseases(data);
      const options = data.map((item) => ({
        label: `${item.disease_id} - ${item.disease_name}`,
        value: `${item.disease_id}`,
      }));
      // setDiseaseOptions(options);
    } catch (error) {
      message.error("Không thể tải danh sách bệnh");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Reset về trang 1 khi filter thay đổi
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: null,
      patientId: null,
      dateRange: null,
      status: null,
      disease: null,
    });
    // Reset về trang 1
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleDelete = (medical_record_id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: (
        <span>
          Bạn có chắc muốn xóa hồ sơ bệnh án có mã phiếu là{" "}
          <strong>{medical_record_id}</strong> không?
        </span>
      ),
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      closable: true,
      onOk: async () => {
        try {
          setLoading(true);
          const response = await medicalRecordsAPI.deleteMedicalRecord(
            medical_record_id
          );
          if (response.data.success) {
            message.success("Xóa hồ sơ bệnh án thành công");
            fetchMedicalRecords(); // Tải lại danh sách sau khi xóa
            setIsRefresh(!isRefresh);
          } else {
            message.error("Xóa hồ sơ bệnh án thất bại");
          }
        } catch (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            message.error(error.response.data.message);
          } else {
            message.error("Xóa hồ sơ bệnh án thất bại");
          }

          console.error("Error deleting medical record:", error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      defaultVisible: true,
    },
    {
      title: "Mã hồ sơ",
      dataIndex: "medical_record_id",
      key: "id",
      width: 90,
      render: (text) => (
        <Text strong style={{ color: "#1890ff" }}>
          #{text}
        </Text>
      ),
      defaultVisible: true,
    },
    {
      title: "Bệnh nhân",
      dataIndex: "patient_name",
      key: "patient_name",
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
      defaultVisible: true,
    },
    {
      title: "Triệu chứng",
      dataIndex: "symptoms",
      key: "symptoms",
      width: 150,
      ellipsis: true,
      render: (text) => (
        <Text style={{ fontSize: 13 }}>
          {text ? (
            text.length > 50 ? (
              `${text.substring(0, 50)}...`
            ) : (
              text
            )
          ) : (
            <Text type="secondary">Chưa có thông tin</Text>
          )}
        </Text>
      ),
      defaultVisible: true,
    },
    {
      title: "Chẩn đoán",
      dataIndex: "diseases",
      key: "diseases",
      width: 200,
      render: (text) => {
        if (!text || text.length === 0)
          return <Text type="secondary">Chưa chẩn đoán</Text>;

        const diseasesArray = Array.isArray(text) ? text : text.split(",");

        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {diseasesArray.slice(0, 2).map((disease, index) => (
              <Tag
                color="blue"
                key={index}
                style={{ margin: 0, borderRadius: 4 }}
              >
                {disease.disease_name || disease}
              </Tag>
            ))}
            {diseasesArray.length > 2 && (
              <Tag color="default" style={{ margin: 0, borderRadius: 4 }}>
                +{diseasesArray.length - 2}
              </Tag>
            )}
          </div>
        );
      },
      defaultVisible: true,
    },
    {
      title: "Ngày khám",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date) => (
        <div>
          <div style={{ fontWeight: 500, color: "#262626" }}>
            <CalendarOutlined style={{ marginRight: 6, color: "#52c41a" }} />
            {moment(date).format("DD/MM/YYYY")}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {moment(date).format("HH:mm")}
          </Text>
        </div>
      ),
      sorter: (a, b) =>
        moment(a.created_at).unix() - moment(b.created_at).unix(),
      defaultVisible: true,
    },
    {
      title: "Bác sĩ",
      dataIndex: "doctor_name",
      key: "doctor_name",
      width: 150,
      render: (text) => (
        <Text style={{ fontWeight: 400 }}>
          {text || <Text type="secondary">Chưa xác định</Text>}
        </Text>
      ),
      defaultVisible: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status_mr",
      key: "status_mr",
      width: 150,
      render: (text) => {
        let color = "";
        let label = "";

        switch (text) {
          case "completed":
            color = "green";
            label = "Hoàn thành";
            break;

          case "examined":
            color = "blue";
            label = "Đã khám";
            break;

          default:
            color = "default";
            label = "Chưa xác định";
        }

        return (
          <Tag color={color} style={{ fontWeight: 400 }}>
            {label}
          </Tag>
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
      defaultVisible: false,
    },

    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => {
        const isCompleted = record.status_mr?.toLowerCase() === "completed";

        // Owner = chính bác sĩ tạo bệnh án
        const isOwner = String(record.doctor_id) === String(user.id);

        // Admin = sửa được hết
        const isAdmin = user.role_name?.toLowerCase() === "admin";

        console.log("user", user);

        console.log("Doctor:", record.doctor_id, typeof record.doctor_id);
        console.log("User:", user.id, typeof user.id);
        console.log("Is Owner =>", isOwner);

        return (
          <Space>
            {/* Luôn hiển thị */}
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

            {/* Chỉ sửa/xóa khi:
            - chưa completed
            - và (owner hoặc admin) 
        */}
            {!isCompleted && (isOwner || isAdmin) && (
              <>
                <Tooltip title="Sửa">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() =>
                      navigate(
                        `/medical-records/edit/${record.medical_record_id}`
                      )
                    }
                  />
                </Tooltip>

                <Tooltip title="Xóa">
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record.medical_record_id)}
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  // Hook quản lý hiển thị cột
  const { visibleColumns, setVisibleColumns, filteredColumns, resetColumns } =
    useColumnVisibility(columns);

  return (
    <div style={{ padding: "5px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Header */}

      {/* Statistics Cards */}

      {/* Filters */}
      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex justify-between">
          <Space>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-1">
              Quản lý Hồ Sơ Bệnh Án
            </h1>
            <FileDropdown
              dataExport={medicalRecords}
              nameFile={`Danh_Sach_Ho_So_Benh_Nhan_${moment().format(
                "YYYY-MM-DD_HH-mm-ss"
              )}`}
            />
          </Space>

          <ColumnVisibilityDropdown
            columns={columns}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
            onReset={resetColumns}
          />
        </div>
        <Text className="text-gray-600 mt-3 ml-1 mb-5">
          Quản lý và theo dõi hồ sơ khám chữa bệnh
        </Text>

        <Row gutter={16} style={{ marginBottom: 24, marginTop: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Tổng hồ sơ</p>
                  <p className="text-4xl font-bold mt-2">{kpi.total}</p>
                </div>
                {/*   <CalendarOutlined  size={48} className="opacity-80" />  */}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Hôm nay</p>
                  <p className="text-4xl font-bold mt-2">{kpi.today}</p>
                </div>
                <CalendarOutlined size={48} className="opacity-80" />
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Hoành thành</p>
                  <p className="text-4xl font-bold mt-2">
                    {kpi.completed_ratio}
                  </p>
                </div>
                {/*   <CalendarOutlined  size={48} className="opacity-80" />  */}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="bg-gradient-to-br from-purple-500 to-purple-900 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Chờ xử lý</p>
                  <p className="text-4xl font-bold mt-2">{kpi.pending_ratio}</p>
                </div>
                {/*   <CalendarOutlined  size={48} className="opacity-80" />  */}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <Space wrap className="w-full mb-8 mt-3">
          <Search
            placeholder="Tìm kiếm theo tên ..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            style={{ width: 320 }}
            allowClear
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          />

          <Select
            placeholder="Chọn bệnh nhân"
            value={filters.patientId}
            onChange={(value) => handleFilterChange("patientId", value)}
            style={{ width: 200 }}
            allowClear
            suffixIcon={<UserOutlined />}
          >
            {patients.map((patient) => (
              <Option key={patient.patient_id} value={patient.patient_id}>
                {patient.id} - {patient.full_name}
              </Option>
            ))}
          </Select>

          <RangePicker
            placeholder={["Từ ngày", "Đến ngày"]}
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange("dateRange", dates)}
            format="DD/MM/YYYY"
            style={{ borderRadius: 6 }}
          />

          <Select
            placeholder="Trạng thái"
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="completed">
              <Tag color="green" style={{ margin: 0 }}>
                Hoàn thành
              </Tag>
            </Option>
            <Option value="examined">
              <Tag color="blue" style={{ margin: 0 }}>
                Đã khám
              </Tag>
            </Option>
          </Select>

          {/*     Filter theo loại bệnh  */}

          <Select
            placeholder="Loại bệnh"
            value={filters.disease}
            onChange={(value) => handleFilterChange("disease", value)}
            style={{ width: 160 }}
            allowClear
          >
            {diseases?.map((disease) => (
              <Option key={disease.disease_id} value={disease.disease_id}>
                <Tag color="blue" style={{ margin: 0 }}>
                  {disease.disease_name}
                </Tag>
              </Option>
            ))}
          </Select>

          <Button
            icon={<ClearOutlined />}
            onClick={clearFilters}
            style={{ borderRadius: 6 }}
          >
            Xóa bộ lọc
          </Button>
        </Space>

        <Table
          columns={filteredColumns}
          dataSource={medicalRecords}
          rowKey="medical_record_id"
          loading={loading}
          pagination={{
            ...pagination,
            position: ["bottomCenter"],
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["10", "15", "25", "50"],
            showTotal: (total, range) => (
              <span className="text-gray-600">
                Hiển thị{" "}
                <strong>
                  {range[0]}-{range[1]}
                </strong>{" "}
                trong tổng <strong>{total}</strong> hồ sơ
              </span>
            ),
          }}
          onChange={(p) => {
            setPagination({
              current: p.current,
              pageSize: p.pageSize,
              total: pagination.total,
            });
          }}
          scroll={{ x: 1200 }}
          style={{
            borderRadius: 8,
          }}
          rowClassName={(record) => {
            const isOwner = String(record.doctor_id) === String(user.id);
            return isOwner ? "owner-row" : null;
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: "#1890ff", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              Chi tiết Hồ Sơ Bệnh Án
            </span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setDetailModalVisible(false)}
            style={{ borderRadius: 6 }}
          >
            Đóng
          </Button>,
        ]}
        width={900}
        style={{ top: 20 }}
      >
        {selectedRecord && (
          <div>
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              size="middle"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Mã hồ sơ" span={1}>
                <Text strong style={{ color: "#1890ff" }}>
                  #{selectedRecord.medical_record_id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Bệnh nhân" span={1}>
                <Text strong>
                  {selectedRecord.patient_name} (ID: {selectedRecord.patient_id}
                  )
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Bác sĩ điều trị" span={1}>
                {selectedRecord.doctor_name || (
                  <Text type="secondary">Chưa xác định</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày khám" span={1}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {moment(selectedRecord.created_at).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Triệu chứng" span={2}>
                {selectedRecord.symptoms || (
                  <Text type="secondary">Không có thông tin</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Chẩn đoán" span={2}>
                {selectedRecord.diagnosis || (
                  <Text type="secondary">Chưa chẩn đoán</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {selectedRecord.notes || (
                  <Text type="secondary">Không có ghi chú</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={2}>
                <Tag
                  color={
                    selectedRecord.status === "completed"
                      ? "green"
                      : selectedRecord.status === "examined"
                      ? "blue"
                      : "red"
                  }
                  style={{ fontSize: 13, padding: "4px 12px" }}
                >
                  {selectedRecord.status === "completed"
                    ? "Hoàn thành"
                    : selectedRecord.status === "examined"
                    ? "Đã khám"
                    : null}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedRecord.prescriptions &&
              selectedRecord.prescriptions.length > 0 && (
                <div
                  style={{
                    marginTop: 24,
                    padding: 16,
                    background: "#fafafa",
                    borderRadius: 8,
                  }}
                >
                  <Title level={5} style={{ marginBottom: 12 }}>
                    <MedicineBoxOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    Đơn thuốc
                  </Title>
                  <Table
                    dataSource={selectedRecord.prescriptions}
                    columns={[
                      {
                        title: "Tên thuốc",
                        dataIndex: "medicine_name",
                        key: "medicine_name",
                        render: (text) => <Text strong>{text}</Text>,
                      },
                      {
                        title: "Số lượng",
                        dataIndex: "quantity",
                        key: "quantity",
                        width: 100,
                        align: "center",
                      },
                      {
                        title: "Đơn vị",
                        dataIndex: "unit",
                        key: "unit",
                        width: 100,
                        align: "center",
                      },
                      {
                        title: "Cách dùng",
                        dataIndex: "usage_method",
                        key: "usage_method",
                      },
                    ]}
                    pagination={false}
                    size="small"
                    bordered
                  />
                </div>
              )}
          </div>
        )}
      </Modal>

      <style jsx>{`
        .table-row-hover:hover {
          background-color: #fafafa !important;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default MedicalRecordsManagement;
