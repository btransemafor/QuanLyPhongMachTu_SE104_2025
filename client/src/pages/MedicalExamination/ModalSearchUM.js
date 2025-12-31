// src/components/MedicineSearchModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Input,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Pagination,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  SlidersOutlined,
} from "@ant-design/icons";
import { usageMethodsAPI } from '../../services/api'
import { CircleCheck, CircleX } from "lucide-react";

const { Text } = Typography;
const { Search } = Input;

// Hook debounce đơn giản
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const UsageMethodSearchModal = ({
  visible,
  onCancel,
  onSelect, // (medicine) => trả về thuốc đã chọn
  onCreateNew, // () => mở form tạo thuốc mới
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 400);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch dữ liệu
   const fetchUsageMethods = async () => {
      try {
        setLoading(true);
        const response = await usageMethodsAPI.getUsageMethods();
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        message.error("Không thể tải danh sách cách dùng");
      } finally {
        setLoading(false);
      }
    };

  // Load khi mở modal hoặc search thay đổi
  useEffect(() => {
    if (visible) {
      fetchUsageMethods();
    }
  }, [visible, debouncedSearchText]);

  // Xử lý tìm kiếm
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Xử lý chọn thuốc (click hoặc double click)
  const handleRowClick = (record) => {
    onSelect(record);   // TRẢ VỀ THUỐC CHO COMPONENT CHA
    onCancel();         // Đóng modal
  };

  const handleRowDoubleClick = (record) => {
    handleRowClick(record);
  };

  // Enter trong ô search → chọn dòng đầu tiên
  const handleSearchEnter = () => {
    if (data.length > 0) {
      handleRowClick(data[0]);
    }
  };

  // Thay đổi trang
  const handleTableChange = (page, pageSize) => {
    fetchUsageMethods(page, pageSize, debouncedSearchText);
  };

  // Cột bảng
  const columns = [
    {
      title: "STT",
      width: 30,
      align: "center",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Cách dùng",
      dataIndex: "usage_method_name",
      key: "usage_method_name",
      sorter: (a, b) => a.usage_method_name.localeCompare(b.usage_method_name),
       width: 60,
    }, 
     {
      title: "Kích hoạt",
      dataIndex: "is_active",
      key: "is_active",
      width: 70,
      render: (_, record) => {
        return record.is_active ? (
          <CircleCheck color="green" size={20} />
        ) : (
          <CircleX color="red" size={20} />
        );
      },
    },


  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
        
          <span className="font-semibold text-lg">Cách dùng</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      closeIcon={<span className="text-2xl">×</span>}
      bodyStyle={{ padding: 0 }}
    >
        <Space>
       
          <Text type="secondary">
            {data.length > 0
              ? `${(pagination.current - 1) * pagination.pageSize + 1}-${Math.min(
                  pagination.current * pagination.pageSize,
                  pagination.total
                )}`
              : "0"}{" "}
            / {pagination.total}
          </Text>
          <Pagination
            size="small"
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handleTableChange}
            showSizeChanger={false}
          />
        </Space>


      {/* Table */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ y: 500 }}
        size="middle"
        rowClassName="cursor-pointer hover:bg-blue-50 transition-colors"
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          onDoubleClick: () => handleRowDoubleClick(record),
        })}
      />

    </Modal>
  );
};

export default UsageMethodSearchModal;