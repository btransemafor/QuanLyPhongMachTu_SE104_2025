// InvoicePDFGenerator.jsx
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";

/**
 * Tạo PDF hóa đơn siêu đẹp với thiết kế chuyên nghiệp
 * @param {Object} invoice - Dữ liệu hóa đơn
 * @param {Object} clinicInfo - Thông tin phòng khám (optional)
 */
export const generateInvoicePDF = async (invoice, clinicInfo = {}) => {
  // Default clinic info
  const clinic = {
    name: clinicInfo.name || "PHÒNG KHÁM ĐA KHOA MEDPRO",
    address: clinicInfo.address || "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
    phone: clinicInfo.phone || "028 1234 5678",
    email: clinicInfo.email || "contact@medpro.vn",
    logo: clinicInfo.logo || null,
    ...clinicInfo,
  };

  // Tạo HTML template
  const htmlContent = createInvoiceHTML(invoice, clinic);

  // Tạo temporary container
  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "800px";
  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Tạo PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    // Download PDF
    const fileName = `HoaDon_${invoice.invoice_code}_${dayjs().format("YYYYMMDD")}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { success: false, error };
  } finally {
    // Cleanup
    document.body.removeChild(container);
  }
};

/**
 * Tạo HTML template cho hóa đơn
 */
const createInvoiceHTML = (invoice, clinic) => {
  const isPaid = invoice.payment_status === "paid";
  const formatCurrency = (amount) =>
    Math.round(amount).toLocaleString("vi-VN") + " ₫";
  const formatDate = (date) =>
    dayjs(date).format("DD/MM/YYYY");

  // Load Google Fonts (Inter) - đảm bảo load trước khi render
  const fontStyle = `
    @import url('https://rsms.me/inter/inter.css');
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${fontStyle}
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #f8fafc;
          color: #1e293b;
          line-height: 1.5;
          padding: 40px 20px;
        }
        
        .invoice-container {
          max-width: 820px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        
        /* Header - Thanh lịch, không lố */
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 30px 40px;
          position: relative;
          
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 300px; height: 300px;
          background: rgba(255,255,255,0.07);
          border-radius: 50%;
          transform: translate(100px, -100px);
        }
        
        .clinic-name {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        
        .clinic-address {
          font-size: 15px;
          opacity: 0.9;
          margin-bottom: 4px;
        }
        
        .clinic-contact {
          font-size: 14px;
          opacity: 0.85;
        }
        
        .invoice-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 35px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.2);
        }
        
        .invoice-title {
          font-size: 20px;
          font-weight: 600;
          opacity: 0.95;
          color: white;
        }
        
        .invoice-code {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 1px;
        }
        
        .status-badge {
          padding: 10px 24px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        
        .status-paid {
          background: rgba(34, 197, 94, 0.25);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.4);
        }
        
        .status-unpaid {
          background: rgba(251, 146, 60, 0.25);
          color: #fdba74;
          border: 1px solid rgba(251, 146, 60, 0.4);
        }
        
        /* Body */
        .body {
          padding: 50px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          margin-bottom: 40px;
        }
        
        .info-block {
          background: #f8fafc;
          padding: 24px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
        }
        
        .info-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .info-value {
          font-size: 17px;
          font-weight: 600;
          color: #0f172a;
        }
        
        .info-sub {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
        }
        
        /* Payment Table */
        .payment-section {
          background: #f0f9ff;
          border-radius: 16px;
          padding: 32px;
          border: 1px solid #bae6fd;
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 19px;
          font-weight: 700;
          color: #0c4a6e;
          margin-bottom: 24px;
        }
        
        .payment-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px dashed #94a3b8;
          font-size: 16px;
        }
        
        .payment-row:last-child {
          border-bottom: none;
          padding-top: 20px;
          margin-top: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .payment-label {
          color: #1e40af;
          font-weight: 500;
        }
        
        .payment-value {
          font-weight: 600;
          color: #1e293b;
        }
        
        /* Total Highlight */
        .total-highlight {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: white;
          padding: 32px;
          border-radius: 16px;
          text-align: center;
          margin: 40px 0;
        }
        
        .total-label {
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          opacity: 0.8;
          margin-bottom: 8px;
        }
        
        .total-amount {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -1px;
        }
        
        .paid-note {
          margin-top: 12px;
          font-size: 15px;
          opacity: 0.9;
        }
        
        /* Footer */
        .footer {
          border-top: 2px dashed #cbd5e1;
          padding-top: 20px;
          text-align: center;
          color: #64748b;
        }
        
        .thank-you {
          font-size: 15px;
          margin-bottom: 32px;
          line-height: 1.7;
        }
        
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          margin: 60px 0 40px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-label {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 70px;
          position: relative;
        }
        
        .signature-label::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 1px;
          background: #94a3b8;
        }
        
        .signature-name {
          margin-top: 12px;
          font-weight: 600;
          color: #1e293b;
          font-size: 15px;
        }
        
        .print-info {
          margin-top: 40px;
          padding: 16px;
          background: #f1f5f9;
          border-radius: 10px;
          font-size: 12px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="clinic-name">${clinic.name}</div>
          <div class="clinic-address">${clinic.address}</div>
          <div class="clinic-contact">${clinic.phone} • ${clinic.email}</div>
          
          <div class="invoice-meta">
            <div>
              <div class="invoice-title">Hóa Đơn Khám Bệnh</div>
              <div class="invoice-code">${invoice.invoice_code}</div>
            </div>
            <div class="status-badge ${isPaid ? 'status-paid' : 'status-unpaid'}">
              ${isPaid ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
            </div>
          </div>
        </div>
        
        <div class="body">
          <div class="info-grid">
            <div class="info-block">
              <div class="info-label">Bệnh nhân</div>
              <div class="info-value">${invoice.patient_name || '—'}</div>
              ${invoice.patient_phone ? `<div class="info-sub">${invoice.patient_phone}</div>` : ''}
            </div>
            <div class="info-block">
              <div class="info-label">Ngày khám</div>
              <div class="info-value">${formatDate(invoice.exam_date)} ${dayjs(invoice.exam_date).format("HH:mm")}</div>
            </div>
            <div class="info-block">
              <div class="info-label">Người lập hóa đơn</div>
              <div class="info-value">${invoice.creator || 'Hệ thống'}</div>
              ${invoice.created_by_role ? `<div class="info-sub">${getRoleName(invoice.created_by_role)}</div>` : ''}
            </div>
            <div class="info-block">
              <div class="info-label">Ngày lập</div>
              <div class="info-value">${formatDate(invoice.invoice_date)} ${dayjs(invoice.invoice_date).format("HH:mm")}</div>
              <div class="info-sub"></div>
            </div>
          </div>
          
          <div class="payment-section">
            <div class="section-title">Chi Tiết Thanh Toán</div>
            <div class="payment-row">
              <span class="payment-label">Tiền khám bệnh</span>
              <span class="payment-value">${formatCurrency(invoice.consultation_fee)}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Tiền thuốc</span>
              <span class="payment-value">${formatCurrency(invoice.medicine_fee)}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">TỔNG CỘNG</span>
              <span class="payment-value">${formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
          
          
          <div class="footer">
            <div class="thank-you">
              Xin chân thành cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ tại ${clinic.name}.<br>
              Mọi thắc mắc vui lòng liên hệ: <strong>${clinic.phone}</strong>
            </div>
            
            <div class="signature-grid">
              <div class="signature-box">
                <div class="signature-label">Người lập hóa đơn</div>
                <div class="signature-name">${invoice.creator || 'Hệ thống'}</div>
              </div>
              <div class="signature-box">
                <div class="signature-label">Bệnh nhân</div>
                <div class="signature-name">${invoice.patient_name || ''}</div>
              </div>
            </div>
            
            <div class="print-info">
              Hóa đơn được in lúc ${dayjs().format("HH:mm, [ngày] DD [tháng] MM, YYYY")}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Helper: Get role name in Vietnamese
 */
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

export default generateInvoicePDF;