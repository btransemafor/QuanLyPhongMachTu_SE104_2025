import React, { useState, useEffect, useRef } from "react";
import { Modal, Spin, message } from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { invoicesAPI } from "../../services/api";
import  generateInvoicePDF  from './generateInvoicePDF';

const InvoiceModal = ({ visible, invoiceId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const invoiceRef = useRef(null); //  Thêm ref

  useEffect(() => {
    if (visible && invoiceId) {
      fetchInvoiceBasic();
    }
  }, [visible, invoiceId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      minute: '2-digit',
      hour : '2-digit'
    });
  };

  const fetchInvoiceBasic = async () => {
    setLoading(true);
    try {
      const res = await invoicesAPI.getInvoiceBasic(invoiceId);
      console.log("Data invoice cho modal", res.data.data);
      setInvoice(res.data.data);
    } catch (err) {
      message.error("Không thể tải hóa đơn");
    } finally {
      setLoading(false);
    }
  };


  const printInvoice = async () => {
      try {
    // Thông tin phòng khám (tuỳ chỉnh theo dữ liệu thực tế)
     const clinicInfo = {
      name: "PHÒNG KHÁM OMGNICE",
      address: "Khu phố 6, phường Linh Trung, TP. Thủ Đức, TP.HCM",
      phone: "033 849 8306",
      email: "contact@omgnice.vn",
    };


    const result = await generateInvoicePDF(invoice, clinicInfo);
    
    if (result.success) {
      message.success(`Đã tải xuống ${result.fileName}`);
    } else {
      message.error("Không thể tạo PDF");
    }
  } catch (error) {
    console.error(error);
    message.error("Có lỗi xảy ra khi tạo PDF");
  }
  }

  // Thêm vào InvoiceModal component
const handleDownloadPDF = async () => {
  try {
    // Thông tin phòng khám (tuỳ chỉnh theo dữ liệu thực tế)
    const clinicInfo = {
      name: "PHÒNG KHÁM ĐA KHOA OMGNICE",
      address: "Khu phố 6, phường Linh Trung, TP. Thủ Đức, TP.HCM",
      phone: "033 849 8306",
      email: "contact@omgnice.vn",
    };

    const result = await generateInvoicePDF(invoice, clinicInfo);
    
    if (result.success) {
      message.success(`Đã tải xuống ${result.fileName}`);
    } else {
      message.error("Không thể tạo PDF");
    }
  } catch (error) {
    console.error(error);
    message.error("Có lỗi xảy ra khi tạo PDF");
  }
};

  const handlePrintInvoice = () => {
    if (!invoiceRef.current) {
      message.error("Không thể in hóa đơn");
      return;
    }

    // Tạo style cho trang in
    const printStyles = `
      <style>
        @media print {
          @page { 
            margin: 1cm;
            size: A4;
          }
          
          .print-hide {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          body, .invoice-code {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            background-color: white !important; /* Hoặc màu bạn muốn */
            color: black !important;
        } 

        .phu {
           print-color-adjust: exact !important;
           background-color: white !important; /* Hoặc màu bạn muốn */
        }

        }
        
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .print-hide {
          display: none !important;
        }
      </style>
    `;

    // Clone nội dung và xóa nút in
    const clonedContent = invoiceRef.current.cloneNode(true);
    const printButtons = clonedContent.querySelectorAll(".print-hide, button");
    const phu = clonedContent.querySelectorAll('.phu'); 
    phu.forEach((i) => i.remove())
    printButtons.forEach((btn) => btn.remove());

    // Mở cửa sổ in mới
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Hóa đơn ${invoice.invoice_code}</title>
          ${printStyles}
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/antd/5.12.0/reset.min.css">
        </head>
        <body>
          <div id="printable-invoice">
            ${clonedContent.innerHTML}
          </div>
          <script>
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const InfoItem = ({ icon, label, value, extra }) => (
    <div className="flex gap-3 items-start">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div className="text-base font-semibold text-gray-900">
          {value}
          {extra && (
            <span className="text-gray-400 ml-2 font-medium text-sm">
              {extra}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const getRoleName = (role) => {
    const roles = {
      admin: "Quản trị viên",
      doctor: "Bác sĩ",
      nurse: "Y tá",
      pharmacist: "Dược sĩ",
      receptionist: "Lễ tân",
    };
    return roles[role] || "Nhân viên";
  };

  if (loading || !invoice) {
    return (
      <Modal
        open={visible}
        footer={null}
        onCancel={onClose}
        width={740}
        closable={false}
      >
        <div className="text-center py-24">
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  const isPaid = invoice.payment_status === "paid";

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={880}
      closeIcon={
        <CloseOutlined
          className="text-lg text-white"
          style={{
            background: "#0e1182ff",
            borderRadius: "50%", // tròn
            padding: "10px",
          }}
        />
      }
      style={{ top: 40 }}
      bodyStyle={{ padding: 0 }}
      maskStyle={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
    >
      <div ref={invoiceRef}>
        {" "}
        {/*  Wrap nội dung cần in */}
        {/* Header với gradient */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative bg-gradient-to-br from-[#3568E8] to-[#614AFA] px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="phu w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <FileTextOutlined className="text-3xl text-white" />
                </div>
                <div>
                  <div className="text-white/80 text-sm font-medium mb-1">
                    Hóa đơn khám bệnh
                  </div>
                  <div className="invoice-code text-white text-3xl font-bold tracking-tight">
                    {invoice.invoice_code}
                  </div>
                </div>
              </div>

              <div className="phu relative">
                <div
                  className={`
                    px-6 py-3 rounded-xl font-semibold text-sm
                    backdrop-blur-md shadow-lg
                    ${
                      isPaid
                        ? "bg-green-600/100 text-white"
                        : "bg-amber-400/90 text-amber-900"
                    }
                  `}
                >
                  <div className="phu flex items-center gap-2">
                    {isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    {isPaid ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
          {/* Thông tin bệnh nhân và ngày khám */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <InfoItem
                icon={<UserOutlined className="text-lg text-blue-600" />}
                label="Bệnh nhân"
                value={invoice.patient_name || "—"}
              />
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <InfoItem
                icon={<CalendarOutlined className="text-lg text-indigo-600" />}
                label="Ngày khám"
                value={dayjs(invoice.exam_date).format("DD/MM/YYYY")}
                extra={dayjs(invoice.exam_date).format("HH:mm")}
              />
            </div>
          </div>

          {/* Người lập và ngày lập */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                  {invoice.created_by_name?.[0]?.toUpperCase() || "A"}
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    Người lập hóa đơn
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    {invoice.creator || "Hệ thống"}
                  </div>
                  {invoice.created_by_role && (
                    <div className="inline-block mt-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                      {getRoleName(invoice.created_by_role)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <InfoItem
                icon={<CalendarOutlined className="text-lg text-purple-600" />}
                label="Ngày lập hóa đơn"
                value={dayjs(invoice.invoice_date).format("DD/MM/YYYY")}
                extra={dayjs(invoice.invoice_date).format("HH:mm")}
              />
            </div>
          </div>

          {/* Chi tiết thanh toán */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            {/* Tiền khám và tiền thuốc */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarOutlined className="text-lg text-cyan-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    Tiền khám bệnh
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 ml-1">
                  {Math.round(invoice.consultation_fee).toLocaleString("vi-VN")}
                  <span className="text-xl ml-1 text-gray-600">₫</span>
                </div>
              </div>

              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MedicineBoxOutlined className="text-lg text-emerald-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    Tiền thuốc
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 ml-1">
                  {Math.round(invoice.medicine_fee).toLocaleString("vi-VN")}
                  <span className="text-xl ml-1 text-gray-600">₫</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

            {/* Tổng thanh toán */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 text-white shadow-2xl">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative text-center">
                <div className="text-sm font-semibold text-white/70 mb-2 tracking-wide uppercase">
                  Tổng thanh toán
                </div>
                <div className="text-5xl font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {Math.round(invoice.total_amount).toLocaleString("vi-VN")}
                  <span className="text-3xl ml-2">₫</span>
                </div>
                {isPaid && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full">
                    <CheckCircleOutlined className="text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">
                      Đã thanh toán thành công
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer button - không in */}
          <div className="text-right mt-8 print-hide">
            <button
              className="mr-8 px-8 py-3.5 bg-white text-[#0e1182ff] border-2 border-[#0e1182ff] rounded-xl font-semibold text-base shadow hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95"
              onClick={printInvoice}
            >
              Xuất hóa đơn
            </button>

            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-[#0e1182ff] text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
