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
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
// Tạo component con riêng cho ô Select (rất quan trọng!)
const MedicineSelectCell = ({
  record,
  medicines,
  medicineOptions,
  updateMedicine,
  setVisibleModalMedicine
}) => {
  const selectRef = useRef(null);

  useEffect(() => {
    // Khi medicine_id bị set về null → ép AntD quên label cũ
    if (record.medicine_id == null && selectRef.current) {
      // Cách mạnh nhất: blur + focus để reset internal state
      selectRef.current.blur();
      setTimeout(() => selectRef.current?.focus(), 0);
    }
  }, [record.medicine_id]);

  return (
    <Select
      ref={selectRef}
      showSearch
      allowClear
      placeholder="Tìm và chọn thuốc..."
      value={record.medicine_id ?? undefined}
      options={medicineOptions}
      style={{ width: "100%" }}
      filterOption={(input, option) =>
        (option?.label ?? "")
          .toString()
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      onChange={(value) => {
        if (!value) {
          updateMedicine(record.id, {
            medicine_id: null,
            medicine_name: "",
            unit_name: "",
            quantity: 0,
          });
          return;
        }

        const med = medicines.find((m) => m.medicine_id === value);
        if (!med) return;

        if ((med.stock_quantity ?? 0) <= 0) {
          message.warning("Thuốc này hiện đã hết hàng!");
          updateMedicine(record.id, {
            medicine_id: null,
            medicine_name: "",
            unit_name: "",
            quantity: 0,
          });
          return;
        }

        updateMedicine(record.id, {
          medicine_id: med.medicine_id,
          medicine_name: med.medicine_name,
          unit_name: med.unit_name,
          quantity: 1,
          batches: [],
          usage_method_id: null,
        });
      }}
      // Key ép remount khi cần reset
      key={`${record.id}-${record.medicine_id || "empty"}`}
      dropdownMatchSelectWidth={false}
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
            onClick={setVisibleModalMedicine}
          >
            <PlusOutlined style={{ color: "#095e22" }} />
            Tìm kiếm thêm thuốc ...
          </div>
        </>
      )}
    />
  );
};

export default MedicineSelectCell;
