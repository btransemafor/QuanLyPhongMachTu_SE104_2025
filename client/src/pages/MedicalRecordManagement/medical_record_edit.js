// src/pages/medical_records/MedicalRecordEdit.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
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
  medicalRecordsAPI,
  diseasesAPI,
  medicinesAPI,
  settingsAPI,
  usageMethodsAPI,
} from "../../services/api";
import { useParams, useNavigate } from "react-router-dom";
import BatchSelectionModal from "../MedicalExamination/BatchSelectionModal";
import UsageMethodSearchModal from "../MedicalExamination/ModalSearchUM";
import MedicineSelectCell from "../MedicalExamination/MedicineSelectCell";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;
const { TextArea } = Input;

const calAmount = (batches, sellingPriceRatio) => {
  return batches.reduce((total, batch) => {
    const qty = batch.quantity || 0;
    return total + batch.import_price * qty * sellingPriceRatio;
  }, 0);
};

const MedicalRecordEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [medications, setMedications] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [diseaseOptions, setDiseaseOptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [usageMethods, setUsageMethods] = useState([]);
  const [usageMethodOptions, setUsageMethodOptions] = useState([]);
  const [sellingPriceRatio, setSellingPriceRatio] = useState(1.3);

  // Modal thêm bệnh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempDisease, setTempDisease] = useState("");
  const [tempSeverity, setTempSeverity] = useState("Trung bình");
  const [tempNote, setTempNote] = useState("");
  const originalRecordRef = useRef(null); // Không re-render
  const [is_primary, setTempPrimary] = useState(false);
  //const [checked, setChecked] = useState(false);

  // Modal chọn lô
  const [batchModal, setBatchModal] = useState({
    open: false,
    medicine: null,
    rowId: null,
    requiredQty: 0,
    initialSelectedBatches: null,
  });

  const [visibleUMSearchModal, setvisibleUMSearchModal] = useState(false);

  const SEVERITY = [
    { label: "Nhẹ", value: "Nhẹ", color: "#52c41a" },
    { label: "Trung bình", value: "Trung bình", color: "#faad14" },
    { label: "Nặng", value: "Nặng", color: "#ff4d4f" },
    { label: "Rất nặng", value: "Rất nặng", color: "#a8071a" },
  ];

  useEffect(() => {
    fetchMedicalRecord();
    fetchDiseases();
    fetchMedicines();
    fetchUsageMethods();
    fetchSettings();
  }, [id]);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.getSettings();
      if (res.data.success) {
        setSellingPriceRatio(
          parseFloat(res.data.data.SellingPriceRatio?.value || 1.3)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMedicalRecord = async () => {
    setLoading(true);
    try {
      const res = await medicalRecordsAPI.getMedicalRecord(id);
      if (res.data.success) {
        const data = res.data.data;
        console.log("MEDICAL RECORD", data);
        // Save original
        originalRecordRef.current = JSON.parse(JSON.stringify(data));

        setMedicalRecord(data);

        form.setFieldsValue({
          symptoms: data.symptoms,
          revisitDate: data.revisit_date ? dayjs(data.revisit_date) : null,
          doctor_note: data.doctor_note || "",
          doctor: data.doctor_name,
          patientName: data.patient_name,
          patientId: data.patient_id,
          phone: data.patient_phone,
          address: data.patient_address,
        });

        // Load chẩn đoán
        const loadedDiagnoses = data.diseases.map((d) => ({
          disease_id: d.disease_id,
          disease_name: d.disease_name,
          severity: d.severity,
          note: d.disease_note || "",
          is_primary: d.is_primary || false,
        }));
        setDiagnoses(loadedDiagnoses);

        // Load đơn thuốc
        const loadedMeds = data.prescriptions.map((p, i) => ({
          id: Date.now() + i,
          key: Date.now() + i,
          medicine_id: p.medicine_id,
          medicine_name: p.medicine_name,
          unit_name: p.unit,
          quantity: p.quantity,
          usage_method_id: p.usage_method_id,
          batches: p.batches || [],
          sell_price: p.sell_price,
        }));
        console.log("Thuoc ban dau: ", loadedMeds);
        setMedications(loadedMeds);
      }
    } catch (err) {
      message.error("Không tải được hồ sơ");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiseases = async () => {
    try {
      const res = await diseasesAPI.getDiseases();
      if (res.data.success) {
        setDiseases(res.data.data);
        const opts = res.data.data.map((d) => ({
          label: `${d.disease_id} - ${d.disease_name}`,
          value: d.disease_id,
        }));
        setDiseaseOptions(opts);
      }
    } catch (err) {}
  };

  const fetchMedicines = async () => {
    try {
      const res = await medicinesAPI.getMedicines();
      if (res.data.success) {
        setMedicines(res.data.data);
        const opts = res.data.data.map((m) => ({
          value: m.medicine_id,
          label: `${m.medicine_id} - ${m.medicine_name}`,
        }));
        setMedicineOptions(opts);
      }
    } catch (err) {}
  };

  const fetchUsageMethods = async () => {
    try {
      const res = await usageMethodsAPI.getUsageMethods();
      if (res.data.success) {
        setUsageMethods(res.data.data);
        const opts = res.data.data.map((u) => ({
          value: u.usage_method_id,
          label: `${u.usage_method_id} - ${u.usage_method_name}`,
        }));
        setUsageMethodOptions(opts);
      }
    } catch (err) {}
  };

  function getMedicalRecordDiff(original, current) {
    const diff = {};

    // ----------------------------
    // 1. TRƯỜNG ĐƠN (scalar fields)
    // ----------------------------
    const scalarFields = ["revisit_date", "symptoms", "doctor_note"];

    scalarFields.forEach((field) => {
      if (original[field] !== current[field]) {
        diff[field] = current[field];
      }
    });

    // ----------------------------
    // 2. DISEASES DIFF
    // ----------------------------
    const oriDiseases = original.diseases || [];
    const curDiseases = current.diseases || [];
    console.log("Current Disease: ", curDiseases);

    const diseasesDiff = {
      added: [],
      removed: [],
      updated: [],
    };

    const mapOriDis = new Map(oriDiseases.map((d) => [d.disease_id, d]));
    const mapCurDis = new Map(curDiseases.map((d) => [d.disease_id, d]));

    // Add + Update
    for (const [id, cur] of mapCurDis.entries()) {
      if (!mapOriDis.has(id)) {
        diseasesDiff.added.push(cur);
      } else {
        const ori = mapOriDis.get(id);
        if (
          ori.severity !== cur.severity ||
          (ori.disease_note || "") !== (cur.note || "")
        ) {
          diseasesDiff.updated.push(cur);
        }
      }
    }

    // Removed
    for (const [id, ori] of mapOriDis.entries()) {
      if (!mapCurDis.has(id)) diseasesDiff.removed.push(ori);
    }

    if (
      diseasesDiff.added.length ||
      diseasesDiff.removed.length ||
      diseasesDiff.updated.length
    ) {
      diff.diseases = diseasesDiff;
    }

    // ----------------------------
    // 3. MEDICATIONS DIFF
    // ----------------------------
    const oriMeds = original.prescriptions || [];
    const curMeds = current.prescriptions || [];

    console.log("curMeds:", curMeds);
    console.log("oriMeds:", oriMeds);

    const medsDiff = {
      added: [],
      removed: [],
      updated: [],
    };

    const mapOriMed = new Map(oriMeds.map((m) => [m.medicine_id, m]));
    const mapCurMed = new Map(curMeds.map((m) => [m.medicine_id, m]));

    console.log("Map Origin: ", mapOriMed);
    console.log("Map Cur :", mapCurMed);

    for (const [id, cur] of mapCurMed.entries()) {
      if (!mapOriMed.has(id)) {
        medsDiff.added.push(cur); // thuốc mới
      } else {
        const ori = mapOriMed.get(id);
        if (isMedicationChanged(ori, cur)) {
          medsDiff.updated.push(cur); // thuốc cũ nhưng thay đổi
        }
      }
    }
    // Removed
    for (const [id, ori] of mapOriMed.entries()) {
      console.log("Map: ", id);
      console.log("Hien tai", mapCurMed);
      if (!mapCurMed.has(id)) medsDiff.removed.push(ori);
    }

    if (
      medsDiff.added.length ||
      medsDiff.removed.length ||
      medsDiff.updated.length
    ) {
      diff.medications = medsDiff;
    }

    return diff;
  }
  function isMedicationChanged(ori, cur) {
    const EPSILON = 0.001;

    // compare quantity
    if (ori.quantity !== cur.quantity) return true;

    // compare sell_price with epsilon
    if (Math.abs((ori.sell_price || 0) - (cur.sell_price || 0)) > EPSILON)
      return true;

    // extract batch ids
    const oriBatchIds = (ori.batches || []).map((b) => b.batch_id);
    const curBatchIds = (cur.batches || []).map((b) => b.batch_id);

    // compare count
    if (oriBatchIds.length !== curBatchIds.length) return true;

    // compare values (order independent)
    const setOri = new Set(oriBatchIds);
    const setCur = new Set(curBatchIds);

    for (const id of setOri) {
      if (!setCur.has(id)) return true;
    }

    return false;
  }

  const updateMedicine = useCallback((id, updatedFields) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedFields } : m))
    );
  }, []);

  const openModalWithBatches = (record) => {
    const initBatches = record.batches?.map((item) => ({
      batch_id: item.batch_id,
      quantity: item.quantity,
      import_price: item.import_price,
    }));

    console.log("BATCH CUA TUI", initBatches);

    openBatchModal(
      medicines.find((m) => m.medicine_id === record.medicine_id),
      record.id,
      record.quantity,
      initBatches
    );
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
  };

  const openBatchModal = (medicine, rowId, requiredQty = 1, initial = null) => {
    setBatchModal({
      open: true,
      medicine,
      rowId,
      requiredQty,
      initialSelectedBatches: initial,
    });
  };

  const handleAddDiagnosis = () => {
    if (!tempDisease) return;
    console.log("Chon disease: ", tempDisease);
    const found = diseases.find((d) => d.disease_id === tempDisease);
    if (!found) return;

    if (diagnoses.find((item) => item.disease_id === tempDisease)) {
      message.warning("Chuẩn đoán này được thêm!");
      setIsModalOpen(false);
      return;
    }

    const newDiag = {
      disease_id: found.disease_id,
      disease_name: found.disease_name,
      severity: tempSeverity,
      note: tempNote,
      is_primary: is_primary
    };
    setDiagnoses([...diagnoses, newDiag]);

    setIsModalOpen(false);
    setTempDisease("");
    setTempSeverity("Trung bình");
    setTempNote("");
    message.success("Đã thêm chẩn đoán");
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formValues = form.getFieldsValue();
      const original = originalRecordRef.current;

      const current = {
        ...medicalRecord,
        ...formValues,
        diseases: diagnoses.map((d) => ({
          disease_id: d.disease_id,
          severity: d.severity,
          disease_note: d.note || null,
        })),
        prescriptions: medications,
      };

      console.log("Current: ", current);

      const diff = getMedicalRecordDiff(original, current);

      // diff sẽ chỉ chứa thứ thay đổi
      console.log("DIFF:", diff);
      
      await medicalRecordsAPI.updateRecord(id, diff);

      //await medicalRecordsAPI.updateMedicalRecord(id, payload);
      message.success("Cập nhật hồ sơ thành công!");
      navigate(`/medical-record-details/${id}`);
    } catch (err) {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const medicationColumns = [
    {
      title: "Tên thuốc",
      width: 280,
      render: (_, record) => (
        <MedicineSelectCell
          record={record}
          medicines={medicines}
          medicineOptions={medicineOptions}
          updateMedicine={updateMedicine}
        />
      ),
    },
    { title: "Đơn vị", dataIndex: "unit_name", width: 90 },
    {
      title: "Số lượng",
      width: 110,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(v) =>
            updateMedicine(record.id, { quantity: v, batches: [] })
          }
        />
      ),
    },
    {
      title: "Cách dùng",
      width: 200,
      render: (_, record) => (
        <Select
          showSearch
          placeholder="Chọn cách dùng"
          value={record.usage_method_id}
          onChange={(v) => updateMedicine(record.id, { usage_method_id: v })}
          options={usageMethodOptions}
          dropdownRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: "8px 0" }} />
              <div
                style={{
                  padding: "8px",
                  cursor: "pointer",
                  background: "#f6ffed",
                }}
                onClick={() => setvisibleUMSearchModal(true)}
              >
                <PlusOutlined style={{ color: "#095e22" }} /> Tìm kiếm thêm cách
                dùng...
              </div>
            </>
          )}
        />
      ),
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
                  {b.import_price?.toLocaleString("vi-VN", {
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
      width: 140,
      render: (_, r) =>
        r.batches?.length
          ? calAmount(r.batches, sellingPriceRatio).toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })
          : "-",
    },
    {
      title: "",
      width: 80,
      render: (_, r, i) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() =>
            setMedications((prev) => prev.filter((_, idx) => idx !== i))
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
             /*  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", */
              marginBottom: 24,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
              >
                Quay lại
              </Button>
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Chỉnh sửa Phiếu khám bệnh
                </Title>
                <Text type="secondary">Mã phiếu: {id}</Text>
              </div>
              <div />
            </Space>
          </div>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card
                title={
                  <>
                    <UserOutlined style={{ color: "#1890ff" }} /> Thông tin bệnh
                    nhân
                  </>
                }
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Mã bệnh nhân">
                      <Input value={medicalRecord?.patient_id} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Họ tên">
                      <Input value={medicalRecord?.patient_name} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="SĐT">
                      <Input value={medicalRecord?.patient_phone} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Địa chỉ">
                      <Input value={medicalRecord?.patient_address} disabled />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title={
                  <>
                    <CalendarOutlined style={{ color: "#52c41a" }} /> Thông tin
                    khám
                  </>
                }
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Bác sĩ">
                      <Input value={medicalRecord?.doctor_name} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Ngày khám">
                      <Input
                        value={dayjs(medicalRecord?.created_at).format(
                          "DD/MM/YYYY HH:mm"
                        )}
                        disabled
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="Ngày tái khám" name="revisitDate">
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card
            title="Chẩn đoán & Triệu chứng"
            style={{
              marginBottom: 16,
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
            headStyle={{ borderRadius: "12px 12px 0 0" }}
          >
            {/* Phần hiển thị chẩn đoán */}
            <Form.Item
              label={
                <Space>
                  <strong>Chẩn đoán bệnh (có mức độ + ghi chú)</strong>
                  <Text type="secondary">
                    (Bệnh đầu tiên là chẩn đoán chính)
                  </Text>
                </Space>
              }
              rules={[
                {
                  required: true,
                  message: "Vui lòng thêm ít nhất 1 chẩn đoán",
                },
              ]}
            >
              <Select
                mode="tags"
                placeholder="Nhấn vào đây để thêm chẩn đoán..."
                open={false}
                value={diagnoses.map(
                  (d) => `${d.disease_name}||${d.severity}||${d.note || ""}`
                )} // key duy nhất
                onClick={() => setIsModalOpen(true)}
                tagRender={({ value, onClose }) => {
                  if (!value) return null;

                  const parts = value.split("||");
                  const diseaseName = parts[0];
                  const severity = parts[1];
                  const note = parts[2];

                  // Tìm đúng diagnosis trong state
                  const diag = diagnoses.find(
                    (d) => d.disease_name === diseaseName
                  );

                  // Kiểm tra chẩn đoán chính
                  const isPrimary = diag?.is_primary === true;

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
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        setDiagnoses((prev) =>
                          prev.filter((d) => d.disease_name !== diseaseName)
                        );
                      }}
                    >
                      {/* Hiển thị tag chính */}
                      {isPrimary && (
                        <strong style={{ color: "#ff4d4f" }}>[CHÍNH] </strong>
                      )}

                      <strong>{diseaseName}</strong>
                      <span style={{ marginLeft: 6, opacity: 0.9 }}>
                        ({severity}){note && ` - ${note}`}
                      </span>

                      {/* Nút sửa */}
                      <EditOutlined
                        style={{
                          marginLeft: 8,
                          cursor: "pointer",
                          opacity: 0.7,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();

                          const diag = diagnoses.find(
                            (d) => d.disease_name === diseaseName
                          );

                          if (diag) {
                            setTempDisease(diag.disease_id);
                            setTempSeverity(diag.severity);
                            setTempNote(diag.note || "");
                            setTempPrimary(diag.is_primary); // giữ lại giá trị primary
                            setIsModalOpen(true);

                            // Xóa để không bị trùng khi thêm lại
                            setDiagnoses((prev) =>
                              prev.filter((d) => d.disease_name !== diseaseName)
                            );
                          }
                        }}
                      />
                    </Tag>
                  );
                }}
              />
            </Form.Item>

            {/* Alert chẩn đoán chính */}
            {/* === Alert chẩn đoán chính === */}
            {diagnoses.length > 0 &&
              (() => {
                const primary = diagnoses.find((d) => d.is_primary === true);
                const others = diagnoses.filter((d) => d.is_primary !== true);

                return (
                  <Alert
                    style={{ margin: "16px 0" }}
                    type="warning"
                    showIcon
                    message={
                      <Space wrap>
                        <strong>Chẩn đoán chính:</strong>

                        {primary ? (
                          <Tag color="red" style={{ fontSize: 15 }}>
                            {primary.disease_name} ({primary.severity})
                            {primary.note && ` - ${primary.note}`}
                          </Tag>
                        ) : (
                          <Text type="secondary">Không có chẩn đoán chính</Text>
                        )}

                        {others.length > 0 && (
                          <Text type="secondary">
                            và {others.length} chẩn đoán kèm theo
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
              rules={[{ required: true, message: "Vui lòng nhập triệu chứng" }]}
            >
              <TextArea rows={4} placeholder="Ho khan, sốt, đau họng..." />
            </Form.Item>

            {/*  <Form.Item label="Ghi chú bác sĩ" name="doctor_note">
              <TextArea
                rows={3}
                placeholder="Lời dặn bệnh nhân, lưu ý khi dùng thuốc..."
              />
            </Form.Item> */}
          </Card>
          <Card
            title={
              <>
                <FileTextOutlined style={{ color: "#fa541c" }} /> Toa thuốc
              </>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addMedication}
              >
                Thêm thuốc
              </Button>
            }
            style={{
              marginBottom: 16,
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <Table
              dataSource={medications}
              columns={medicationColumns}
              pagination={false}
            />

            {/*    // Tong tien thuoc */}
          </Card>
          <Card
            style={{
              marginBottom: 16,
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button size="large" onClick={() => navigate(-1)}>
                Hủy
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                style={{ background: "#0e1182ff", border: "none" }}
              >
                Lưu Thay Đổi
              </Button>
            </Space>
          </Card>
        </Form>

        <Modal
          title="Thêm / Sửa chẩn đoán"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          onOk={handleAddDiagnosis}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <Text strong>Chọn bệnh:</Text>
              <Select
                showSearch
                style={{ width: "100%", marginTop: 8 }}
                options={diseaseOptions}
                value={tempDisease}
                onChange={setTempDisease}
              />
            </div>
            <div>
              <Text strong>Mức độ:</Text>
              <Radio.Group
                value={tempSeverity}
                onChange={(e) => setTempSeverity(e.target.value)}
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
              <Text strong>Ghi chú:</Text>
              <TextArea
                rows={2}
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
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

        <BatchSelectionModal
          isEditing={true}
          mr_id={medicalRecord?.medical_record_id}
          {...batchModal}
          onCancel={() => setBatchModal({ open: false })}
          onConfirm={(batches, qty) => {
            console.log("=== DEBUG BATCH MODAL ===");
            console.log("Batches:", batches);
            console.log("Quantity:", qty);
            console.log("Selling Price Ratio:", sellingPriceRatio);

            // Kiểm tra từng batch
            batches.forEach((b, idx) => {
              console.log(`Batch ${idx}:`, {
                batch_id: b.batch_id,
                quantity: b.quantity,
                import_price: b.import_price,
              });
            });

            const totalImportPrice = batches.reduce(
              (sum, b) => sum + (b.import_price || 0) * (b.quantity || 0),
              0
            );

            console.log("Total Import Price:", totalImportPrice);

            const avgSellPrice =
              qty > 0 ? (totalImportPrice / qty) * sellingPriceRatio : 0;

            console.log("Avg Sell Price:", avgSellPrice);
            console.log("========================");

            updateMedicine(batchModal.rowId, {
              quantity: qty,
              batches: batches,
              sell_price: avgSellPrice,
            });

            setBatchModal({ open: false });
          }}
        />

        <UsageMethodSearchModal
          visible={visibleUMSearchModal}
          onCancel={() => setvisibleUMSearchModal(false)}
          onSelect={(um) => {
            setUsageMethods((prev) => [...prev, um]);
            setvisibleUMSearchModal(false);
          }}
        />
      </div>
    </div>
  );
};

export default MedicalRecordEdit;
