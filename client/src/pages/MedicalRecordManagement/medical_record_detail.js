import React, { useState, useEffect } from "react";
import {
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  AlertCircle,
  Pill,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { medicalRecordsAPI, invoicesAPI } from "../../services/api";
import { Button, message, Spin, Empty } from "antd";
import InvoiceModal from "../../pages/invoices/invoice_modal";
import { useAuth } from "../../contexts/AuthContext";
import { DollarOutlined } from "@ant-design/icons";
import ConfirmInvoiceModal from "../invoices/confirm_invoice_modal";
const MedicalRecordDetail = () => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const { id } = useParams();
  const [medicalRecord, setMedicalRecordDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const { user } = useAuth();
  const [hasInvoice, setHasInvoice] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);
  const [visableConfirmModal, setVisableConfirmModal] = useState(false);

  const my_role_name = user.role_name?.toLowerCase();

  /// useEffect chạy sau khi render
  useEffect(() => {
    fetchMedicalRecord();
  }, [id]);

  const openInvoice = (id) => {
    setSelectedInvoiceId(id);
    setInvoiceModalVisible(true);
  };

  const fetchMedicalRecord = async () => {
    setLoading(true);
    try {
      const response = await medicalRecordsAPI.getMedicalRecord(id);
      if (response.data.success) {
        console.log("Medical Record", response.data.data);
        const recordData = response.data.data;
        setMedicalRecordDetail(recordData);

        // Kiểm tra và set invoice
        if (recordData.invoice_id != null) {
          console.log("Có invoice_id:", recordData.invoice_id);
          setHasInvoice(true);
          setInvoiceId(recordData.invoice_id);
          // Fetch chi tiết invoice nếu cần -> Này có lễ tân và admin mới cần xem
          if (
            user.role_name?.toLowerCase() === "admin" ||
            user.role_name?.toLowerCase() === "receptionist"
          ) {
            await fetchInvoice(recordData.medical_record_id);
          }
        } else {
          setHasInvoice(false);
          setInvoiceId(null);
        }
      } else {
        message.error("Không tìm thấy hồ sơ bệnh án");
      }
    } catch (error) {
      console.error("Error fetching medical record:", error);
      message.error("Không thể tải thông tin hồ sơ bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoice = async (medical_record_id) => {
    try {
      console.log("Fetch hoa don dua tren mr", medical_record_id);
      const res = await invoicesAPI.getInvoiceByMedicalRecord(
        medical_record_id
      );

      if (res.data?.success) {
        console.log("FETCH INVOICE", res.data.data);
        setInvoiceId(res.data.data.invoice_id);
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      message.error("Không thể tải hóa đơn");
    }
  };

  const handleCreateInvoice = async (medical_record_id) => {
    if (
      user?.role_name?.toLowerCase() !== "receptionist" &&
      user?.role_name?.toLowerCase() !== "admin"
    ) {
      message.error("Chỉ lễ tân mới có thể tạo hóa đơn");
      return;
    }

    try {
      console.log("Data Appointment:", medical_record_id);
      if (!medical_record_id) {
        message.error("Bệnh nhân chưa có phiếu khám bệnh");
        return;
      }

      const response = await invoicesAPI.createInvoice({
        medical_record_id: medical_record_id,
      });

      if (response.data.success) {
        message.success("Đã tạo hóa đơn thành công");
        // Refresh lại medical record để cập nhật invoice_id
        await fetchMedicalRecord();
        setVisableConfirmModal(false);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      message.error("Không thể tạo hóa đơn");
    }
  };

  const handlePayment = async (invoice_id) => {
    if (
      user?.role_name?.toLowerCase() !== "receptionist" &&
      user?.role_name?.toLowerCase() !== "admin"
    ) {
      message.error(
        "Chỉ lễ tân hoặc quản trị viên mới có thể xác nhận thanh toán"
      );
      return;
    }

    try {
      const response = await invoicesAPI.payInvoice(invoice_id);

      if (response.data.success) {
        message.success("Thanh toán thành công");
        // Refresh lại medical record để cập nhật payment_status
        await fetchMedicalRecord();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error("Error pay invoice:", error);
      message.error("Không thể thanh toán hóa đơn");
    }
  };

  const renderInvoiceButton = () => {
    const role = user?.role_name?.toLowerCase();

    if (role === "admin" || role === "receptionist") {
      if (!hasInvoice) {
        return (
          <Button
            className="bg-green-500 text-white"
            onClick={() => {
              console.log("Tạo hóa đơn");
              setVisableConfirmModal(true);
              // handleCreateInvoice(medicalRecord.medical_record_id);
            }}
          >
            Tạo hóa đơn
          </Button>
        );
      }
    }

    return (
      <Button
        icon={<DollarOutlined />}
        className="bg-[#0e1182ff] text-white"
        onClick={() => {
          if (hasInvoice && invoiceId) {
            openInvoice(invoiceId);
          } else {
            message.warning(
              "Hóa đơn hiện tại chưa tồn tại. Vui lòng hoàn tất quá trình lập hóa đơn trước khi xem."
            );
          }
        }}
      >
        Xem hóa đơn
      </Button>
    );
  };

  const renderPayButton = () => {
    const role = user?.role_name?.toLowerCase();

    if (role === "admin" || role === "receptionist") {
      if (medicalRecord?.payment_status?.toLowerCase() === "chưa thanh toán") {
        return (
          <Button
            className="bg-green-500 text-white"
            onClick={() => {
              console.log("Thanh toán");
              handlePayment(invoiceId);
            }}
            disabled={!invoiceId}
          >
            Thanh toán
          </Button>
        );
      }
    }

    return null;
  };

  ////

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
          Đang tải hồ sơ bệnh án...
        </div>
      </div>
    );
  }

  if (!medicalRecord) {
    return <Empty description="Không tìm thấy hồ sơ bệnh án" />;
  }

  const toggleRow = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case "mild":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "moderate":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "severe":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalAmount = medicalRecord.prescriptions.reduce(
    (sum, p) => sum + p.total,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Phiếu khám bệnh
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Mã: {medicalRecord.medical_record_id}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                Đang hoạt động
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {formatDate(medicalRecord.created_at)}
              </p>
            </div>

            {/*          Xem hóa đơn liên quan tới phiếu khám bệnh này */}
            {my_role_name !== "doctor" ? (
              <div className="flex">
                <div className="mr-3">{renderPayButton()}</div>
                <div>{renderInvoiceButton()}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Patient Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Thông tin bệnh nhân
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Tên bệnh nhân</p>
                  <p className="font-medium text-gray-900">
                    {medicalRecord.patient_name}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Mã bệnh nhân</p>
                  <p className="font-medium text-gray-900">
                    {medicalRecord.patient_id}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium text-gray-900">
                    {medicalRecord.patient_phone}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Địa chỉ</p>
                  <p className="font-medium text-gray-900">
                    {medicalRecord.patient_address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor & Visit Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-green-600" />
              Thông tin bác sĩ & khám bệnh
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Stethoscope className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Bác sĩ điều trị</p>
                  <p className="font-medium text-gray-900">
                    {medicalRecord.doctor_name}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Ngày khám</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(medicalRecord.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Ngày tái khám</p>
                  <p className="font-medium text-gray-900">
                    {new Date(medicalRecord.revisit_date).toLocaleDateString(
                      "vi-VN",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Triệu chứng
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {medicalRecord.symptoms}
          </p>
        </div>

        {/* Diagnosed Diseases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Chẩn đoán bệnh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medicalRecord.diseases.map((disease, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow 
  ${disease.is_primary ? "border-red-500" : "border-gray-200"}
`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {disease.disease_name}{" "}
                    {disease.is_primary ? " - (chính)" : ""}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                      disease.severity
                    )}`}
                  >
                    {disease.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Mã: {disease.disease_id}
                </p>
                {disease.disease_note && (
                  <p className="text-sm text-gray-600 italic">
                    {disease.disease_note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5 text-purple-600" />
            Đơn thuốc
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                    Tên thuốc
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                    Đơn vị
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                    Cách dùng
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
                    Số lượng
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">
                    Đơn giá
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">
                    Thành tiền
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody>
                {medicalRecord.prescriptions.map((prescription, index) => (
                  <React.Fragment key={index}>
                    <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">
                          {prescription.medicine_name}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {prescription.unit}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 max-w-xs">
                        {prescription.usage_method}
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-gray-900">
                        {prescription.quantity}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700">
                        {formatCurrency(prescription.sell_price)}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-900">
                        {formatCurrency(prescription.total)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => toggleRow(index)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                        >
                          {expandedRows.has(index) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(index) && (
                      <tr>
                        <td colSpan="7" className="bg-gray-50 px-4 py-3">
                          <div className="ml-8">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              Thông tin lô hàng
                            </h4>
                            <div className="space-y-2">
                              {prescription.batches.map((batch, batchIndex) => (
                                <div
                                  key={batchIndex}
                                  className="flex items-center gap-4 text-sm bg-white rounded px-3 py-2 border border-gray-200 cursor-pointer"
                                  onClick={() => {
                                    console.log("Xem chi tiet lo ");
                                    navigate(
                                      `/receipts/${batch.import_receipt_id}`
                                    );
                                  }}
                                >
                                  <span className="font-medium text-gray-700">
                                    Lô: {batch.batch_code}
                                  </span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-600">
                                    Số lượng:{" "}
                                    <span className="font-medium text-gray-900">
                                      {batch.quantity}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-blue-50">
                  <td
                    colSpan="5"
                    className="py-4 px-4 text-right font-bold text-gray-900"
                  >
                    Tổng tiền thuốc:
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-lg text-blue-600">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <InvoiceModal
        visible={invoiceModalVisible}
        invoiceId={selectedInvoiceId}
        onClose={() => setInvoiceModalVisible(false)}
      />

      {visableConfirmModal ? (
        <ConfirmInvoiceModal
          onCreateINV={(fee) => {
            console.log("Fee sau thay doi neu co: ", fee);
            /// Update Tien kham neu co:
            handleCreateInvoice(medicalRecord.medical_record_id);
          }}
          onClose={() => {
            setVisableConfirmModal(false);
          }}
          appointmentData={medicalRecord}
        />
      ) : null}
    </div>
  );
};

export default MedicalRecordDetail;
