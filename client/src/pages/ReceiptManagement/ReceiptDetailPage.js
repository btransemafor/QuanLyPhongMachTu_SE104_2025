// src/pages/ReceiptDetailPage.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  Table,
  Row,
  Col,
  Typography,
  Divider,
  message,
  Popconfirm,
  Descriptions,
  Badge,
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { importReceiptsAPI } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";

const { Title, Text } = Typography;

const ReceiptDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true); // Mới: ẩn/hiện sidebar
  const {toast} = useToast()
  useEffect(() => {
    fetchReceiptDetail();
  }, [id]);

  const fetchReceiptDetail = async () => {
    try {
      setLoading(true);
      const res = await importReceiptsAPI.getImportReceipt(id);
      if (res?.data?.success) {
        console.log("Data", res.data.data); 
        setReceipt(res.data.data);
      } else {
        toast.error("Không tìm thấy phiếu nhập");
        navigate("/receipts");
      }
    } catch (err) {
      toast.error("Lỗi tải chi tiết phiếu nhập");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      await importReceiptsAPI.updateImportReceipt(receipt.import_receipt_id, {"status": 'confirmed'})
      toast.success("Đã xác nhận nhập kho thành công!");
      fetchReceiptDetail();
    } catch {
      toast.error("Xác nhận thất bại");
    }
  };

  const handleDelete = async () => {
    try {
      await importReceiptsAPI.deleteReceipt(id);
      toast.success("Đã xóa phiếu nhập");
      navigate("/receipts");
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 text-xl">
        Đang tải phiếu nhập...
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-10 text-center text-red-500 text-xl">
        Không tìm thấy phiếu nhập!
      </div>
    );
  }

  const statusConfig = {
    draft: { color: "orange", text: "Nháp", icon: null },
    confirmed: { color: "green", text: "Đã nhập kho", icon: null },
    cancelled: { color: "red", text: "Đã hủy", icon: null },
  };

  const currentStatus = statusConfig[receipt.status] || statusConfig.draft;

  const columns = [
    { title: "STT", width: 60, render: (_, __, i) => i + 1 },
    {
      title: "Mã thuốc",
      dataIndex: "medicine_id",
      width: 80,
      render: (text) => <Tag color="blue">{text || "-"}</Tag>,
    },
    {
      title: "Tên thuốc",
      dataIndex: "medicine_name",
      width: 140,
      render: (text, record) => (
        <div>
          <div className="font-semibold">{text}</div>
          {record.unit_name && (
            <Text type="secondary" className="text-xs">
              Đơn vị: {record.unit_name}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "SL",
      dataIndex: "quantity",
      width: 80,
      align: "center",
      render: (qty) => (
        <Tag color="cyan" className="font-bold">
          {qty}
        </Tag>
      ),
    },
    {
      title: "Giá nhập",
      dataIndex: "unit_price",
      width: 120,
      align: "right",
      render: (price) => (
        <span className="font-medium">
          {Number(price).toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    {
      title: "Thành tiền",
      width: 120,
      align: "right",
      render: (_, record) => (
        <Text strong className="text-green-600 text-lg">
          {(record.quantity * record.unit_price).toLocaleString("vi-VN")} ₫
        </Text>
      ),
    },
    {
      title: "Hạn dùng",
      dataIndex: "expiry_date",
      width: 110,
      render: (date) =>
        date ? (
          moment(date).format("DD/MM/YYYY")
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Số lô",
      dataIndex: "batch_code",
      width: 60,
      render: (code) => <Tag>{code || "-"}</Tag>,
    },

    {
      title: 'Ghi chú', 
      dataIndex: 'note_batch', 
      width: 130, 
    }
  ];

  const totalAmount =
    receipt.items?.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    ) || 0;

  const totalItems = receipt.items?.length || 0;
  const totalQuantity = receipt.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-0 md:p-6">
      {/* Header*/}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl p-8 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div>
              <h2 level={2} className="text-white mb-1 !text-3xl font-bold">
                PHIẾU NHẬP KHO #{receipt.import_receipt_id || receipt.id}
              </h2>
              <Text className="text-indigo-100 text-lg">
                Ngày lập:{" "}
                {moment(receipt.created_at).format("DD/MM/YYYY HH:mm")}
              </Text>
            </div>
          </div>

          <Space size="middle">
            {receipt.status === "draft" && (
              <>
                <Button
                  size="large"
                  icon={<CheckCircleOutlined />}
                  className="
                            bg-[#0e1182] 
                            hover:bg-green-600 
                            border-none 
                            text-white 
                            font-medium
                            rounded-lg
                        "
                  onClick={handleConfirmReceipt}
                >
                  Xác nhận nhập kho
                </Button>

                <Button
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() =>
                    navigate(
                      `/receipts/${receipt.import_receipt_id || id}/edit`
                    )
                  }
                >
                  Sửa phiếu
                </Button>
              </>
            )}
            <Button
              size="large"
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              className=" bg-[#0e1182]  text-white  border-none"
            >
              In phiếu
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[10, 24]}>
        {/* Sidebar trái – có thể ẩn/hiện */}
        <Col
          xs={24}
          lg={sidebarVisible ? 8 : 0}
          className="transition-all duration-300"
        >
          {sidebarVisible && (
            <Card
              className="shadow-xl rounded-2xl h-fit sticky top-6"
              title={
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">
                    Thông tin phiếu nhập
                  </span>
                  <Button
                    type="text"
                    icon={
                      sidebarVisible ? (
                        <EyeInvisibleOutlined />
                      ) : (
                        <EyeOutlined />
                      )
                    }
                    onClick={() => setSidebarVisible(!sidebarVisible)}
                    size="small"
                  />
                </div>
              }
            >
              <Descriptions column={1} bordered size="middle" className="mb-4">
                <Descriptions.Item label="Trạng thái">
                  <Tag
                    color={currentStatus.color}
                    className="font-bold text-base"
                  >
                    {currentStatus.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Nhà cung cấp">
                  <Text strong className="text-lg">
                    {receipt.supplier_name}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày nhập kho">
                  <Space>
                    <CalendarOutlined className="text-blue-600" />
                    <Text strong>
                      {moment(receipt.receipt_date).format("DD/MM/YYYY HH:mm")}
                    </Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Người lập phiếu">
                  <Space>
                    <UserOutlined className="text-green-600" />
                    <Text strong>{receipt.created_by || "Không xác định"}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú">
                  {receipt.note || (
                    <Text type="secondary">Không có ghi chú</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>

              {receipt.status === "draft" && (
                <Popconfirm
                  title="Xóa phiếu nhập này vĩnh viễn?"
                  onConfirm={handleDelete}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger block icon={<DeleteOutlined />}>
                    Xóa phiếu nhập
                  </Button>
                </Popconfirm>
              )}
            </Card>
          )}
        </Col>

        {/* Bảng danh sách thuốc */}
        <Col
          xs={24}
          lg={sidebarVisible ? 16 : 24}
          className="transition-all duration-300 "
        >
          <Card
            className="shadow-2xl rounded-2xl pl-1 pr-1 pt-1 pb-1"
            title={
              <div className="flex justify-between items-center">
                <span className="!text-lg font-bold ">
                  Danh sách thuốc nhập ({totalItems} loại)
                </span>
                {!sidebarVisible && (
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => setSidebarVisible(true)}
                  >
                    Hiện thông tin
                  </Button>
                )}
              </div>
            }
          >
            <Table
              columns={columns}
              dataSource={receipt.items || []}
              pagination={false}
              rowKey="batch_id"
              scroll={{ x: 1000 }}
              className="mb-8"
              bordered
            />

            {/* Tổng kết đẹp lung linh */}
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 p-8 rounded-2xl border-2 border-emerald-200">
              <Row justify="space-between" align="middle">
                <Col>
                  <Space direction="vertical" size="middle">
                    <div>
                      <Text className="text-gray-600 text-lg">
                        Tổng số loại thuốc:
                      </Text>
                      <Tag
                        color="purple"
                        className="ml-3 text-lg font-bold px-4 py-1"
                      >
                        {totalItems}
                      </Tag>
                    </div>
                    <div>
                      <Text className="text-gray-600 text-lg">
                        Tổng số lượng:
                      </Text>
                      <Tag
                        color="orange"
                        className="ml-3 text-lg font-bold px-4 py-1"
                      >
                        {totalQuantity}
                      </Tag>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <div className="text-right">
                    <Text className="text-gray-500 text-lg">
                      TỔNG TIỀN NHẬP KHO
                    </Text>
                    <div className="text-2xl font-extrabold text-emerald-600 mt-3">
                      {totalAmount.toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* In phiếu đẹp (ẩn) */}
      <div className="hidden print:block print:p-10 print:bg-white">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            PHIẾU NHẬP KHO THUỐC
          </h2>
          <p className="text-lg">
            Mã phiếu: <strong>#{receipt.import_receipt_id}</strong>
          </p>
          <p>
            Ngày nhập: {moment(receipt.receipt_date).format("DD/MM/YYYY HH:mm")}
          </p>
          <p>Nhà cung cấp: {receipt.supplier_name}</p>
        </div>
        <table className="w-full border-collapse border-2 border-gray-800">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-600 px-4 py-3">STT</th>
              <th className="border border-gray-600 px-4 py-3">Tên thuốc</th>
              <th className="border border-gray-600 px-4 py-3">SL</th>
              <th className="border border-gray-600 px-4 py-3">Đơn giá</th>
              <th className="border border-gray-600 px-4 py-3">Thành tiền</th>
              <th className="border border-gray-600 px-4 py-3">Hạn dùng</th>
              <th className="border border-gray-600 px-4 py-3">Số lô</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, i) => (
              <tr key={i} className="text-center">
                <td className="border border-gray-600 py-2">{i + 1}</td>
                <td className="border border-gray-600 py-2 text-left pl-4">
                  {item.medicine_name}
                </td>
                <td className="border border-gray-600 py-2">{item.quantity}</td>
                <td className="border border-gray-600 py-2">
                  {item.unit_price.toLocaleString()}
                </td>
                <td className="border border-gray-600 py-2 font-bold">
                  {(item.quantity * item.unit_price).toLocaleString()}
                </td>
                <td className="border border-gray-600 py-2">
                  {item.expiry_date
                    ? moment(item.expiry_date).format("DD/MM/YYYY")
                    : "-"}
                </td>
                <td className="border border-gray-600 py-2">
                  {item.batch_code || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right mt-8 text-2xl font-bold">
          TỔNG TIỀN: {totalAmount.toLocaleString("vi-VN")} VNĐ
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailPage;
