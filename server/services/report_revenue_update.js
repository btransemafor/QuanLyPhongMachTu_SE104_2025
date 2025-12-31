/* 

// jobs/reportSync.job.js
const cron = require('node-cron');
const pool = require('../config/database');
const moment = require('moment');

// Hàm đồng bộ ngày hôm qua (chạy mỗi ngày lúc 0h05 để chắc chắn dữ liệu đã đầy đủ)
async function syncYesterdayDailyReport() {
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  console.log(`Bắt đầu đồng bộ báo cáo ngày: ${yesterday}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lấy tất cả invoice của ngày hôm qua
    const invoiceRes = await client.query(`
      SELECT 
        i.total_amount,
        i.created_at,
        mr.patient_id
      FROM invoices i
      JOIN medical_records mr ON i.medical_record_id = mr.medical_record_id
      WHERE DATE(i.created_at) = $1
        AND i.payment_status = 'paid'  -- chỉ lấy hóa đơn đã thanh toán (tùy chỉnh nếu cần)
    `, [yesterday]);

    const invoices = invoiceRes.rows;
    if (invoices.length === 0) {
      console.log(`Không có hóa đơn nào ngày ${yesterday}`);
      await client.query('COMMIT');
      return;
    }

    // Tính tổng doanh thu + số bệnh nhân duy nhất
    const revenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const uniquePatients = new Set(invoices.map(inv => inv.patient_id));
    const patientCount = uniquePatients.size;

    // Lấy monthly_report_id của tháng này
    const monthYear = moment(yesterday).format('YYYY-MM');
    const monthRes = await client.query(`
      SELECT monthly_report_id, total_revenue 
      FROM monthly_revenue_reports 
      WHERE month_year = $1
    `, [monthYear]);

    let monthlyReportId;
    let monthlyTotal = revenue;

    if (monthRes.rows.length > 0) {
      monthlyReportId = monthRes.rows[0].monthly_report_id; 
      monthlyTotal = parseFloat(monthRes.rows[0].total_revenue) + revenue;
    } else {
      // Nếu chưa có báo cáo tháng → tạo mới (hiếm khi xảy ra)
      const newMonth = await client.query(`
        INSERT INTO monthly_revenue_reports (month_year, total_revenue, total_patient_count)
        VALUES ($1, $2, 0)
        RETURNING monthly_report_id
      `, [monthYear, revenue]);
      monthlyReportId = newMonth.rows[0].monthly_report_id;
    }

    // Cập nhật lại tổng tháng (sẽ được xử lý chính xác hơn vào mùng 1)
    await client.query(`
      UPDATE monthly_revenue_reports 
      SET total_revenue = total_revenue + $2 
      WHERE monthly_report_id = $1
    `, [monthlyReportId, revenue]);

    // Tính tỷ lệ đóng góp của ngày
    const revenueRate = monthlyTotal > 0 ? ((revenue / monthlyTotal) * 100).toFixed(4) : 0;

    // Upsert daily report
    await client.query(`
      INSERT INTO daily_revenue_reports (
        report_date, revenue, patient_count, monthly_report_id, revenue_rate
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (report_date) DO UPDATE SET
        revenue = EXCLUDED.revenue,
        patient_count = EXCLUDED.patient_count,
        monthly_report_id = EXCLUDED.monthly_report_id,
        revenue_rate = EXCLUDED.revenue_rate,
        updated_at = CURRENT_TIMESTAMP
    `, [yesterday, revenue, patientCount, monthlyReportId, revenueRate]);

    await client.query('COMMIT');
    console.log(`Đồng bộ ngày ${yesterday} thành công | Doanh thu: ${revenue.toLocaleString()}đ | ${patientCount} bệnh nhân`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Lỗi đồng bộ ngày ${yesterday}:`, error);
  } finally {
    client.release();
  }
}

// Hàm đồng bộ toàn bộ tháng trước (chạy vào 0h10 ngày 1 hàng tháng)
async function syncPreviousMonthReport() {
  const lastMonth = moment().subtract(1, 'month');
  const monthYear = lastMonth.format('YYYY-MM');
  const startOfMonth = lastMonth.startOf('month').format('YYYY-MM-DD');
  const endOfMonth = lastMonth.endOf('month').format('YYYY-MM-DD');

  console.log(`Bắt đầu tổng hợp báo cáo tháng: ${monthYear}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tính tổng doanh thu + bệnh nhân duy nhất trong tháng
    const result = await client.query(`
      SELECT 
        COALESCE(SUM(i.total_amount), 0) as total_revenue,
        COUNT(DISTINCT i.patient_id) as total_patients
      FROM invoices i
      JOIN medical_records mr ON i.medical_record_id = mr.medical_record_id
      WHERE i.created_at::date BETWEEN $1 AND $2
        AND i.payment_status = 'paid'
    `, [startOfMonth, endOfMonth]);

    const { total_revenue, total_patients } = result.rows[0];

    // Upsert monthly report
    const upsertRes = await client.query(`
      INSERT INTO monthly_revenue_reports (month_year, total_revenue, total_patient_count)
      VALUES ($1, $2, $3)
      ON CONFLICT (month_year) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_patient_count = EXCLUDED.total_patients,
        updated_at = CURRENT_TIMESTAMP
      RETURNING monthly_report_id
    `, [monthYear, total_revenue, total_patients || 0]);

    const monthlyReportId = upsertRes.rows[0].monthly_report_id;

    // Cập nhật lại revenue_rate cho tất cả các ngày trong tháng
    await client.query(`
      WITH month_data AS (
        SELECT report_date, revenue
        FROM daily_revenue_reports
        WHERE monthly_report_id = $1
      )
      UPDATE daily_revenue_reports d
      SET revenue_rate = ROUND((m.revenue::numeric / $2) * 100, 4)
      FROM month_data m
      WHERE d.report_date = m.report_date
        AND d.monthly_report_id = $1
    `, [monthlyReportId, total_revenue || 1]);

    await client.query('COMMIT');
    console.log(`Tổng hợp tháng ${monthYear} hoàn tất | Tổng DT: ${Number(total_revenue).toLocaleString()}đ | ${total_patients} bệnh nhân duy nhất`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Lỗi tổng hợp tháng ${monthYear}:`, error);
  } finally {
    client.release();
  }
}

// Khởi động cron jobs
function startReportSyncJobs() {
  console.log('Cron jobs báo cáo đã được khởi động');

  // Mỗi ngày lúc 0h05: đồng bộ ngày hôm qua
  cron.schedule('5 0 * * *', () => {
    console.log('Chạy cron: Đồng bộ báo cáo ngày hôm qua');
    syncYesterdayDailyReport();
  });

  // Ngày 1 hàng tháng lúc 0h10: tổng hợp tháng trước
  cron.schedule('10 0 1 * *', () => {
    console.log('Chạy cron: Tổng hợp báo cáo tháng trước');
    syncPreviousMonthReport();
  });

  // (Tùy chọn) Chạy ngay khi khởi động để test
  // syncYesterdayDailyReport();
  // syncPreviousMonthReport();
}

module.exports = { startReportSyncJobs, syncYesterdayDailyReport }; */



