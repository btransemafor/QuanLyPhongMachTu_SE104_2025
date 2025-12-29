import React, { useEffect, useState } from "react";
import { settingsAPI } from "../../services/api";
import { message } from "antd";
import moment from "moment";
import { useAuth } from "../../contexts/AuthContext";
import { medicalRecordsAPI } from "../../services/api";
const ConfirmInvoiceModal = ({ onCreateINV, onClose, appointmentData, isAtAppointmentList }) => {
  const [consultationFee, setConsultationFee] = useState(null);
  const [editedFee, setEditedFee] = useState("");
  const [oriFee, setOriFee] = useState(0); 
  const [isEditing, setIsEditing] = useState(false);
  const [dataPreview, setPreview] = useState({
    basicInfo: {

    }, 
    totalMedicine: 0
  }); 
  const { user } = useAuth();
  console.log('Thoong tin: ', appointmentData)

  useEffect(() => {
    fetchFee();
  }, []);

  useEffect(() => {
    if (isAtAppointmentList) {
      // Fetch lai 
      fetchInfoPreview()
    }
  }, []); 


  const fetchInfoPreview = async () => {
    try {
      const res = await medicalRecordsAPI.getPreviewBeforeCreateINV(appointmentData.medical_record_id); 

      if (res.data.success) {
        setPreview(res.data.data)
        //message.success('Set preview thanh cong roi a ba!')
      }
    }
    catch(e) {

    }
    
  }



  const fetchFee = async () => {
    try {
      const res = await settingsAPI.getSetting("ConsultationFee");
      if (res.data.success) {
        const fee = res.data.data.value;
        setConsultationFee(fee);
        setOriFee(fee); 
        setEditedFee(fee);
      } else {
        message.error("Không lấy được phí khám");
      }
    } catch (e) {
      message.error("Lỗi kết nối!");
    }
  };

  const updateFee = async (fee) => {
    try {
      const res = await settingsAPI.updateSetting("ConsultationFee", {
        value: fee,
      });
      if (res.data.success) {
        // None
        console.log("Updated Fee Successfully");
      }
    } catch (e) {
      message.error("Không thể cập nhập tiền khám");
    }
  };

  const handleFeeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setEditedFee(value ? parseInt(value) : "");
  };

  const handleConfirm = async () => {
    const fee = Number(editedFee);
    const originalFee = Number(oriFee);

    if (fee <= 0) {
      message.warning("Vui lòng nhập phí khám hợp lệ");
      return;
    }

    try {
      if (fee !== originalFee) {
        await updateFee(fee);     
      }
      // Chỉ tạo hóa đơn khi fee hợp lệ
      onCreateINV(fee);
      //message.success("Cập nhật và tạo hóa đơn thành công");
    } catch (error) {
      console.error(error);
      message.error("Cập nhật phí thất bại. Vui lòng thử lại");
    }
  };


  // Dữ liệu từ appointmentData (giả định từ props)
  const patientName = appointmentData?.patient_name || appointmentData?.full_name || "Chưa xác định";
  const appointmentDate = appointmentData?.appointment_date
    ? moment(appointmentData.appointment_date).format("DD/MM/YYYY")
    : "Chưa xác định";
  const examFee = editedFee || consultationFee || 0
  const medicineFee =
    appointmentData?.prescriptions?.reduce(
      (sum, item) => sum + (item.total ?? item.quantity * item.sell_price),
      0
    ) ?? 0;

  ///const totalFee = parseFloat(examFee) + parseFloat(medicineFee);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-1">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Xác nhận thông tin
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Kiểm tra hoặc điều chỉnh phí trước khi tạo hóa đơn
          </p>
        </div>

        {/* Thông tin xem trước */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
            <div>
              <p className="font-medium">Họ và tên:</p>
              <p className="text-gray-800">{patientName}</p>
            </div>
            <div>
              <p className="font-medium">Ngày khám:</p>
              <p className="text-gray-800">{moment(dataPreview.basicInfo.exam_date).format('DD-MM-YYYY')}</p>
            </div>
            <div>
              <p className="font-medium">Tiền khám:</p>
              <p className="text-gray-800">
                {isEditing
                  ? formatCurrency(editedFee)
                  : formatCurrency(examFee)}
                đ
              </p>
            </div>
            <div>
              <p className="font-medium">Tiền thuốc:</p>
              <p className="text-gray-800">
               {formatCurrency(dataPreview?.totalMedicine)  ?? medicineFee.toLocaleString("vi-VN")} đ
              </p>
            </div>
          </div>
          <div className="border-t pt-2 text-center">
            <p className="text-lg font-semibold text-gray-800">
              Tổng cộng: {formatCurrency(parseFloat(examFee) +  parseFloat(dataPreview?.totalMedicine) ?? parseFloat(medicineFee))} đ
            </p>
          </div>
        </div>

        {/* Phí khám (có thể chỉnh sửa) */}
        <div className="bg-gray-50 rounded-xl p-5 text-center">
          {consultationFee === null ? (
            <div className="flex items-center justify-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang tải phí khám...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Phí khám hiện tại
                </span>

                {user.role_name?.toLowerCase() === "admin" && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="text"
                    value={editedFee.toLocaleString("vi-VN")}
                    onChange={handleFeeChange}
                    className="text-3xl font-bold text-center border-b-2 border-blue-500 focus:outline-none w-40"
                    autoFocus
                  />
                  <span className="text-xl text-gray-600">đ</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-800">
                  {formatCurrency(editedFee)} đ
                </p>
              )}

              {isEditing && (
                <p className="text-xs text-gray-500 mt-2">
                  Phí mặc định: {consultationFee.toLocaleString("vi-VN")} đ
                </p>
              )}
            </>
          )}
        </div>

        {/* Nút bấm */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!editedFee || editedFee <= 0}
            className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            Tạo hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmInvoiceModal;
