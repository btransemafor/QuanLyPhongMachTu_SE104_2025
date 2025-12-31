import * as XLSX from "xlsx";
import React, { useState, useEffect, useCallback } from "react";
import {
  Popconfirm,
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Tag,
  Tooltip,
  Badge,
  Drawer,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  FilterOutlined,
  ClearOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { importReceiptsAPI, medicinesAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import FileDropdown from "../components/FileDropdown";
import useColumnVisibility from "../components/hooks/useColumnVisibility";
import ColumnVisibilityDropdown from "../components/ColumnSetting";
import { useToast } from "../contexts/ToastContext";
const { Search } = Input;
const { RangePicker } = DatePicker;

const ReceiptMedicineManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {toast} = useToast()

  // State management
  const [receipts, setReceipts] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [form] = Form.useForm();

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    status: null,
    supplier: null,
    created_by: null,
    date_from: null,
    date_to: null,
    sort_by: "receipt_date",
    sort_order: "DESC",
    page: 1,
    limit: 20,
  });

  // Debounced search
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMedicines();
    fetchReceipts();
  }, []);

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        handleFilterChange({ search: searchTerm, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch receipts with filters
  const fetchReceipts = useCallback(async (filterParams = filters) => {
    try {
      setLoading(true);

      // Build query params
      const queryParams = new URLSearchParams();
      Object.keys(filterParams).forEach((key) => {
        if (filterParams[key] !== null && filterParams[key] !== "") {
          queryParams.append(key, filterParams[key]);
        }
      });

      console.log(queryParams)

      const res = await importReceiptsAPI.getImportReceipts(
       queryParams
      );

      if (res.data.success) {
        setReceipts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Fetch receipts error:", error);
      toast.error("Không thể tải danh sách phiếu nhập");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await medicinesAPI.getMedicines();
      if (res.data.success) setMedicines(res.data.data);
    } catch (error) {
      console.error("Fetch medicines error:", error);
      toast.error("Không thể tải danh sách thuốc");
    }
  }, []);

  // Filter handlers
  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchReceipts(updatedFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      search: "",
      status: null,
      supplier: null,
      created_by: null,
      date_from: null,
      date_to: null,
      sort_by: "receipt_date",
      sort_order: "DESC",
      page: 1,
      limit: 20,
    };
    setFilters(defaultFilters);
    setSearchTerm("");
    form.resetFields();
    fetchReceipts(defaultFilters);
    toast.success("Đã xóa tất cả bộ lọc");
  };

  const handleApplyFilters = () => {
    const formValues = form.getFieldsValue();
    const newFilters = {
      ...filters,
      status: formValues.status || null,
      supplier: formValues.supplier || null,
      created_by: formValues.created_by || null,
      date_from: formValues.dateRange?.[0]
        ? formValues.dateRange[0].format("YYYY-MM-DD")
        : null,
      date_to: formValues.dateRange?.[1]
        ? formValues.dateRange[1].format("YYYY-MM-DD")
        : null,
      page: 1,
    };
    handleFilterChange(newFilters);
    setFilterDrawerVisible(false);
    toast.success("Đã áp dụng bộ lọc");
  };

  // Pagination handlers
  const handlePageChange = (page, pageSize) => {
    handleFilterChange({ page, limit: pageSize });
  };

  const handleSort = (column) => {
    const isSameColumn = filters.sort_by === column;
    let newSortOrder = "DESC";

    if (isSameColumn) {
      newSortOrder = filters.sort_order === "DESC" ? "ASC" : "DESC";
    }

    handleFilterChange({
      sort_by: column,
      sort_order: newSortOrder,
      page: 1,
    });
  };

  // CRUD operations
  const handleDeleteReceipt = async (id) => {
    try {
      await importReceiptsAPI.deleteImportReceipt(id);
      toast.success("Xóa phiếu nhập thành công");
      fetchReceipts();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Không thể xóa phiếu nhập";
      toast.error(errorMsg);
    }
  };

  const handleViewDetail = useCallback(async (record) => {
    try {
      setSelectedReceipt(null);
      const res = await importReceiptsAPI.getImportReceipt(
        record.import_receipt_id
      );

      if (res?.data?.success && res.data.data) {
        setSelectedReceipt(res.data.data);
        navigate(`/receipts/${record.import_receipt_id}`);
      } else {
        toast.warning("Không tìm thấy chi tiết phiếu nhập");
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết phiếu nhập:", error);
      toast.error("Không thể tải chi tiết phiếu nhập");
    }
  }, []);

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.supplier) count++;
    if (filters.created_by) count++;
    if (filters.date_from || filters.date_to) count++;
    return count;
  };

  // Table columns
  const columns = [
    {
      key: "id",
      title: "Mã phiếu",
      dataIndex: "import_receipt_id",
      width: 100,
      defaultVisible: true,
      render: (text) => <strong>#{text}</strong>,
    },
    {
      key: "receipt_date",
      title: () => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => handleSort("receipt_date")}
        >
          Ngày nhập{" "}
          {filters.sort_by === "receipt_date" &&
            (filters.sort_order === "ASC" ? "↑" : "↓")}
        </div>
      ),
      dataIndex: "receipt_date",
      width: 140,
      render: (d) => moment(d).format("DD/MM/YYYY HH:mm"),
      defaultVisible: true,
    },
    {
      key: "created_by",
      title: "NV lập",
      dataIndex: "created_by",
      width: 150,
      defaultVisible: true,
    },
    {
      key: "supplier_name",
      title: "Nhà cung cấp",
      dataIndex: "supplier_name",
      width: 200,
      defaultVisible: true,
    },
    {
      key: "status",
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s) => (
        <Tag color={s === "confirmed" ? "green" : s === "draft" ? "orange" : "red"}>
          {s === "confirmed" ? "Đã xác nhận" : s === "draft" ? "Nháp" : s}
        </Tag>
      ),
      defaultVisible: true,
    },
    {
      key: "total_amount",
      title: () => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => handleSort("total_amount")}
        >
          Tổng tiền{" "}
          {filters.sort_by === "total_amount" &&
            (filters.sort_order === "ASC" ? "↑" : "↓")}
        </div>
      ),
      dataIndex: "total_amount",
      width: 150,
      render: (v) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(v),
      defaultVisible: true,
    },
    {
      key: "note",
      title: "Ghi Chú",
      dataIndex: "note",
      width: 200,
      defaultVisible: true,
    },
    {
      key: "created_at",
      title: () => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => handleSort("created_at")}
        >
          Thời gian tạo{" "}
          {filters.sort_by === "created_at" &&
            (filters.sort_order === "ASC" ? "↑" : "↓")}
        </div>
      ),
      dataIndex: "created_at",
      render: (value) =>
        value ? moment(value).format("DD-MM-YYYY HH:mm") : "-",
      width: 160,
      defaultVisible: false,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              style={{
                backgroundColor: "#0e1182ff",
                borderColor: "#0e1182ff",
                color: "white",
              }}
            />
          </Tooltip>

          {record.status === "draft" && (
            <Tooltip title="Sửa">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  navigate(`/receipts/${record.import_receipt_id}/edit`);
                }}
              />
            </Tooltip>
          )}

          <Popconfirm
            title="Xóa phiếu nhập"
            description={`Bạn có chắc muốn xóa phiếu #${record.import_receipt_id}?`}
            onConfirm={() => handleDeleteReceipt(record.import_receipt_id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button size="small" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const { visibleColumns, setVisibleColumns, filteredColumns, resetColumns } =
    useColumnVisibility(columns);

  // Active filter tags
  const renderActiveFilters = () => {
    const tags = [];

    if (filters.status) {
      tags.push(
        <Tag
          key="status"
          closable
          onClose={() => handleFilterChange({ status: null, page: 1 })}
          color="blue"
        >
          Trạng thái: {filters.status}
        </Tag>
      );
    }

    if (filters.supplier) {
      tags.push(
        <Tag
          key="supplier"
          closable
          onClose={() => handleFilterChange({ supplier: null, page: 1 })}
          color="green"
        >
          NCC: {filters.supplier}
        </Tag>
      );
    }

    if (filters.created_by) {
      tags.push(
        <Tag
          key="created_by"
          closable
          onClose={() => handleFilterChange({ created_by: null, page: 1 })}
          color="purple"
        >
          Người tạo: {filters.created_by}
        </Tag>
      );
    }

    if (filters.date_from && filters.date_to) {
      tags.push(
        <Tag
          key="dateRange"
          closable
          onClose={() =>
            handleFilterChange({ date_from: null, date_to: null, page: 1 })
          }
          color="orange"
        >
          {moment(filters.date_from).format("DD/MM/YYYY")} -{" "}
          {moment(filters.date_to).format("DD/MM/YYYY")}
        </Tag>
      );
    }

    return tags;
  };

  return (
    <div>
      <Card>
        {/* Header */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
              Quản lý nhập thuốc
            </h1>
            <FileDropdown
              isHidden={true}
              dataExport={receipts}
              nameFile={`Danh_Sach_Phieu_nhap_${moment().format(
                "YYYY-MM-DD_HH-mm-ss"
              )}`}
            />
          </div>

          <Space>
            <Search
              placeholder="Tìm kiếm mã phiếu, NCC, ghi chú..."
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />

            <Badge count={getActiveFilterCount()} offset={[-5, 5]}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
              >
                Bộ lọc
              </Button>
            </Badge>

            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => navigate("/receipts/new")}
              style={{
                background: "#0e1182ff",
                border: "none",
              }}
            >
              Thêm phiếu nhập
            </Button>

            <ColumnVisibilityDropdown
              columns={columns}
              visibleColumns={visibleColumns}
              onVisibilityChange={setVisibleColumns}
              onReset={resetColumns}
            />
          </Space>
        </div>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "#f0f5ff",
              borderRadius: 8,
              border: "1px solid #d6e4ff",
            }}
          >
            <Space size="small" wrap>
              <span style={{ fontWeight: 500, color: "#1890ff" }}>
                Bộ lọc đang áp dụng:
              </span>
              {renderActiveFilters()}
              <Button
                type="link"
                size="small"
                icon={<ClearOutlined />}
                onClick={handleClearFilters}
                style={{ color: "#ff4d4f" }}
              >
                Xóa tất cả
              </Button>
            </Space>
          </div>
        )}

        {/* Table */}
        <Table
          columns={filteredColumns}
          dataSource={receipts}
          rowKey="import_receipt_id"
          loading={loading}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.itemsPerPage,
            total: pagination.totalItems,
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong tổng ${total} phiếu`,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: handlePageChange,
            showQuickJumper: true,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Advanced Filter Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FilterOutlined style={{ fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              Bộ lọc nâng cao
            </span>
          </div>
        }
        placement="right"
        width={400}
        open={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        footer={
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setFilterDrawerVisible(false)}>Hủy</Button>
            <Button onClick={handleClearFilters} icon={<ClearOutlined />}>
              Xóa bộ lọc
            </Button>
            <Button
              type="primary"
              onClick={handleApplyFilters}
              icon={<CheckCircleOutlined />}
            >
              Áp dụng
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Trạng thái" name="status">
            <Select
              placeholder="Chọn trạng thái"
              allowClear
              options={[
                { label: "Nháp", value: "draft" },
                { label: "Đã xác nhận", value: "confirmed" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Nhà cung cấp" name="supplier">
            <Input placeholder="Nhập tên nhà cung cấp" allowClear />
          </Form.Item>

        {/*   <Form.Item label="Người tạo" name="created_by">
            <Input placeholder="Nhập tên người tạo" allowClear />
          </Form.Item> */}

          <Form.Item label="Khoảng thời gian" name="dateRange">
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Form.Item>

          <Form.Item label="Sắp xếp theo">
            <Select
              value={filters.sort_by}
              onChange={(value) =>
                handleFilterChange({ sort_by: value, page: 1 })
              }
              options={[
                { label: "Ngày nhập", value: "receipt_date" },
                { label: "Thời gian tạo", value: "created_at" },
                { label: "Tổng tiền", value: "total_amount" },
                { label: "Mã phiếu", value: "receipt_id" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Thứ tự">
            <Select
              value={filters.sort_order}
              onChange={(value) =>
                handleFilterChange({ sort_order: value, page: 1 })
              }
              options={[
                { label: "Giảm dần", value: "DESC" },
                { label: "Tăng dần", value: "ASC" },
              ]}
            />
          </Form.Item>

          <div
            style={{
              padding: 12,
              background: "#f0f5ff",
              borderRadius: 8,
              fontSize: 13,
              color: "#595959",
            }}
          >
            💡 <strong>Mẹo:</strong> Có thể kết hợp nhiều bộ lọc để tìm kiếm
            chính xác hơn
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default ReceiptMedicineManagement;