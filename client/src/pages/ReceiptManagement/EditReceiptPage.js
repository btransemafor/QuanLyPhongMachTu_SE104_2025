import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Input,
  Space,
  Form,
  Select,
  DatePicker,
  message,
  InputNumber,
  Row,
  Col,
  Divider,
  Table,
  Typography,
  Tag,
} from "antd";

import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { importReceiptsAPI, medicinesAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import MedicineSearchModal from "../../components/MedicineSearchModal";
import "react-datepicker/dist/react-datepicker.css";
import generateBatchNumber from "../../utils/randomBatch";
import { useToast } from "../../contexts/ToastContext";
const { Option } = Select;
const { Title } = Typography;
const { TextArea } = Input;


const EditReceiptPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [medicines, setMedicines] = useState([]);
  const [medicineList, setMedicineList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [medicineModalVisible, setMedicineModalVisible] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [submitType, setSubmitType] = useState("");
  const {toast} = useToast(); 

  useEffect(() => {
    fetchMedicines();
    if (id) {
      fetchReceipt();
    } else {
      // Nếu không có id (tạo mới), set giá trị mặc định
      form.setFieldsValue({
        staff_name: user?.full_name || user?.username || "N/A",
        receipt_date: moment(),
      });
    }
  }, [id, form, user]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const res = await importReceiptsAPI.getImportReceipt(id);

      if (res?.data?.success) {
        const data = res.data.data;
        setReceipt(data);

        // Fill form fields
        form.setFieldsValue({
          supplier_name: data.supplier_name || "",
          staff_name: user?.full_name || user?.username || "N/A",
          receipt_date: data.receipt_date
            ? moment(data.receipt_date)
            : moment(),
          note: data.note || "",
        });

        // Fill medicine list với format đúng
        if (data.items && Array.isArray(data.items)) {
          const formattedItems = data.items.map((item, index) => ({
            id: item.id || Date.now() + index,
            medicine_id: item.medicine_id,
            medicine_code: item.medicine_code || item.code,
            medicine_name: item.medicine_name || item.name,
            unit_name: item.unit_name || item.unit || "",
            quantity: item.quantity || 1,
            unit_price: item.unit_price || item.price || 0,
            expiry_date: item.expiry_date ? moment(item.expiry_date) : null,
            batch_number: item.batch_number || item.batch_code || "",
            note_batch: item.note_batch || "",
          }));

          setMedicineList(formattedItems);
        } else {
          setMedicineList([]);
        }
      } else {
        toast.error("Không tìm thấy phiếu nhập");
        navigate("/receipts");
      }
    } catch (err) {
      console.error("Fetch receipt error:", err);
      toast.error("Lỗi tải chi tiết phiếu nhập");
      navigate("/receipts");
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await medicinesAPI.getMedicines();
      if (res.data.success) setMedicines(res.data.data);
    } catch (error) {
      console.error("Fetch medicines error:", error);
      toast.error("Không thể tải danh sách thuốc");
    }
  }, []);

  const addMedicine = useCallback(() => {
    const newMedicine = {
      id: Date.now() + Math.random(),
      medicine_id: null,
      medicine_name: "",
      unit_name: "",
      quantity: 1,
      unit_price: 0,
      expiry_date: null,
      batch_number: "",
      note_batch: "",
    };
    setMedicineList((prev) => [...prev, newMedicine]);
  }, []);

  const removeMedicine = useCallback((id) => {
    setMedicineList((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMedicine = useCallback((id, updatedFields) => {
    setMedicineList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedFields } : m))
    );
  }, []);

  const handleMedicineCodeChange = useCallback(
    (rowId, selectedMedicineId) => {
      const selectedMedicine = medicines.find(
        (m) => m.medicine_id === selectedMedicineId
      );

      if (!selectedMedicine) return;

      updateMedicine(rowId, {
        medicine_id: selectedMedicine.medicine_id || selectedMedicine.id,
        medicine_code:
          selectedMedicine.code ||
          selectedMedicine.medicine_code ||
          selectedMedicineId,
        medicine_name:
          selectedMedicine.medicine_name || selectedMedicine.name || "",
        unit_name: selectedMedicine.unit_name || selectedMedicine.unit || "",
        unit_price:
          selectedMedicine.default_price ?? selectedMedicine.unit_price ?? 0,
      });
    },
    [medicines, updateMedicine]
  );

  const calculateTotal = useCallback(() => {
    return medicineList.reduce((total, m) => {
      return total + (m.quantity || 0) * (m.unit_price || 0);
    }, 0);
  }, [medicineList]);

  const getMedicineInfo = useCallback(
    (medicineCode) => {
      return medicines.find((m) => m.medicine_id === medicineCode);
    },
    [medicines]
  );

  const updateQuantityMedicine = async () => {
    try {
      for (const item of medicineList) {
        const currentMedicineRes = await medicinesAPI.getMedicine(
          item.medicine_id
        );
        const currentMedicine = currentMedicineRes.data.data;

        if (!currentMedicine) {
          console.warn("Không tìm thấy thuốc:", item.medicine_id);
          continue;
        }

        const newQuantity =
          (currentMedicine.stock_quantity || 0) + (item.quantity || 0);
        const min_stock_level = currentMedicine.min_stock_level;
        const isActive = currentMedicine.is_active;

        let newStatus = currentMedicine.status;
        if (!isActive) newStatus = "inactive";
        else if (newQuantity <= 0) newStatus = "out_of_stock";
        else if (newQuantity < min_stock_level) newStatus = "low_stock";
        else newStatus = "active";

        await medicinesAPI.updateMedicine(currentMedicine.medicine_id, {
          quantity: newQuantity,
          status: newStatus,
        });
      }

     // message.success("Cập nhật số lượng thuốc thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      toast.error("Không thể cập nhật số lượng thuốc!");
    }
  };

  const handleSubmit = useCallback(
    async (values, type) => {
      if (medicineList.length === 0) {
        message.error("Vui lòng thêm ít nhất 1 thuốc!");
        return;
      }

      try {
        setLoading(true);

        const status = type === "draft" ? "draft" : "confirmed";

        const medicinesData = medicineList
          .map((item) => {
            const found = getMedicineInfo(item.medicine_id);
            return {
              medicine_id: found?.medicine_id || item.medicine_id,
              batch_code: item.batch_number,
              expiry_date: item.expiry_date?.format("YYYY-MM-DD"),
              quantity: item.quantity,
              unit_price: item.unit_price,
              note_batch: item.note_batch,
            };
          })
          .filter((item) => item.medicine_id);

        if (medicinesData.length === 0) {
          toast.error("Vui lòng chọn ít nhất 1 thuốc hợp lệ!");
          return;
        }

        const payload = {
          supplier_name: values.supplier_name,
          receipt_date: values.receipt_date.format("YYYY-MM-DD HH:mm:ss"),
          user_id: user.id,
          batches: medicinesData,
          status: status,
          note: values.note || "",
        };

        // Sử dụng update nếu có id, create nếu không
        if (id) {
          await importReceiptsAPI.updateImportReceipt(id, payload);
          toast.success("Cập nhật phiếu nhập thành công");
        } else {
          await importReceiptsAPI.createImportReceipt(payload);
          toast.success("Thêm phiếu nhập thành công");
        }

        if (type !== "draft") {
          await updateQuantityMedicine();
        }

        navigate("/receipts");
      } catch (error) {
        console.error("Submit error:", error);
        toast.error("Không thể lưu phiếu nhập thuốc");
      } finally {
        setLoading(false);
      }
    },
    [medicineList, getMedicineInfo, user, navigate, id]
  );

  const medicineColumns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã thuốc",
      key: "medicine_code",
      width: 200,
      render: (_, record) => (
        <Select
          placeholder="Chọn mã thuốc"
          value={record.medicine_id || null}
          onChange={(value) => handleMedicineCodeChange(record.id, value)}
          style={{ width: "100%" }}
          showSearch
          allowClear
          filterOption={(input, option) =>
            option.children?.toLowerCase?.().includes(input.toLowerCase())
          }
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSearchModalVisible(true)}
              >
                <PlusOutlined style={{ color: "#095e22" }} />
                Tìm kiếm thuốc...
              </div>
            </>
          )}
        >
          {medicines.map((medicine) => (
            <Option
              key={medicine.id || medicine.medicine_id}
              value={medicine.medicine_id}
            >
              {medicine.medicine_id} - {medicine.medicine_name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 90,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => updateMedicine(record.id, { quantity: value })}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Giá nhập",
      key: "unit_price",
      width: 140,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={0}
          value={record.unit_price}
          onChange={(value) => updateMedicine(record.id, { unit_price: value })}
          style={{ width: "100%" }}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫"
          }
          parser={(value) =>
            value.replace(/\₫\s?|(,*)/g, "").replace(/\./g, "")
          }
        />
      ),
    },
    {
      title: "Hạn sử dụng",
      key: "expiry_date",
      width: 160,
      render: (_, record) => (
        <DatePicker
          value={record.expiry_date || null} // KHÔNG cần wrap lại bằng moment()
          onChange={(date) => updateMedicine(record.id, { expiry_date: date })}
          format="DD/MM/YYYY"
          style={{ width: "100%" }}
          placeholder="DD/MM/YYYY"
        />
      ),
    },
