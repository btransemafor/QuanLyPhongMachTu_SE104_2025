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
/// GET /api/dashboard/admin/summary
router.get(
  "/admin/summary",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { period = "today", start, end, chart = "30" } = req.query;
      //const todayVN = getTodayVN();
      const now = new Date();
      console.log("Now: ", now);

      const todayVN = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      console.log("Now (UTC):", now);
      console.log("Vietnam Time (UTC+7):", todayVN);

      // const vnOffset = 7 * 60 * 60 * 1000;
      // const todayVN = new Date(now.getTime() + vnOffset);
      // todayVN.setHours(0, 0, 0, 0);
      console.log("todayVN:", todayVN.toISOString().split("T")[0]);
      console.log("today raw: ", todayVN.toISOString().split("T"));
      const client = await pool.connect();
      try {
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

        //startDate.setDate(startDate.getDate() + 1);
        //endDate.setDate(endDate.getDate() + 1);

        console.log(
          "Adjusted Start Date:",
          startDate.toISOString().split("T")[0]
        );
        console.log("Adjusted End Date:", endDate.toISOString().split("T")[0]);

        // Biểu đồ: 7, 30, 90 ngày
        const chartDays = Math.min(Math.max(parseInt(chart, 10) || 30, 7), 90);
        const chartStartDate = new Date(todayVN);
        chartStartDate.setDate(todayVN.getDate() - (chartDays - 1));
        const chartStartSQL = `'${
          chartStartDate.toISOString().split("T")[0]
        }'::date`;

        // ============================================================

        const mainResult = await client.query(
          `
          WITH filtered AS (
            SELECT 
              COUNT(DISTINCT CASE WHEN da.status = 'completed' THEN da.patient_id END) AS patients_today,
              COUNT(DISTINCT CASE WHEN da.status IN ('examined') THEN da.patient_id END) AS patients_pending,
              COUNT(DISTINCT CASE WHEN da.status = 'waiting' THEN da.patient_id END) AS patients_waiting,
              COUNT(DISTINCT CASE WHEN p.created_at::date = $2 THEN da.patient_id END) AS new_patients,
              COUNT(*) AS appointments_total
            FROM daily_appointments da
            LEFT JOIN medical_records mr ON mr.medical_record_id = da.medical_record_id
            LEFT JOIN patients p ON da.patient_id = p.patient_id
            WHERE da.appointment_date::date 
                  BETWEEN $1 AND $2
          ),
          invoice_stats AS (
            SELECT 
              COUNT(*) AS total_invoices,
              COALESCE(SUM(total_amount), 0) AS total_revenue,
              COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_revenue,
              COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS unpaid_invoices,
              COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_invoices
            FROM invoices
            WHERE invoice_date::date BETWEEN $1 AND $2
          ),
          low_stock AS (SELECT COUNT(*) AS low_stock FROM medicines WHERE stock_quantity < min_stock_level),
          unpaid AS (SELECT COUNT(*) AS unpaid FROM invoices WHERE payment_status = 'pending'),
          total_invoice AS (SELECT COUNT(*) AS total_invoice FROM invoices),
          daily_limit AS (SELECT COALESCE(setting_value::int, 50) AS daily_limit FROM settings WHERE setting_key = 'MaxPatientsPerDay' LIMIT 1)
          
          SELECT * FROM filtered
          CROSS JOIN invoice_stats
          CROSS JOIN low_stock
          CROSS JOIN unpaid
          CROSS JOIN total_invoice
          CROSS JOIN daily_limit;
        `,
          [
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
          ]
        );

        // 1. Thống kê tổng quan
        const summaryData = await client.query(
          `
          WITH invoice_stats AS (
            SELECT 
              COUNT(*) AS total_invoices,
              COALESCE(SUM(total_amount), 0) AS total_revenue,
              COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_revenue,
              COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS unpaid_invoices,
              COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_invoices
            FROM invoices
            WHERE invoice_date::date BETWEEN $1 AND $2
          ),
          patient_stats AS (
            SELECT 
              COUNT(DISTINCT patient_id) AS total_patients,
              COUNT(DISTINCT CASE WHEN created_at::date BETWEEN $1 AND $2 THEN patient_id END) AS new_patients
            FROM patients
          ),
          appointment_stats AS (
            SELECT 
              COUNT(*) AS total_appointments,
              COUNT(CASE WHEN status = 'waiting' THEN 1 END) AS waiting_appointments,
              COUNT(CASE WHEN status = 'examined' THEN 1 END) AS examined_appointments,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_appointments
            FROM daily_appointments
            WHERE appointment_date::date BETWEEN $1 AND $2
          )
          SELECT 
            i.*,
            p.total_patients,
            p.new_patients,
            a.total_appointments,
            a.waiting_appointments,
            a.examined_appointments,
            a.completed_appointments
          FROM invoice_stats i, patient_stats p, appointment_stats a;
        `,
          [
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
          ]
        );

        const summary = mainResult.rows[0];

        // ============================================================
        const revenueData = await client.query(
          `SELECT * FROM daily_revenue_reports WHERE report_date >= $1 AND report_date <= $2 ORDER BY report_date`,
          [
            chartStartDate.toISOString().split("T")[0],
            todayVN.toISOString().split("T")[0],
          ]
        );

        // ============================================================
        // 7) Thuốc hôm nay
        // ============================================================
        const medicinesToday = await client.query(
          `
          SELECT 
            m.medicine_id,
            m.medicine_name,
            COALESCE(SUM(pd.quantity), 0) AS quantity_used
          FROM prescription_detail pd
          JOIN medicines m ON pd.medicine_id = m.medicine_id
          JOIN medical_records mr ON pd.medical_record_id = mr.medical_record_id
          JOIN daily_appointments da ON mr.medical_record_id = da.medical_record_id
          WHERE da.appointment_date::date = '${
            todayVN.toISOString().split("T")[0]
          }'
          GROUP BY m.medicine_id, m.medicine_name
          HAVING SUM(pd.quantity) > 0
          ORDER BY quantity_used DESC;
          `
        );

        const totalMedicinesUsed = medicinesToday.rows.reduce(
          (s, r) => s + Number(r.quantity_used),
          0
        );

        const top5Medicines = medicinesToday.rows.slice(0, 5).map((r) => ({
          name: r.medicine_name,
          quantity: Number(r.quantity_used),
        }));

        // ============================================================
        // 8) Trả về
        // ============================================================
        res.json({
          success: true,
          data: {
            period,
            date_range: { start, end },
            chart_days: chartDays,
            total_revenue_today: Number(summary.total_revenue),
            paid_revenue_today: Number(summary.paid_revenue),

            patients_completed_today: Number(summary.patients_today),
            new_patients_today: Number(summary.new_patients),
            appointments_today: Number(summary.appointments_total),
            patients_waiting_today: Number(summary.patients_waiting),
            patients_pending_today: Number(summary.patients_pending),
            low_stock_medicines: Number(summary.low_stock),
            unpaid_invoices: Number(summary.unpaid_invoices),
            total_invoice: Number(summary.total_invoice),
            daily_limit: Number(summary.daily_limit),

            revenue_last_days: revenueData.rows.map((r) => ({
              date: r.report_date,
              revenue: Number(r.revenue),
            })),

            patients_by_day: revenueData.rows.map((r) => ({
              date: r.report_date,
              count: Number(r.patient_count),
            })),

            medicines_used_today: totalMedicinesUsed,
            top5_medicines_today: top5Medicines,
          },
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Admin summary error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/// GET /api/dashboard/receptionist/summary
router.get(
  "/receptionist/summary",
  [authenticateToken, authorizeRoles("receptionist", "admin")],
  async (req, res) => {
    const { period = "today", start, end, chart } = req.query;

    const now = new Date();
    console.log("Now: ", now);
    const todayVN = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    console.log("Now (UTC):", now);
    console.log("Vietnam Time (UTC+7):", todayVN);
    // const vnOffset = 7 * 60 * 60 * 1000;
    // const todayVN = new Date(now.getTime() + vnOffset);
    // todayVN.setHours(0, 0, 0, 0);
    console.log("todayVN:", todayVN.toISOString().split("T")[0]);
    console.log("today raw: ", todayVN.toISOString().split("T"));

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

    //startDate.setDate(startDate.getDate() + 1);
    //endDate.setDate(endDate.getDate() + 1);

    console.log("Adjusted Start Date:", startDate.toISOString().split("T")[0]);
    console.log("Adjusted End Date:", endDate.toISOString().split("T")[0]);

    // Biểu đồ: 7, 30, 90 ngày
    const chartDays = Math.min(Math.max(parseInt(chart, 10) || 30, 7), 90);
    const chartStartDate = new Date(todayVN);
    chartStartDate.setDate(todayVN.getDate() - (chartDays - 1));

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        console.log("Start Date:", startDate.toISOString().split("T")[0]);
        console.log("End Date:", endDate.toISOString().split("T")[0]);

        // 1. Thống kê tổng quan
        const summaryData = await client.query(
          `
          WITH invoice_stats AS (
            SELECT 
              COUNT(*) AS total_invoices,
              COALESCE(SUM(total_amount), 0) AS total_revenue,
              COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_revenue,
              COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS unpaid_invoices,
              COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_invoices
            FROM invoices
            WHERE invoice_date::date BETWEEN $1 AND $2
          ),
          patient_stats AS (
            SELECT 
              COUNT(DISTINCT patient_id) AS total_patients,
              COUNT(DISTINCT CASE WHEN created_at::date BETWEEN $1 AND $2 THEN patient_id END) AS new_patients
            FROM patients
          ),
          appointment_stats AS (
            SELECT 
              COUNT(*) AS total_appointments,
              COUNT(CASE WHEN status = 'waiting' THEN 1 END) AS waiting_appointments,
              COUNT(CASE WHEN status = 'examined' THEN 1 END) AS examined_appointments,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_appointments
            FROM daily_appointments
            WHERE appointment_date::date BETWEEN $1 AND $2
          ), 
          medical_record_uninvoices AS (
            SELECT 
              COUNT(*) AS medical_record_uninvoices
              FROM medical_records mr 
              LEFT JOIN invoices i ON i.medical_record_id = mr.medical_record_id 
              WHERE i.invoice_id is null AND mr.created_at::date BETWEEN $1 AND $2
          )

          SELECT 
            i.*,
            p.total_patients,
            p.new_patients,
            a.total_appointments,
            a.waiting_appointments,
            a.examined_appointments,
            a.completed_appointments, 
            mru.medical_record_uninvoices
          FROM invoice_stats i, patient_stats p, appointment_stats a, medical_record_uninvoices mru
        `,
          [
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
          ]
        );

        const summary = summaryData.rows[0];

        const revenueData = await client.query(
          `SELECT * FROM daily_revenue_reports WHERE report_date >= $1 AND report_date <= $2 ORDER BY report_date`,
          [
            chartStartDate.toISOString().split("T")[0],
            todayVN.toISOString().split("T")[0],
          ]
        );

        // 4. Danh sách appointments hôm nay
        const todayAppointments = await client.query(
          `
          SELECT 
            da.daily_appointment_id,
            da.patient_id,
            p.full_name AS patient_name,
            p.phone,
            p.date_of_birth,
            da.appointment_date,
            da.status,
            mr.medical_record_id,
            i.invoice_id,
            i.total_amount,
            i.payment_status
          FROM daily_appointments da
          JOIN patients p ON da.patient_id = p.patient_id
          LEFT JOIN medical_records mr ON da.medical_record_id = mr.medical_record_id
          LEFT JOIN invoices i ON mr.medical_record_id = i.medical_record_id
          WHERE da.appointment_date::date = $1
          ORDER BY da.appointment_date ASC;
        `,
          [todayVN.toISOString().split("T")[0]]
        );

        const daily_limit = await client.query(
          `SELECT setting_value::int AS daily_limit FROM settings WHERE setting_key = $1 LIMIT 1`,
          ["MaxPatientsPerDay"]
        );

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

            // Thống kê tổng quan
            total_invoices: Number(summary.total_invoices),
            total_revenue: Number(summary.total_revenue),
            paid_revenue: Number(summary.paid_revenue),
            unpaid_invoices: Number(summary.unpaid_invoices),
            paid_invoices: Number(summary.paid_invoices),
            medical_record_uninvoices_today: Number(summary.medical_record_uninvoices), 

            total_patients: Number(summary.total_patients),
            new_patients: Number(summary.new_patients),
            daily_limit: Number(daily_limit.rows?.[0].daily_limit),

            total_appointments: Number(summary.total_appointments),
            waiting_appointments: Number(summary.waiting_appointments),
            examined_appointments: Number(summary.examined_appointments),
            completed_appointments: Number(summary.completed_appointments),

            // Biểu đồ
            revenue_chart: revenueData.rows.map((r) => ({
              date: r.report_date,
              paid_revenue: Number(r.revenue),
              ///total_revenue: Number(r.total_revenue),
            })),

            patients_chart: revenueData.rows.map((r) => ({
              date: r.report_date,
              total: Number(r.patient_count),
            })),

            // Danh sách appointments hôm nay
            today_appointments: todayAppointments.rows.map((r) => ({
              appointment_id: Number(r.daily_appointment_id),
              patient_id: Number(r.patient_id),
              patient_name: r.patient_name,
              phone: r.phone,
              date_of_birth: r.date_of_birth,
              appointment_date: r.appointment_date,
              status: r.status,
              notes: r.notes,
              medical_record_id: r.medical_record_id
                ? Number(r.medical_record_id)
                : null,
              invoice_id: r.invoice_id ? Number(r.invoice_id) : null,
              total_amount: r.total_amount ? Number(r.total_amount) : null,
              payment_status: r.payment_status,
            })),
          },
        });
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Receptionist dashboard error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/// GET /api/dashboard/doctor/summary
/// GET /api/dashboard/doctor/summary?date=2025-12-07
router.get(
  "/doctor/summary",
  [authenticateToken, authorizeRoles("doctor", "admin")],
  async (req, res) => {
    // ===========================
    // 0. Validate doctorId
    // ===========================
    console.log("ALOOOOOOOOOOOOOOOOO");
    const doctorId = String(req.user.user_id);
    console.log("user: ", req.user.user_id);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctorId from token",
      });
    }

    // ===========================
    // 1. Get target date (VN timezone)
    // ===========================
    const { date } = req.query;

    const getTargetDateVN = () => {
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }

      const now = new Date();
      const vnOffset = 7 * 60 * 60 * 1000;

      const vnTime = new Date(now.getTime() + vnOffset);

      return new Date(
        Date.UTC(
          vnTime.getUTCFullYear(),
          vnTime.getUTCMonth(),
          vnTime.getUTCDate()
        )
      )
        .toISOString()
        .split("T")[0];
    };

    const targetDate = getTargetDateVN();

    // ===========================
    // 2. SQL Queries (clean + separated)
    // ===========================

    const SQL = {
      KPI: `
        WITH appointments AS (
          SELECT 
            COUNT(*) AS total_appointments,
            COUNT(CASE WHEN status = 'waiting' THEN 1 END) AS pending_appointments,
            COUNT(CASE WHEN status = 'examined' THEN 1 END) AS examining_appointments,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_appointments
          FROM daily_appointments
          WHERE appointment_date::date = $1
        )
        SELECT * FROM appointments;
      `,

      TIMELINE: `
        SELECT 
          da.daily_appointment_id,
          da.appointment_date,
          p.full_name,
          da.status,
          EXTRACT(EPOCH FROM (da.appointment_date - NOW())) / 60 < -15 AS is_late
        FROM daily_appointments da
        JOIN patients p ON da.patient_id = p.patient_id
        WHERE da.appointment_date::date = $1
        ORDER BY da.appointment_date ASC;
      `,

      TODAY_PATIENTS: `
        SELECT 
          da.daily_appointment_id,
          p.patient_id,
          p.full_name,
          EXTRACT(YEAR FROM AGE(p.date_of_birth)) AS age,
          p.gender,
          da.status,
          da.appointment_date,
          da.medical_record_id
        FROM daily_appointments da
        JOIN patients p ON da.patient_id = p.patient_id
        WHERE da.appointment_date::date = $1
        ORDER BY da.appointment_date ASC;
      `,

      RECENT_RECORDS: `
        WITH recent_mr AS (
          SELECT 
            mr.medical_record_id,
            mr.created_at,
            p.full_name AS patient_name,
            TO_CHAR(mr.created_at, 'DD/MM/YYYY') AS visit_date
          FROM medical_records mr
          JOIN daily_appointments da ON mr.medical_record_id = da.medical_record_id
          JOIN patients p ON da.patient_id = p.patient_id
          WHERE mr.doctor_id = $1
          ORDER BY mr.created_at DESC
          LIMIT 5
        ),
        diagnoses AS (
          SELECT 
            dd.medical_record_id,
            COALESCE(d.disease_id::text, '') AS icd_code,
            COALESCE(d.disease_name, 'Chưa xác định') AS disease_name,
            dd.is_primary
          FROM disease_details dd
          LEFT JOIN diseases d ON d.disease_id = dd.disease_id
          WHERE dd.medical_record_id = ANY (SELECT medical_record_id FROM recent_mr)
        )
        SELECT 
          r.*,
          COALESCE(json_agg(
            json_build_object(
              'icd_code', diag.icd_code,
              'disease_name', diag.disease_name,
              'is_primary', COALESCE(diag.is_primary, false)
            )
          ) FILTER (WHERE diag.disease_name IS NOT NULL), '[]')::json AS diagnoses
        FROM recent_mr r
        LEFT JOIN diagnoses diag ON diag.medical_record_id = r.medical_record_id
        GROUP BY r.medical_record_id, r.created_at, r.patient_name, r.visit_date
        ORDER BY r.created_at DESC;
      `,
    };

    // ===========================
    // 3. DB Logic
    // ===========================
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const kpiRes = await client.query(SQL.KPI, [targetDate]);
      const timelineRes = await client.query(SQL.TIMELINE, [targetDate]);
      const todayRes = await client.query(SQL.TODAY_PATIENTS, [targetDate]);
      const recentRes = await client.query(SQL.RECENT_RECORDS, [doctorId]);

      await client.query("COMMIT");

      const kpi = kpiRes.rows[0] || {};

      res.json({
        success: true,
        data: {
          selected_date: targetDate,

          // KPI Cards
          appointments_total: Number(kpi.total_appointments || 0),
          pending_appointments: Number(kpi.pending_appointments || 0),
          completed_appointments: Number(kpi.completed_appointments || 0),
          examining_appointments: Number(kpi.examining_appointments || 0),

          // Timeline
          timeline: timelineRes.rows.map((r) => ({
            id: Number(r.daily_appointment_id),
            // time: moment(r.appointment_date).format("HH:mm"),
            patient_name: r.full_name,
            status: r.status,
            late: r.is_late === true,
          })),

          // Today patients
          today_patients: todayRes.rows.map((r) => ({
            id: Number(r.daily_appointment_id),
            patient_id: Number(r.patient_id),
            name: r.full_name,
            age: r.age ? Number(r.age) : null,
            gender: r.gender,
            status: r.status,
            medical_record_id: r.medical_record_id,
          })),

          // Recent medical records
          recent_records: recentRes.rows.map((r) => ({
            id: Number(r.medical_record_id),
            name: r.patient_name,
            date: r.visit_date,
            diagnoses: r.diagnoses, // JSON luôn
          })),
        },
      });
    } catch (err) {
      await client.query("ROLLBACK");

      console.error("Doctor summary error:", err);

      res.status(500).json({
        success: false,
        message: "Lỗi tải dữ liệu dashboard bác sĩ",
      });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
