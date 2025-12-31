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
import { medicinesAPI } from "../services/api";

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

const MedicineSearchModal = ({
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
  const fetchMedicines = useCallback(
    async (page = 1, pageSize = 10, search = "") => {
      try {
        setLoading(true);
        const res = await medicinesAPI.getMedicines({
          page,
          limit: pageSize,
          search: search.trim(),
        });

        if (res.data.success) {
          setData(res.data.data);
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize,
            total: res.data.pagination?.totalItems || res.data.data.length,
          }));
        }
      } catch (error) {
        message.error("Lỗi tải danh sách thuốc");
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load khi mở modal hoặc search thay đổi
  useEffect(() => {
    if (visible) {
      fetchMedicines(1, 10, debouncedSearchText);
    }
  }, [visible, debouncedSearchText, fetchMedicines]);

  // Xử lý tìm kiếm
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Xử lý chọn thuốc (click hoặc double click)
  const handleRowClick = useCallback(
    (record) => {
      try {
        if (!record) {
          message.error("Dữ liệu thuốc không hợp lệ");
          return;
        }
        onSelect(record); // TRẢ VỀ THUỐC CHO COMPONENT CHA
        setTimeout(() => {
          onCancel(); // Đóng modal
        }, 100);
      } catch (error) {
        message.error("Lỗi khi chọn thuốc");
        console.error(error);
      }
    },
    [onSelect, onCancel]
  );

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
    fetchMedicines(page, pageSize, debouncedSearchText);
  };

  // Cột bảng
  const columns = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Tên thuốc",
      dataIndex: "medicine_name",
      key: "medicine_name",
      sorter: (a, b) => a.medicine_name.localeCompare(b.medicine_name),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit_name",
      key: "unit",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "Tồn kho",
      dataIndex: "stock_quantity",
      key: "stock_quantity",
      width: 100,
      render: (qty) => (
        <Tag color={qty <= 10 ? "red" : qty <= 50 ? "orange" : "green"}>
          {qty}
        </Tag>
      ),
    },
    {
      title: "Tồn tối thiểu",
      dataIndex: "min_stock_level",
      key: "min_stock_level",
      width: 110,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const colors = {
          active: "green",
          inactive: "default",
          low_stock: "orange",
          out_of_stock: "red",
          expired: "volcano",
        };

        const labels = {
          active: "Hoạt động",
          inactive: "Ngừng hoạt động",
          low_stock: "Dưới mức tồn kho",
          out_of_stock: "Hết hàng",
          expired: "Hết hạn",
        };

        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <SearchOutlined className="text-lg" />
          <span className="font-semibold text-lg">Tìm kiếm thuốc</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      closeIcon={<span className="text-2xl">×</span>}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <Search
          placeholder="Nhập tên thuốc, mã, hoạt chất..."
          allowClear
          enterButton
          size="large"
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearchEnter}
          style={{ width: 380 }}
        />

        <Space>
          <Text type="secondary">
            {data.length > 0
              ? `${
                  (pagination.current - 1) * pagination.pageSize + 1
                }-${Math.min(
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
      </div>

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

      {/* Footer */}
      <div className="px-4 py-3 bg-white border-t text-right">
        <Space>
          <Button onClick={onCancel}>Đóng</Button>
        </Space>
      </div>
    </Modal>
  );
};

export default MedicineSearchModal;
