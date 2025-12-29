// src/pages/SettingsFinance.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  InputNumber,
  Button,
  message,
  Row,
  Col,
  Typography,
  Space,
  Select,
  Switch,
  Divider,
  Tag,
} from "antd";
import {
  SaveOutlined,
  DollarCircleOutlined,
  PercentageOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { settingsAPI } from "../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsFinance = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const response = await settingsAPI.getSettings();
      if (response.data.success) {
        const data = response.data.data;
        form.setFieldsValue({
          consultation_fee: parseFloat(data.ConsultationFee?.value) || 150000,
          selling_price_ratio: parseFloat(data.SellingPriceRatio?.value) || 1.3,
          max_patients_per_day: parseFloat(data.MaxPatientsPerDay?.value || 10),
          /* vat_rate: parseFloat(data.VATRate?.value) || 10,
          max_discount_percent:
            parseFloat(data.MaxDiscountPercent?.value) || 20,
          round_to_nearest: data.RoundToNearest?.value || 1000,
          currency: data.Currency?.value || "VND",
          auto_apply_discount: data.AutoApplyDiscount?.value === "true", */
        });
      }
    } catch (error) {
      message.error("Không thể tải cài đặt tài chính");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await settingsAPI.updateSettings(values);
      message.success("Cập nhật cài đặt tài chính thành công!");
    } catch (error) {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ padding: 24 }}>
        <Card loading />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#f9f9f9", minHeight: "100vh" }}>
      <Title
        level={2}
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 600,
          marginBottom: "15px",
        }}
      >
        Cấu hình hệ thống
      </Title>

      <div>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[24, 24]}>
            {/* === PHÍ KHÁM BỆNH === */}
            <Col xs={24} md={12}>
              <Card
                title="Phí khám bệnh"
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <Form.Item
                  name="consultation_fee"
                  label="Phí khám mặc định"
                  rules={[
                    { required: true, message: "Vui lòng nhập phí khám!" },
                  ]}
                  tooltip="Áp dụng cho mọi bệnh nhân nếu không ghi đè"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    step={10000}
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                    addonAfter="VND"
                  />
                </Form.Item>
              </Card>
            </Col>

            {/* === GIÁ BÁN THUỐC === */}
            <Col xs={24} md={12}>
              <Card
                title="Giá bán thuốc"
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <Form.Item
                  name="selling_price_ratio"
                  label="Tỷ lệ giá bán / giá nhập"
                  rules={[{ required: true, message: "Vui lòng nhập tỷ lệ!" }]}
                  tooltip="VD: 1.3 = bán 130.000 nếu nhập 100.000"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    step={0.05}
                    precision={2}
                    addonAfter="lần"
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Card
            title="Số lượng bệnh nhân tối đa trong 1 ngày"
            style={{
              marginBottom: 16,
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <Form.Item
              name="max_patients_per_day"
              label="Số lượng bệnh nhân"
              rules={[{ required: true, message: "Vui lòng nhập số lượng !" }]}
              /* tooltip="VD: 1.3 = bán 130.000 nếu nhập 100.000" */
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                step={1}
                addonAfter="người"
              />
            </Form.Item>
          </Card>

          {/* === NÚT LƯU === */}
          <div style={{ textAlign: "right" }}>
            <Space>
{/*               <Button onClick={() => form.resetFields()}>Hủy</Button> */}
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                 style={{
                background: "#0e1182ff",
                border: "none",
              }}
              >
                Lưu cài đặt
              </Button>
            </Space>
          </div>
        </Form>
      </div>

      {/* === GỢI Ý === */}
      <Card  style={{
              marginBottom: 16,
              marginTop:16,
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}>
        <Space direction="vertical" size={8}>
          <Text strong>
            <TagsOutlined /> Gợi ý:
          </Text>
          <Text type="secondary">
            • Tỷ lệ giá bán: <Tag color="orange">1.3 - 1.5</Tag> là hợp lý
           {/*  <br />• VAT thuốc: <Tag color="green">10%</Tag> (theo quy định)
            <br />• Làm tròn: <Tag color="blue">1.000 VND</Tag> → dễ tính tiền
            mặt */}
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default SettingsFinance;
