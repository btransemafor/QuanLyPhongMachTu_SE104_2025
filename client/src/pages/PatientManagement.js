import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Statistic,
  Tooltip,
  Switch,
} from "antd";
import {
  InboxOutlined,
  PlusCircleOutlined,
  UndoOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  UserAddOutlined,
  DeleteOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import styles from "../pages/PatientManagement/Patient.module.css";

import { patientsAPI, appointmentsAPI } from "../services/api";
import moment from "moment";
import ColumnVisibilityDropdown from "../components/ColumnSetting";
import useColumnVisibility from "../components/hooks/useColumnVisibility";
import FileDropdown from "../components/FileDropdown";
import PatientHistoryDrawer from "../pages/PatientManagement/PatientHistoryDrawer";
import NotificationModal from "../components/NotificationModal";
import { useNavigate } from "react-router-dom";
import { CircleCheck, CircleX } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
const { Search } = Input;
const { Option } = Select;

// ============================================
// COMPONENT CHÍNH
// ============================================
const PatientManagement = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // --- Danh sách bệnh nhân ---
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Phân trang ---
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- Modal thêm/sửa bệnh nhân ---
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form] = Form.useForm();

  // --- Thống kê hôm nay ---
  const [todayStats, setTodayStats] = useState({
    total_appointments: 0,
    waiting_count: 0,
    examined_count: 0,
    completed_count: 0,
  });

  // --- Drawer lịch sử bệnh nhân ---
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // --- Modal xóa/lưu trữ ---
  const [visibleModalRelation, setVisibleModalRelation] = useState({
    status: false,
    id: null,
  });
  const [isLinked, setLinked] = useState(null);

  // --- Modal filter ---
  const [openFilterModal, setOpenFilterModal] = useState(false);

  // --- Filters ---
  const [filters, setFilters] = useState({
    search: "",
    gender: {
      male: true,
      female: true,
      all: true,
    },
    isArchived: undefined,
  });

  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const {toast} = useToast(); 

  // ============================================
  // FETCH DATA KHI FILTERS THAY ĐỔI
  // ============================================
  useEffect(() => {
    fetchPatients();
  }, [
    pagination.current,
    pagination.pageSize,
    filters.search,
    filters.gender.male,
    filters.gender.female,
    filters.gender.all,
    filters.isArchived,
    filterStatus
  ]);

  useEffect(() => {
    fetchTodayStats();
  }, []);

  /**
   * Lấy danh sách bệnh nhân với filters
   */
  const fetchPatients = async () => {
    try {
      setLoading(true);
      console.log("FETCHED: ");

      // Xác định gender cần gửi lên backend
      const genderParam = getGenderParam();
      let isArchived;

      if (filterStatus === "active") isArchived = false;
      if (filterStatus === "inactive") isArchived = true;
      console.log("param:", isArchived);

      const response = await patientsAPI.getPatients({
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search.trim() || undefined,
        gender: genderParam,
        isArchived: isArchived,
      });

      if (response.data.success) {
        setPatients(response.data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination?.totalItems || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Không thể tải danh sách bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lấy thống kê lịch khám hôm nay
   */
  const fetchTodayStats = async () => {
    try {
      const response = await appointmentsAPI.getDailyAppointments({
        date: moment().format("YYYY-MM-DD"),
      });

      if (response.data.success) {
        const appointments = response.data.data;
        const stats = {
          total_appointments: appointments.length,
          waiting_count: appointments.filter((apt) => apt.status === "waiting")
            .length,
          examined_count: appointments.filter(
            (apt) => apt.status === "examined"
          ).length,
          completed_count: appointments.filter(
            (apt) => apt.status === "completed"
          ).length,
        };
        setTodayStats(stats);
      }
    } catch (error) {
      console.error("Error fetching today stats:", error);
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Xác định gender param gửi lên backend
   * @returns {Array|undefined} Mảng gender hoặc undefined
   */
  const getGenderParam = () => {
    const { male, female, all } = filters.gender;

    // Case 1: Chọn "Tất cả" hoặc chọn cả Nam + Nữ → không filter
    if (all || (male && female)) {
      return undefined;
    }

    // Case 2: Chọn một hoặc cả hai (nhưng không phải "Tất cả")
    const selectedGenders = [];
    if (male) selectedGenders.push("Nam");
    if (female) selectedGenders.push("Nữ");

    // Case 3: Không chọn gì → trả về mảng rỗng (backend sẽ không trả về gì)
    return selectedGenders.length > 0 ? selectedGenders : [];
  };

  /**
   * Xử lý thay đổi checkbox gender
   */
  const handleGenderChange = (key) => {
    setFilters((prev) => {
      const current = prev.gender;
      let updated;

      if (key === "all") {
        // Toggle "Tất cả"
        const checked = !current.all;
        updated = { male: checked, female: checked, all: checked };
      } else {
        // Toggle Nam/Nữ
        updated = {
          ...current,
          [key]: !current[key],
        };
        // Tự động cập nhật "Tất cả"
        updated.all = updated.male && updated.female;
      }

      return { ...prev, gender: updated };
    });

    // Reset về trang 1 khi filter
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  /**
   * Xử lý tìm kiếm
   */
  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  /**
   * Xử lý phân trang
   */
  const handleTableChange = (page, pageSize) => {
    setPagination({
      current: page,
      pageSize: pageSize,
      total: pagination.total,
    });
  };

  /**
   * Mở modal thêm bệnh nhân
   */
  const handleAddPatient = () => {
    setEditingPatient(null);
    form.resetFields();
    setModalVisible(true);
  };

  /**
   * Mở modal sửa bệnh nhân
   */
  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    form.setFieldsValue({
      ...patient,
      date_of_birth: patient.date_of_birth
        ? dayjs(patient.date_of_birth)
        : null,
    });
    setModalVisible(true);
  };

  /**
   * Xử lý xóa bệnh nhân
   */
  const handleDeletePatient = async (patient_id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa bản ghi này?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await patientsAPI.handleDelete(patient_id);
          if (response.data.success) {
            toast.success('Xóa thành công!')
            fetchPatients();
          } else {
            toast.warning("Không thể xóa bản ghi này vì đang được sử dụng!")
          }
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message || "Không thể xóa bản ghi";

          toast.warning({
            content: (
              <div className="message-underline-wrapper">
                <p className="font-semibold text-sm text-gray-800">
                  {errorMessage}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Hãy vô hiệu hóa thay vì xóa
                </p>

                <span className="message-underline"></span>
              </div>
            ),
            duration: 2,
          });
        }
      },
    });
  };

  /// Xử lý bỏ lưu trữ - chỉ áp dụng cho admin mới sửa được .
  const handleRestorePatient = async (patient_id) => {
    try {
      console.log("Tiến hành bỏ lưu trữ bệnh nhân:", patient_id);

      const res = await patientsAPI.handleUnArchive(patient_id, {
        isArchived: false,
      });

      if (res.data.success) {
        console.log("Bệnh nhân đã được bỏ lưu trữ:", res.data.data);
        toast.success("Bệnh nhân đã được bỏ lưu trữ");

        // Nếu đang ở tab 'Đã lưu trữ', xóa khỏi danh sách
        setPatients((prev) => prev.filter((p) => p.patient_id !== patient_id));
      }
    } catch (e) {
      if (e?.response?.status === 403) {
        return toast.warning("Bạn không có quyền thực hiện thao tác này");
      }
      //  Lỗi khác
      toast.error("Không thể bỏ lưu trữ bệnh nhân");
      console.error("Error:", e);
    }
  };

  /**
   * Lưu trữ bệnh nhân thay vì xóa
   */
  const handleArchivePatient = async (id) => {
    try {
      const res = await patientsAPI.archivePatient(id);
      if (res.data.success) {
        toast.success("Đã lưu trữ bệnh nhân");
        // setPatients((prev) => prev.filter((p) => p.patient_id !== id));
        fetchPatients();
        setVisibleModalRelation({ status: false, id: null });
      }
    } catch (error) {
      console.error("Error archiving patient:", error);
      toast.error("Không thể lưu trữ bệnh nhân");
    }
  };

  /**
   * Thêm bệnh nhân vào danh sách khám hôm nay
   */
  const handleAddToAppointment = async (patient) => {
    try {
      const response = await appointmentsAPI.addAppointment({
        patient_id: patient.patient_id,
        appointment_date: moment().format("YYYY-MM-DD"),
      });

      if (response.data.success) {
        toast.success("Đã thêm bệnh nhân vào danh sách khám hôm nay");
        fetchTodayStats();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error adding to appointment:", error);
      toast.error(
        error.response?.data?.message || "Không thể thêm vào danh sách khám"
      );
    }
  };

  /**
   * Submit form thêm/sửa bệnh nhân
   */
  const handleSubmit = async (values) => {
    try {
      const patientData = {
        ...values,
        date_of_birth: values.date_of_birth.format("YYYY-MM-DD"),
      };

      let response;
      if (editingPatient) {
        response = await patientsAPI.updatePatient(
          editingPatient.patient_id,
          patientData
        );
      } else {
        response = await patientsAPI.createPatient(patientData);
      }

      if (response.data.success) {
        toast.success(
          editingPatient
            ? "Cập nhật bệnh nhân thành công!"
            : "Thêm bệnh nhân thành công!"
        );
        setModalVisible(false);
        form.resetFields();
        fetchPatients();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("❌ Error saving patient:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi lưu bệnh nhân"
      );
    }
  };

  /**
   * Xử lý click vào row → mở drawer lịch sử
   */
  const handleRowClick = (record) => {
    setSelectedPatientId(record.patient_id);
    setDrawerVisible(true);
  };

  // ============================================
  // TABLE COLUMNS DEFINITION
  // ============================================
  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 50,
      align: "center",
      defaultVisible: true,
    },

    {
      title: "Họ tên",
      dataIndex: "full_name",
      key: "full_name",
      width: 140,
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
      defaultVisible: true,
    },

    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      width: 80,
      render: (gender) => (
        <Tag color={gender === "Nam" ? "blue" : "pink"}>{gender}</Tag>
      ),
      defaultVisible: true,
    },

    {
      title: "Năm sinh",
      dataIndex: "date_of_birth",
      key: "date_of_birth",
      width: 100,
      render: (date) => (date ? moment(date).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) =>
        moment(a.date_of_birth).valueOf() - moment(b.date_of_birth).valueOf(),
      defaultVisible: true,
    },

    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 95,
      defaultVisible: true,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      /*  ellipsis: true, */
      width: 140,
      defaultVisible: true,
    },

    {
      title: "email",
      dataIndex: "email",
      key: "email",
      width: 90,
      defaultVisible: false,
    },

    {
      title: "Ngày tái khám",
      dataIndex: "revisit_date",
      key: "revisit_date",
      width: 100,
      render: (date) =>
        date ? moment(date).format("DD/MM/YYYY") : <center>-</center>,
      sorter: (a, b) =>
        moment(a.revisit_date).valueOf() - moment(b.revisit_date).valueOf(),
      defaultVisible: false,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm:ss"),
      sorter: (a, b) =>
        moment(a.created_at).valueOf() - moment(b.created_at).valueOf(),
      defaultVisible: false,
    },
    {
      title: "Kích hoạt",
      dataIndex: "isArchived",
      key: "isArchived",
      width: 80,
      render: (_, record) => {
        return !record.isArchived ? (
          <CircleCheck color="green" size={20} />
        ) : (
          <CircleX color="red" size={20} />
        );
      },

      defaultVisible: true,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            style={{
              background: "#0e1182ff",
              border: "none",
            }}
            icon={<UserAddOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToAppointment(record);
            }}
          >
            Thêm khám
          </Button>

          <Tooltip title="Sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEditPatient(record);
              }}
            />
          </Tooltip>

          <div onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Xóa">
              {" "}
              <Button
                size="small"
                icon={<DeleteOutlined />}
                danger
                onClick={() => {
                  handleDeletePatient(record.patient_id);
                }}
              />
            </Tooltip>

            <Tooltip title={record.isArchived ? "Khôi phục" : "Lưu trữ"}>
              <Button
                size="small"
                icon={record.isArchived ? <UndoOutlined /> : <InboxOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  record.isArchived
                    ? handleRestorePatient(record.patient_id)
                    : handleArchivePatient(record.patient_id);
                }}
                style={{ marginLeft: 10 }}
              />
            </Tooltip>
          </div>
        </Space>
      ),
    },
  ];

  // Hook quản lý hiển thị cột
  const { visibleColumns, setVisibleColumns, filteredColumns, resetColumns } =
    useColumnVisibility(columns);

  // ============================================
  // RENDER UI
  // ============================================
  return (
    <div>
      {/* ============================================ */}
      {/* HEADER & FILTERS */}
      {/* ============================================ */}
      <Card
        className="mt-0"
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            //boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            borderRadius: 8,
          }}
        >
          <Space>
            <h1 className="text-2xl font-bold">Quản lý bệnh nhân</h1>
            <FileDropdown
              isHidden={true}
              dataExport={patients}
              nameFile={`Danh_Sach_Benh_Nhan_${moment().format(
                "YYYY-MM-DD_HH-mm-ss"
              )}`}
              s
            />
          </Space>

          <Search
            placeholder="Tìm kiếm tên, số điện thoại, ... "
            allowClear
            onSearch={handleSearch}
            style={{ width: 420 }}
            prefix={<SearchOutlined className="text-gray-400" />}
            addonBefore={
              <div
                onClick={() => setOpenFilterModal(true)}
                style={{ cursor: "pointer" }}
              >
                <FilterOutlined className="text-grey-600 text-lg" />
              </div>
            }
            className="custom-search-with-filter"
          />

          <Select
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              //setCurrentPage(1);
              setPagination((prev) => ({
                ...prev,
                currentPage: 1,
              }));
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
              style={{
                background: "#0e1182ff",
                border: "none",
              }}
              icon={<PlusCircleOutlined />}
              onClick={handleAddPatient}
            >
              Thêm mới
            </Button>

            <ColumnVisibilityDropdown
              columns={columns}
              visibleColumns={visibleColumns}
              onVisibilityChange={setVisibleColumns}
              onReset={resetColumns}
            />
          </Space>
        </div>

        {/* ============================================ */}
        {/* GENDER FILTER CHECKBOXES */}
        {/* ============================================ */}
        <div className="flex items-center mb-4">
          {/* Checkbox Nam */}
          <label
            htmlFor="checkboxMale"
            className="flex items-center gap-2 text-base font-medium text-gray-900 cursor-pointer ml-4"
          >
            <span className="relative flex items-center">
              <input
                id="checkboxMale"
                type="checkbox"
                checked={filters.gender.male}
                onChange={() => handleGenderChange("male")}
                className="peer relative h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-gray-100 checked:border-blue-500 checked:bg-blue-500 focus:outline-none"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white ${
                  filters.gender.male ? "visible" : "invisible"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
            <span>Nam</span>
          </label>

          {/* Checkbox Nữ */}
          <label
            htmlFor="checkboxFemale"
            className="flex items-center gap-2 text-base font-medium text-gray-900 cursor-pointer ml-6"
          >
            <span className="relative flex items-center">
              <input
                id="checkboxFemale"
                type="checkbox"
                checked={filters.gender.female}
                onChange={() => handleGenderChange("female")}
                className="peer relative h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-gray-100 checked:border-red-500 checked:bg-red-500 focus:outline-none"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white ${
                  filters.gender.female ? "visible" : "invisible"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
            <span>Nữ</span>
          </label>

          {/* Checkbox Tất cả */}
          <label
            htmlFor="checkboxAll"
            className="flex items-center gap-2 text-base font-medium text-gray-900 cursor-pointer ml-6"
          >
            <span className="relative flex items-center">
              <input
                id="checkboxAll"
                type="checkbox"
                checked={filters.gender.all}
                onChange={() => handleGenderChange("all")}
                className="peer relative h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-gray-100 checked:border-gray-500 checked:bg-gray-500 focus:outline-none"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white ${
                  filters.gender.all ? "visible" : "invisible"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
            <span>Tất cả</span>
          </label>
        </div>

        <hr className="border-t border-gray-300 my-4" />

        {/* ============================================ */}
        {/* TABLE */}
        {/* ============================================ */}
        <Table
          columns={filteredColumns}
          dataSource={patients}
          loading={loading}
          rowKey="patient_id"
          onRow={(record) => ({
            onClick: () => {
              console.log("ROW RECORD:", record);
              //navigate(`/medical-history/${record.patient_id}`);
              handleRowClick(record);
            },
            style: { cursor: "pointer" },
          })}
          rowClassName={(record) =>
            record.patient_id === selectedPatientId ? styles.selectedRow : ""
          }
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} bệnh nhân`,
            onChange: handleTableChange,
          }}
        />
      </Card>

      {/* ============================================ */}
      {/* MODAL THÊM/SỬA BỆNH NHÂN */}
      {/* ============================================ */}
      <Modal
        title={
          editingPatient ? "Sửa thông tin bệnh nhân" : "Thêm bệnh nhân mới"
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        maskClosable={false}
      >
        <Form
          form={form}
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
                  setModalVisible(false);
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
                {editingPatient ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ============================================ */}
      {/* DRAWER LỊCH SỬ BỆNH NHÂN */}
      {/* ============================================ */}
      <PatientHistoryDrawer
        patientId={selectedPatientId}
        visible={drawerVisible}
        onClose={() => {
          setSelectedPatientId(null);
          setDrawerVisible(false);
        }}
        maskClosable={false}
      />

      {/* ============================================ */}
      {/* MODAL XÁC NHẬN LƯU TRỮ */}
      {/* ============================================ */}
      {visibleModalRelation.status && (
        <NotificationModal
          nameAction="Lưu trữ"
          onClose={() => setVisibleModalRelation({ status: false, id: null })}
          text={
            <span>
              Bạn không thể xóa bệnh nhân đã{" "}
              <b className="text-red-600">liên kết</b>. Hãy lưu trữ thay vì xóa
            </span>
          }
          action={() => handleArchivePatient(visibleModalRelation.id)}
        />
      )}

      {/* ============================================ */}
      {/* MODAL TÙY CHỌN HIỂN THỊ */}
      {/* ============================================ */}
      <Modal
        title={
          <span className="text-lg font-semibold text-gray-700">
            Tuỳ chọn hiển thị
          </span>
        }
        open={openFilterModal}
        onCancel={() => setOpenFilterModal(false)}
        footer={null}
        className="custom-filter-modal"
        centered
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">
              Hiển thị bệnh nhân đã lưu trữ
            </span>
            <Switch
              checked={filters.isArchived}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, isArchived: value }));
                //  setPagination((prev) => ({ ...prev, current: 1 })); // Thêm dòng này
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button onClick={() => setOpenFilterModal(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={() => {
                setPagination((prev) => ({ ...prev, current: 1 }));
                setOpenFilterModal(false);
              }}
            >
              Áp dụng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientManagement;
