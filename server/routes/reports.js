const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// /api/reports/months/available?year=YYYY
router.get("/months/revenue/available", authenticateToken, async (req, res) => {
  try {
    //
    const { year } = req.query;
    let query = `
      SELECT DISTINCT month_year, monthly_report_id, total_revenue as revenue, total_patient_count as patients, created_at as created, ExTRACT(YEAR FROM TO_DATE(month_year, 'YYYY-MM')) AS year, EXTRACT(MONTH FROM TO_DATE(month_year, 'YYYY-MM')) AS month
      FROM monthly_revenue_reports
    `;
    let params = [];
    if (year) {
      query += ` WHERE EXTRACT(YEAR FROM TO_DATE(month_year, 'YYYY-MM')) = $1 `;
      params.push(year);
    }
    query += ` ORDER BY month_year DESC `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get available months error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching available months",
    });
  }
});

/// ----------- Usage Method ----------- ///
router.get(
  "/months/usage-medicines/available",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      //
      const { year } = req.query;

      //
      let query = `SELECT DISTINCT month_year, medicine_usage_report_id FROM medicine_usage_reports`;
      let params = [];

      if (year) {
        query += `WHERE EXTRACT(YEAR FROM TO_DATE(month_year, 'YYYY-MM')) = $1 `;
        params.push(year);
      }

      query += ` ORDER BY month_year DESC `;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Get available months error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching available months",
      });
    }
  }
);

