/* {
  "revenue_today": 15200000,
  "patients_today": 48,
  "new_patients_today": 6,
  "appointments_today": 54,
  "low_stock_medicines": 3,
  "unpaid_invoices": 5,
  "daily_limit": 50   // dùng để tính: gần đạt giới hạn bệnh nhân
}
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();
/* GET /api/dashboard/admin/summary */
// GET /api/dashboard/admin/summary
// GET /api/dashboard/admin/summary
// ?period=today | week | month | custom
// &start=2025-12-01&end=2025-12-07
// &chart=7 | 30 | 90 (số ngày cho biểu đồ)
const getTodayVN = () => {
  const now = new Date();
  // Ép về giờ VN: +7 tiếng
  const vnOffset = 7 * 60 * 60 * 1000;
  const vnTime = new Date(now.getTime() + vnOffset);

  const year = vnTime.getUTCFullYear();
  const month = vnTime.getUTCMonth();
  const date = vnTime.getUTCDate();

  return new Date(Date.UTC(year, month, date, 0, 0, 0)); // 00:00 UTC của ngày hôm nay VN
};
/* GET /api/dashboard/admin/summary */
router.get(
  "/admin/summary",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    const { period = "today", start, end, chart = "30" } = req.query;

    // CHỈ DÙNG 1 LẦN – ĐÚNG GIỜ VIỆT NAM
    const getTodayVN = () => {
      const now = new Date();
      const vnOffset = 7 * 60 * 60 * 1000;
      const vnTime = new Date(now.getTime() + vnOffset);
      return new Date(
        Date.UTC(
          vnTime.getUTCFullYear(),
          vnTime.getUTCMonth(),
          vnTime.getUTCDate()
        )
      );
    };

    const todayVN = getTodayVN(); // ← 00:00 UTC của ngày hôm nay Việt Nam

    // Xác định khoảng thời gian
    let startDate, endDate;

    if (period === "week") {
      startDate = new Date(todayVN);
      startDate.setDate(todayVN.getDate() - 6);
      endDate = new Date(todayVN);
    } else if (period === "month") {
      startDate = new Date(todayVN.getFullYear(), todayVN.getMonth(), 1);
      endDate = new Date(todayVN);
    } else if (period === "custom" && start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(todayVN);
      endDate = new Date(todayVN);
    }

    // Biểu đồ: 7, 30, 90 ngày
    const chartDays = Math.min(Math.max(parseInt(chart, 10) || 30, 7), 90);
    const chartStartDate = new Date(todayVN);
    chartStartDate.setDate(todayVN.getDate() - (chartDays - 1));

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // 1. Dữ liệu chính
        const mainData = await client.query(
          `
          WITH filtered AS (
            SELECT 
              COALESCE(SUM(i.total_amount), 0) AS revenue,
              COUNT(DISTINCT CASE WHEN da.status = 'completed' THEN da.patient_id END) AS patients_today,
              COUNT(DISTINCT CASE WHEN da.status IN ('waiting', 'examined') THEN da.patient_id END) AS patients_pending,
              COUNT(DISTINCT CASE WHEN da.status = 'waiting' THEN da.patient_id END) AS patients_waiting,
              COUNT(DISTINCT CASE WHEN p.created_at::date BETWEEN $1 AND $2 THEN da.patient_id END) AS new_patients,
              COUNT(*) AS appointments_total

            FROM daily_appointments da
            LEFT JOIN medical_records mr ON mr.medical_record_id = da.medical_record_id 
            LEFT JOIN invoices i ON i.medical_record_id = mr.medical_record_id 
              AND i.created_at::date BETWEEN $1 AND $2
            LEFT JOIN patients p ON da.patient_id = p.patient_id
            WHERE da.appointment_date::date BETWEEN $1 AND $2
          ),
          low_stock AS (SELECT COUNT(*) AS low_stock FROM medicines WHERE stock_quantity < min_stock_level),
          unpaid AS (SELECT COUNT(*) AS unpaid FROM invoices WHERE payment_status = 'Chưa thanh toán' AND created_at::date BETWEEN $1 AND $2),
          total_invoice AS (SELECT COUNT(*) AS total_invoice FROM invoices WHERE created_at::date BETWEEN $1 AND $2),
          settings AS (SELECT setting_value::int AS daily_limit FROM settings WHERE setting_key = 'MaxPatientsPerDay' LIMIT 1)
          SELECT 
            f.*,
            COALESCE(ls.low_stock, 0) AS low_stock_medicines,
            COALESCE(un.unpaid, 0) AS unpaid_invoices,
            COALESCE(s.daily_limit, 50) AS daily_limit, 
            COALESCE(ti.total_invoice, 0) AS total_invoice
          FROM filtered f, low_stock ls, unpaid un, settings s, total_invoice ti;
        `,
          [
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
          ]
        );

        const result = mainData.rows[0];

        // 2. Biểu đồ doanh thu
        const revenueChart = await client.query(
          `
          SELECT 
            date::date AS date,
            COALESCE(SUM(i.total_amount), 0) AS revenue
          FROM generate_series($1::date, $2::date, INTERVAL '1 day') AS date
          LEFT JOIN invoices i ON i.created_at::date = date::date
          GROUP BY date
          ORDER BY date;
        `,
          [
            chartStartDate.toISOString().split("T")[0],
            todayVN.toISOString().split("T")[0],
          ]
        );

        // 3. Biểu đồ ca khám
        const patientsChart = await client.query(
          `
          SELECT 
            appointment_date::date AS date,
            COUNT(*) AS count
          FROM daily_appointments
          WHERE appointment_date >= $1 AND appointment_date <= $2
          GROUP BY appointment_date::date
          ORDER BY date;
        `,
          [
            chartStartDate.toISOString().split("T")[0],
            todayVN.toISOString().split("T")[0],
          ]
        );

        // NEW: Số lượng từng loại thuốc đã dùng hôm nay + Top 5
        const medicinesUsedTodayDetail = await client.query(`
          SELECT 
                m.medicine_id,
                m.medicine_name,
                COALESCE(SUM(pd.quantity), 0) AS quantity_used
            FROM prescription_detail pd
            JOIN medicines m 
                ON pd.medicine_id = m.medicine_id
            JOIN medical_records mr 
                ON pd.medical_record_id = mr.medical_record_id
            JOIN daily_appointments da 
                ON mr.medical_record_id = da.medical_record_id
            WHERE da.appointment_date::date = CURRENT_DATE
            GROUP BY m.medicine_id, m.medicine_name
            HAVING COALESCE(SUM(pd.quantity), 0) > 0
            ORDER BY quantity_used DESC;
        `);

        const totalMedicinesUsedToday = medicinesUsedTodayDetail.rows.reduce(
          (sum, row) => sum + Number(row.quantity_used),
          0
        );

        const top5MedicinesToday = medicinesUsedTodayDetail.rows.slice(0, 5);

        await client.query("COMMIT");

        res.json({
          success: true,
          data: {
            period,
            date_range: {
              start: startDate.toISOString().split("T")[0],
              end: endDate.toISOString().split("T")[0],
            },
            chart_days: chartDays,

            // THÊM MỚI
            medicines_used_today: totalMedicinesUsedToday,
            medicines_used_today_detail: medicinesUsedTodayDetail.rows.map(
              (r) => ({
                medicine_id: Number(r.medicine_id),
                medicine_name: r.medicine_name,
                unit: r.unit,
                quantity_used: Number(r.quantity_used),
              })
            ),
            top5_medicines_today: top5MedicinesToday.map((r) => ({
              // Top 5
              name: r.medicine_name,
              unit: r.unit,
              quantity: Number(r.quantity_used),
            })),

            revenue_today: Number(result.revenue),
            patients_today: Number(result.patients_today),
            new_patients_today: Number(result.new_patients),
            appointments_today: Number(result.appointments_total),
            patients_waiting_today: Number(result.patients_waiting),
            patients_pending_today: Number(result.patients_pending),
            low_stock_medicines: Number(result.low_stock_medicines),
            unpaid_invoices: Number(result.unpaid_invoices),
            daily_limit: Number(result.daily_limit),
            total_invoice: Number(result.total_invoice), 

            revenue_last_days: revenueChart.rows.map((r) => ({
              date: r.date.toISOString().split("T")[0],
              revenue: Number(r.revenue),
            })),
            patients_by_day: patientsChart.rows.map((r) => ({
              date: r.date.toISOString().split("T")[0],
              count: Number(r.count),
            })),

            // Bổ sung số lượng của các thuốc đã dùng hôm nay:
          },
        });
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Dashboard summary error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  
);


/// receptionist/summary 
router.get(
  "/receptionist/summary",
  [authenticateToken, authorizeRoles("receptionist")],
  async (req, res) => {
    const { period = "today", start, end, chart = "30" } = req.query;
    // Tổng hóa đơn, doanh thu ước tính, doanh thu thực tế, hóa đơn chưa thanh toán, đã thanh toán / Số bệnh nhân mới hôm nay, danh sách khám bệnh ( appointments), 
    /// Đã khám chưa khám , hoàn tất 

  }
)
/// Doctor/summary 
/// Đã khám, Chưa khám, hoàn tất , ...


module.exports = router;

