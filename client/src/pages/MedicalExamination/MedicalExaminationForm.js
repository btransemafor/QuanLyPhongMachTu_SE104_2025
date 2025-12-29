// src/components/MedicalExaminationForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  Tabs,
  Collapse,
  Row,
  Col,
  Button,
  message,
  Card,
  Typography,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Title } = Typography;

const MedicalExaminationForm = ({ patientId, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);

  // Tự động load thông tin bệnh nhân khi có patientId
  useEffect(() => {
    if (patientId) {
      const fetchPatient = async () => {
        try {
          const res = await axios.get(`/api/patients/${patientId}`);
          setPatient(res.data);
          form.setFieldsValue({
            patientName: res.data.fullname,
            gender: res.data.gender,
            dateOfBirth: res.data.dateOfBirth ? dayjs(res.data.dateOfBirth) : null,
            phone: res.data.phone,
            address: res.data.address,
          });
        } catch (err) {
          message.error("Không tải được thông tin bệnh nhân");
        }
      };
      fetchPatient();
    }
  }, [patientId, form]);

  /// 
  

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        examinationDate: values.examinationDate?.format("YYYY-MM-DD HH:mm"),
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
      };
      await axios.post(`/api/patients/${patientId}/examinations`, payload);
      message.success("Lưu phiếu khám thành công!");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      message.error("Lưu thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{ maxWidth: 1400, margin: "0 auto" }}
      bodyStyle={{ padding: "24px" }}
    >
      <Title level={3} style={{ textAlign: "center", color: "#1890ff" }}>
        PHIẾU KHÁM BỆNH
      </Title>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Tabs defaultActiveKey="1" size="large">
          {/* ==================== TAB 1: THÔNG TIN HÀNH CHÍNH ==================== */}
          <TabPane
            tab={<span><UserOutlined /> Thông tin hành chính</span>}
            key="1"
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Ngày khám" name="examinationDate" initialValue={dayjs()}>
                  <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Số hồ sơ" name="recordNumber">
                  <Input prefix={<CalendarOutlined />} disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Họ và tên bệnh nhân" name="patientName" rules={[{ required: true }]}>
                  <Input disabled style={{ background: "#f5f5f5" }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Ngày sinh" name="dateOfBirth">
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} disabled />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Giới tính" name="gender">
                  <Select disabled>
                    <Select.Option value="Nam">Nam</Select.Option>
                    <Select.Option value="Nữ">Nữ</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Địa chỉ" name="address">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Điện thoại" name="phone">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Nghề nghiệp" name="job">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Loại khám" name="examinationType" initialValue="Khám thường">
                  <Select>
                    <Select.Option value="Khám thường">Khám thường</Select.Option>
                    <Select.Option value="Tái khám">Tái khám</Select.Option>
                    <Select.Option value="Khám VIP">Khám VIP</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Phòng khám" name="room" initialValue="P1">
                  <Select>
                    <Select.Option value="P1">P1</Select.Option>
                    <Select.Option value="P2">P2</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Bác sĩ khám" name="doctorId">
                  <Select placeholder="Chọn bác sĩ">
                    <Select.Option value="17">BS. Nguyễn Văn A</Select.Option>
                    <Select.Option value="18">BS. Trần Thị B</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* ==================== TAB 2: KẾT QUẢ KHÁM ==================== */}
          <TabPane
            tab={<span><MedicineBoxOutlined /> Kết quả khám</span>}
            key="2"
          >
            <Collapse defaultActiveKey={["1", "2", "3"]}>
              <Panel header="Khám lâm sàng" key="1">
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item label="Mạch" name="pulse"><Input suffix="lần/phút" /></Form.Item>
                    <Form.Item label="Nhiệt độ" name="temperature"><Input suffix="°C" /></Form.Item>
                    <Form.Item label="Huyết áp" name="bloodPressure"><Input suffix="mmHg" /></Form.Item>
                    <Form.Item label="Nhịp thở" name="respiratoryRate"><Input suffix="lần/phút" /></Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Cân nặng" name="weight"><Input suffix="kg" /></Form.Item>
                    <Form.Item label="Chiều cao" name="height"><Input suffix="cm" /></Form.Item>
                    <Form.Item label="Bệnh kèm theo" name="comorbidity">
                      <TextArea rows={3} />
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>

              <Panel header="Chẩn đoán" key="2">
                <Form.Item label="Bệnh theo ICD10" name="icd10">
                  <Select showSearch placeholder="Nhấn F2 để tìm ICD10" allowClear>
                    <Select.Option value="J00">J00 - Viêm mũi họng cấp</Select.Option>
                    <Select.Option value="J06">J06 - Nhiễm khuẩn hô hấp trên</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Chẩn đoán bệnh" name="diagnosis">
                  <TextArea rows={4} placeholder="Nhập chẩn đoán chi tiết..." />
                </Form.Item>
              </Panel>

              <Panel header="Kê đơn thuốc" key="3">
                <Form.Item label="Tiền sử dị ứng thuốc" name="drugAllergy">
                  <TextArea rows={2} style={{ background: "#fffbe6" }} />
                </Form.Item>
                <Form.Item label="Kê đơn thuốc" name="prescription">
                  <TextArea rows={6} placeholder="VD: Paracetamol 500mg - 2 viên x 3 lần/ngày x 5 ngày..." />
                </Form.Item>
              </Panel>

              <Panel header="Kết luận & hướng điều trị" key="4">
                <Form.Item label="Tiền khám" name="examinationFee">
                  <Input prefix="đ" />
                </Form.Item>
                <Form.Item label="Tiền thuốc" name="medicineFee">
                  <Input prefix="đ" />
                </Form.Item>
                <Form.Item label="Hướng điều trị" name="treatmentPlan">
                  <TextArea rows={4} />
                </Form.Item>
              </Panel>
            </Collapse>
          </TabPane>
        </Tabs>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Button size="large" style={{ marginRight: 12 }}>
            In phiếu khám
          </Button>
          <Button type="primary" size="large" htmlType="submit" loading={loading}>
            Lưu phiếu khám
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default MedicalExaminationForm;