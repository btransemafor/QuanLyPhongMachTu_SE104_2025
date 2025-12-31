import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Row,
  Col,
  Button,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ClearOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { invoicesAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import InvoiceModal from "./invoices/invoice_modal";
import { useAuth } from "../contexts/AuthContext";
import FileDropdown from "../components/FileDropdown";
import { useToast } from "../contexts/ToastContext";
const { RangePicker } = DatePicker;
const { Option } = Select;

const InvoiceManagement = () => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const { user } = useAuth();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    payment_status: "",
    dateRange: null,
  });
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    totalRevenue: 0,
  });

  const [visibleInvoiceModal, setVisibleInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const navigate = useNavigate();
  const {toast} = useToast(); 

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.start_date = filters.dateRange[0].format("YYYY-MM-DD");
        params.end_date = filters.dateRange[1].format("YYYY-MM-DD");
      }

      if (filters.search) {
        params.search = filters.search; 
      }

      const response = await invoicesAPI.getInvoices(params);
      if (response.data.success) {
        console.log("Toi danf fetch hoa don ne: ", response.data.data);
        setInvoices(response.data.data);
        setPagination((prev) => ({
          ...prev,
          total:
            response.data.pagination?.totalItems || response.data.data.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Không thể tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.start_date = filters.dateRange[0].format("YYYY-MM-DD");
        params.end_date = filters.dateRange[1].format("YYYY-MM-DD");
      }

      if (filters.search) {
        params.search = filters.search;
      }

      if (filters.payment_status) {
        params.payment_status = filters.payment_status;
      }

      const response = await invoicesAPI.getStats(params);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: null , payment_status:null, dateRange: null });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const handlePayment = async (invoice_id) => {
    if (
      user?.role_name?.toLowerCase() !== "receptionist" &&
      user?.role_name?.toLowerCase() !== "admin"
    ) {
      toast.error(
        "Chỉ lễ tân hoặc quản trị viên mới có thể xác nhận thanh toán"
      );
      return;
    }

    try {
      const response = await invoicesAPI.payInvoice(invoice_id);

      if (response.data.success) {
        toast.success("Thanh toán thành công");
        await fetchInvoices();
        await fetchStats();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error pay invoice:", error);
      toast.error("Không thể thanh toán hóa đơn");
    }
  };

  const handleDeleteInvoice = async (invoice_id) => {
    if (
      user?.role_name?.toLowerCase() !== "receptionist" &&
      user?.role_name?.toLowerCase() !== "admin"
    ) {
      toast.error(
        "Chỉ lễ tân hoặc quản trị viên mới có thể xóa hóa đơn"
      );
      return;
    }
    try {
      const response = await invoicesAPI.deleteInvoice(invoice_id);
      if (response.data.success) {
        toast.success("Xóa hóa đơn thành công");
        await fetchInvoices();
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Không thể xóa hóa đơn");
    }
  };

  const columns = [
    {
      title: 'STT', 
      dataIndex: 'index', 
      key: 'index', 
      width: 40,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      defaultVisible: true,
    }, 
    {
      title: "Số hóa đơn",
      dataIndex: "invoice_code",
      key: "invoice_code",
      width: 100,
      render: (text) => <span className="text-sm font-medium">{text}</span>,
    },
    {
      title: "Bệnh nhân",
      dataIndex: "patient_name",
      key: "patient_name",
      width: 100,
      render: (_, record) => (
        <div>
          <div className=" text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {record.patient_name?.[0] || "P"}
            </div>
            {record.patient_name}
          </div>
          <span className="text-xs text-gray-500">ID: {record.patient_id}</span>
        </div>
      ),
      sorter: (a, b) => a.patient_name.localeCompare(b.patient_name),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 60,
    },
    {
      title: "Ngày lập",
      dataIndex: "created_at",
      key: "created_at",
      width: 70,
      render: (date) => (
        <div>
          <div className=" flex items-center gap-2">
            <CalendarOutlined className="text-green-600" />
            {moment(date).format("DD/MM/YYYY")}
          </div>
          <span className="text-xs text-gray-500">
            {moment(date).format("HH:mm")}
          </span>
        </div>
      ),

      sorter: (a, b) =>
        moment(a.created_at).valueOf() - moment(b.created_at).valueOf(),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 60,
      align: "right",
      render: (amount) => (
        <span className="font-medium ">{formatCurrency(amount)}</span>
      ),

      sorter: (a, b) =>
        a.total_amount > b.total_amount ? a.total_amount : b.total_amount,
    },
    {
      title: "Trạng thái",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 70,
      render: (status) => {
        const isPaid = status === "paid";
        return (
          <Tag
            icon={isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            color={isPaid ? "success" : "red"}
            className="text-xs"
          >
            {isPaid ? "Đã thanh toán" : "Chờ thanh toán"}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 50,
      fixed: "right",
      render: (_, record) => (
        <Space className="flex  justify-center">
          {record.payment_status == "paid" ? (
            <Tooltip title="Xem chi tiết hóa đơn">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  // navigate(`/invoices/${record.invoice_id}`)
                  setSelectedInvoice(record.invoice_id);
                  console.log("Ban dang chon invoice: ", record.invoice_id);
                  setVisibleInvoiceModal(true);
                }}
                style={{
                  backgroundColor: "#0e1182",
                  borderColor: "#0e1182",
                  color: "white",
                }}
                className="hover:opacity-90"
              />
            </Tooltip>
          ) : (
            <Space>
              <Tooltip title="Xem chi tiết hóa đơn">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    //navigate(`/invoices/${record.invoice_id}`)
                    setSelectedInvoice(record.invoice_id);
                    setVisibleInvoiceModal(true);
                  }}
                  style={{
                    backgroundColor: "#0e1182",
                    borderColor: "#0e1182",
                    color: "white",
                  }}
                  className="hover:opacity-90"
                />
              </Tooltip>
              <Tooltip title="Xác nhận thanh toán">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                  onClick={() => {
                    handlePayment(record.invoice_id);
                  }}
                />
              </Tooltip>

              <Tooltip title="Xóa">
                <Popconfirm
                  title="Bạn có chắc muốn xóa hóa đơn này?"
                  onConfirm={() => handleDeleteInvoice(record.invoice_id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                  ></Button>
                </Popconfirm>
              </Tooltip>
            </Space>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-1">
      <div className="max-w-full mx-auto space-y-8">
        {/* Header */}
        <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <FileTextOutlined className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý hóa đơn
              </h1>
              <p className="text-gray-600 mt-1">
                Theo dõi và quản lý tất cả hóa đơn khám bệnh
              </p>
            </div>
          </div>

          <FileDropdown
            isHidden={true}
            dataExport={invoices}
            nameFile={`Danh_Sach_HoaDon_${moment().format(
              "YYYY-MM-DD_HH-mm-ss"
            )}`}
          />
        </div>

        {/* Stats Cards - Gradient đẹp như MedicalRecords */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm">Tổng hóa đơn</p>
                  <p className="text-4xl font-bold mt-2">{stats.total}</p>
                </div>
                <DollarOutlined className="text-5xl opacity-30" />
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-orange-100 text-sm">Tổng doanh thu</p>
                  <p className="text-4xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarOutlined className="text-5xl opacity-30" />
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Đã thanh toán</p>
                  <p className="text-4xl font-bold mt-2">{stats.paid}</p>
                </div>
                <CheckCircleOutlined className="text-5xl opacity-30" />
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-purple-100 text-sm">Chờ thanh toán</p>
                  <p className="text-4xl font-bold mt-2">{stats.pending}</p>
                </div>
                <ClockCircleOutlined className="text-5xl opacity-30" />
              </div>
            </div>
          </Col>
        </Row>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <Space wrap size={16} className="">
            <Input
              placeholder="Tìm bệnh nhân, số hóa đơn..."
              allowClear
              prefix={<SearchOutlined className="text-gray-400" />}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              style={{ width: 340 }}
              size="large"
              className="rounded-xl"
            />
            <Select
              placeholder="Trạng thái thanh toán"
              allowClear
              style={{ width: 200 }}
              size="large"
              className="rounded-xl"
              value={filters.payment_status || undefined}  // Thêm value
              onChange={(v) => handleFilterChange("payment_status", v)}
            >
              <Option value="pending">Chờ thanh toán</Option>
              <Option value="paid">Đã thanh toán</Option>
            </Select>
            <RangePicker
              size="large"
              className="rounded-xl"
              placeholder={["Từ ngày", "Đến ngày"]}
               value={filters.dateRange}  // Thêm value
              onChange={(dates) => handleFilterChange("dateRange", dates)}
            />
            <Button
              icon={<ClearOutlined />}
              onClick={clearFilters}
              size="large"
              className="rounded-xl"
            >
              Xóa bộ lọc
            </Button>
          </Space>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <Table
            columns={columns}
            dataSource={invoices}
            loading={loading}
            rowKey="invoice_id"
            pagination={{
              ...pagination,
              position: ["bottomCenter"],
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ["10", "15", "25", "50"],
              showTotal: (total, range) => (
                <span className="text-gray-600">
                  Hiển thị{" "}
                  <strong>
                    {range[0]}-{range[1]}
                  </strong>{" "}
                  trong tổng <strong>{total}</strong> hóa đơn
                </span>
              ),
            }}
            onChange={(p) => {
              setPagination({
                current: p.current,
                pageSize: p.pageSize,
                total: pagination.total,
              });
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      </div>

      <InvoiceModal
        visible={visibleInvoiceModal}
        invoiceId={selectedInvoice}
        onClose={() => {
          setVisibleInvoiceModal(false);
        }}
      />
    </div>
  );
}
export default InvoiceManagement;

