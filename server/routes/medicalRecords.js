const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const moment = require("moment");

const router = express.Router();
function isToday(date) {
  const today = new Date();
  return (
    date?.getDate() === today.getDate() &&
    date?.getMonth() === today.getMonth() &&
    date?.getFullYear() === today.getFullYear()
  );
}

router.get("/", async (req, res) => {
  try {
    const {
      search,
      disease,
      patientId, // THÊM
      status, // THÊM
      page = 1,
      pageSize = 15, // ĐỔI default từ 100 xuống 15
      startDate,
      endDate,
    } = req.query;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // --- Count tổng số bản ghi ---
    let countQuery = `SELECT COUNT(*) AS total FROM medical_records mr 
      LEFT JOIN daily_appointments da ON da.medical_record_id = mr.medical_record_id
      LEFT JOIN patients p ON da.patient_id = p.patient_id
    WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;

    if (search) {
      countQuery += ` AND (p.full_name ILIKE '%' || $${countIndex} || '%' OR mr.symptoms ILIKE '%' || $${countIndex} || '%')`;
      countParams.push(search);
      countIndex++;
    }

    // THÊM filter theo patientId
    if (patientId) {
      countQuery += ` AND p.patient_id = $${countIndex}`;
      countParams.push(patientId);
      countIndex++;
    }

    // THÊM filter theo status
    if (status) {
      countQuery += ` AND mr.status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    if (disease) {
      countQuery += ` AND EXISTS (
        SELECT 1
        FROM disease_details dd
        LEFT JOIN diseases d ON dd.disease_id = d.disease_id
        WHERE dd.medical_record_id = mr.medical_record_id
          AND d.disease_id = $${countIndex}
      )`;
      countParams.push(disease);
      countIndex++;
    }

    if (startDate && endDate) {
      countQuery += ` AND da.appointment_date BETWEEN $${countIndex} AND $${
        countIndex + 1
      }`;
      countParams.push(startDate, endDate);
      countIndex += 2;
    }

    const { rows: totalResult } = await pool.query(countQuery, countParams);

    // --- Lấy dữ liệu chính ---
    let mainQuery = `
      SELECT 
        mr.medical_record_id,
        mr.patient_id,
        i.invoice_id, 
        COALESCE(p.full_name, 'Unknown Patient') AS patient_name,
        p.phone AS patient_phone,
        p.address AS patient_address,
        mr.symptoms,
        mr.created_at,
        da.status,
        mr.status as status_mr,
        COALESCE(u.full_name, 'Unknown Doctor') AS doctor_name, 
        mr.doctor_id,
        da.appointment_date as exam_date
        
      FROM medical_records mr 
      LEFT JOIN daily_appointments da ON da.medical_record_id = mr.medical_record_id
      LEFT JOIN patients p ON da.patient_id = p.patient_id
      LEFT JOIN users u ON mr.doctor_id = u.user_id
      LEFT JOIN invoices i ON i.medical_record_id = mr.medical_record_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      mainQuery += ` AND (p.full_name ILIKE '%' || $${paramIndex} || '%' OR mr.symptoms ILIKE '%' || $${paramIndex} || '%')`;
      params.push(search);
      paramIndex++;
    }

    // THÊM filter theo patientId
    if (patientId) {
      mainQuery += ` AND p.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
    }

    // THÊM filter theo status
    if (status) {
      mainQuery += ` AND mr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (disease) {
      mainQuery += ` AND EXISTS (
        SELECT 1
        FROM disease_details dd
        LEFT JOIN diseases d ON dd.disease_id = d.disease_id
        WHERE dd.medical_record_id = mr.medical_record_id
          AND d.disease_id = $${paramIndex}
      )`;
      params.push(disease);
      paramIndex++;
    }

    if (startDate && endDate) {
      mainQuery += ` AND da.appointment_date BETWEEN $${paramIndex} AND $${
        paramIndex + 1
      }`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    mainQuery += ` ORDER BY mr.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const { rows: records } = await pool.query(mainQuery, params);

    // --- Enrich dữ liệu (bệnh lý + thuốc) ---
    const recordsFull = await Promise.all(
      records.map(async (record) => {
        const { rows: diseases } = await pool.query(
          `
          SELECT 
            dd.disease_detail_id,
            d.disease_id,
            d.disease_name,
            dd.severity,
            dd.note AS disease_note
          FROM disease_details dd
          LEFT JOIN diseases d ON dd.disease_id = d.disease_id
          WHERE dd.medical_record_id = $1
          `,
          [record.medical_record_id]
        );

        const { rows: prescriptionsRaw } = await pool.query(
          `
          SELECT 
            pd.prescription_detail_id,
            pd.medicine_id,
            pd.quantity,
            pd.sell_price,
            COALESCE(m.medicine_name, 'Unknown Medicine') AS medicine_name,
            COALESCE(u.unit_name, 'Unknown Unit') AS unit,
            COALESCE(um.usage_method_name, 'Unknown Usage') AS usage_method,
            b.batch_id,
            b.batch_code
          FROM prescription_detail pd
          LEFT JOIN medicines m ON pd.medicine_id = m.medicine_id
          LEFT JOIN units u ON u.unit_id = m.unit_id
          LEFT JOIN usage_methods um ON pd.usage_method_id = um.usage_method_id
          LEFT JOIN batches b ON pd.batch_id = b.batch_id
          WHERE pd.medical_record_id = $1
          `,
          [record.medical_record_id]
        );

        const prescriptionMap = {};
        prescriptionsRaw.forEach((p) => {
          const key = `${p.medicine_id}_${p.usage_method}_${p.sell_price}`;
          if (!prescriptionMap[key]) {
            prescriptionMap[key] = {
              medicine_id: p.medicine_id,
              medicine_name: p.medicine_name,
              unit: p.unit,
              usage_method: p.usage_method,
              price: p.sell_price,
              quantity: 0,
              total: 0,
              batches: [],
            };
          }
          prescriptionMap[key].quantity += p.quantity;
          prescriptionMap[key].total += p.quantity * (p.sell_price || 0);
          prescriptionMap[key].batches.push({
            batch_id: p.batch_id,
            batch_code: p.batch_code,
            quantity: p.quantity,
          });
        });

        return {
          ...record,
          diseases,
          prescriptions: Object.values(prescriptionMap),
        };
      })
    );

    const stats = {
      completed: recordsFull.filter((item) => item.status_mr === "completed")
        .length,
      pending: recordsFull.filter((item) => item.status_mr === "pending")
        .length,
      examined: recordsFull.filter((item) => item.status_mr === "examined")
        .length,
      cancelled: recordsFull.filter((item) => item.status_mr === "cancelled")
        .length,
      today: recordsFull.filter((item) => isToday(item.exam_date) === true)
        .length,
      total: parseInt(totalResult[0].total),
    };

    res.json({
      success: true,
      data: recordsFull,
      stats: stats,
      pagination: {
        current: parseInt(page),
        pageSize: limit,
        total: parseInt(totalResult[0].total),
        totalPages: Math.ceil(totalResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Get medical records error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching medical records",
    });
  }
});

// Danh sách phiếu khám bệnh chưa lập hóa đơn
router.get(
  "/pending-medical-examinations",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          mr.medical_record_id        AS medical_record_id,
          p.full_name                 AS patient_name,
          da.appointment_date         AS exam_date,
          COALESCE(SUM(pd.total), 0)  AS total_medicine
        FROM medical_records mr
        JOIN daily_appointments da 
          ON da.medical_record_id = mr.medical_record_id
        JOIN patients p 
          ON p.patient_id = da.patient_id
        LEFT JOIN invoices i 
          ON i.medical_record_id = mr.medical_record_id
        LEFT JOIN prescription_detail pd
          ON pd.medical_record_id = mr.medical_record_id
        WHERE i.invoice_id IS NULL
        GROUP BY 
          mr.medical_record_id,
          p.full_name,
          da.appointment_date
        ORDER BY da.appointment_date DESC
      `);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách phiếu khám chưa lập hóa đơn",
      });
    }
  }
);
/// Preview before Create Invoice
router.get("/:id/preview", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const basicInfo = await pool.query(
      `
      SELECT 
        p.full_name AS patient_name, 
        da.appointment_date AS exam_date
      FROM medical_records mr
      JOIN daily_appointments da 
        ON da.medical_record_id = mr.medical_record_id
      JOIN patients p 
        ON p.patient_id = da.patient_id
      WHERE mr.medical_record_id = $1
    `,
      [id]
    );

    const totalMedicine = await pool.query(
      `
      SELECT SUM(total) AS total_medicine
      FROM prescription_detail
      WHERE medical_record_id = $1
    `,
      [id]
    );

    res.json({
      success: true,
      data: {
        basicInfo: basicInfo.rows[0],
        totalMedicine: totalMedicine.rows[0].total_medicine || 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/// Danh sách các phiếu khám bệnh chưa lập hóa đơn



/* -------------------------------------------------------------------------- */
/*                               POST /records                                */
/* -------------------------------------------------------------------------- */

router.post(
  "/",
  [
    authenticateToken,
    authorizeRoles("doctor", "admin"),
    body("patientId").isInt(),
    body("symptoms").notEmpty(),
    body("medications").optional().isArray(),
    body("resultDiagnoses").optional().isArray(),
    body("revisitDate").optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      patientId,
      symptoms,
      medications = [],
      revisitDate,
      resultDiagnoses,
    } = req.body;

    console.log("Data received:", {
      patientId,
      symptoms,
      medications,
      revisitDate,
    });
    const client = await pool.connect();

    try {
      // Kiểm tra bệnh nhân
      const patientRes = await client.query(
        "SELECT patient_id FROM patients WHERE patient_id = $1",
        [patientId]
      );
      if (patientRes.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      }

      await client.query("BEGIN");

      // Tạo hồ sơ khám
      const {
        rows: [medicalRecord],
      } = await client.query(
        `INSERT INTO medical_records (patient_id, doctor_id, symptoms, revisit_date, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING medical_record_id`,
        [
          patientId,
          req.user.user_id,
          symptoms,
          moment(revisitDate).format("YYYY-MM-DD HH:mm") || null,
          "examined",
        ]
      );

      // === XỬ LÝ TỪNG THUỐC TRONG ĐƠN ===
      for (const med of medications) {
        const {
          medicine_id,
          quantity,
          usage_method_id,
          sell_price,
          batches = [],
        } = med;

        // Validate cơ bản
        if (!medicine_id || !quantity || !usage_method_id) {
          throw new Error(`Thuốc ${medicine_id} thiếu thông tin bắt buộc`);
        }

        // Nếu FE đã chọn sẵn lô (từ modal chọn lô) → dùng luôn
        if (batches && batches.length > 0) {
          for (const b of batches) {
            const { batch_id, quantity: qty } = b;
            if (!batch_id || qty <= 0) continue;

            // Lưu chi tiết đơn thuốc theo từng lô
            await client.query(
              `INSERT INTO prescription_detail
               (medical_record_id, batch_id, medicine_id, quantity, usage_method_id, sell_price, total)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                medicalRecord.medical_record_id,
                batch_id,
                medicine_id,
                qty,
                usage_method_id,
                sell_price || 0,
                qty * sell_price,
              ]
            );

            // Trừ tồn kho
            await client.query(
              `UPDATE batches 
               SET remaining_quantity = remaining_quantity - $1 
               WHERE batch_id = $2 AND remaining_quantity >= $1`,
              [qty, batch_id]
            );
          }
        } else {
          // Trường hợp cũ: chưa chọn lô → tự động trừ theo FEFO (vẫn hỗ trợ cho tương thích)
          let remaining = quantity;
          const batchRes = await client.query(
            `SELECT b.id, b.remaining_quantity 
             FROM batches b
             JOIN import_receipts ir ON b.import_receipt_id = ir.id
             WHERE b.medicine_id = $1 AND b.remaining_quantity > 0
             ORDER BY b.expiry_date ASC NULLS LAST, ir.receipt_date ASC`,
            [medicine_id]
          );

          for (const batch of batchRes.rows) {
            if (remaining <= 0) break;
            const deduct = Math.min(batch.remaining_quantity, remaining);

            await client.query(
              `INSERT INTO prescription_detail
               (medical_record_id, batch_id, medicine_id, quantity, usage_method_id, sell_price, total)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                medicalRecord.medical_record_id,
                batch.id,
                medicine_id,
                deduct,
                usage_method_id,
                sell_price || 0,
                deduct * sell_price,
              ]
            );

            await client.query(
              `UPDATE batches SET remaining_quantity = remaining_quantity - $1 WHERE batch_id = $2`,
              [deduct, batch.batch_id]
            );

            remaining -= deduct;
          }

          if (remaining > 0) {
            throw new Error(`Không đủ tồn kho cho thuốc ID ${medicine_id}`);
          }
        }

        /// Lay thong tin thuoc:

        // Cập nhật lại tồn tổng của thuốc
        await client.query(
          `UPDATE medicines m
           SET stock_quantity = (
             SELECT COALESCE(SUM(remaining_quantity), 0)
             FROM batches WHERE medicine_id = m.medicine_id
           )
           WHERE medicine_id = $1`,
          [medicine_id]
        );

        const currInfoMed = await client.query(
          `SELECT * FROM medicines WHERE medicine_id = $1`,
          [medicine_id]
        );
        const isActiveBool = currInfoMed.rows?.[0].is_active;

        //////// ============= UPDATE STATUS ======================/////
        // Determine new stock quantity
        const newQuantity = currInfoMed.rows?.[0].stock_quantity;
        const newMinStock = currInfoMed.rows?.[0].min_stock_level;
        const oriStatus = currInfoMed.rows?.[0].status;

        let newStatus = "active";
        // Compute new status
        if (!isActiveBool) {
          newStatus = "inactive";
        } else if (newQuantity <= newMinStock) {
          newStatus = "low_stock";
        } else if (newQuantity <= 0) {
          newStatus = "out_of_stock";
        }

        if (newStatus != oriStatus) {
          await client.query(
            `UPDATE medicines m
           SET status = $2
           WHERE medicine_id = $1`,
            [medicine_id, newStatus]
          );
        }
      }

      // === THÊM PHẦN LƯU BỆNH (DIAGNOSES) ===
      if (resultDiagnoses && resultDiagnoses.length > 0) {
        for (const diag of resultDiagnoses) {
          const { disease, severity, note, is_primary } = diag;

          console.log("DIAG:", diag);

          // Validate cơ bản
          if (!disease) {
            throw new Error("Mỗi chẩn đoán phải có disease_id");
          }

          // Kiểm tra bệnh có tồn tại không (tùy chọn)
          const diseaseCheck = await client.query(
            "SELECT disease_id FROM diseases WHERE disease_id = $1",
            [disease.disease_id]
          );
          if (diseaseCheck.rowCount === 0) {
            throw new Error(`Bệnh với ID ${disease_id} không tồn tại`);
          }

          await client.query(
            `INSERT INTO disease_details 
            (medical_record_id, disease_id, severity, note, is_primary)
            VALUES ($1, $2, $3, $4, $5)`,
            [
              medicalRecord.medical_record_id,
              disease.disease_id,
              severity || null,
              note || null,
              is_primary || false,
            ]
          );
        }
      }

      console.log("TOI DAY CHUA");

      // Cập nhật lịch hẹn
      await client.query(
        `UPDATE daily_appointments 
         SET status = 'examined', medical_record_id = $1, updated_at = NOW()
         WHERE patient_id = $2 AND appointment_date = CURRENT_DATE AND status = 'waiting'`,
        [medicalRecord.medical_record_id, patientId]
      );

      await client.query("COMMIT");

      // Trả về dữ liệu đầy đủ
      const result = await pool.query(
        `SELECT 
          mr.*, p.full_name AS patient_name, p.phone,
          d.disease_name AS disease_name, u.full_name AS doctor_name,
          pd.prescription_detail_id AS prescription_id, pd.quantity, pd.usage_method_id,
          m.medicine_name AS medicine_name, un.unit_name AS medicine_unit,
          pd.sell_price AS medicine_price, um.usage_method_name AS usage_method_name
        FROM medical_records mr
        JOIN patients p ON mr.patient_id = p.patient_id
        LEFT JOIN disease_details dd ON mr.medical_record_id = dd.medical_record_id
        LEFT JOIN diseases d ON d.disease_id = dd.disease_id
        LEFT JOIN users u ON mr.doctor_id = u.user_id
        LEFT JOIN prescription_detail pd ON mr.medical_record_id = pd.medical_record_id
        LEFT JOIN medicines m ON pd.medicine_id = m.medicine_id
        LEFT JOIN units un ON un.unit_id = m.unit_id
        LEFT JOIN usage_methods um ON pd.usage_method_id = um.usage_method_id
        WHERE mr.medical_record_id = $1
        ORDER BY pd.prescription_detail_id
      `,
        [medicalRecord.medical_record_id]
      );

      console.log("RESULT: ", result);

      return res.status(201).json({
        success: true,
        message: "Tạo hồ sơ khám thành công",
        data: result.rows,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Create medical record error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server",
      });
    } finally {
      client.release();
    }
  }
);

// /api/medical-records/summary
// ==================================================================
// KPI SUMMARY – DÀNH RIÊNG CHO DASHBOARD
// ==================================================================
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const { date } = req.query; // nếu không có → mặc định hôm nay
    const targetDate = date || moment().format("YYYY-MM-DD");

    const result = await pool.query(
      `
      WITH stats AS (
        SELECT 
          COUNT(*) AS total,
          COUNT(CASE WHEN DATE(mr.created_at) = $1 THEN 1 END) AS today,
          COUNT(CASE WHEN mr.status = 'completed' THEN 1 END) AS completed,
          COUNT(CASE WHEN mr.status IN ('pending', 'in_progress', 'examined') THEN 1 END) AS pending
        FROM medical_records mr
      )
      SELECT 
        total::int,
        today::int,
        completed::int,
        pending::int,
        (SELECT COUNT(*) FROM medical_records WHERE status = 'completed')::int AS completed_total
      FROM stats
      `,
      [targetDate]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        total: row.total,
        today: row.today,
        completed: row.completed,
        pending: row.pending,
        completed_ratio:
          row.total > 0 ? `${row.completed}/${row.total}` : "0/0",
        pending_ratio: row.total > 0 ? `${row.pending}/${row.total}` : "0/0",
      },
    });
  } catch (error) {
    console.error("KPI Summary error:", error);
    res.status(500).json({ success: false, message: "Lỗi tải KPI" });
  }
});
/* -------------------------------------------------------------------------- */
/*                              GET /records/:id                              */
/* -------------------------------------------------------------------------- */
router.get(
  "/:id",
  [authenticateToken, authorizeRoles("doctor", "admin")],
  async (req, res) => {
    try {
      const { id } = req.params;

      // Lấy thông tin cơ bản hồ sơ
      const { rows: recordRows } = await pool.query(
        `
        SELECT 
          mr.medical_record_id,
          mr.patient_id,
          COALESCE(p.full_name, 'Unknown Patient') AS patient_name,
          p.phone AS patient_phone,
          p.address AS patient_address,
          mr.symptoms,
          mr.created_at,
          COALESCE(u.full_name, 'Unknown Doctor') AS doctor_name,
          mr.doctor_id, 
          mr.revisit_date, 
          i.invoice_id, 
          i.payment_status, 
          da.appointment_date
        FROM medical_records mr
        LEFT JOIN patients p ON mr.patient_id = p.patient_id
        LEFT JOIN users u ON mr.doctor_id = u.user_id
        LEFT JOIN invoices i ON i.medical_record_id = mr.medical_record_id
        LEFT JOIN daily_appointments da ON mr.medical_record_id = da.medical_record_id
        WHERE mr.medical_record_id = $1
      `,
        [id]
      );

      if (!recordRows.length)
        return res
          .status(404)
          .json({ success: false, message: "Medical record not found" });

      const record = recordRows[0];

      // Lấy danh sách bệnh
      const { rows: diseases } = await pool.query(
        `
        SELECT 
          dd.disease_detail_id,
          d.disease_id,
          d.disease_name,
          dd.severity,
          dd.note AS disease_note, 
          dd.is_primary
        FROM disease_details dd
        LEFT JOIN diseases d ON dd.disease_id = d.disease_id
        WHERE dd.medical_record_id = $1
      `,
        [id]
      );

      // Lấy danh sách đơn thuốc
      const { rows: prescriptionsRaw } = await pool.query(
        `
        SELECT 
          pd.prescription_detail_id,
          pd.quantity,
          pd.sell_price,
          COALESCE(m.medicine_name, 'Unknown Medicine') AS medicine_name,
          COALESCE(u.unit_name, 'Unknown Unit') AS unit,
          COALESCE(um.usage_method_name, 'Unknown Usage') AS usage_method,
          b.batch_id,
          b.batch_code,
          b.import_receipt_id, 
          pd.medicine_id, 
          pd.usage_method_id, 
          b.unit_price AS import_price
        FROM prescription_detail pd
        LEFT JOIN medicines m ON pd.medicine_id = m.medicine_id
        LEFT JOIN units u ON m.unit_id = u.unit_id
        LEFT JOIN usage_methods um ON pd.usage_method_id = um.usage_method_id
        LEFT JOIN batches b ON pd.batch_id = b.batch_id
        WHERE pd.medical_record_id = $1
      `,
        [id]
      );

      // Gộp thuốc theo medicine_name (nhiều lô)
      const prescriptionMap = {};
      prescriptionsRaw.forEach((p) => {
        if (!prescriptionMap[p.medicine_name]) {
          prescriptionMap[p.medicine_name] = {
            medicine_name: p.medicine_name,
            unit: p.unit,
            usage_method: p.usage_method,
            sell_price: p.sell_price,
            quantity: 0,
            total: 0,
            batches: [],
            medicine_id: p.medicine_id,
            usage_method_id: p.usage_method_id,
          };
        }
        prescriptionMap[p.medicine_name].quantity += p.quantity;
        prescriptionMap[p.medicine_name].total +=
          p.quantity * (p.sell_price || 0);
        prescriptionMap[p.medicine_name].batches.push({
          batch_id: p.batch_id,
          batch_code: p.batch_code,
          quantity: p.quantity,
          import_receipt_id: p.import_receipt_id,
          import_price: p.import_price,
        });
      });

      console.log(Object.values(prescriptionMap));

      res.json({
        success: true,
        data: {
          ...record,
          diseases,
          prescriptions: Object.values(prescriptionMap),
        },
      });
    } catch (error) {
      console.error("Get medical record error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching medical record",
      });
    }
  }
);

// ==================================================================
// 3. TÌM HỒ SƠ THEO THUỐC
// ==================================================================
router.get(
  "/by-medicine/:medicine_id",
  [authenticateToken, authorizeRoles("admin", "pharmacist", "doctor")],
  async (req, res) => {
    try {
      const { medicine_id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await pool.query(
        `SELECT medicine_name FROM medicines WHERE medicine_id = $1`,
        [medicine_id]
      );

      const ten_thuoc = result.rows?.[0]?.medicine_name || "";

      const { rows, rowCount } = await pool.query(
        `
        SELECT 
          mr.medical_record_id,
          mr.created_at,
          p.full_name AS patient_name,
          p.phone,
          u.full_name AS doctor_name,
          pd.quantity,
          pd.sell_price,
          b.batch_code,
          m.medicine_name
        FROM prescription_detail pd
        JOIN medical_records mr ON pd.medical_record_id = mr.medical_record_id
        JOIN medicines m ON pd.medicine_id = m.medicine_id
        LEFT JOIN batches b ON pd.batch_id = b.batch_id
        LEFT JOIN daily_appointments da ON da.medical_record_id = mr.medical_record_id
        LEFT JOIN patients p ON da.patient_id = p.patient_id
        LEFT JOIN users u ON mr.doctor_id = u.user_id
        WHERE pd.medicine_id = $1
        ORDER BY mr.created_at DESC
        LIMIT $2 OFFSET $3
      `,
        [medicine_id, limit, offset]
      );

      const total = await pool.query(
        "SELECT COUNT(*) FROM prescription_detail WHERE medicine_id = $1",
        [medicine_id]
      );

      res.json({
        success: true,
        data: {
          records: rows,
          medicine_name: ten_thuoc,
        },
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: parseInt(total.rows[0].count),
        },
      });
    } catch (error) {
      console.error("Error searching by medicine:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                       GET /records/patient/:patientId                      */
/* -------------------------------------------------------------------------- */

router.get(
  "/patient/:patientId",
  [authenticateToken, authorizeRoles("doctor", "admin")],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // 1. Lấy danh sách hồ sơ
      const { rows: records } = await pool.query(
        `
        SELECT 
          mr.medical_record_id,
          mr.symptoms,
          mr.created_at,
          mr.revisit_date,
          u.full_name AS doctor_name,
          i.invoice_id,
          i.payment_status,
          i.total_amount,
          da.appointment_date
        FROM medical_records mr
        LEFT JOIN users u ON mr.doctor_id = u.user_id
        LEFT JOIN invoices i ON i.medical_record_id = mr.medical_record_id
        LEFT JOIN daily_appointments da ON da.medical_record_id = mr.medical_record_id
        WHERE mr.patient_id = $1
        ORDER BY mr.created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [patientId, limit, offset]
      );

      if (!records.length) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
          },
        });
      }

      // 2. Lấy danh sách bệnh cho từng hồ sơ
      const recordIds = records.map((r) => r.medical_record_id);

      const { rows: diseaseRows } = await pool.query(
        `
        SELECT 
          dd.medical_record_id,
          d.disease_name,
          dd.severity,
          dd.note
        FROM disease_details dd
        JOIN diseases d ON dd.disease_id = d.disease_id
        WHERE dd.medical_record_id = ANY($1)
        `,
        [recordIds]
      );

      // Gom bệnh theo hồ sơ
      const diseasesByRecord = {};
      diseaseRows.forEach((d) => {
        if (!diseasesByRecord[d.medical_record_id]) {
          diseasesByRecord[d.medical_record_id] = [];
        }
        diseasesByRecord[d.medical_record_id].push(d);
      });

      // 3. Gắn bệnh vào hồ sơ
      const final = records.map((r) => ({
        ...r,
        diseases: diseasesByRecord[r.medical_record_id] || [],
      }));

      // 4. Lấy tổng số
      const totalResult = await pool.query(
        `SELECT COUNT(*) FROM medical_records WHERE patient_id = $1`,
        [patientId]
      );

      const total = parseInt(totalResult.rows[0].count);

      res.json({
        success: true,
        data: final,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      });
    } catch (error) {
      console.error("Get patient records error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching patient medical records",
      });
    }
  }
);