// jobs/reportSync.job.js
const cron = require('node-cron');
const pool = require('../config/database');
const moment = require('moment');

// Hàm đồng bộ ngày hôm qua (chạy mỗi ngày lúc 0h05)
async function syncYesterdayDailyReport() {
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  console.log(`Bắt đầu đồng bộ báo cáo ngày: ${yesterday}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lấy tất cả invoice của ngày hôm qua
    const invoiceRes = await client.query(`
      SELECT 
        i.total_amount,
        i.created_at,
        mr.patient_id
      FROM invoices i
      JOIN medical_records mr ON i.medical_record_id = mr.medical_record_id
      WHERE DATE(i.created_at) = $1
        AND i.payment_status = 'paid'
    `, [yesterday]);

    const invoices = invoiceRes.rows;
    if (invoices.length === 0) {
      console.log(`Không có hóa đơn nào ngày ${yesterday}`);
      await client.query('COMMIT');
      return;
    }

    // Tính tổng doanh thu + số bệnh nhân duy nhất
    const revenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const uniquePatients = new Set(invoices.map(inv => inv.patient_id));
    const patientCount = uniquePatients.size;

    // Lấy monthly_report_id của tháng này
    const monthYear = moment(yesterday).format('YYYY-MM');
    const monthRes = await client.query(`
      SELECT monthly_report_id, total_revenue 
      FROM monthly_revenue_reports 
      WHERE month_year = $1
    `, [monthYear]);

    let monthlyReportId;
    let monthlyTotal = revenue;

    if (monthRes.rows.length > 0) {
      monthlyReportId = monthRes.rows[0].monthly_report_id; 
      monthlyTotal = parseFloat(monthRes.rows[0].total_revenue) + revenue;
    } else {
      // Nếu chưa có báo cáo tháng → tạo mới
      const newMonth = await client.query(`
        INSERT INTO monthly_revenue_reports (
          month_year, 
          total_revenue, 
          total_patient_count,
          total_visit_count
        )
        VALUES ($1, $2, 0, 0)
        RETURNING monthly_report_id
      `, [monthYear, revenue]);
      monthlyReportId = newMonth.rows[0].monthly_report_id;
    }

    // Cập nhật lại tổng tháng
    await client.query(`
      UPDATE monthly_revenue_reports 
      SET 
        total_revenue = total_revenue + $2,
        total_visit_count = total_visit_count + 1
      WHERE monthly_report_id = $1
    `, [monthlyReportId, revenue]);

    // Tính tỷ lệ đóng góp của ngày
    const revenueRate = monthlyTotal > 0 ? ((revenue / monthlyTotal) * 100).toFixed(4) : 0;

    // Upsert daily report
    await client.query(`
      INSERT INTO daily_revenue_reports (
        report_date, revenue, patient_count, monthly_report_id, revenue_rate
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (report_date) DO UPDATE SET
        revenue = EXCLUDED.revenue,
        patient_count = EXCLUDED.patient_count,
        monthly_report_id = EXCLUDED.monthly_report_id,
        revenue_rate = EXCLUDED.revenue_rate,
        updated_at = CURRENT_TIMESTAMP
    `, [yesterday, revenue, patientCount, monthlyReportId, revenueRate]);

    await client.query('COMMIT');
    console.log(`Đồng bộ ngày ${yesterday} thành công | DT: ${revenue.toLocaleString()}đ | ${patientCount} BN`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Lỗi đồng bộ ngày ${yesterday}:`, error);
  } finally {
    client.release();
  }
}

