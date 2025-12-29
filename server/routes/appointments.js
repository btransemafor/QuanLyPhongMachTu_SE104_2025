const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();
router.get("/daily", authenticateToken, async (req, res) => {
  try {
    const {
      date = new Date().toISOString().split("T")[0],
      search = "",
      status = "",        // status=examined,completed,pending
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (page - 1) * limit;

    // ------------------------------
    // 1️⃣ Build WHERE dynamic
    // ------------------------------
    const conditions = [`da.appointment_date = $1`];
    const params = [date];
    let idx = 2;

    // Search theo tên hoặc số điện thoại
    if (search) {
      conditions.push(`(LOWER(p.full_name) LIKE LOWER($${idx}) OR p.phone LIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    // Lọc theo nhiều trạng thái
    let statusList = null;
    if (status) {
      statusList = status.split(",").map((s) => s.trim());
      conditions.push(`da.status = ANY($${idx})`);
      params.push(statusList);
      idx++;
    }

    const whereQuery = "WHERE " + conditions.join(" AND ");

    // ------------------------------
    // 2️⃣ Count for pagination
    // ------------------------------
    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM daily_appointments da
      JOIN patients p ON da.patient_id = p.patient_id
      ${whereQuery}
      `,
      params
    );

    const total = Number(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // ------------------------------
    // 3️⃣ Fetch data
    // ------------------------------
    const dataQuery = `
      SELECT 
        da.daily_appointment_id,
        da.patient_id,
        da.status,
        da.created_at,
        p.full_name,
        p.gender,
        p.date_of_birth,
        p.phone,
        p.address,
        da.medical_record_id,
        i.invoice_id
      FROM daily_appointments da
      JOIN patients p ON da.patient_id = p.patient_id
      LEFT JOIN medical_records mr ON mr.medical_record_id = da.medical_record_id
      LEFT JOIN invoices i ON i.medical_record_id = mr.medical_record_id
      ${whereQuery}
      ORDER BY da.created_at ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const dataParams = [...params, limit, offset];
    const dataResult = await pool.query(dataQuery, dataParams);

    return res.json({
      success: true,
      meta: {
        total,
        totalPages,
        page: Number(page),
        limit: Number(limit),
      },
      data: dataResult.rows,
    });
  } catch (error) {
    console.error("Get daily appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching daily appointments",
    });
  }
});


router.post(
  "/",
  [
    authenticateToken,
    authorizeRoles("receptionist", "admin"),
    body("patient_id").isInt().withMessage("Patient ID must be a number"),
    body("appointment_date")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        patient_id,
        appointment_date = new Date().toISOString().split("T")[0],
      } = req.body;

      const patientResult = await pool.query(
        "SELECT patient_id FROM patients WHERE patient_id = $1",
        [patient_id]
      );

      if (patientResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const existingAppointment = await pool.query(
        "SELECT daily_appointment_id FROM daily_appointments WHERE patient_id = $1 AND appointment_date = $2",
        [patient_id, appointment_date]
      );

      if (existingAppointment.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Bệnh nhân này đã có trong danh sách lịch hẹn hôm nay.",
        });
      }

      const settingsResult = await pool.query(
        "SELECT setting_value FROM settings WHERE setting_key = $1",
        ["MaxPatientsPerDay"]
      );

      const maxPatients =
        settingsResult.rows.length > 0
          ? parseInt(settingsResult.rows[0].setting_value)
          : 50;

      const todayAppointmentsCount = await pool.query(
        "SELECT COUNT(*) FROM daily_appointments WHERE appointment_date = $1",
        [appointment_date]
      );

      if (parseInt(todayAppointmentsCount.rows[0].count) >= maxPatients) {
        return res.status(400).json({
          success: false,
          message: `Đã đạt số lượng bệnh nhân tối đa trong ngày (${maxPatients} bệnh nhân)`,
        });
      }

      const result = await pool.query(
        `INSERT INTO daily_appointments (patient_id, appointment_date, status)
       VALUES ($1, $2, 'waiting')
       RETURNING *`,
        [patient_id, appointment_date]
      );

      res.status(201).json({
        success: true,
        message: "Patient added to appointment list successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Add appointment error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while adding appointment",
      });
    }
  }
);

router.put(
  "/:id/status",
  [
    authenticateToken,
    body("status")
      .isIn(["waiting", "examined", "completed"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { status } = req.body;

      const existingAppointment = await pool.query(
        "SELECT id FROM daily_appointments WHERE id = $1",
        [id]
      );

      if (existingAppointment.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      const result = await pool.query(
        `UPDATE daily_appointments 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
        [status, id]
      );

      res.json({
        success: true,
        message: "Appointment status updated successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Update appointment status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating appointment status",
      });
    }
  }
);

router.delete(
  "/:id",
  [authenticateToken, authorizeRoles("receptionist", "admin")],
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingAppointment = await pool.query(
        "SELECT daily_appointment_id, status FROM daily_appointments WHERE daily_appointment_id = $1",
        [id]
      );

      if (existingAppointment.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      if (existingAppointment.rows[0].status !== "waiting") {
        return res.status(400).json({
          success: false,
          message: "Cannot remove appointment that is not in waiting status",
        });
      }

      await pool.query(
        "DELETE FROM daily_appointments WHERE daily_appointment_id = $1",
        [id]
      );

      res.json({
        success: true,
        message: "Appointment removed successfully",
      });
    } catch (error) {
      console.error("Remove appointment error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while removing appointment",
      });
    }
  }
);

router.get("/stats", [authenticateToken], async (req, res) => {
  try {
    const { date = new Date().toISOString().split("T")[0] } = req.query;

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
      [date]
    );

    const monthStart = new Date(date);
    monthStart.setDate(1);
    const monthEnd = new Date(date);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    const monthlyStats = await pool.query(
      `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
      FROM daily_appointments 
      WHERE appointment_date >= $1 AND appointment_date <= $2
    `,
      [
        monthStart.toISOString().split("T")[0],
        monthEnd.toISOString().split("T")[0],
      ]
    );

    res.json({
      success: true,
      data: {
        today: todayStats.rows[0],
        monthly: monthlyStats.rows[0],
      },
    });
  } catch (error) {
    console.error("Get appointment stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching appointment statistics",
    });
  }
});

module.exports = router;