// GET /api/reports/revenue?month=MM&year=YYYY&date=YYYY-MM-DD&page=1&limit=10
router.get(
  "/revenue",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { month, year, page = 1, limit = 10, date } = req.query;
      const offset = (page - 1) * limit;

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: "Month and year are required",
        });
      }

      const month_year = `${year}-${month.padStart(2, "0")}`;

      // 1. Lấy báo cáo tháng
      const monthlyRes = await pool.query(
        `SELECT * FROM monthly_revenue_reports WHERE month_year = $1`,
        [month_year]
      );

      if (monthlyRes.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            daily_revenue: [],
            monthly_summary: {
              total_patients: 0,
              total_consultation_fee: 0,
              total_medicine_fee: 0,
              total_revenue: 0,
              average_revenue_per_patient: 0,
            },
          },
          pagination: {
            currentPage: 1,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0,
          },
        });
      }

      const monthly_report_id = monthlyRes.rows[0].monthly_report_id;

      // 2. Điều kiện lọc ngày (nếu có)
      let whereClause = "WHERE monthly_report_id = $1";
      let params = [monthly_report_id];
      let paramCount = 2;

      if (date) {
        whereClause += ` AND report_date = $${paramCount}`;
        params.push(date);
        paramCount++;
      }

      // 3. Đếm tổng
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM daily_revenue_reports ${whereClause}`,
        params
      );

      // 4. Lấy dữ liệu phân trang
      const dailyRes = await pool.query(
        `
      SELECT 
        report_date,
        patient_count,
        revenue,
        revenue_rate
      FROM daily_revenue_reports 
      ${whereClause}
      ORDER BY report_date
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `,
        [...params, limit, offset]
      );

      res.json({
        success: true,
        data: {
          daily_revenue: dailyRes.rows,
          monthly_summary: monthlyRes.rows[0],
        },
        pagination: {
          currentkertPage: parseInt(page),
          pageSize: parseInt(limit),
          totalItems: parseInt(countRes.rows[0].count),
          totalPages: Math.ceil(countRes.rows[0].count / limit),
        },
      });
    } catch (error) {
      console.error("Get revenue report error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.get("/custom-revenue", authenticateToken, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    if (!from_date || !to_date) {
      return res.status(400).json({
        success: false,
        message: "From date and to date are required",
      });
    }
    const result = await pool.query(
      `
            SELECT
              SUM(patient_count) AS total_patients,
              SUM(revenue) AS total_revenue,
                ROUND(AVG(NULLIF(revenue, 0) / NULLIF(patient_count, 0)), 2) AS average_revenue_per_patient
                FROM daily_revenue_reports
                WHERE report_date BETWEEN $1 AND $2
                `,
      [from_date, to_date]

      // Hieen thi chi tiet
    );
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get custom revenue report error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating custom revenue report",
    });
  }
});

/// - ------ Dạng Custom người dùng sẽ chọn khoảng thời gian --------
router.get(
  "/medicine-usage",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          message: "From date and to date are required",
        });
      }

      // Validate date format
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Please use YYYY-MM-DD",
        });
      }

      if (fromDate > toDate) {
        return res.status(400).json({
          success: false,
          message: "From date must be before or equal to date",
        });
      }

      const { search } = req.query;

      // build query with optional search
      let query = `
      SELECT 
        m.medicine_id as medicine_id,
        m.medicine_name as medicine_name,
        u.unit_name,
        SUM(pd.quantity) as total_quantity_used,
        COUNT(DISTINCT pd.medical_record_id) as prescription_count,
        ROUND(AVG(pd.quantity), 2) as average_quantity_per_prescription,
        SUM(pd.quantity * pd.sell_price) as total_value
      FROM prescription_detail pd
      JOIN medicines m ON pd.medicine_id = m.medicine_id
      JOIN units u ON u.unit_id = m.unit_id
      JOIN medical_records mr ON pd.medical_record_id = mr.medical_record_id
      WHERE DATE(mr.created_at) >= $1 
        AND DATE(mr.created_at) <= $2
    `;

      const queryParams = [from, to];

      if (search && search.trim()) {
        queryParams.push(`%${search.trim()}%`);
        // search against medicine name or id
        query += ` AND (m.medicine_name ILIKE $${queryParams.length} OR m.medicine_id ILIKE $${queryParams.length}) `;
      }

      query += ` GROUP BY m.medicine_id, m.medicine_name, u.unit_name ORDER BY total_quantity_used DESC `;

      const medicineUsage = await pool.query(query, queryParams);

      // summary query - apply same search filter if provided
      let summaryQuery = `
      SELECT 
        COUNT(DISTINCT m.medicine_id) as unique_medicines_used,
        SUM(pd.quantity) as total_medicines_dispensed,
        SUM(pd.quantity * pd.sell_price) as total_medicine_value,
        COUNT(DISTINCT pd.medical_record_id) as total_prescriptions
      FROM prescription_detail pd
      JOIN medicines m ON pd.medicine_id = m.medicine_id
      JOIN medical_records mr ON pd.medical_record_id = mr.medical_record_id
      WHERE DATE(mr.created_at) >= $1 
        AND DATE(mr.created_at) <= $2
    `;

      const summaryParams = [from, to];
      if (search && search.trim()) {
        summaryParams.push(`%${search.trim()}%`);
        summaryQuery += ` AND (m.medicine_name ILIKE $${summaryParams.length} OR m.medicine_id ILIKE $${summaryParams.length}) `;
      }

      const summary = await pool.query(summaryQuery, summaryParams);

      res.json({
        success: true,
        data: {
          period: {
            from,
            to,
          },
          medicine_usage: medicineUsage.rows,
          summary: summary.rows[0] || {
            unique_medicines_used: 0,
            total_medicines_dispensed: 0,
            total_medicine_value: 0,
            total_prescriptions: 0,
          },
        },
      });
    } catch (error) {
      console.error("Get medicine usage report error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while generating medicine usage report",
      });
    }
  }
);


router.get(
  "/medicine-usage/period/:id",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { id } = req.params; // sửa đúng tên param

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID báo cáo không hợp lệ",
        });
      }

      // 1. Lấy thông tin báo cáo tháng
      const reportQuery = await pool.query(
        `
        SELECT 
          medicine_usage_report_id,
          month_year,
          created_at
        FROM medicine_usage_reports
        WHERE medicine_usage_report_id = $1
        `,
        [id]
      );

      if (reportQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo với ID này",
        });
      }

      const report = reportQuery.rows[0];
      // 2. Lấy chi tiết thuốc
      const detailsQuery = await pool.query(
        `
        SELECT 
          m.medicine_id,
          m.medicine_name,
          u.unit_name,
          murd.quantity_used,
          murd.usage_count, 
          total_value
        FROM medicine_usage_reports_details murd
        JOIN medicines m ON m.medicine_id = murd.medicine_id
        JOIN units u ON u.unit_id = m.unit_id
        WHERE murd.medicine_usage_report_id = $1
        ORDER BY murd.quantity_used DESC
        `,
        [id]
      );

      const medicineUsage = detailsQuery.rows.map(row => ({
        medicine_id: row.medicine_id,
        medicine_name: row.medicine_name,
        unit_name: row.unit_name,
        total_quantity_used: row.quantity_used,
        prescription_count: row.usage_count,
        total_value: row.total_value
      }));

      // 3. Tính summary
      const summary = {
        unique_medicines_used: detailsQuery.rows.length,
        total_medicines_dispensed: detailsQuery.rows.reduce((s, r) => s + Number(r.quantity_used), 0),
        total_prescriptions: detailsQuery.rows.reduce((s, r) => s + Number(r.usage_count), 0),
        total_medicine_value: detailsQuery.rows.reduce((s, r) => s+ Number(r.total_value),0)
      };

      // Trả response đúng chuẩn
      res.status(200).json({
        success: true,
        data: {
        /*   period: {
            from: periodFrom,
            to: periodTo
          }, */
          medicine_usage: medicineUsage,
          summary: summary
        },
      });

    } catch (error) {
      console.error("Error fetching saved medicine usage report:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy báo cáo đã lưu",
      });
    }
  }
);

router.get(
  "/patient-stats",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      console.log("Patient stats request:", { start_date, end_date });

      const checkData = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM daily_appointments) as total_appointments,
        (SELECT COUNT(*) FROM patients) as total_patients
    `);

      console.log("Data check result:", checkData.rows[0]);

      let dateFilter = "";
      let queryParams = [];

      if (start_date && end_date) {
        dateFilter = `WHERE DATE(da.appointment_date) BETWEEN $1 AND $2`;
        queryParams = [start_date, end_date];
      }

      const patientStats = await pool.query(
        `
      SELECT 
        COUNT(DISTINCT da.patient_id) as total_patients,
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN da.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN da.status = 'waiting' THEN 1 END) as waiting_appointments,
        COUNT(CASE WHEN da.status = 'examined' THEN 1 END) as examined_appointments,
        COUNT(CASE WHEN p.gender = 'Nam' THEN 1 END) as male_patients,
        COUNT(CASE WHEN p.gender = 'Nữ' THEN 1 END) as female_patients
      FROM daily_appointments da
      LEFT JOIN patients p ON da.patient_id = p.id
      ${dateFilter}
    `,
        queryParams
      );

      console.log("Patient stats result:", patientStats.rows[0]);

      let ageGroupStats = { rows: [] };
      if (patientStats.rows[0] && patientStats.rows[0].total_patients > 0) {
        try {
          ageGroupStats = await pool.query(
            `
          WITH age_groups AS (
            SELECT 
              da.patient_id,
              CASE 
                WHEN p.birth_year IS NULL THEN 'Unknown'
                WHEN EXTRACT(YEAR FROM CURRENT_DATE) - p.birth_year < 18 THEN 'Under 18'
                WHEN EXTRACT(YEAR FROM CURRENT_DATE) - p.birth_year BETWEEN 18 AND 30 THEN '18-30'
                WHEN EXTRACT(YEAR FROM CURRENT_DATE) - p.birth_year BETWEEN 31 AND 50 THEN '31-50'
                WHEN EXTRACT(YEAR FROM CURRENT_DATE) - p.birth_year BETWEEN 51 AND 70 THEN '51-70'
                ELSE 'Over 70'
              END as age_group
            FROM daily_appointments da
            LEFT JOIN patients p ON da.patient_id = p.id
            ${dateFilter}
          )
          SELECT 
            age_group,
            COUNT(DISTINCT patient_id) as patient_count
          FROM age_groups
          GROUP BY age_group
          ORDER BY 
            CASE age_group
              WHEN 'Under 18' THEN 1
              WHEN '18-30' THEN 2
              WHEN '31-50' THEN 3
              WHEN '51-70' THEN 4
              WHEN 'Over 70' THEN 5
              WHEN 'Unknown' THEN 6
            END
        `,
            queryParams
          );

          console.log("Age group stats result:", ageGroupStats.rows);
        } catch (ageError) {
          console.error("Age group stats error:", ageError);
        }
      }

      res.json({
        success: true,
        data: {
          patient_statistics: patientStats.rows[0] || {
            total_patients: 0,
            total_appointments: 0,
            completed_appointments: 0,
            waiting_appointments: 0,
            examined_appointments: 0,
            male_patients: 0,
            female_patients: 0,
          },
          age_group_statistics: ageGroupStats.rows || [],
        },
      });
    } catch (error) {
      console.error("Get patient stats error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        position: error.position,
        where: error.where,
      });

      res.status(500).json({
        success: false,
        message: "Server error while generating patient statistics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const todayStats = await pool.query(
      `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_count,
        COUNT(CASE WHEN status = 'examined' THEN 1 END) as examined_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
      FROM daily_appointments 
      WHERE appointment_date = $1
      `,
      [today]
    );

    const todayRevenue = await pool.query(
      `
      SELECT 
        COUNT(*) as invoices_count,
        SUM(total_amount) as total_revenue
      FROM invoices 
      WHERE DATE(created_at) = $1 
        AND payment_status = 'paid'
      `,
      [today]
    );

    // 🌟 Thêm hóa đơn UNPAID trong ngày
    const todayUnpaid = await pool.query(
      `
      SELECT 
        COUNT(*) AS unpaid_count,
        SUM(total_amount) AS unpaid_total
      FROM invoices
      WHERE DATE(created_at) = $1 
        AND payment_status = 'Chưa thanh toán'
      `,
      [today]
    );

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = await pool.query(
      `
      SELECT 
        COUNT(*) as invoices_count,
        SUM(total_amount) as total_revenue
      FROM invoices 
      WHERE EXTRACT(MONTH FROM created_at) = $1 
        AND EXTRACT(YEAR FROM created_at) = $2
        AND payment_status = 'paid'
      `,
      [currentMonth, currentYear]
    );

    res.json({
      success: true,
      data: {
        today: {
          appointments: todayStats.rows[0] || {
            total_appointments: 0,
            waiting_count: 0,
            examined_count: 0,
            completed_count: 0,
          },
          revenue: todayRevenue.rows[0] || {
            invoices_count: 0,
            total_revenue: 0,
          },
          unpaid: todayUnpaid.rows[0] || {
            unpaid_count: 0,
            unpaid_total: 0,
          },
        },
        monthly: {
          revenue: monthlyRevenue.rows[0] || {
            invoices_count: 0,
            total_revenue: 0,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating dashboard statistics",
    });
  }
});

// ====================== BÁO CÁO DOANH THU TÙY CHỈNH ======================
// GET /api/reports/range?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get(
  "/range",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { from, to } = req.query;

      // ===== 1. Validate query params =====
      if (!from || !to) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số from hoặc to",
        });
      }

      const fromStr = String(from).trim();
      const toStr = String(to).trim();

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(fromStr) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(toStr)
      ) {
        return res.status(400).json({
          success: false,
          message: "Định dạng ngày phải là YYYY-MM-DD",
        });
      }

      // Kiểm tra ngày hợp lệ
      const fromDate = new Date(fromStr);
      const toDate = new Date(toStr);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Ngày không hợp lệ",
        });
      }
      if (fromDate > toDate) {
        return res.status(400).json({
          success: false,
          message: "Ngày bắt đầu phải ≤ ngày kết thúc",
        });
      }

      // ===== 2. Query chi tiết – loại bỏ hoàn toàn ::BIGINT (tránh NaN) =====
      const detailsQuery = `
      SELECT
        DATE(i.created_at)::TEXT AS date,
        COUNT(DISTINCT i.invoice_id) AS invoices,
        COUNT(DISTINCT mr.patient_id) AS patients,
        COALESCE(SUM(i.total_amount), 0) AS revenue
      FROM invoices i
      JOIN medical_records mr ON i.medical_record_id = mr.medical_record_id
      WHERE i.payment_status = 'paid'
        AND DATE(i.created_at) BETWEEN $1 AND $2
      GROUP BY DATE(i.created_at)
      ORDER BY DATE(i.created_at) ASC
    `;

      const detailsResult = await pool.query(detailsQuery, [fromStr, toStr]);
      const details = detailsResult.rows.map((row) => ({
        date: row.date,
        invoices: Number(row.invoices) || 0,
        patients: Number(row.patients) || 0,
        revenue: Number(row.revenue) || 0, // ← ép ở Node.js, không ở Postgres
      }));

      // ===== 3. Query tổng hợp – cũng không dùng ::BIGINT =====
      const summaryQuery = `
      SELECT
        COUNT(DISTINCT i.invoice_id) AS total_invoices,
        COUNT(DISTINCT mr.patient_id) AS total_patients,
        COALESCE(SUM(i.total_amount), 0) AS total_revenue
      FROM invoices i
      JOIN medical_records mr ON i.medical_record_id = mr.medical_record_id
      WHERE i.payment_status = 'paid'
        AND DATE(i.created_at) BETWEEN $1 AND $2
    `;

      const summaryResult = await pool.query(summaryQuery, [fromStr, toStr]);
      const sum = summaryResult.rows[0] || {
        total_invoices: 0,
        total_patients: 0,
        total_revenue: 0,
      };

      const totalRevenue = Number(sum.total_revenue) || 0;
      const totalInvoices = Number(sum.total_invoices) || 0;
      const totalPatients = Number(sum.total_patients) || 0;

      // ===== 4. Tính toán an toàn =====
      const daysCount = Math.max(
        Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1,
        1
      );

      const dailyAverage = Math.round(totalRevenue / daysCount);
      const avgInvoiceValue =
        totalInvoices > 0 ? Math.round(totalRevenue / totalInvoices) : 0;

      // ===== 5. Tính % doanh thu từng ngày =====
      const detailRows = details.map((row) => {
        const rate =
          totalRevenue > 0
            ? Number(((row.revenue / totalRevenue) * 100).toFixed(2))
            : 0;
        return { ...row, revenue_rate: rate };
      });

      // ===== 6. Response =====
      res.json({
        success: true,
        data: {
          totalRevenue,
          totalInvoices,
          totalPatients,
          dailyAverage,
          avgInvoiceValue,
          details: detailRows,
        },
      });
    } catch (error) {
      console.error("Get report range error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy báo cáo",
        // Chỉ hiện lỗi chi tiết khi dev
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }
);
module.exports = router;
