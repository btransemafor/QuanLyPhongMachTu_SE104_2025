import React, { useState, useEffect } from "react";
import { debounce } from "lodash";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Popconfirm,
  Tag,
  Spin,
  Switch,
  Tooltip,
  Col,
  Row,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { FaPills } from "react-icons/fa";
import { medicinesAPI, unitsAPI } from "../../services/api";
import MedicineDetailModal from "./MedicineDetailModal";
import ColumnVisibilityDropdown from "../../components/ColumnSetting";
import useColumnVisibility from "../../components/hooks/useColumnVisibility";
import FileDropdown from "../../components/FileDropdown";
import moment from "moment";
import { useNavigate } from "react-router-dom";
const { Search } = Input;

const getLabelStatus = (status) => {
  const labels = {
    active: "Hoạt động",
    inactive: "Ngừng hoạt động",
    low_stock: "Dưới mức tồn kho",
    out_of_stock: "Hết hàng",
    expired: "Hết hạn",
    all: "Tất cả",
  };
  return labels[status];
};

const MedicineManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");

  // state cho xem chi tiết
  const [isDetailVisiable, setIsDetailVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate()

  const [status, setStatus] = useState({
    active: true,
    inactive: true,
    low_stock: true,
    out_of_stock: true,
    all: true,
  });
  const [filterUnitId, setFilterUnitId] = useState(null);

  const handleChange = (key) => {
    if (key === "all") {
      // Toggle tất cả checkbox theo trạng thái all hiện tại
      const newValue = !status.all;
      const newStatus = Object.fromEntries(
        Object.keys(status).map((k) => [k, k === "all" ? newValue : newValue])
      );
      setStatus(newStatus);
    } else {
      setStatus((prev) => {
        const updated = { ...prev, [key]: !prev[key] };

        // Nếu tất cả 4 checkbox (không tính all) đều true thì all = true, ngược lại all = false
        const allChecked = [
          "active",
          "inactive",
          "low_stock",
          "out_of_stock",
        ].every((k) => updated[k]);
        updated.all = allChecked;

        return updated;
      });
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchUnits();
  }, [
    pagination.current,
    pagination.pageSize,
    searchText,
    status,
    filterUnitId,
  ]);

  // handler
  const handleViewDetail = async (record) => {
    try {
      setLoading(true);
      // Giả sử API có endpoint lấy chi tiết theo id: medicinesAPI.getMedicineById
      const response = await medicinesAPI.getMedicine(record.medicine_id);

      if (response.data.success) {
        console.log(response.data.data);
        setSelectedMedicine(response.data.data); // lưu dữ liệu chi tiết

        setIsDetailVisible(true); // mở modal
      } else {
        message.error("Không thể tải chi tiết thuốc");
      }
    } catch (error) {
      console.error("Error fetching medicine detail:", error);
      message.error("Không thể tải chi tiết thuốc");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailVisible(false);
    setSelectedMedicine(null);
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await medicinesAPI.getMedicines({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        notSet: false,
        filterStatus: status,
        unit_id: filterUnitId,
      });

      if (response.data.success) {
        console.log("So luong thuoc fetch: ", response.data.data.length);
        setMedicines(response.data.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.totalItems,
        }));
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
      message.error("Không thể tải danh sách thuốc");
    } finally {
      setLoading(false);
    }
  };

  /// Hàm fetch danh sách đơn vị
  const fetchUnits = async () => {
    try {
      const response = await unitsAPI.getUnits(); // gọi API /api/units chẳng hạn
      if (response.data.success) {
        setUnits(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const handleAdd = () => {
    setEditingMedicine(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    form.setFieldsValue(medicine);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await medicinesAPI.deleteMedicine(id);

      if (response.data.success) {
        message.success("Xóa thuốc thành công!");
        fetchMedicines();
      }
    } catch (error) {
      console.error("Error deleting medicine:", error);
      message.error("Không thể xóa thuốc");
    }
  };

  const handleSubmit = async (values) => {
    try {
      let response;

      if (editingMedicine) {
        response = await medicinesAPI.updateMedicine(
          editingMedicine.medicine_id,
          values
        );
      } else {
        response = await medicinesAPI.createMedicine(values);
      }

      if (response.data.success) {
        message.success(
          editingMedicine
            ? "Cập nhật thuốc thành công!"
            : "Thêm thuốc thành công!"
        );
        setModalVisible(false);
        form.resetFields();
        fetchMedicines();
      }
    } catch (error) {
      console.error("Error caught:", error);

      if (error.response?.status === 409) {
        const errorMsg = error.response?.data?.message || "Thuốc đã tồn tại!";
        console.log("Showing error message:", errorMsg);
        message.warning({
          content: errorMsg,
          duration: 2,
          key: "medicine-error", // Key để tránh duplicate
        });
        return;
      }

      message.error("Có lỗi xảy ra!");
    }
  };
  // --- Search ------

  // debounce để giảm số lần gọi API khi gõ
  const handleSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 })); // reset page
    setSearchText(value);
  }, 300); // 300ms

  /// Define các columns

  const columns = [
    {
      title: "STT",
      key: "index",
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
    },

    {
      title: "Tồn tối thiểu",
      description: "Mức tồn kho tối thiểu cần nhập thêm thuốc",
      dataIndex: "min_stock_level",
      key: "min_stock_level",
    },

    {
      title: "Số lượng",
      description: "Số lượng",
      dataIndex: "stock_quantity",
      key: "stock_quantity",
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (_, record) => record.note || "-",
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

    {
      title: "Thao tác",
      key: "actions",
      width: 120,
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
          <Tooltip title="Sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            ></Button>
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc muốn xóa thuốc này?"
              onConfirm={() => handleDelete(record.medicine_id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger size="small" icon={<DeleteOutlined />}></Button>
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  /// -------- Gọi Hook -------
  // Bước 1: Gọi hook
  const { visibleColumns, setVisibleColumns, filteredColumns, resetColumns } =
    useColumnVisibility(columns);

  return (
    <div>
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: 0, fontSize: 25, fontWeight: 600 }}>
              Quản lý thuốc
            </h1>

            <FileDropdown
              dataExport={medicines}
              nameFile={`Danh_Sach_Thuoc_${moment().format(
                "YYYY-MM-DD_HH-mm-ss"
              )}`}
            />
          </div>

          <Space>
            <Search
              placeholder="Tìm kiếm thuốc"
              allowClear
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />

            {/* Unit Filter */}
            <Select
              placeholder="Lọc theo đơn vị"
              allowClear
              style={{ width: 80 }}
              value={filterUnitId}
              onChange={(value) => {
                setFilterUnitId(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              options={[
                { label: "Tất cả", value: null },
                ...units.map((unit) => ({
                  label: unit.unit_name,
                  value: unit.unit_id,
                })),
              ]}
            />
          </Space>

          <Space>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleAdd}
              style={{
                background: "#0e1182ff",
                border: "none",
              }}
            >
              {loading ? <Spin /> : "Thêm mới"}
            </Button>

            {/* Thêm dropdown */}
            <div style={{ textAlign: "right" }}>
              <ColumnVisibilityDropdown
                columns={columns}
                visibleColumns={visibleColumns}
                onVisibilityChange={setVisibleColumns}
                onReset={resetColumns}
              />
            </div>
          </Space>
        </div>

        <div className="flex gap-4 mb-4 h-10 items-center">
          {/*   <Text className="text-xl font-bold">Lọc: </Text> */}

          {/* ACTIVE */}
          <label
            htmlFor="checkboxInfo"
            className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
          >
            <span className="relative flex items-center">
              <input
                id="checkboxInfo"
                type="checkbox"
                checked={status.active}
                onChange={() => handleChange("active")}
                className="peer relative h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-gray-100 checked:border-green-500 checked:bg-green-500 focus:outline-none"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white ${
                  status.active ? "visible" : "invisible"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
            <span>{getLabelStatus("active")}</span>
          </label>

          {/* INACTIVE */}
          <label
            htmlFor="checkboxSuccess"
            className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
          >
            <span className="relative flex items-center">
              <input
                id="checkboxSuccess"
                type="checkbox"
                checked={status.inactive}
                onChange={() => handleChange("inactive")}
                className="peer relative h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-gray-100 checked:border-gray-500 checked:bg-gray-500 focus:outline-none"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white ${
                  status.inactive ? "visible" : "invisible"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
            <span>{getLabelStatus("inactive")}</span>
          </label>

          {/* Warning */}
          <label
            htmlFor="checkboxWarning"
            className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
          >
            <span className="relative flex items-center">
              <input
                id="checkboxWarning"
                type="checkbox"
                checked={status.low_stock}
                onChange={() => handleChange("low_stock")}
                className="peer relative h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-gray-100 checked:border-yellow-500 checked:bg-yellow-500 focus:outline-none"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white ${
                  status.low_stock ? "visible" : "invisible"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
            <span>{getLabelStatus("low_stock")}</span>
          </label>

          {/* Danger */}
          <label
            htmlFor="checkboxDanger"
            className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
          >
            <span className="relative flex items-center">
              <input
                id="checkboxDanger"
                type="checkbox"
                checked={status.out_of_stock}
                onChange={() => handleChange("out_of_stock")}
                className="peer relative h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-gray-100 checked:border-red-500 checked:bg-red-500 focus:outline-none"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white ${
                  status.out_of_stock ? "visible" : "invisible"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
            <span>{getLabelStatus("out_of_stock")}</span>
          </label>

          {/*   Tất cả  */}

          <label
            htmlFor="checkboxDanger"
            className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
          >
            <span className="relative flex items-center">
              <input
                id="checkboxDanger"
                type="checkbox"
                checked={status.all}
                onChange={() => handleChange("all")}
                className="peer relative h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-gray-100 checked:border-blue-500 checked:bg-blue-500 focus:outline-none"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white ${
                  status.all ? "visible" : "invisible"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
            <span>{getLabelStatus("all")}</span>
          </label>
        </div>

        <hr className="border-t border-gray-300 my-4" />

        <Table
          columns={filteredColumns}
          dataSource={medicines}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} thuốc`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize: pageSize || prev.pageSize,
              }));
            },
          }}
        />
      </Card>

      <Modal
        title={editingMedicine ? "Sửa thông tin thuốc" : "Thêm thuốc mới"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            {/* Tên thuốc */}
            <Col span={12}>
              <Form.Item
                name="medicine_name"
                label="Tên thuốc"
                rules={[
                  { required: true, message: "Tên thuốc không được để trống" },
                  { max: 150, message: "Tên thuốc phải dưới 150 ký tự" },
                  {
                    pattern: /^[A-Za-zÀ-ỹ0-9()./%+\-\/\s]+$/,
                    message: "Tên thuốc chứa ký tự không hợp lệ",
                  },
                  {
                    validator: (_, value) => {
                      if (value && /^\d+$/.test(value)) {
                        return Promise.reject(
                          "Tên thuốc không thể chỉ toàn số"
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Nhập tên thuốc" />
              </Form.Item>
            </Col>

            {/* Đơn vị */}
            <Col span={12}>
              <Form.Item
                name="unit_id"
                label="Đơn vị"
                rules={[{ required: true, message: "Vui lòng chọn đơn vị!" }]}
              >
                <Select
                  placeholder="Chọn đơn vị"
                  options={units.map((u) => ({
                    label: u.unit_name,
                    value: u.unit_id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Lượng tồn tối thiểu */}
            <Col span={12}>
              <Form.Item
                name="min_stock_level"
                label="Lượng tồn tối thiểu"
                rules={[
                  { required: true, message: "Vui lòng nhập tồn tối thiểu!" },
                ]}
              >
                <Input
                  type="number"
                  min={0}
                  placeholder="Nhập lượng tồn tối thiểu"
                />
              </Form.Item>
            </Col>

            {/* Hoạt động */}
            <Col span={12}>
              <Form.Item
                label="Hoạt động"
                name="is_active"
                initialValue={false}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          {/* Ghi chú */}
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea 
            rows={3} 
            placeholder="Nhập ghi chú bổ sung (tối đa 300 ký tự) " 
            maxLength={300}
            
            />
          </Form.Item>

          {/* Buttons */}
          <Form.Item style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" 
               style={{
                background: "#0e1182ff",
                border: "none",
              }}
              >
                {editingMedicine ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <MedicineDetailModal
    
        visible={isDetailVisiable}
        medicine={selectedMedicine}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default MedicineManagement;