/// Update Medical Record (chưa có hóa đơn)
router.put(
  "/:id",
  [authenticateToken, authorizeRoles("doctor", "admin")],
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const {
        symptoms,
        revisit_date,
        diseases = [],
        medications = [],
      } = req.body;

      console.log("=== UPDATE MEDICAL RECORD ===");
      console.log("Record ID:", id);
      console.log("Symptoms:", symptoms);
      console.log("Revisit Date:", revisit_date);
      console.log("Diseases:", diseases);
      console.log("Prescriptions:", medications);

      // 1. Kiểm tra hồ sơ tồn tại
      const checkRecord = await client.query(
        `SELECT mr.*, i.invoice_id 
         FROM medical_records mr
         LEFT JOIN invoices i ON i.medical_record_id = mr.medical_record_id
         WHERE mr.medical_record_id = $1`,
        [id]
      );

      if (checkRecord.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Hồ sơ khám không tồn tại",
        });
      }

      const record = checkRecord.rows[0];

      // 2. Kiểm tra đã có hóa đơn chưa (nếu có rồi thì không cho sửa)
      if (record.invoice_id) {
        return res.status(400).json({
          success: false,
          message: "Không thể sửa hồ sơ đã có hóa đơn",
        });
      }

      await client.query("BEGIN");

      // 3. Cập nhật thông tin cơ bản medical_records
      await client.query(
        `UPDATE medical_records 
         SET symptoms = $1, 
             revisit_date = $2, 
             updated_at = NOW()
         WHERE medical_record_id = $3`,
        [
          symptoms || record.symptoms,
          revisit_date
            ? moment(revisit_date).format("YYYY-MM-DD HH:mm")
            : record.revisit_date,
          id,
        ]
      );

      // 4. XỬ LÝ DISEASES (added, removed, updated)
      if (diseases) {
        const { added = [], removed = [], updated = [] } = diseases;

        // 4.1. Xóa các bệnh bị removed
        for (const item of removed) {
          const disease_detail_id = item.disease_detail_id;

          await client.query(
            "DELETE FROM disease_details WHERE disease_detail_id = $1",
            [disease_detail_id]
          );
          console.log(`✅ Deleted disease_detail_id: ${disease_detail_id}`);
        }

        // 4.2. Thêm các bệnh mới (added)
        for (const item of added) {
          const { disease_id, severity, disease_note } = item;

          await client.query(
            `INSERT INTO disease_details (medical_record_id, disease_id, severity, note)
             VALUES ($1, $2, $3, $4)`,
            [id, disease_id, severity || null, disease_note || null]
          );
          console.log(`Added disease_id: ${disease_id}`);
        }

        // 4.3. Cập nhật các bệnh đã có (updated)
        for (const item of updated) {
          const { disease_detail_id, disease, severity, disease_note } = item;

          if (!disease_detail_id) {
            console.warn("Updated disease missing disease_detail_id:", item);
            continue;
          }

          await client.query(
            `UPDATE disease_details 
             SET disease_id = $1, severity = $2, note = $3
             WHERE disease_detail_id = $4`,
            [
              disease.disease_id,
              severity || null,
              disease_note || null,
              disease_detail_id,
            ]
          );
          console.log(`Updated disease_detail_id: ${disease_detail_id}`);
        }
      }

      // 5. XỬ LÝ PRESCRIPTIONS (added, removed, updated)
      if (medications) {
        const { added = [], removed = [], updated = [] } = medications;

        // 5.1. Xóa thuốc bị removed (hoàn trả tồn kho)
        for (const item of removed) {
          const { medicine_id, usage_method_id, batches = [] } = item;
          console.log("Can xoa medicine : ", medicine_id);
          console.log(
            `Removing medicine_id: ${medicine_id}, usage_method_id: ${usage_method_id}`
          );

          // Lấy thông tin prescription_detail cần xóa (dùng composite key)
          const detailsToDelete = await client.query(
            `SELECT pd.prescription_detail_id, pd.batch_id, pd.quantity, pd.medicine_id
             FROM prescription_detail pd
             WHERE pd.medical_record_id = $1 
               AND pd.medicine_id = $2 
               AND pd.usage_method_id = $3`,
            [id, medicine_id, usage_method_id]
          );

          console.log(
            `Found ${detailsToDelete.rows.length} prescription_detail records to delete`
          );

          // Hoàn trả tồn kho từng lô
          for (const detail of detailsToDelete.rows) {
            await client.query(
              `UPDATE batches 
               SET remaining_quantity = remaining_quantity + $1
               WHERE batch_id = $2`,
              [detail.quantity, detail.batch_id]
            );

            console.log(
              `Restored ${detail.quantity} to batch_id: ${detail.batch_id}`
            );
          }

          // Xóa prescription_detail (composite key)
          await client.query(
            `DELETE FROM prescription_detail 
             WHERE medical_record_id = $1 
               AND medicine_id = $2`,
            [id, medicine_id]
          ),
            // Cập nhật lại tồn tổng của thuốc
            await client.query(
              `UPDATE medicines m
            SET stock_quantity = (
            SELECT COALESCE(SUM(remaining_quantity), 0)
            FROM batches WHERE medicine_id = m.medicine_id)
            WHERE medicine_id = $1`,
              [medicine_id]
            );
          console.log(
            `Deleted medicine_id: ${medicine_id}, usage_method_id: ${usage_method_id}`
          );

          const currInfoMed = await client.query(
            `SELECT * FROM medicines WHERE medicine_id = $1`,
            [medicine_id]
          );

          const isActiveBool = currInfoMed.rows?.[0].is_active;
          // Determine new stock quantity
          const newQuantity = currInfoMed.rows?.[0].stock_quantity;
          const newMinStock = currInfoMed.rows?.[0].min_stock_level;
          const oriStatus = currInfoMed.rows?.[0].status;

          let newStatus = "active";
          // Compute new status
          if (!isActiveBool) {
            newStatus = "inactive";
          } else if (newQuantity <= newMinStock) {
            newStatus = "low_stock";
          } else if (newQuantity <= 0) {
            newStatus = "out_of_stock";
          }

          if (newStatus != oriStatus) {
            await client.query(
              `UPDATE medicines m
           SET status = $2
           WHERE medicine_id = $1`,
              [medicine_id, newStatus]
            );
          }
        }

        // 5.2. Thêm thuốc mới (added)
        for (const med of added) {
          const {
            medicine_id,
            quantity,
            usage_method_id,
            sell_price,
            batches = [],
          } = med;

          if (!medicine_id || !quantity || !usage_method_id) {
            console.warn("Medicine missing required fields:", med);
            continue;
          }

          // Nếu có chọn lô cụ thể
          if (batches && batches.length > 0) {
            for (const b of batches) {
              const { batch_id, quantity: qty } = b;
              if (!batch_id || qty <= 0) continue;

              // Kiểm tra tồn kho
              const batchCheck = await client.query(
                "SELECT remaining_quantity FROM batches WHERE batch_id = $1",
                [batch_id]
              );

              if (
                batchCheck.rows.length === 0 ||
                batchCheck.rows[0].remaining_quantity < qty
              ) {
                throw new Error(`Lô ${batch_id} không đủ tồn kho`);
              }

              // Lưu prescription_detail
              await client.query(
                `INSERT INTO prescription_detail
                 (medical_record_id, batch_id, medicine_id, quantity, usage_method_id, sell_price, total)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  id,
                  batch_id,
                  medicine_id,
                  qty,
                  usage_method_id,
                  sell_price || 0,
                  qty * (sell_price || 0),
                ]
              );

              // Trừ tồn kho
              await client.query(
                `UPDATE batches 
                 SET remaining_quantity = remaining_quantity - $1
                 WHERE batch_id = $2`,
                [qty, batch_id]
              );
              console.log(`Deducted ${qty} from batch_id: ${batch_id}`);
            }
          } else {
            // Tự động trừ theo FEFO
            let remaining = quantity;
            const batchRes = await client.query(
              `SELECT b.batch_id, b.remaining_quantity 
               FROM batches b
               JOIN import_receipts ir ON b.import_receipt_id = ir.import_receipt_id
               WHERE b.medicine_id = $1 AND b.remaining_quantity > 0
               ORDER BY b.expiry_date ASC NULLS LAST, ir.receipt_date ASC`,
              [medicine_id]
            );

            for (const batch of batchRes.rows) {
              if (remaining <= 0) break;
              const deduct = Math.min(batch.remaining_quantity, remaining);

              await client.query(
                `INSERT INTO prescription_detail
                 (medical_record_id, batch_id, medicine_id, quantity, usage_method_id, sell_price, total)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  id,
                  batch.batch_id,
                  medicine_id,
                  deduct,
                  usage_method_id,
                  price || 0,
                  deduct * (price || 0),
                ]
              );

              await client.query(
                `UPDATE batches SET remaining_quantity = remaining_quantity - $1 WHERE batch_id = $2`,
                [deduct, batch.batch_id]
              );

              remaining -= deduct;
              console.log(
                `✅ Auto-deducted ${deduct} from batch_id: ${batch.batch_id}`
              );
            }

            if (remaining > 0) {
              throw new Error(`Không đủ tồn kho cho thuốc ID ${medicine_id}`);
            }
          }

          // Cập nhật tồn tổng
          await client.query(
            `UPDATE medicines m
             SET stock_quantity = (
               SELECT COALESCE(SUM(remaining_quantity), 0)
               FROM batches WHERE medicine_id = m.medicine_id
             )
             WHERE medicine_id = $1`,
            [medicine_id]
          );

          /// Check trang thai
          //////// ============= UPDATE STATUS ======================/////
          const currInfoMed = await client.query(
            `SELECT * FROM medicines WHERE medicine_id = $1`,
            [medicine_id]
          );

          const isActiveBool = currInfoMed.rows?.[0].is_active;
          // Determine new stock quantity
          const newQuantity = currInfoMed.rows?.[0].stock_quantity;
          const newMinStock = currInfoMed.rows?.[0].min_stock_level;
          const oriStatus = currInfoMed.rows?.[0].status;

          let newStatus = "active";
          // Compute new status
          if (!isActiveBool) {
            newStatus = "inactive";
          } else if (newQuantity <= newMinStock) {
            newStatus = "low_stock";
          } else if (newQuantity <= 0) {
            newStatus = "out_of_stock";
          }

          if (newStatus != oriStatus) {
            await client.query(
              `UPDATE medicines m
           SET status = $2
           WHERE medicine_id = $1`,
              [medicine_id, newStatus]
            );
          }
        }

        // 5.3. Cập nhật thuốc đã có (updated) - thường là thay đổi số lượng
        for (const med of updated) {
          const {
            medicine_id,
            quantity,
            usage_method_id,
            price,
            batches = [],
          } = med;

          console.log(
            `🔄 Updating medicine_id: ${medicine_id}, usage_method_id: ${usage_method_id}`
          );

          // Xóa prescription_detail cũ và hoàn trả tồn (composite key)
          const oldDetails = await client.query(
            `SELECT pd.prescription_detail_id, pd.batch_id, pd.quantity
             FROM prescription_detail pd
             WHERE pd.medical_record_id = $1 
               AND pd.medicine_id = $2 
               AND pd.usage_method_id = $3`,
            [id, medicine_id, usage_method_id]
          );

          console.log(
            `Found ${oldDetails.rows.length} old prescription_detail records`
          );

          for (const detail of oldDetails.rows) {
            await client.query(
              `UPDATE batches SET remaining_quantity = remaining_quantity + $1 WHERE batch_id = $2`,
              [detail.quantity, detail.batch_id]
            );
            console.log(
              `✅ Restored ${detail.quantity} to batch_id: ${detail.batch_id}`
            );
          }

          await client.query(
            `DELETE FROM prescription_detail 
             WHERE medical_record_id = $1 
               AND medicine_id = $2 
               AND usage_method_id = $3`,
            [id, medicine_id, usage_method_id]
          );

          // Thêm lại với số lượng mới (giống logic added)
          if (batches && batches.length > 0) {
            for (const b of batches) {
              const { batch_id, quantity: qty } = b;
              if (!batch_id || qty <= 0) continue;

              await client.query(
                `INSERT INTO prescription_detail
                 (medical_record_id, batch_id, medicine_id, quantity, usage_method_id, sell_price, total)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  id,
                  batch_id,
                  medicine_id,
                  qty,
                  usage_method_id,
                  price || 0,
                  qty * (price || 0),
                ]
              );

              await client.query(
                `UPDATE batches SET remaining_quantity = remaining_quantity - $1 WHERE batch_id = $2`,
                [qty, batch_id]
              );
              console.log(`✅ Added ${qty} to batch_id: ${batch_id}`);
            }
          } else {
            // Tự động trừ theo FEFO nếu không chọn lô
            let remaining = quantity;
            const batchRes = await client.query(
              `SELECT b.batch_id, b.remaining_quantity 
               FROM batches b
               JOIN import_receipts ir ON b.import_receipt_id = ir.import_receipt_id
               WHERE b.medicine_id = $1 AND b.remaining_quantity > 0
               ORDER BY b.expiry_date ASC NULLS LAST, ir.receipt_date ASC`,
              [medicine_id]
            );

            for (const batch of batchRes.rows) {
              if (remaining <= 0) break;
              const deduct = Math.min(batch.remaining_quantity, remaining);

              await client.query(
                `INSERT INTO prescription_detail
                 (medical_record_id, batch_id, medicine_id, quantity, usage_method_id, sell_price, total)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  id,
                  batch.batch_id,
                  medicine_id,
                  deduct,
                  usage_method_id,
                  price || 0,
                  deduct * (price || 0),
                ]
              );

              await client.query(
                `UPDATE batches SET remaining_quantity = remaining_quantity - $1 WHERE batch_id = $2`,
                [deduct, batch.batch_id]
              );

              remaining -= deduct;
              console.log(
                `✅ Auto-deducted ${deduct} from batch_id: ${batch.batch_id}`
              );
            }

            if (remaining > 0) {
              throw new Error(`Không đủ tồn kho cho thuốc ID ${medicine_id}`);
            }
          }

          // Cập nhật tồn tổng
          await client.query(
            `UPDATE medicines m
             SET stock_quantity = (
               SELECT COALESCE(SUM(remaining_quantity), 0)
               FROM batches WHERE medicine_id = m.medicine_id
             )
             WHERE medicine_id = $1`,
            [medicine_id]
          );
          console.log(
            `✅ Updated medicine_id: ${medicine_id}, usage_method_id: ${usage_method_id}`
          );

          /// Check trang thai
          //////// ============= UPDATE STATUS ======================/////
          const currInfoMed = await client.query(
            `SELECT * FROM medicines WHERE medicine_id = $1`,
            [medicine_id]
          );

          const isActiveBool = currInfoMed.rows?.[0].is_active;
          // Determine new stock quantity
          const newQuantity = currInfoMed.rows?.[0].stock_quantity;
          const newMinStock = currInfoMed.rows?.[0].min_stock_level;
          const oriStatus = currInfoMed.rows?.[0].status;

          let newStatus = "active";
          // Compute new status
          if (!isActiveBool) {
            newStatus = "inactive";
          } else if (newQuantity <= newMinStock) {
            newStatus = "low_stock";
          } else if (newQuantity <= 0) {
            newStatus = "out_of_stock";
          }

          if (newStatus != oriStatus) {
            await client.query(
              `UPDATE medicines m
           SET status = $2
           WHERE medicine_id = $1`,
              [medicine_id, newStatus]
            );
          }
        }
      }

      await client.query("COMMIT");

      // 6. Lấy lại dữ liệu đầy đủ sau khi update
      const updatedRecord = await pool.query(
        `SELECT 
          mr.medical_record_id,
          mr.patient_id,
          mr.symptoms,
          mr.revisit_date,
          mr.created_at,
          p.full_name AS patient_name,
          u.full_name AS doctor_name
        FROM medical_records mr
        LEFT JOIN patients p ON mr.patient_id = p.patient_id
        LEFT JOIN users u ON mr.doctor_id = u.user_id
        WHERE mr.medical_record_id = $1`,
        [id]
      );

      const { rows: updatedDiseases } = await pool.query(
        `SELECT dd.*, d.disease_name
         FROM disease_details dd
         LEFT JOIN diseases d ON dd.disease_id = d.disease_id
         WHERE dd.medical_record_id = $1`,
        [id]
      );

      const { rows: updatedPrescriptions } = await pool.query(
        `SELECT pd.*, m.medicine_name, u.unit_name, um.usage_method_name, b.batch_code
         FROM prescription_detail pd
         LEFT JOIN medicines m ON pd.medicine_id = m.medicine_id
         LEFT JOIN units u ON m.unit_id = u.unit_id
         LEFT JOIN usage_methods um ON pd.usage_method_id = um.usage_method_id
         LEFT JOIN batches b ON pd.batch_id = b.batch_id
         WHERE pd.medical_record_id = $1`,
        [id]
      );

      res.status(200).json({
        success: true,
        message: "Cập nhật hồ sơ khám thành công",
        data: {
          ...updatedRecord.rows[0],
          diseases: updatedDiseases,
          prescriptions: updatedPrescriptions,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update medical record error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi cập nhật hồ sơ khám",
      });
    } finally {
      client.release();
    }
  }
);
router.delete(
  "/:id",
  [authenticateToken, authorizeRoles("admin", "doctor")],
  async (req, res) => {
    const client = await pool.connect(); // Dùng transaction

    try {
      const { id } = req.params;
      const user = req.user;

      console.log(
        `User ${user.user_id} (${user.full_name}) is attempting to delete medical record ID: ${id}`
      );

      await client.query("BEGIN"); // Bắt đầu transaction

      // Kiểm tra hồ sơ có tồn tại không
      const recordCheck = await client.query(
        `SELECT * FROM medical_records WHERE medical_record_id = $1`,
        [id]
      );

      if (recordCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Hồ sơ khám không tồn tại",
        });
      }

      // Check có invoice chưa
      const invoiceCheck = await client.query(
        `SELECT * FROM invoices WHERE medical_record_id = $1`,
        [id]
      );

      if (invoiceCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Không thể xóa hồ sơ đã có hóa đơn",
        });
      }

      // Check quyền doctor
      const record = recordCheck.rows[0];
      if (
        record.doctor_id !== user.user_id &&
        user.role_name?.toLowerCase() !== "admin"
      ) {
        await client.query("ROLLBACK");
        return res.status(403).json({
          success: false,
          message: "Chỉ bác sĩ tạo hồ sơ mới có quyền xóa",
        });
      }

      // ===== LẤY PRESCRIPTION DETAIL TRƯỚC KHI XÓA MEDICAL RECORD =====
      const prescriptionDetails = await client.query(
        `SELECT batch_id, quantity, medicine_id 
         FROM prescription_detail 
         WHERE medical_record_id = $1`,
        [id]
      );

      console.log(
        `Found ${prescriptionDetails.rows.length} prescriptions to restore`
      );

      // ===== HOÀN TRẢ TỒN KHO THUỐC =====
      for (const detail of prescriptionDetails.rows) {
        console.log(
          `Hoàn trả thuốc ID: ${detail.medicine_id}, Số lượng: ${detail.quantity}, Lô: ${detail.batch_id}`
        );

        // 1. Hoàn trả tồn kho lô
        await client.query(
          `UPDATE batches 
           SET remaining_quantity = remaining_quantity + $1,
               updated_at = NOW()
           WHERE batch_id = $2`,
          [detail.quantity, detail.batch_id]
        );

        // 2. Cập nhật tổng tồn kho thuốc
        const updateResult = await client.query(
          `UPDATE medicines m
           SET stock_quantity = (
             SELECT COALESCE(SUM(remaining_quantity), 0)
             FROM batches 
             WHERE medicine_id = m.medicine_id
           ),
           updated_at = NOW()
           WHERE medicine_id = $1
           RETURNING stock_quantity, min_stock_level, is_active`,
          [detail.medicine_id]
        );

        if (updateResult.rows.length > 0) {
          const { stock_quantity, min_stock_level, is_active } =
            updateResult.rows[0];

          // 3. Tính toán status mới
          let newStatus = "active";

          if (!is_active) {
            newStatus = "inactive";
          } else if (stock_quantity <= 0) {
            newStatus = "out_of_stock";
          } else if (stock_quantity <= min_stock_level) {
            newStatus = "low_stock";
          }

          console.log(
            `Cập nhật status thuốc ${detail.medicine_id}: ${newStatus} (Tồn: ${stock_quantity})`
          );

          // 4. Update status
          await client.query(
            `UPDATE medicines 
             SET status = $1,
                 updated_at = NOW()
             WHERE medicine_id = $2`,
            [newStatus, detail.medicine_id]
          );
        }
      }

      // ===== XÓA CÁC RECORDS LIÊN QUAN =====

      // Xóa prescription_detail
      if (prescriptionDetails.rows.length > 0) {
        await client.query(
          `DELETE FROM prescription_detail WHERE medical_record_id = $1`,
          [id]
        );
        console.log("Đã xóa prescription_detail");
      }

      // Xóa disease_details
      await client.query(
        `DELETE FROM disease_details WHERE medical_record_id = $1`,
        [id]
      );
      console.log("Đã xóa disease_details");

      // Update daily_appointments
      await client.query(
        `UPDATE daily_appointments 
         SET medical_record_id = NULL, 
             status = 'waiting',
             updated_at = NOW()
         WHERE medical_record_id = $1`,
        [id]
      );
      console.log("Đã cập nhật daily_appointments");

      // Xóa medical_record (cuối cùng)
      await client.query(
        `DELETE FROM medical_records WHERE medical_record_id = $1`,
        [id]
      );
      console.log("Đã xóa medical_record");

      await client.query("COMMIT"); // Commit transaction

      res.status(200).json({
        success: true,
        message: "Xóa hồ sơ khám thành công",
      });
    } catch (error) {
      await client.query("ROLLBACK"); // Rollback nếu có lỗi
      console.error("Delete medical record error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa hồ sơ khám",
        error: error.message,
      });
    } finally {
      client.release(); // Release connection
    }
  }
);
module.exports = router;