// Hàm đồng bộ toàn bộ tháng trước (chạy vào 0h10 ngày 1 hàng tháng)
async function syncPreviousMonthReport() {
  const lastMonth = moment().subtract(1, 'month');
  const monthYear = lastMonth.format('YYYY-MM');
  const startOfMonth = lastMonth.startOf('month').format('YYYY-MM-DD');
  const endOfMonth = lastMonth.endOf('month').format('YYYY-MM-DD');

  console.log(`Bắt đầu tổng hợp báo cáo tháng: ${monthYear}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tính tổng doanh thu + số bệnh nhân duy nhất + tổng lượt khám
    const result = await client.query(`
      SELECT 
        COALESCE(SUM(i.total_amount), 0) as total_revenue,
        COUNT(DISTINCT mr.patient_id) as total_patients,
        COUNT(*) as total_visits
      FROM invoices i
      JOIN medical_records mr ON i.medical_record_id = mr.medical_record_id
      WHERE i.created_at::date BETWEEN $1 AND $2
        AND i.payment_status = 'paid'
    `, [startOfMonth, endOfMonth]);

    const { total_revenue, total_patients, total_visits } = result.rows[0];

    // Upsert monthly report
    const upsertRes = await client.query(`
      INSERT INTO monthly_revenue_reports (
        month_year, 
        total_revenue, 
        total_patient_count,
        total_visit_count
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (month_year) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_patient_count = EXCLUDED.total_patient_count,
        total_visit_count = EXCLUDED.total_visit_count,
        updated_at = CURRENT_TIMESTAMP
      RETURNING monthly_report_id
    `, [monthYear, total_revenue, total_patients || 0, total_visits || 0]);

    const monthlyReportId = upsertRes.rows[0].monthly_report_id;

    // Cập nhật lại revenue_rate cho tất cả các ngày trong tháng
    if (parseFloat(total_revenue) > 0) {
      await client.query(`
        UPDATE daily_revenue_reports
        SET revenue_rate = ROUND((revenue::numeric / $2) * 100, 4)
        WHERE monthly_report_id = $1
      `, [monthlyReportId, total_revenue]);
    }

    await client.query('COMMIT');
    console.log(`Tổng hợp tháng ${monthYear} hoàn tất`);
    console.log(`Tổng DT: ${Number(total_revenue).toLocaleString()}đ`);
    console.log(`Số BN duy nhất: ${total_patients}`);
    console.log(`Tổng lượt khám: ${total_visits}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Lỗi tổng hợp tháng ${monthYear}:`, error);
  } finally {
    client.release();
  }
}

// Khởi động cron jobs
function startReportSyncJobs() {
  console.log('Cron jobs báo cáo đã được khởi động');

  // Mỗi ngày lúc 0h05: đồng bộ ngày hôm qua
  cron.schedule('5 0 * * *', () => {
    console.log('Chạy cron: Đồng bộ báo cáo ngày hôm qua');
    syncYesterdayDailyReport();
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  // Ngày 1 hàng tháng lúc 0h10: tổng hợp tháng trước
  cron.schedule('10 0 1 * *', () => {
    console.log('Chạy cron: Tổng hợp báo cáo tháng trước');
    syncPreviousMonthReport();
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  // Test ngay khi khởi động (comment lại khi production)
  // syncYesterdayDailyReport();
  // syncPreviousMonthReport();
}

module.exports = { 
  startReportSyncJobs, 
  syncYesterdayDailyReport,
  syncPreviousMonthReport
};