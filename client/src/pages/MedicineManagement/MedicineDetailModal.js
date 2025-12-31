import React, { useState, useEffect } from "react";
import {
  X,
  Edit2,
  Package,
  AlertCircle,
  FileText,
  Space,
  EyeIcon,
} from "lucide-react";
import { BatchesAPI, medicinesAPI, settingsAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Button, Form, Input, message, Modal, Tooltip } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useToast } from "../../contexts/ToastContext";
const MedicineDetailModal = ({
  visible,
  medicine,
  onClose,
  onNavigateToReceipt,
  onBatchUpdate, // Callback để update parent component nếu cần
}) => {
  const [settings, setSettings] = useState({});
  const [sellingPriceRatio, setSellingPriceRatio] = useState();
  const [localMedicine, setLocalMedicine] = useState(medicine);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [openEdit, setOpenEdit] = useState(false);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState({
    id: null,
    batch_code: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const {toast} = useToast();

  useEffect(() => {
    setLocalMedicine(medicine);
  }, [medicine]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      if (response.data.success) {
        const settingsData = response.data.data;
        console.log("FETCHED SETTINGS:", settingsData);
        setSettings(settingsData);
        setSellingPriceRatio(parseFloat(settingsData.SellingPriceRatio?.value));
      }
    } catch (error) {
      console.error("Không thể tải cài đặt hệ thống");
    }
  };

  if (!visible || !localMedicine) return null;

  const formatCurrency = (amount) => {
    return amount ? amount.toLocaleString("vi-VN") + " đ" : "-";
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString("vi-VN") : "-";
  };

  const handleSave = async () => {
    try {
      console.log("Note:", note, "selected id", selected.id);
      const res = await BatchesAPI.updateNote(selected.id, { note: note });

      if (res.data.success) {
        toast.success("Cập nhật thông tin lô thành công");
        
        // Cập nhật local state ngay lập tức
        setLocalMedicine((prev) => ({
          ...prev,
          batches: prev.batches.map((batch) =>
            batch.batch_id === selected.id
              ? { ...batch, notes: note }
              : batch
          ),
        }));

        // Gọi callback để update parent nếu có
        if (onBatchUpdate) {
          onBatchUpdate(selected.id, note);
        }

        setOpenEdit(false);
        form.resetFields();
        setNote("");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật note:", error);
      toast.error("Không thể cập nhật thông tin lô. Vui lòng thử lại!");
    }
  };

  const handleOpen = (value) => {
    console.log("Value: ", value);
    setOpenEdit(true);
  };

  const handleCancelEdit = () => {
    setOpenEdit(false);
    form.resetFields();
    setNote("");
    setSelected({ id: null, batch_code: "" });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-start justify-center p-4 pb-20">
        <div className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl transform transition-all my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 px-8 py-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-wide">
                Chi tiết thuốc
              </h2>
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white hover:rotate-90 transition-all duration-300 p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Medicine Details */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden mb-8">
              <div className="divide-y divide-blue-50">
                <DetailRow label="Tên thuốc" value={localMedicine.medicine_name} />
                <DetailRow label="Đơn vị" value={localMedicine.unit_name} />
                <DetailRow
                  label="Số lượng hiện tại"
                  value={localMedicine.stock_quantity}
                />
                <DetailRow
                  label="Tồn tối thiểu"
                  value={localMedicine.min_stock_level}
                />
                <DetailRow
                  label="Trạng thái"
                  value={
                    <span
                      className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                        localMedicine.is_active
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                      }`}
                    >
                      {localMedicine.is_active ? "Hoạt động" : "Ngừng hoạt động"}
                    </span>
                  }
                />
                <DetailRow
                  label="Ngày thêm"
                  value={formatDate(localMedicine.created_at)}
                />
                <DetailRow
                  label="Ngày cập nhật"
                  value={formatDate(localMedicine.updated_at)}
                />
              </div>
            </div>

            {/* Batches Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6 text-blue-800" />
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                  Danh sách lô thuốc
                </h3>
              </div>

              {!localMedicine.batches || localMedicine.batches.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-700 font-medium">
                    Không có lô thuốc nào
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
                          <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            STT
                          </th>
                          <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Số Lô
                          </th>
                          <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Ngày nhập
                          </th>
                          <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            HSD
                          </th>
                          <th className="px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                            SL nhập
                          </th>
                          <th className="px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                            SL còn
                          </th>
                          <th className="px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                            Giá nhập
                          </th>
                          <th className="px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                            Giá bán
                          </th>
                          <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Ghi chú
                          </th>
                          <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        {localMedicine.batches.map((batch, index) => {
                          const displayPrice =
                            batch.sell_price ||
                            (batch.import_price
                              ? batch.import_price * sellingPriceRatio
                              : null);

                          return (
                            <tr
                              key={batch.batch_id}
                              className="hover:bg-blue-50/50 transition-colors group"
                            >
                              <td className="px-4 py-4 text-sm font-medium text-slate-700">
                                {index + 1}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-blue-900">
                                    {batch.batch_code}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {formatDate(batch.import_date)}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {formatDate(batch.expiry_date)}
                              </td>
                              <td className="px-4 py-4 text-sm text-right font-medium text-slate-700">
                                {batch.initial_quantity}
                              </td>
                              <td className="px-4 py-4 text-sm text-right font-semibold text-blue-800">
                                {batch.remaining_quantity}
                              </td>
                              <td className="px-4 py-4 text-sm text-right font-semibold text-slate-700">
                                {formatCurrency(batch.import_price)}
                              </td>
                              <td className="px-4 py-4 text-sm text-right font-bold text-green-700">
                                {formatCurrency(displayPrice)}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-600">
                                {batch.notes || "-"}
                              </td>
                              <td className="">
                                <div className="flex justify-center items-center gap-2">
                                  <Tooltip title="Sửa ghi chú">
                                    <Button
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => {
                                        handleOpen(batch.notes);
                                        console.log("IDDDD", batch.batch_id);
                                        setSelected({
                                          id: batch.batch_id,
                                          batch_code: batch.batch_code,
                                        });
                                        form.setFieldsValue({
                                          note: batch.notes || "",
                                        });
                                        setNote(batch.notes || "");
                                      }}
                                    />
                                  </Tooltip>

                                  <Tooltip title="Xem phiếu nhập liên quan">
                                    <Button
                                      size="small"
                                      icon={<EyeOutlined />}
                                      onClick={() => {
                                        navigate(
                                          `/receipts/${batch.import_receipt_id}`
                                        );
                                        onClose();
                                      }}
                                      style={{
                                        backgroundColor: "#0e1182ff",
                                        borderColor: "#0e1182ff",
                                        color: "white",
                                      }}
                                    />
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-blue-100 px-8 py-4 rounded-b-2xl flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all duration-200 hover:shadow-xl"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Modal sửa note của batch nhanh */}
      <Modal
        title={
          <span className="text-blue-900 font-bold text-lg">
            Chỉnh sửa thông tin lô #{selected.batch_code}
          </span>
        }
        visible={openEdit}
        onCancel={handleCancelEdit}
        onOk={handleSave}
        
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{
          style: {
            marginTop: '16px',
            backgroundColor: "#1e3a8a",
            borderColor: "#1e3a8a",
          },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea
              maxLength={150}
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú bổ sung cho lô (tối đa 150 ký tự)"
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Helper Component
const DetailRow = ({ label, value }) => (
  <div className="flex hover:bg-blue-50/50 transition-colors">
    <div className="w-1/3 px-6 py-4 bg-gradient-to-r from-blue-100 to-blue-50 border-r-2 border-blue-800">
      <span className="text-blue-900 font-semibold text-sm">{label}</span>
    </div>
    <div className="w-2/3 px-6 py-4 bg-white">
      <span className="text-slate-800 font-medium text-sm">{value}</span>
    </div>
  </div>
);

export default MedicineDetailModal