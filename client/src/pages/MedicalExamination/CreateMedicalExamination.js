import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PlusOutlined,
  HeartOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Table,
  Space,
  message,
  Divider,
  Alert,
  Radio,
  Modal,
  InputNumber,
  Switch,
} from "antd";
import dayjs from "dayjs";
import {
  patientsAPI,
  diseasesAPI,
  medicinesAPI,
  settingsAPI,
  usageMethodsAPI,
  medicalRecordsAPI,
  appointmentsAPI,
} from "../../services/api";
import "./BatchSelectionModal.css";
import { useParams, useNavigate } from "react-router-dom";
import BatchSelectionModal from "./BatchSelectionModal";
import UsageMethodSearchModal from "./ModalSearchUM";
import { useAuth } from "../../contexts/AuthContext";
import moment from "moment";
import MedicineSelectCell from "./MedicineSelectCell";
import PatientHistoryDrawer from "../PatientManagement/PatientHistoryDrawer";
import MedicineSearchModal from "../../components/MedicineSearchModal";
import { useToast } from "../../contexts/ToastContext";
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const calAmount = (batches, sellingPriceRatio) => {
  return batches.reduce((total, batch) => {
    console.log("ITEM", batch, batch.quantity);
    const qty = batch.quantity || 0; // số lượng đã chọn
    return total + batch.import_price * qty * sellingPriceRatio;
  }, 0);
};

