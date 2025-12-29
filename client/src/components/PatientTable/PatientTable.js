import React from "react";
import { Table, Tag } from "antd";
import styles from "./PatientTable.module.css";

const PatientTable = () => {
  const columns = [
    {
      title: "Họ và tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Tuổi",
      dataIndex: "age",
      key: "age",
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      render: (gender) => (
        <Tag color={gender === "Nam" ? "blue" : "pink"}>{gender}</Tag>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
  ];

  const data = [
    {
      key: 1,
      name: "Nguyễn Văn A",
      age: 32,
      gender: "Nam",
      phone: "0901234567",
    },
    {
      key: 2,
      name: "Trần Thị B",
      age: 25,
      gender: "Nữ",
      phone: "0932345678",
    },
  ];

  return (
    <div className={styles.tableWrapper}>
      <Table columns={columns} dataSource={data} bordered />
    </div>
  );
};

export default PatientTable;
