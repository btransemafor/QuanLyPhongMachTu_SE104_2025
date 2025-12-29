import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Progress,
  Card,
  Divider,
  message,
  InputNumber,
  Row,
  Col,
  Alert,
} from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { medicinesAPI } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
const { Text, Title } = Typography;

const BatchSelectionModal = ({
  open,
  onCancel,
  onConfirm,
  medicine,
  loading = false,
  requiredQty = 0,
  initialSelectedBatches = [],
  isEditing = false,
  mr_id,
}) => {
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const {toast} = useToast()

  // Reset khi đóng
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSelectedBatches([]);
        setBatches([]);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Load dữ liệu đã chọn trước (khi sửa phiếu)
  useEffect(() => {
    if (open && initialSelectedBatches?.length > 0) {
      setSelectedBatches([...initialSelectedBatches]);
    }
  }, [open, initialSelectedBatches]);

  // Fetch danh sách lô
  useEffect(() => {
    if (!open || !medicine?.medicine_id) return;

    const fetch = async () => {
      setFetchLoading(true);
      try {
        const res =
          isEditing && mr_id
            ? await medicinesAPI.getMedicine(medicine.medicine_id, { mr_id })
            : await medicinesAPI.getMedicine(medicine.medicine_id);

        const data = res.data?.data?.batches || [];
        const formatted = data
          .filter((b) => b.remaining_quantity > 0)
          .map((b) => ({ ...b, key: b.batch_id }));

        setBatches(formatted);
      } catch (err) {
        toast.error("Lỗi tải danh sách lô");
      } finally {
        setFetchLoading(false);
      }
    };

    fetch();
  }, [open, medicine?.medicine_id, isEditing, mr_id]);

  // Sắp xếp FIFO → FEFO
  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => {
      const ia = new Date(a.import_date);
      const ib = new Date(b.import_date);
      if (ia.getTime() !== ib.getTime()) return ia - ib;
      const ea = a.expiry_date ? new Date(a.expiry_date) : Infinity;
      const eb = b.expiry_date ? new Date(b.expiry_date) : Infinity;
      return ea - eb;
    });
  }, [batches]);

  const totalSelected = useMemo(() => {
    return selectedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
  }, [selectedBatches]);

  const isEnough = totalSelected >= requiredQty;
  const progressPercent =
    requiredQty > 0 ? (totalSelected / requiredQty) * 100 : 0;

  const handleQtyChange = useCallback(
    (batchId, value) => {
      const batch = batches.find((b) => b.batch_id === batchId);
      if (!batch) return;

      // Làm tròn và đảm bảo giá trị hợp lệ
      let qty = Math.max(0, Math.floor(Number(value) || 0));

      // Kiểm tra không vượt quá tồn kho của lô
      qty = Math.min(qty, batch.remaining_quantity);

      setSelectedBatches((prev) => {
        // Tính tổng số lượng của các lô khác (không tính lô hiện tại)
        const otherBatchesTotal = prev
          .filter((b) => b.batch_id !== batchId)
          .reduce((sum, b) => sum + (b.quantity || 0), 0);

        // Số lượng tối đa có thể chọn cho lô này
        const maxAllowedForThisBatch = requiredQty - otherBatchesTotal;

        // Nếu tổng các lô khác đã đủ hoặc vượt quá requiredQty
        if (maxAllowedForThisBatch <= 0 && qty > 0) {
          toast.warning(
            `Tổng số lượng đã đủ ${requiredQty}. Không thể thêm lô này!`
          );
          return prev;
        }

        // Giới hạn số lượng của lô này để không vượt quá requiredQty
        if (qty > maxAllowedForThisBatch) {
          qty = maxAllowedForThisBatch;
          toast.info(
            `Đã điều chỉnh số lượng xuống ${qty} để không vượt quá số lượng cần xuất`
          );
        }

        // Nếu qty = 0, xóa lô khỏi danh sách đã chọn
        if (qty === 0) {
          return prev.filter((b) => b.batch_id !== batchId);
        }

        // Kiểm tra lô đã tồn tại trong danh sách chưa
        const exists = prev.find((b) => b.batch_id === batchId);
        if (exists) {
          return prev.map((b) =>
            b.batch_id === batchId ? { ...b, quantity: qty } : b
          );
        }

        // Thêm lô mới
        return [...prev, { batch_id: batchId, quantity: qty }];
      });
    },
    [batches, requiredQty]
  );

  const autoSelectFEFO = useCallback(() => {
    if (requiredQty <= 0)
      return toast.warning("Vui lòng nhập số lượng cần xuất");

    let remain = requiredQty;
    const result = [];

    for (const b of sortedBatches) {
      if (remain <= 0) break;
      const take = Math.min(remain, b.remaining_quantity);
      if (take > 0) {
        result.push({ batch_id: b.batch_id, quantity: take });
        remain -= take;
      }
    }

    setSelectedBatches(result);
    
    if (remain > 0) {
      toast.warning(
        `Tồn kho không đủ! Thiếu ${remain} ${medicine?.unit_name || "đơn vị"}`
      );
    } else {
      toast.success("Đã tự động chọn lô theo nguyên tắc FIFO → FEFO");
    }
  }, [sortedBatches, requiredQty, medicine]);

  const handleConfirm = () => {
    if (totalSelected === 0) return toast.warning("Chưa chọn lô nào");

    if (totalSelected > requiredQty) {
      return toast.error(
        `Tổng số lượng đã chọn (${totalSelected}) vượt quá số lượng cần xuất (${requiredQty})!`
      );
    }

    const result = selectedBatches
      .filter((b) => b.quantity > 0)
      .map((item) => {
        const b = batches.find((x) => x.batch_id === item.batch_id);
        return {
          ...item,
          batch_code: b.batch_code,
          import_price: b.import_price,
          expiry_date: b.expiry_date,
          import_date: b.import_date,
        };
      });

    onConfirm(result, totalSelected);
  };

  const columns = [
    {
      title: "Lô số",
      dataIndex: "batch_code",
      width: 110,
      render: (t) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {t}
        </Tag>
      ),
    },
    {
      title: "Ngày nhập",
      dataIndex: "import_date",
      width: 110,
      render: (d) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Hạn dùng",
      dataIndex: "expiry_date",
      width: 130,
      render: (d) => {
        if (!d) return <Tag color="default">Không rõ</Tag>;
        const days = dayjs(d).diff(dayjs(), "day");
        const color = days < 0 ? "red" : days < 90 ? "orange" : "green";
        return <Tag color={color}>{dayjs(d).format("DD/MM/YYYY")}</Tag>;
      },
    },
    {
      title: "Tồn kho",
      dataIndex: "remaining_quantity",
      width: 90,
      align: "center",
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: "Chọn số lượng",
      width: 150,
      align: "center",
      render: (_, record) => {
        const selected = selectedBatches.find(
          (s) => s.batch_id === record.batch_id
        );

        // Tính số lượng còn có thể chọn
        const otherBatchesTotal = selectedBatches
          .filter((b) => b.batch_id !== record.batch_id)
          .reduce((sum, b) => sum + (b.quantity || 0), 0);
        
        const remaining = requiredQty - otherBatchesTotal;
        const maxForThisBatch = Math.min(remaining, record.remaining_quantity);

        return (
          <div>
            <InputNumber
              min={0}
              max={maxForThisBatch}
              value={selected?.quantity || 0}
              onChange={(value) => handleQtyChange(record.batch_id, value)}
              size="middle"
              style={{ width: 90 }}
              disabled={remaining <= 0 && !selected}
            />
            {remaining <= 0 && !selected && (
              <div style={{ fontSize: 11, color: "#ff4d4f", marginTop: 2 }}>
                Đã đủ
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Modal
      closeIcon={
        <CloseOutlined
          className="text-lg text-white"
          style={{
            background: "#0e1182ff",
            borderRadius: "50%",
            padding: "10px",
          }}
        />
      }
      open={open}
      onCancel={onCancel}
      title={null}
      footer={null}
      width={1100}
      destroyOnClose
    >
      {/* Header đẹp */}
      <Card
        bordered={false}
        style={{ marginBottom: 16, background: "#f0f5ff" }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ margin: 0, color: "#1d39c4" }}>
              {medicine?.medicine_name}
            </Title>
            <Text type="secondary">
              ĐVT: {medicine?.unit_name} • Tồn tổng:{" "}
              {batches.reduce((s, b) => s + b.remaining_quantity, 0)}
            </Text>
          </Col>
          <Col>
            <Text strong style={{ fontSize: 18 }}>
              Cần xuất:{" "}
              <Text style={{ fontSize: 24, color: "#d4380d" }}>
                {requiredQty}
              </Text>
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Thanh tiến độ */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Text strong>Đã chọn: {totalSelected}</Text>
          {totalSelected > requiredQty ? (
            <Tag icon={<WarningOutlined />} color="error">
              Vượt quá {totalSelected - requiredQty}
            </Tag>
          ) : isEnough ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Đủ số lượng
            </Tag>
          ) : (
            <Tag icon={<WarningOutlined />} color="warning">
              Thiếu {requiredQty - totalSelected}
            </Tag>
          )}
        </div>
        <Progress
          percent={Math.min(progressPercent, 100)}
          status={
            totalSelected > requiredQty
              ? "exception"
              : isEnough
              ? "success"
              : "active"
          }
          strokeColor={
            totalSelected > requiredQty
              ? "#ff4d4f"
              : isEnough
              ? "#52c41a"
              : "#fa8c16"
          }
          format={() => `${totalSelected}/${requiredQty}`}
        />
      </div>

      {/* Cảnh báo vượt quá */}
      {totalSelected > requiredQty && (
        <Alert
          message="Cảnh báo"
          description={`Tổng số lượng đã chọn (${totalSelected}) vượt quá số lượng cần xuất (${requiredQty}). Vui lòng điều chỉnh lại!`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      {/* Bảng chọn lô */}
      <Table
        columns={columns}
        dataSource={sortedBatches}
        loading={fetchLoading}
        pagination={false}
        size="middle"
        rowKey="batch_id"
        bordered
        rowClassName={(record) => {
          const selected = selectedBatches.find(
            (s) => s.batch_id === record.batch_id && s.quantity > 0
          );
          return selected ? "ant-table-row-selected" : "";
        }}
        style={{ marginBottom: 16 }}
      />

      {/* Danh sách lô đã chọn */}
      {selectedBatches.length > 0 && (
        <Alert
          message={
            <div>
              <Text strong>Các lô đã chọn:</Text>
              <div style={{ marginTop: 8 }}>
                {selectedBatches
                  .filter((b) => b.quantity > 0)
                  .map((item) => {
                    const b = batches.find((x) => x.batch_id === item.batch_id);
                    return (
                      <Tag
                        key={item.batch_id}
                        color="blue"
                        style={{ margin: 4 }}
                      >
                        {b?.batch_code} × <strong>{item.quantity}</strong>
                      </Tag>
                    );
                  })}
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Divider />

      {/* Footer actions */}
      <Row justify="space-between" align="middle">
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={autoSelectFEFO}
              size="large"
              style={{ background: "#0e1182ff", border: "none" }}
            >
              Tự động chọn (FIFO → FEFO)
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setSelectedBatches([])}
              disabled={selectedBatches.length === 0}
            >
              Xóa tất cả
            </Button>
          </Space>
        </Col>

        <Col>
          <Space>
            <Button onClick={onCancel}>Hủy</Button>
            <Button
              type="primary"
              size="large"
              onClick={handleConfirm}
              loading={loading}
              disabled={totalSelected === 0 || totalSelected > requiredQty}
              style={{
                minWidth: 140,
                background: "#0e1182ff",
                border: "none",
                color: "white",
              }}
            >
              Xác nhận ({totalSelected})
            </Button>
          </Space>
        </Col>
      </Row>
    </Modal>
  );
};

export default BatchSelectionModal;