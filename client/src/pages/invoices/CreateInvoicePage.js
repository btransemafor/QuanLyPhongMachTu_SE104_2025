import React, { useState, useEffect } from "react";
import {
  Calendar,
  User,
  FileText,
  DollarSign,
  Save,
  X,
  Search,
  ChevronRight,
} from "lucide-react";
import { invoicesAPI, medicalRecordsAPI, settingsAPI } from "../../services/api";
import { message } from "antd";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";

const CreateInvoicePage = () => {
  // Get medical record ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const medicalRecordIdFromUrl = urlParams.get("medical_record_id");
  const {user} = useAuth();

  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [showRecordSelector, setShowRecordSelector] = useState(
    !medicalRecordIdFromUrl
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [consultationFee, setConsultationFee] = useState(0);


  const [invoiceData, setInvoiceData] = useState({
    invoiceDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const navigate = useNavigate()

  const {toast} = useToast();

  // Fetch pending medical records
  const fetchPendingMedicalRecords = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordsAPI.getPendingMedicalExaminations();
      setMedicalRecords(response.data.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phiếu khám chưa lập hóa đơn", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch consultation fee
  const fetchConsultationFee = async () => {
    try {
      // const res = await settingsAPI.getSetting("ConsultationFee");
      // setConsultationFee(res.data.data.value);
      const response = await settingsAPI.getSettings();
      if (response.data.success) {
        const data = response.data.data;
        setConsultationFee(parseFloat(data.ConsultationFee?.value));
      }
    } catch (e) {
      console.error("Error fetching consultation fee:", e);
    }
  };

  // Fetch medical record by ID
  const fetchMedicalRecordById = async (id) => {
    try {
      setLoading(true);
      // const res = await medicalRecordsAPI.getById(id);
      // const record = res.data.data;

      // For now, find from existing list
      const record = medicalRecords.find((r) => r.id === id);
      if (record) {
        setSelectedMedicalRecord(record);
        setShowRecordSelector(false);
      }
    } catch (e) {
      console.error("Error fetching medical record:", e);
    } finally {
      setLoading(false);
    }
  };

   const handleCreateInvoice = async (record) => {
    if (!["receptionist", "admin"].includes(user?.role_name?.toLowerCase())) {
      toast.error("Chỉ lễ tân hoặc admin mới được tạo hóa đơn");
      return;
    }
    if (!selectedMedicalRecord) {
      toast.error("Bệnh nhân chưa có hồ sơ khám");
      return;
    }

    console.log(
        'invoice', invoiceData
    )

    try {
      const res = await invoicesAPI.createInvoice({
        medical_record_id: selectedMedicalRecord.medical_record_id,
        note: invoiceData.notes, 
        invoice_date: invoiceData.invoiceDate, 
      });
      if (res.data.success) {
        toast.success("Tạo hóa đơn thành công");
        

        navigate(`/invoices`);
        //setIsRefresh(true);
        //setModalVisible(false);
        //await fetchPendingMedicalRecords();
      }
    } catch (err) {
      toast.error("Không thể tạo hóa đơn");
    }
  };

  useEffect(() => {
    fetchConsultationFee();
    fetchPendingMedicalRecords();
  }, []);

  useEffect(() => {
    if (medicalRecordIdFromUrl && medicalRecords.length > 0) {
      fetchMedicalRecordById(medicalRecordIdFromUrl);
    }
  }, [medicalRecordIdFromUrl, medicalRecords]);

  const handleSelectMedicalRecord = (record) => {
    setSelectedMedicalRecord(record);
    setShowRecordSelector(false);
  };

  const calculateGrandTotal = () => {
    if (!selectedMedicalRecord) return 0;
    return consultationFee + parseFloat(selectedMedicalRecord.total_medicine || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const filteredRecords = medicalRecords.filter((record) =>
    record.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Record Selector View
  if (showRecordSelector) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Tạo Hóa Đơn Mới
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Chọn phiếu khám bệnh để lập hóa đơn
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 text-3xl" />
                Danh sách phiếu khám chưa lập hóa đơn
              </h2>
            </div>

            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên bệnh nhân..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Records List */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                  Đang tải...
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy phiếu khám bệnh nào
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecords.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => handleSelectMedicalRecord(record)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              {record.patient_name}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Chưa có hóa đơn
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Ngày khám:</span>{" "}
                              {new Date(record.exam_date).toLocaleDateString(
                                "vi-VN"
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Tiền thuốc:</span>{" "}
                              {formatCurrency(record.total_medicine)} đ
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invoice Form View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-8xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Tạo Hóa Đơn
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Bệnh nhân: {selectedMedicalRecord?.patient_name}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRecordSelector(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Đổi phiếu khám
              </button>
              <button
               style={{
                  background: "#0e1182ff",
                  border: "none",
                }}
                onClick={handleCreateInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Lưu hóa đơn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="col-span-2 space-y-6">
            {/* Invoice Date */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Thông tin hóa đơn
                </h2>
              </div>
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày hóa đơn *
                  </label>
                  <input
                    type="date"
                    value={invoiceData.invoiceDate}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        invoiceDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Thông tin bệnh nhân
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên
                    </label>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {selectedMedicalRecord?.patient_name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày khám
                    </label>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {new Date(
                        selectedMedicalRecord?.exam_date
                      ).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold text-gray-900">Ghi chú</h2>
              </div>
              <div className="p-6">
                <textarea
                  maxLength={200}
                  value={invoiceData.notes}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, notes: e.target.value })
                  }
                  placeholder="Nhập ghi chú bổ sung cho hóa đơn (tối đa 200 ký tự)"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border shadow-sm sticky top-24">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Chi tiết thanh toán
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Tiền khám</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(consultationFee)} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Tiền thuốc</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(
                        selectedMedicalRecord?.total_medicine || 0
                      )}{" "}
                      đ
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">
                      Tổng cộng
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculateGrandTotal())} đ
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-900">
                        Trạng thái
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 ml-4">Chờ thanh toán</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoicePage;