/*     {
      title: "Số lô",
      key: "batch_number",
      width: 140,
      render: (_, record) => (
        <Input
          value={record.batch_number}
          onChange={(e) =>
            updateMedicine(record.id, { batch_number: e.target.value })
          }
          placeholder="Nhập số lô"
        />
      ),
    }, */

    {
      title: "Số lô",
      key: "batch_number",
      width: 200,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            value={record.batch_number}
            onChange={(e) =>
              updateMedicine(record.id, { batch_number: e.target.value })
            }
            placeholder="Nhập số lô"
          />
          <Button
            onClick={() =>
              updateMedicine(record.id, {
                batch_number: generateBatchNumber(),
              })
            }
          >
            Random
          </Button>
        </div>
      ),
    },
    {
      title: "Ghi chú",
      key: "note_batch",
      width: 120,
      render: (_, record) => (
        <Input
          value={record.note_batch}
          onChange={(e) =>
            updateMedicine(record.id, { note_batch: e.target.value })
          }
          placeholder="Nhập ghi chú..."
        />
      ),
    },
    {
      title: "Thành tiền",
      key: "subtotal",
      width: 150,
      align: "right",
      render: (_, record) => {
        const subtotal = (record.quantity || 0) * (record.unit_price || 0);
        return (
          <Tag color="green" style={{ fontSize: 14 }}>
            {subtotal.toLocaleString("vi-VN")} ₫
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeMedicine(record.id)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "5px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Page Header */}
      <div
        style={{
          background: "white",
          backdropFilter: "blur(10px)",
          padding: "30px 24px",
          borderRadius: 12,
          marginBottom: 24,

          //  border: "1px solid rgba(24, 144, 255, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/receipts")}
            size="large"
            style={{ borderRadius: 8 }}
          >
            Quay lại
          </Button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
            {id ? `Chỉnh sửa phiếu nhập #${id}` : "Tạo phiếu nhập mới"}
          </h1>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => handleSubmit(values, submitType)}
      >
        {/* Thông tin phiếu nhập */}
        <Card
          style={{
            marginBottom: 16,
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            padding: 10,
          }}
          className="card-receipt"
          title={
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              Thông tin phiếu nhập
            </span>
          }
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="supplier_name"
                label="Nhà cung cấp"
                rules={[
                  { required: true, message: "Vui lòng nhập nhà cung cấp" },
                ]}
              >
                <Input
                  placeholder="Nhập tên nhà cung cấp"
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="receipt_date"
                label="Ngày nhập"
                rules={[{ required: true, message: "Vui lòng chọn ngày nhập" }]}
              >
                <DatePicker
                  style={{ width: "100%", borderRadius: 8 }}
                  format="DD/MM/YYYY HH:mm:ss"
                  showTime={{ format: "HH:mm:ss" }}
                  size="large"
                  defaultValue={moment()}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="staff_name" label="Người nhập">
                <Input
                  size="large"
                  style={{ borderRadius: 8 }}
                  disabled
                  readOnly
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Danh sách thuốc */}
        <Card
          style={{
            // display: "flex",
            //   justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            padding: 10,
          }}
          // className="card-receipt"
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                // borderRadius: 8,

                //  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                padding: 10,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                Danh sách thuốc
              </span>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addMedicine}
                style={{
                  background: "#0e1182ff",
                  border: "none",
                  borderRadius: 8,
                }}
              >
                Thêm thuốc
              </Button>
            </div>
          }
        >
          <Table
            columns={medicineColumns}
            dataSource={medicineList}
            pagination={false}
            rowKey="id"
            size="middle"
            scroll={{ x: 1200 }}
            bordered
            locale={{
              emptyText: "Chưa có thuốc nào. Nhấn 'Thêm thuốc' để bắt đầu.",
            }}
          />

          {medicineList.length > 0 && (
            <div
              style={{
                marginTop: 24,
                padding: "16px 24px",
                background: "linear-gradient(135deg, #f6ffed 0%, #f0f9e8 100%)",
                borderRadius: 12,
                border: "1px solid #b7eb8f",
              }}
            >
              <Row justify="space-between" align="middle">
                <Col>
                  <Space size="large">
                    <div>
                      <span style={{ color: "#595959", fontSize: 14 }}>
                        Tổng số loại thuốc:
                      </span>
                      <Tag
                        color="blue"
                        style={{
                          marginLeft: 8,
                          fontSize: 16,
                          padding: "4px 12px",
                        }}
                      >
                        {medicineList.length}
                      </Tag>
                    </div>
                    <div>
                      <span style={{ color: "#595959", fontSize: 14 }}>
                        Tổng số lượng:
                      </span>
                      <Tag
                        color="orange"
                        style={{
                          marginLeft: 8,
                          fontSize: 16,
                          padding: "4px 12px",
                        }}
                      >
                        {medicineList.reduce(
                          (sum, m) => sum + (m.quantity || 0),
                          0
                        )}
                      </Tag>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: "#595959",
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    >
                      Tổng tiền:
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#000000ff",
                      }}
                    >
                      {calculateTotal().toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Card>

        <Card
          className="card-note-receipt"
          title="Ghi chú"
          style={{
            marginBottom: 16,
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            padding: 10,
          }}
        >
          <Form.Item name="note">
            <TextArea placeholder="Nhập ghi chú..." rows={4} />
          </Form.Item>
        </Card>

        {/* Action Buttons */}
        <Card
          style={{
            marginBottom: 16,
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            padding: 10,
          }}
        >
          <Row justify="end">
            <Space size="middle">
              <Button
                size="large"
                onClick={() => navigate("/receipts")}
                style={{ borderRadius: 8, minWidth: 120 }}
              >
                Hủy
              </Button>

              <Button
                type="default"
                size="large"
                loading={loading}
                onClick={() => {
                  setSubmitType("draft");
                  form.submit();
                }}
                icon={<SaveOutlined />}
                style={{
                  borderRadius: 8,
                  minWidth: 150,
                  background: "#ffffff",
                  border: "2px solid #0050b3",
                  color: "#0050b3",
                }}
              >
                Lưu nháp
              </Button>

              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={() => {
                  setSubmitType("confirmed");
                  form.submit();
                }}
                icon={<SaveOutlined />}
                style={{
                  borderRadius: 8,
                  minWidth: 150,
                  background: "#0e1182ff",
                  border: "none",
                }}
              >
                Xác nhận
              </Button>
            </Space>
          </Row>
        </Card>
      </Form>

      <MedicineSearchModal
        visible={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        onSelect={(medicine) => {
          const newItem = {
            id: Date.now() + Math.random(),
            medicine_id: medicine.medicine_id,
            medicine_code: medicine.code,
            medicine_name: medicine.medicine_name,
            unit_name: medicine.unit_name,
            quantity: 1,
            unit_price: medicine.cost_price || 0,
            expiry_date: null,
            batch_number: "",
            note_batch: "",
          };

          setMedicineList((prev) => {
            if (prev.length === 0) return [newItem];

            const lastItem = prev[prev.length - 1];
            const isLastEmpty =
              lastItem.medicine_id === null ||
              lastItem.medicine_id === "" ||
              lastItem.medicine_id === undefined;

            if (isLastEmpty) {
              const updated = [...prev];
              updated[prev.length - 1] = newItem;
              return updated;
            }

            return [...prev, newItem];
          });

          setSearchModalVisible(false);
        }}
        onCreateNew={() => {
          message.info("Chức năng tạo mới thuốc - mở form riêng");
          setSearchModalVisible(false);
        }}
      />
    </div>
  );
};

export default EditReceiptPage;
