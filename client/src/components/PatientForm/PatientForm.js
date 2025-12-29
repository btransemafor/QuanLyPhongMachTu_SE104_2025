import React from "react";
import { Form, Input, Button, Select } from "antd";
import styles from "./PatientForm.module.css";

const { Option } = Select;

const PatientForm = ({ onCancel }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    console.log("Dữ liệu bệnh nhân:", values);
    form.resetFields();
    onCancel();
  };

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={handleSubmit}
      className={styles.form}
    >
      <Form.Item
        label="Họ và tên"
        name="name"
        rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Tuổi"
        name="age"
        rules={[{ required: true, message: "Vui lòng nhập tuổi" }]}
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        label="Giới tính"
        name="gender"
        rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
      >
        <Select placeholder="Chọn giới tính">
          <Option value="Nam">Nam</Option>
          <Option value="Nữ">Nữ</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Số điện thoại"
        name="phone"
        rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
      >
        <Input />
      </Form.Item>

      <div className={styles.footer}>
        <Button onClick={onCancel}>Hủy</Button>
        <Button type="primary" htmlType="submit">
          Lưu
        </Button>
      </div>
    </Form>
  );
};

export default PatientForm;
