const cron = require("node-cron");
const pool = require("../config/database");
const moment = require("moment");

// ================= DAILY REPORT =================
async function syncYesterdayDailyReport() {
  const client = await pool.connect();
  const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

  try {
    await client.query("BEGIN");

    const details = await client.query(
      `
      SELECT 
        pd.medicine_id,
        COUNT(*) AS usage_count,
        SUM(pd.quantity) AS quantity_used
      FROM prescription_detail pd
      JOIN medical_records mr ON mr.medical_record_id = pd.medical_record_id
      JOIN daily_appointments da ON da.medical_record_id = mr.medical_record_id
      WHERE da.appointment_date = $1
      GROUP BY pd.medicine_id
      `,
      [yesterday]
    );

    console.log(`✔ Daily data (${yesterday}):`, details.rows);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi sync daily:", err);
  } finally {
    client.release();
  }
}



// ================= MONTHLY REPORT =================
// Tổng hợp tháng trước → ghi vào medicine_usage_reports + details
async function syncPreviousMonthReport() {
  const client = await pool.connect();
  const previousMonth = moment().subtract(1, "month").format("YYYY-MM");
  const monthFirstDay = previousMonth + "-01";

  try {
    await client.query("BEGIN");

    console.log(`▶ Tổng hợp báo cáo tháng ${previousMonth}`);

    // 1. Kiểm tra record tháng đã có chưa
    const check = await client.query(
      `SELECT medicine_usage_report_id 
       FROM medicine_usage_reports 
       WHERE month_year = $1`,
      [previousMonth]
    );

    let reportId;

    if (check.rows.length === 0) {
      // Tạo record mới cho tháng
      const insert = await client.query(
        `INSERT INTO medicine_usage_reports (month_year)
         VALUES ($1)
         RETURNING medicine_usage_report_id`,
        [previousMonth]
      );
      reportId = insert.rows[0].medicine_usage_report_id;
    } else {
      reportId = check.rows[0].medicine_usage_report_id;

      // Xóa chi tiết cũ nếu cron chạy lại
      await client.query(
        `DELETE FROM medicine_usage_reports_details 
         WHERE medicine_usage_report_id = $1`,
        [reportId]
      );
    }

    // 2. Tổng hợp dữ liệu tháng trước
    const summary = await client.query(
      `
      SELECT 
        pd.medicine_id,
        COUNT(*) AS usage_count,
        SUM(pd.quantity) AS quantity_used, 
        SUM(pd.sell_price * pd.quantity) AS total_value
      FROM prescription_detail pd
      JOIN medicines m ON m.medicine_id = pd.medicine_id
      JOIN medical_records mr ON mr.medical_record_id = pd.medical_record_id
      JOIN daily_appointments da ON da.medical_record_id = mr.medical_record_id
      WHERE DATE_TRUNC('month', da.appointment_date) = DATE_TRUNC('month', $1::date)
      GROUP BY pd.medicine_id
      `,
      [monthFirstDay]
    );

    // 3. Insert vào bảng chi tiết
    for (const row of summary.rows) {
      await client.query(
        `
        INSERT INTO medicine_usage_reports_details
        (medicine_usage_report_id, medicine_id, usage_count, quantity_used, total_value)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          reportId,
          row.medicine_id,
          row.usage_count,
          row.quantity_used,
          row.total_value
        ]
      );
    }

    await client.query("COMMIT");
    console.log(`✔ Đã tạo báo cáo tháng ${previousMonth} thành công!`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi sync monthly:", err);
  } finally {
    client.release();
  }
}




// ================= CRON JOBS =================

function startReportUsageMedicineSyncJobs() {
  console.log("Cron jobs báo cáo thuốc đã chạy");

  // DAILY — chạy 00:04 mỗi ngày
  cron.schedule("4 0 * * *", () => {
    console.log("Cron: cập nhật báo cáo ngày");
    syncYesterdayDailyReport();
  });

  // MONTHLY — chạy 00:10 ngày 1 mỗi tháng
  cron.schedule("10 0 1 * *", () => {
    console.log("Cron: tổng hợp báo cáo tháng");
    syncPreviousMonthReport();
  });
}

module.exports = {
  startReportUsageMedicineSyncJobs,
  syncPreviousMonthReport
};