const CreateMedicalExamination = () => {
  const { appointmentId } = useParams();
  const [form] = Form.useForm();
  const [formCreateDisease] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [diseaseOptions, setDiseaseOptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [sellingPriceRatio, setSellingPriceRatio] = useState(1);
  const [selectedCurrentMedicine, setSelectedCurrentMedicine] = useState(null);
  const [usageMethods, setUsageMethods] = useState(null);
  const [usageMethodOptions, setUsageMethodOptions] = useState(null);
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempDisease, setTempDisease] = useState("");
  const [tempSeverity, setTempSeverity] = useState("Trung bình");
  const [tempNote, setTempNote] = useState("");
  const [resultDiagnoses, setDiagnoses] = useState([]);
  const [editingDiagnosisIndex, setEditingDiagnosisIndex] = useState(null);
  const [appointment, setAppointment] = useState(null); // Nếu người dùng nhấn từ chổ khám bệnh trong danh sách
  const [isOpenNewDiseaseModal, setOpenAddDisease] = useState(false);
  //setOpenAddDisease(true)
  const [visibleUMSearchModal, setvisibleUMSearchModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  // --- Drawer lịch sử bệnh nhân ---
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const [openSearchMedicine, setOpenSearchMedicine] = useState(false);

  const handleRowClick = (record) => {
    setSelectedPatientId(record.patient_id);
    setDrawerVisible(true);
  };
  const [selectedMedicineFromModal, setSelectedMedicineModal] = useState(null);

  const [is_primary, setTempPrimary] = useState(false);

  // Trong component chính CreateMedicalExamination
  const [batchModal, setBatchModal] = useState({
    open: false,
    medicine: null,
    rowId: null,
    requiredQty: 0,
    initialSelectedBatches: null,
  });

  const SEVERITY = [
    { label: "Nhẹ", value: "Nhẹ", color: "#52c41a" },
    { label: "Trung bình", value: "Trung bình", color: "#faad14" },
    { label: "Nặng", value: "Nặng", color: "#ff4d4f" },
    { label: "Rất nặng", value: "Rất nặng", color: "#a8071a" },
  ];

  const {toast} = useToast()

  useEffect(() => {
    fetchPatients();
    fetchDiseases();
    fetchMedicines();
    fetchSystems();
    fetchUsageMethods();
  }, [searchText]);

  useEffect(() => {
    fetchDiseases();
  }, [isModalOpen]);

  useEffect(() => {
    fetchSystems();
  }, [medications]);

  useEffect(() => {
    if (!appointmentId) return;
    fetchAppointmentData();
  }, [appointmentId]);

  useEffect(() => {
    form.setFieldsValue({
      doctor: user?.full_name || user?.username || "N/A",
    });
    updateMedicine();
  }, [usageMethods, user]);

  const fetchSystems = async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getSettings();
      if (response.data.success) {
        const data = response.data.data;
        setSellingPriceRatio(parseFloat(data.SellingPriceRatio?.value));
      }
    } catch (error) {
      toast.error("Lỗi! Fetch Tham số ");
    }
  };

  // Fetch danh sách thuốc:
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await medicinesAPI.getMedicines();
      if (response.data.success) {
        const data = response.data.data;
        setMedicines(data);

        const formatted = data.map((item) => ({
          value: item.medicine_id,
          label: `${item.medicine_id} - ${item.medicine_name}`,
        }));
        setMedicineOptions(formatted);
      }
    } catch (e) {
      toast.error("Không thể tải danh sách thuốc");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await patientsAPI.getPatients();
      if (response.data.success) {
        const data = response.data.data;
        setPatients(data);
        const formatted = data.map((item) => ({
          value: item.id,
          label: `${item.id} - ${item.full_name}`,
        }));
        setPatientOptions(formatted);
      }
    } catch (e) {
      message.error("Không thể tải danh sách bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiseases = async () => {
    try {
      setLoading(true);
      const response = await diseasesAPI.getDiseases({ search: searchText });
      if (response.data.success) {
        const data = response.data.data;
        setDiseases(data);
        const options = data.map((item) => ({
          label: `${item.disease_id} - ${item.disease_name}`,
          value: `${item.disease_id}`,
        }));
        setDiseaseOptions(options);
      }
    } catch (error) {
      message.error("Không thể tải danh sách bệnh");
    } finally {
      setLoading(false);
    }
  };

  const searchDisease = async (value) => {
    if (!value) {
      setDiseaseOptions([]);
      return;
    }

    setLoading(true);

    try {
      const res = await diseasesAPI.getDiseases({ search: value });
      const data = res.data.data;
      setDiseases(data);
      const options = data.map((item) => ({
        label: `${item.disease_id} - ${item.disease_name}`,
        value: `${item.disease_id}`,
      }));
      setDiseaseOptions(options);
    } catch (error) {
      console.log("Search error:", error);
    }

    setLoading(false);
  };

  // ===============================
  // Fetch cuộc hẹn
  // ===============================
  const fetchAppointmentData = async () => {
    try {
      setLoading(true);
      console.log("AppointmentID: ", appointmentId);

      const response = await appointmentsAPI.getDailyAppointments({
        date: moment().format("YYYY-MM-DD"),
      });

      if (response.data.success) {
        const appointmentData = response.data.data.find(
          (apt) => apt.daily_appointment_id === parseInt(appointmentId)
        );

        if (!appointmentData) {
          message.error("Không tìm thấy cuộc hẹn");
          return navigate("/appointments");
        }

        setAppointment(appointmentData);

        /*  //  Tự fill thông tin từ bệnh nhân
        onPatientChange(appointmentData.patient_id); */

        form.setFieldsValue({
          patientId: appointmentData.patient_id,
          patientName: appointmentData.full_name,
          gender: appointmentData.gender,
          dob: dayjs(appointmentData.dob),
          phone: appointmentData.phone,
          address: appointmentData.address,
        });
        setSelectedPatientId(appointmentData.patient_id);
        if (appointmentData.status !== "waiting") {
          toast.warning("Bệnh nhân này đã được khám hoặc hoàn thành");
          return navigate("/appointments");
        }
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      message.error("Không thể tải thông tin cuộc hẹn");
      navigate("/appointments");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // Khi thay đổi bệnh nhân hoặc khi load
  // =====================================
  const onPatientChange = (value) => {
    const p = patients.find((item) => item.patient_id === value);

    console.log("SO Dien Thoai, ", p.phone);

    if (p) {
      form.setFieldsValue({
        patientId: p.patient_id,
        patientName: p.full_name,
        gender: p.gender,
        dob: dayjs(p.dob),
        phone: p.phone,
        address: p.address,
      });
    }
  };

  const fetchUsageMethods = async () => {
    try {
      setLoading(true);
      const response = await usageMethodsAPI.getUsageMethods();
      if (response.data.success) {
        setUsageMethods(response.data.data);
        const data = response.data.data;
        const formatted = data.map((item) => ({
          value: item.usage_method_id,
          label: `${item.usage_method_id} - ${item.usage_method_name}`,
        }));
        setUsageMethodOptions(formatted);
      }
    } catch (error) {
      message.error("Không thể tải danh sách cách dùng");
    } finally {
      setLoading(false);
    }
  };

  const updateMedicine = useCallback((id, updatedFields) => {
    console.log("Cap nhat: ", updatedFields, id);
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedFields } : m))
    );
  }, []);

  // Hàm mở modal chọn lô
  const openBatchModal = (
    medicine,
    rowId,
    requiredQty = 1,
    initialSelectedBatches
  ) => {
    setBatchModal({
      open: true,
      medicine,
      rowId,
      requiredQty,
      initialSelectedBatches,
    });
  };

  ///  Handle reset
  const handleDeleteAll = () => {
    // Clear
    Modal.confirm({
      title: "Xác nhận xóa tất cả",
      content:
        "Bạn có chắc chắn muốn xóa ?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        setMedications([]);
      },
    });
  };

  /// Check valiate thuốc:
  const validateMedicine = (medications) => {
    // Lặp qua từng thuốc để kiểm tra
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];

      // Kiểm tra nếu medicine_id, usage_method_id bị null, quantity <=0 hoặc batches rỗng
      if (
        !med.medicine_id || // null hoặc undefined
        !med.usage_method_id || // null hoặc undefined
        med.quantity <= 0 || // số lượng <= 0
        !med.batches ||
        med.batches.length === 0 // không có batch
      ) {
        return false; // có ít nhất 1 thuốc chưa hợp lệ
      }
    }

    return true; // tất cả thuốc đều hợp lệ
  };

  const addMedication = () => {
    const newId = Date.now();
    setMedications([
      ...medications,
      {
        id: newId,
        key: newId,
        medicine_id: null,
        medicine_name: "",
        unit_name: "",
        quantity: 0,
        batches: [],
        sell_price: 0,
        usage_method_id: null,
      },
    ]);

    setSelectedCurrentMedicine(medications[medications.length - 1]);
  };

  const handleAddDiagnosis = () => {
    console.log("KQ chan doan: ", tempDisease);
    if (!tempDisease) return;

    const found = diseases.find((item) => item.disease_id == tempDisease);
    console.log("Found Disease: ", found);

    if (!found) return;
    // If editing existing diagnosis (editingDiagnosisIndex != null), update it instead of adding
    const finalValue = tempNote
      ? `${found.disease_name} (${tempSeverity}) - ${tempNote}`
      : `${found.disease_name} (${tempSeverity})`;

    if (editingDiagnosisIndex !== null && editingDiagnosisIndex >= 0) {
      setDiagnoses((prev) =>
        prev.map((d, idx) =>
          idx === editingDiagnosisIndex
            ? {
                disease: found,
                severity: tempSeverity,
                note: tempNote || "",
                is_primary: is_primary,
              }
            : d
        )
      );

      const current = form.getFieldValue("diagnoses") || [];
      const updated = [...current];
      updated[editingDiagnosisIndex] = finalValue;
      form.setFieldsValue({ diagnoses: updated });

      // Reset editing state
      setEditingDiagnosisIndex(null);
    } else {
      // Prevent duplicate by comparing disease_id + severity + note
      const exists = resultDiagnoses.some(
        (r) => r.disease?.disease_id === found.disease_id
      );
      if (exists) {
        toast.warning("Chuẩn đoán này được thêm!");
        setIsModalOpen(false);
        return;
      }

      const daChinhChua = resultDiagnoses.some((r) => r.is_primary);
      if (is_primary && daChinhChua) {
        toast.warning("Đã có chẩn đoán chính trong danh sách!");
        setIsModalOpen(false);
        return;
      }

      const newDiagnosis = {
        disease: found,
        severity: tempSeverity,
        note: tempNote || "",
        is_primary: is_primary,
      };

      setDiagnoses((prev) => [...prev, newDiagnosis]);

      const current = form.getFieldValue("diagnoses") || [];
      form.setFieldsValue({
        diagnoses:
          current.length === 0 ? [finalValue] : [...current, finalValue],
      });
    }

    // Reset modal
    setIsModalOpen(false);
    setTempDisease("");
    setTempSeverity("Trung bình");
    setTempNote("");
  };

  const openAddModal = (index) => {
    // If index is provided, open modal to edit that diagnosis
    if (typeof index === "number" && resultDiagnoses[index]) {
      const diag = resultDiagnoses[index];
      setTempDisease(diag.disease?.disease_id || "");
      setTempSeverity(diag.severity || "Trung bình");
      setTempNote(diag.note || "");
      setTempPrimary(!!diag.is_primary);
      setEditingDiagnosisIndex(index);
      setIsModalOpen(true);
      return;
    }

    // Otherwise open for adding new
    setTempDisease("");
    setTempSeverity("Trung bình");
    setTempNote("");
    setTempPrimary(false);
    setEditingDiagnosisIndex(null);
    setIsModalOpen(true);
  };

  /// Submit form lưu phiếu khám bệnh
  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log("Submitted:", { ...values, medications, resultDiagnoses });
      if (!validateMedicine(medications)) {
        toast.warning("Thông tin thuốc chưa hợp lệ");
        return;
      }

      const response = await medicalRecordsAPI.createMedicalRecord({
        ...values,
        medications,
        resultDiagnoses,
      });

      if (response.data.success) {
        toast.success(
          "Lưu phiếu khám bệnh thành công! Lễ tân sẽ tạo hóa đơn thanh toán cho bệnh nhân."
        );
        navigate("/appointments");
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error("Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const openModalWithBatches = (record) => {
    const initBatches = record.batches?.reduce((acc, item) => {
      acc[item.batch_id] = item.quantity;
      return acc;
    }, {});

    openBatchModal(
      medicines.find((m) => m.medicine_id === record.medicine_id),
      record.id,
      record.quantity,
      initBatches
    );
  };

  /// Form tạo bệnh mới
  const handleSubmitDisease = async (values) => {
    try {
      console.log("Form values:", values);
      let response;
      response = await diseasesAPI.createDisease(values);

      if (response.data.success) {
        toast.success("Thêm mới thành công!");
        setOpenAddDisease(false);
        formCreateDisease.resetFields();
        fetchDiseases();
      }
    } catch (error) {
      toast.error("Không thể lưu dữ liệu");
    }
  };

  const TOP_DISEASES = diseaseOptions.slice(0, 8);

  // Xác nhận hủy
  const cancelProcess = () => {
    Modal.confirm({
      title: "Xác nhận hủy bỏ",
      content:
        "Bạn có chắc chắn muốn hủy phiếu đang tạo ! Nó sẽ thiết lại hết dữ liệu đã nhập !",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        window.history.back();
      },
    });
  };

  // Cập nhật columns của Table kê đơn
  const medicationColumns = [
    {
      title: "Tên thuốc",
      width: 250,
      render: (_, record) => (
        <MedicineSelectCell
          record={record}
          medicines={medicines}
          medicineOptions={medicineOptions}
          updateMedicine={updateMedicine}
          setVisibleModalMedicine={() => {
            setSelectedMedicineModal(record.id);
            setOpenSearchMedicine(true);
          }}
        />
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit_name",
      width: 80,
    },
    {
      title: "Số lượng",
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity || 0}
          onChange={(val) => {
            updateMedicine(record.id, { quantity: val, batches: null });
          }}
        />
      ),
    },

    {
      title: "Cách dùng",
      width: 120,
      render: (_, record) => {
        return (
          <Select
            placeholder="Chọn cách dùng"
            value={record.usage_method_id || undefined}
            onChange={(val) =>
              updateMedicine(record.id, { usage_method_id: val })
            }
            options={usageMethodOptions}
            filterOption={(input, opt) =>
              opt.label.toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: "100%" }}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "8px 0" }} />
                <div
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    backgroundColor: "#f6ffed",
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#095e22",
                    fontWeight: 500,
                  }}
                  onMouseDown={(e) => e.preventDefault()} // Quan trọng: ngăn focus mất
                  onClick={() => {
                    //  updateMedicine(record.id, {usage_method_id: record.usage_method_id });
                    setvisibleUMSearchModal(true);
                  }}
                >
                  <PlusOutlined style={{ color: "#095e22" }} />
                  Tìm kiếm thêm cách dùng...
                </div>
              </>
            )}
          />
        );
      },
    },

    {
      title: "Lô đã chọn",
      width: 220,
      render: (_, record) => {
        if (!record.batches?.length)
          return (
            <Select
              placeholder="Chọn lô"
              style={{ cursor: "pointer" }}
              onClick={() => openModalWithBatches(record)}
            >
              Chọn lô
            </Select>
          );

        return (
          <div
            className="batch-box"
            onClick={() => openModalWithBatches(record)}
          >
            {record.batches.map((b) => (
              <div className="batch-row" key={b.batch_id}>
                <Tag color="blue">{b.batch_code}</Tag>
                <span className="batch-qty">{b.quantity}</span>
              </div>
            ))}
          </div>
        );
      },
    },

    {
      title: "Giá nhập",
      width: 140,
      render: (_, record) => {
        if (!record.batches?.length)
          return (
            <Select
              placeholder="Chọn lô ..."
              style={{ cursor: "pointer" }}
              onClick={() => openModalWithBatches(record)}
            >
              Chọn lô
            </Select>
          );

        return (
          <div
            className="batch-box"
            onClick={() => openModalWithBatches(record)}
          >
            {record.batches.map((b) => (
              <div className="batch-row" key={b.batch_id}>
                <span>
                  {b.import_price.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })}
                </span>
              </div>
            ))}
          </div>
        );
      },
    },

    {
      title: "Giá bán",
      dataIndex: "sell_price",
      width: 120,
      render: (_, record) => {
        if (!record.batches?.length) return <span>-</span>;

        return (
          <div
            className="batch-box"
            onClick={() => openModalWithBatches(record)}
          >
            {record.batches.map((b) => (
              <div className="batch-row" key={b.batch_id}>
                <Tag color="blue">
                  {(b.import_price * sellingPriceRatio).toLocaleString(
                    "vi-VN",
                    {
                      style: "currency",
                      currency: "VND",
                    }
                  )}
                </Tag>
              </div>
            ))}
          </div>
        );
      },
    },

    {
      title: "Thành tiền",
      dataIndex: "Total",
      width: 120,
      render: (_, record) => {
        if (!record.batches?.length) return <span>-</span>;

        return (
          <div className="batch-box">
            {calAmount(record.batches, sellingPriceRatio).toLocaleString(
              "vi-VN",
              {
                style: "currency",
                currency: "VND",
              }
            )}
          </div>
        );
      },
    },

    {
      title: "",
      width: 80,
      render: (_, record, index) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() =>
            setMedications((prev) => prev.filter((_, i) => i !== index))
          }
        />
      ),
    },
  ];

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", padding: "5px" }}>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <div
            style={{
              background: "white",
              padding: "20px 32px",
              borderRadius: 12,
              //boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              marginBottom: 24,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <Space
              align="center"
              style={{
                width: "100%",
                justifyContent: "space-between",
                borderRadius: 8,
                //boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <Space>
                <Button
                  onClick={() => {
                    window.history.back();
                  }}
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  size="large"
                >
                  Quay lại
                </Button>
              </Space>
              <div>
                <Title level={3} style={{ margin: 0, color: "#1e293b" }}>
                  Tạo Hồ Sơ Khám Bệnh
                </Title>
                <Text type="secondary">
                  Nhập thông tin bệnh nhân và kết quả khám
                </Text>
              </div>
              <div style={{ width: 56 }} />
            </Space>
          </div>

          <Row gutter={24}>
            {/* SECTION 1: Patient Info */}
            <Col xs={24} md={12}>
              <Card
                title={
                  <div className="flex justify-between items-center">
                    <div>
                      <UserOutlined style={{ color: "#1890ff" }} />
                      <span className="ml-2">Thông tin bệnh nhân</span>
                    </div>

                    <div>
                      <Button
                        icon={<HistoryOutlined />}
                        onClick={() => {
                          setDrawerVisible(true);
                        }}
                      >
                        Xem lịch sử khám bệnh
                      </Button>
                    </div>
                  </div>
                }
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
                headStyle={{
                  // background: "#e6f7ff",
                  borderRadius: "12px 12px 0 0",
                }}
              >
                <Row gutter={16}>
                  <Col xs={12}>
                    <Form.Item
                      label="Mã bệnh nhân"
                      name="patientId"
                      rules={[{ required: true }]}
                    >
                      <Select
                        disabled= {`${appointmentId != null ? true: false}`}
                        showSearch
                        placeholder="Tìm bệnh nhân..."
                        options={patientOptions}
                        onChange={onPatientChange}
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item label="Họ và tên" name="patientName">
                      <Input disabled />
                    </Form.Item>
                  </Col>

                  <Col xs={12}>
                    <Form.Item label="Giới tính" name="gender">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item label="Ngày sinh" name="dob">
                      <DatePicker disabled style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>

                  <Col xs={12}>
                    <Form.Item label="Số điện thoại" name="phone">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item label="Địa chỉ" name="address">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* SECTION 2: Appointment Info */}
            <Col xs={24} md={12}>
              <Card
                title={
                  <Space>
                    <CalendarOutlined style={{ color: "#52c41a" }} />
                    Thông tin buổi khám
                  </Space>
                }
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
                headStyle={{
                  //   background: "#f6ffed",
                  borderRadius: "12px 12px 0 0",
                }}
              >
                <Row gutter={16}>
                  <Col xs={12}>
                    <Form.Item
                      label="Ngày giờ khám"
                      name="visitDateTime"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn ngày giờ khám!",
                        },
                      ]}
                    >
                      <DatePicker
                        showTime
                        style={{ width: "100%" }}
                        disabledDate={(current) => {
                          // Không cho chọn ngày trước hôm nay
                          return current && current < moment().startOf("day");
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item label="Bác sĩ phụ trách" name="doctor">
                      <Select placeholder="" disabled />
                    </Form.Item>
                  </Col>

                  <Col xs={12}>
                    <Form.Item
                      label="Ngày tái khám (Nếu có)"
                      name="revisitDate"
                    >
                      <DatePicker
                        showTime
                        style={{ width: "100%" }}
                        disabledDate={(current) => {
                          // Không cho chọn ngày trước hôm nay
                          return current && current < moment().startOf("day");
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* SECTION 3: Diagnosis */}
          <Card
            title={<Space>Chẩn đoán & Kết quả lâm sàng</Space>}
            style={{
              marginBottom: 16,
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
            headStyle={{
              //  background: "#f9f0ff",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <Form.Item
              label={
                <Space>
                  <strong>Chẩn đoán bệnh (có mức độ + ghi chú)</strong>
                  <Text type="secondary">
                    (Bệnh đầu tiên là chẩn đoán chính)
                  </Text>
                </Space>
              }
              name="diagnoses"
              rules={[
                {
                  required: true,
                  message: "Vui lòng thêm ít nhất 1 chẩn đoán",
                },
              ]}
            >
              <Select
                mode="tags"
                placeholder="Click vào ô → chọn bệnh → thêm mức độ & ghi chú"
                style={{ width: "100%" }}
                open={false}
                onChange={(values) => {
                  // Khi người dùng xóa tag, Select sẽ gọi onChange với danh sách giá trị mới
                  form.setFieldsValue({ diagnoses: values });

                  // Helper để convert object diagnosis thành chuỗi tag (phải khớp với format khi thêm)
                  const toTag = (diag) =>
                    diag && diag.disease
                      ? diag.note
                        ? `${diag.disease.disease_name} (${diag.severity}) - ${diag.note}`
                        : `${diag.disease.disease_name} (${diag.severity})`
                      : "";

                  const newList = resultDiagnoses.filter((d) =>
                    values.includes(toTag(d))
                  );

                  // Nếu chẩn đoán chính bị xóa, gán lại chẩn đoán đầu tiên làm chính
                  if (
                    newList.length > 0 &&
                    !newList.some((r) => r.is_primary)
                  ) {
                    newList[0] = { ...newList[0], is_primary: true };
                  }

                  setDiagnoses(newList);
                }}
                tagRender={(props) => {
                  const { value, closable, onClose } = props;

                  // Kiểm tra value có tồn tại không
                  if (!value) return null;

                  // Determine primary flag from resultDiagnoses state (which stores objects)
                  const current = form.getFieldValue("diagnoses") || [];

                  // Parse the tag value to compare with stored resultDiagnoses
                  const matchVal = String(value).match(
                    /^(.+?)\s*\(([^)]+)\)(?:\s*-\s*(.+))?$/
                  );
                  const valDisease = matchVal?.[1] || value;
                  const valSeverity = matchVal?.[2] || "Trung bình";
                  const valNote = matchVal?.[3] || "";

                  const isPrimary =
                    resultDiagnoses.find((r) => {
                      const rn = r.disease?.disease_name || "";
                      const rs = r.severity || "Trung bình";
                      const rnote = r.note || "";
                      return (
                        rn === valDisease &&
                        rs === valSeverity &&
                        rnote === valNote
                      );
                    })?.is_primary === true;

                  // Parse dữ liệu với safe check
                  const match = String(value).match(
                    /^(.+?)\s*\(([^)]+)\)(?:\s*-\s*(.+))?$/
                  );
                  const disease = match?.[1] || value;
                  const severity = match?.[2] || "Trung bình";
                  const note = match?.[3] || "";

                  const colorMap = {
                    Nhẹ: "#52c41a",
                    "Trung bình": "#faad14",
                    Nặng: "#ff4d4f",
                    "Rất nặng": "#a8071a",
                  };

                  return (
                    <Tag
                      color={colorMap[severity] || "blue"}
                      style={{
                        margin: 4,
                        padding: "8px 12px",
                        fontSize: 13,
                        border: isPrimary
                          ? "2.5px solid #ff4d4f"
                          : "1px solid #d9d9d9",
                        borderRadius: 8,
                      }}
                      closable={closable}
                      onClose={onClose}
                    >
                      {isPrimary && (
                        <strong style={{ color: "#ff4d4f" }}>[CHÍNH] </strong>
                      )}
                      <strong>{disease}</strong>
                      <span style={{ marginLeft: 6, opacity: 0.9 }}>
                        ({severity}){note && ` - ${note}`}
                      </span>
                      <EditOutlined
                        style={{
                          marginLeft: 8,
                          cursor: "pointer",
                          opacity: 0.7,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // find matching diagnosis index in resultDiagnoses
                          const idx = resultDiagnoses.findIndex((r) => {
                            const rn = r.disease?.disease_name || "";
                            const rs = r.severity || "Trung bình";
                            const rnote = r.note || "";
                            return (
                              rn === disease &&
                              rs === severity &&
                              rnote === (note || "")
                            );
                          });
                          if (idx >= 0) openAddModal(idx);
                          else openAddModal();
                        }}
                      />
                    </Tag>
                  );
                }}
                onClick={() => openAddModal()}
              />
            </Form.Item>

            <Modal
              title={<strong>Thêm / Sửa chẩn đoán</strong>}
              open={isModalOpen}
              onCancel={() => setIsModalOpen(false)}
              onOk={handleAddDiagnosis}
              okText="Thêm vào danh sách"
              cancelText="Hủy"
              width={560}
              okButtonProps={{
                style: {
                  background: "#0e1182ff",
                },
              }}
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                <div>
                  <Text strong>Chọn bệnh:</Text>
                  <Select
                    showSearch
                    value={tempDisease || undefined}
                    placeholder="Tìm bệnh hoặc mã ICD-10..."
                    style={{ width: "100%", marginTop: 8 }}
                    // Không filter client, để server làm
                    filterOption={false}
                    // Gọi API mỗi lần gõ
                    onSearch={searchDisease}
                    // Dữ liệu trả về từ API
                    options={diseaseOptions}
                    // Khi chọn
                    onChange={setTempDisease}
                    // Spinner loading
                    notFoundContent={loading ? "Đang tìm..." : null}
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
                            onClick={() => setOpenAddDisease(true)}
                          >
                            Thêm loại bệnh mới
                          </Button>
                        </div>
                      </>
                    )}
                  />

                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">Gợi ý nhanh:</Text>
                    <Space wrap style={{ marginTop: 8 }}>
                      {TOP_DISEASES.map((d) => (
                        <Tag
                          key={d.value}
                          color="processing"
                          style={{ cursor: "pointer" }}
                          onClick={() => setTempDisease(d.value)}
                        >
                          {d.label}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
                <div>
                  <Text strong>Mức độ:</Text>
                  <Radio.Group
                    value={tempSeverity}
                    onChange={(e) => setTempSeverity(e.target.value)}
                    style={{ marginTop: 8, display: "block" }}
                  >
                    <Space direction="vertical">
                      {SEVERITY.map((s) => (
                        <Radio key={s.value} value={s.value}>
                          <Tag color={s.color}>{s.label}</Tag>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </div>
                <div>
                  <Text strong>Ghi chú (tùy chọn):</Text>
                  <TextArea
                    maxLength={150}
                    rows={2}
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="VD: do liên cầu khuẩn, mới phát hiện..."
                    style={{ marginTop: 8 }}
                  />
                </div>

                <Space>
                  {" "}
                  <Text>Chuẩn đoán chính: </Text>
                  <Switch
                    checked={is_primary}
                    onChange={(value) => setTempPrimary(value)}
                  />
                </Space>
              </Space>
            </Modal>

            {/* Hiển thị chẩn đoán chính dựa trên state resultDiagnoses (chứa object) */}
            {resultDiagnoses &&
              resultDiagnoses.length > 0 &&
              (() => {
                const primary =
                  resultDiagnoses.find((d) => d.is_primary === true) ||
                  resultDiagnoses[0];

                return (
                  <Alert
                    style={{ margin: "16px 0" }}
                    type="error"
                    showIcon
                    message={
                      <Space>
                        <strong>Chẩn đoán chính:</strong>

                        <Tag color="red" size="large" style={{ fontSize: 15 }}>
                          {primary?.disease?.disease_name || "-"}
                        </Tag>

                        {resultDiagnoses.length > 1 && (
                          <Text type="secondary">
                            và {resultDiagnoses.length - 1} chẩn đoán kèm theo
                          </Text>
                        )}
                      </Space>
                    }
                  />
                );
              })()}

            <Divider />

            <Form.Item
              label="Triệu chứng lâm sàng"
              name="symptoms"
              rules={[{ required: true }]}
            >
              <TextArea
                rows={4}
                placeholder="Ho khan 3 ngày, sốt nhẹ 37.8°C..."
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
          </Card>

          {/* SECTION 4: Treatment */}
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: "#fa541c" }} />
                Toa thuốc
              </Space>
            }
            style={{
              marginBottom: 16,
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
            headStyle={{
              //  background: "#fff2e8",
              borderRadius: "12px 12px 0 0",
            }}
            extra={
              <>
                <Button className="mr-2 m-3" onClick={handleDeleteAll}>
                  Xóa tất cả
                </Button>

                <Button
                  background="#0e1182ff"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addMedication}
                  style={{
                    // borderRadius: "12px",
                    fontWeight: 500,
                    background: "#0e1182ff",
                    // background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                  }}
                >
                  Thêm thuốc
                </Button>
              </>
            }
          >
            <Table
              dataSource={medications}
              columns={medicationColumns}
              pagination={false}
              locale={{
                emptyText: "Chưa có đơn thuốc. Nhấn 'Thêm thuốc' để kê đơn.",
              }}
            />
          </Card>

          {/* Action Buttons */}
          <Card
            style={{
              marginBottom: 16,
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={cancelProcess} size="large">
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                style={{
                  // borderRadius: "12px",
                  fontWeight: 500,
                  background: "#0e1182ff",
                  // background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                Lưu Hồ Sơ Khám Bệnh
              </Button>
            </Space>
          </Card>
        </Form>

        {/* ---------------    MODAL CHON LO THUOC ------------ */}

        <BatchSelectionModal
          open={batchModal.open}
          medicine={batchModal.medicine}
          requiredQty={batchModal.requiredQty}
          initialselectedBatches={batchModal.initialSelectedBatches}
          onCancel={() =>
            setBatchModal({
              open: false,
              medicine: null,
              rowId: null,
              requiredQty: 0,
            })
          }
          onConfirm={(selectedBatches, totalQty) => {
            // Cập nhật dòng thuốc với lô đã chọn
            updateMedicine(batchModal.rowId, {
              quantity: totalQty,
              batches: selectedBatches,
              sell_price:
                (selectedBatches.reduce(
                  (sum, b) => sum + b.import_price * b.quantity,
                  0
                ) /
                  totalQty) *
                  sellingPriceRatio || 0,
            });

            setBatchModal({
              open: false,
              medicine: null,
              rowId: null,
              requiredQty: 0,
            });
            toast.success(
              `Đã chọn ${totalQty} ${batchModal.medicine?.unit_name}`
            );
          }}
        />
      </div>

      <UsageMethodSearchModal
        visible={visibleUMSearchModal}
        onCancel={() => setvisibleUMSearchModal(false)}
        onSelect={(um) => {
          console.log("Usage Method đã chọn", um);

          const newItem = {
            id: Date.now() + Math.random(),
            usage_method_id: um.usage_method_id,
            usage_method_name: um.usage_method_name,
          };
          setUsageMethods((prev) => [...prev, newItem]);

          setvisibleUMSearchModal(false);
        }}
        onCreateNew={() => {
          message.info("Chức năng tạo mới thuốc - mở form riêng");
          setvisibleUMSearchModal(false);
        }}
      />

      <PatientHistoryDrawer
        patientId={selectedPatientId}
        visible={drawerVisible}
        onClose={() => {
          setSelectedPatientId(null);
          setDrawerVisible(false);
        }}
        maskClosable={false}
      />

      <Modal
        title="Thêm loại bệnh mới"
        open={isOpenNewDiseaseModal}
        onCancel={() => setOpenAddDisease(false)}
        footer={null} // Modal không dùng onOk
      >
        <Form
          form={formCreateDisease}
          layout="vertical"
          onFinish={handleSubmitDisease}
        >
          <Form.Item
            name="disease_name"
            label="Tên bệnh"
            rules={[
              { required: true, message: "Vui lòng nhập tên bệnh!" },
              { max: 100, min: 3, message: "Tên bệnh phải từ 3 đến 100 ký tự" },
            ]}
          >
            <Input placeholder="Nhập tên bệnh" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[
              { max: 300, message: "Mô tả không được dài quá 300 ký tự" },
            ]}
          >
            <Input.TextArea placeholder="Nhập mô tả" rows={3} />
          </Form.Item>

          {/* Chỉ để Form.Item name="is_active" MỘT LẦN */}
          <Form.Item label="Kích hoạt" name="is_active" valuePropName="checked">
            <Switch checkedChildren={<CheckCircleOutlined />} />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginTop: 20 }}>
            <Space>
              <Button onClick={() => setOpenAddDisease(false)}>Hủy</Button>

              {/* Nút submit CHỈ SUBMIT đúng form này */}
              <Button type="primary" htmlType="submit">
                Thêm mới
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <MedicineSearchModal
        onCancel={() => {
          setOpenSearchMedicine(false);
        }}
        visible={openSearchMedicine}
        onSelect={(medicine) => {
          console.log("Toi vua chon thuoc", medicine);

          updateMedicine(selectedMedicineFromModal.id, {
            medicine_id: medicine.medicine_id,
            medicine_name: medicine.medicine_name,
            unit_name: medicine.unit_name,
            quantity: 1,
            batches: [],
            usage_method_id: null,
          });
        }}
        onCreateNew={() => {
          message.info("Chức năng tạo mới thuốc - mở form riêng");
          setOpenSearchMedicine(false);
        }}
      />
    </div>
  );
};

export default CreateMedicalExamination;
