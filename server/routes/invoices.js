const express = require("express");
const { body, validationResult, query } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { generateCode } = require("../utils/CreateInvoiceCode");
const router = express.Router();

router.post(
  "/",
  [
    authenticateToken,
    authorizeRoles("receptionist", "admin"),
    body("medical_record_id")
      .isInt()
      .withMessage("Medical record ID must be a number"),
    body('note').optional(),
    body('invoice_date').optional()
  ],
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN"); //  BẮT ĐẦU TRANSACTION

    /*   const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      } */

      const { medical_record_id, note, invoice_date } = req.body;

      console.log(medical_record_id, note, invoice_date)

      // 1. Check appointment
      const appointmentResult = await client.query(
        `SELECT daily_appointment_id, status 
         FROM daily_appointments 
         WHERE medical_record_id = $1`,
        [medical_record_id]
      );

      if (appointmentResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }

      if (appointmentResult.rows[0].status !== "examined") {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Cannot create invoice for appointment that is not examined",
        });
      }

      // 2. Check duplicate invoice
      const existingInvoice = await client.query(
        "SELECT invoice_id FROM invoices WHERE medical_record_id = $1",
        [medical_record_id]
      );

      if (existingInvoice.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Invoice already exists",
        });
      }

      // 3. Get settings
      const settingsResult = await client.query(
        "SELECT setting_value FROM settings WHERE setting_key = $1",
        ["ConsultationFee"]
      );

      const consultationFee =
        settingsResult.rows.length > 0
          ? parseFloat(settingsResult.rows[0].setting_value)
          : 100000;

      // 4. Calculate medicine fee
      const medicineFeeResult = await client.query(
        `
        SELECT SUM(COALESCE(pd.total, pd.quantity * pd.sell_price, 0)) AS total_medicine_fee
        FROM prescription_detail pd
        WHERE pd.medical_record_id = $1
        `,
        [medical_record_id]
      );

      const medicineFee = parseFloat(medicineFeeResult.rows[0].total_medicine_fee) || 0;
      const totalAmount = consultationFee + medicineFee;

      // 5. Generate unique invoice code (inside transaction)
      let invoiceCode = "";
      while (true) {
        invoiceCode = generateCode();

        const check = await client.query(
          `SELECT invoice_code FROM invoices WHERE invoice_code = $1`,
          [invoiceCode]
        );

        if (check.rows.length === 0) break;
      }

      // 6. INSERT invoice
      const result = await client.query(
        `INSERT INTO invoices 
          (medical_record_id, daily_appointment_id, consultation_fee, medicine_fee, total_amount, 
           payment_status, invoice_code, created_by_id, invoice_date, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, COALESCE($9, CURRENT_DATE), $10)
         RETURNING *`,
        [
          medical_record_id,
          appointmentResult.rows[0].daily_appointment_id,
          consultationFee,
          medicineFee,
          totalAmount,
          "pending",
          invoiceCode,
          req.user.user_id,
          invoice_date|| null,
          note
        ]
      );

      // 7. UPDATE medical-record
      await client.query(
        `UPDATE medical_records
         SET status = $1
         WHERE medical_record_id = $2`,
        ["completed", medical_record_id]
      );

      await client.query("COMMIT"); // 🔥 KHOÁ THANH CÔNG

      return res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: result.rows[0],
      });

    } catch (error) {
      await client.query("ROLLBACK"); // 🔥 ĐẢO NGƯỢC MỌI THAY ĐỔI
      console.error("Create invoice error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while creating invoice",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/:id",
  [authenticateToken, authorizeRoles("receptionist", "admin")],
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
      SELECT 
        i.*,

        p.patient_id,
        p.full_name AS patient_name,
        p.phone,
        p.address,

        mr.medical_record_id,
        mr.symptoms,

        dd.disease_detail_id,
        d.disease_id,
        d.disease_name,
        dd.severity,
        dd.note AS disease_note,

        u.full_name AS doctor_name,

        pd.prescription_detail_id,
        pd.quantity,
        pd.sell_price AS medicine_price,

        m.medicine_name,


        b.batch_code,
        b.batch_id,

        um.usage_method_name,
        da.appointment_date, 
        mr.status as status_mr

      FROM invoices i
      JOIN medical_records mr 
        ON i.medical_record_id = mr.medical_record_id


      JOIN daily_appointments da 
        ON da.medical_record_id = mr.medical_record_id

      JOIN patients p 
        ON da.patient_id = p.patient_id

      LEFT JOIN disease_details dd
        ON mr.medical_record_id = dd.medical_record_id

      LEFT JOIN diseases d
        ON dd.disease_id = d.disease_id

      LEFT JOIN users u 
        ON mr.doctor_id = u.user_id
    
      LEFT JOIN prescription_detail pd 
        ON mr.medical_record_id = pd.medical_record_id

      LEFT JOIN batches b 
        ON b.batch_id = pd.batch_id

      LEFT JOIN medicines m 
        ON pd.medicine_id = m.medicine_id

      LEFT JOIN usage_methods um 
        ON pd.usage_method_id = um.usage_method_id

      WHERE i.invoice_id = $1
      ORDER BY pd.prescription_detail_id
    
    `,
        [id]
      );

      const prescription = await pool.query("");

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      const rows = result.rows;

      const invoice = {
        invoice_id: rows[0].invoice_id,
        invoice_code: rows[0].invoice_code,

        patient_id: rows[0].patient_id,
        patient_name: rows[0].patient_name,
        phone_number: rows[0].phone,
        address: rows[0].address,

        medical_record_id: rows[0].medical_record_id,
        symptoms: rows[0].symptoms,
        diagnosis: rows[0].diagnosis,

        doctor_name: rows[0].doctor_name,
        consultation_fee: rows[0].consultation_fee,
        medicine_fee: rows[0].medicine_fee,
        total_amount: rows[0].total_amount,
        payment_status: rows[0].payment_status,
        created_at: rows[0].created_at,
        appointment_date: rows[0].appointment_date, 

        // ⭐ Gom nhiều bệnh vào danh sách
        diseases: rows
          .filter((r) => r.disease_detail_id)
          .map((r) => ({
            disease_detail_id: r.disease_detail_id,
            disease_id: r.disease_id,
            disease_name: r.disease_name,
            severity: r.severity,
            note: r.disease_note,
          })),

        // ⭐ Gom nhiều thuốc vào danh sách
        prescriptions: rows
          .filter((r) => r.prescription_detail_id)
          .map((r) => ({
            prescription_detail_id: r.prescription_detail_id,
            medicine_name: r.medicine_name,
            unit: r.medicine_unit,
            price: r.medicine_price,
            quantity: r.quantity,
            usage_method_name: r.usage_method_name,
            batch_code: r.batch_code,
            batch_id: r.batch_id,
            total: r.quantity * r.medicine_price,
          })),
      };

      const prescriptionMap = {};

      rows.forEach((r) => {
        if (!r.prescription_detail_id) return;

        const key = r.medicine_id;

        if (!prescriptionMap[key]) {
          prescriptionMap[key] = {
            medicine_id: r.medicine_id,
            medicine_name: r.medicine_name,
            unit: r.medicine_unit,
            usage_method_name: r.usage_method_name,
            price: r.medicine_price,
            quantity: 0,
            total: 0,
          };
        }

        prescriptionMap[key].quantity += r.quantity;
        prescriptionMap[key].total += r.quantity * r.medicine_price;
      });

      const prescriptions = Object.values(prescriptionMap);

      invoice.kethuoc = prescriptions;

      console.log("Fetch invoice data: ".invoice);

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching invoice",
      });
    }
  }
);

router.get(
  "/basic/:id",
  [authenticateToken, authorizeRoles("receptionist", "admin")],
  async (req, res) => {
    try {
      const { id } = req.params;

      const sql = `
        SELECT
          i.invoice_id,
          i.medical_record_id,
          i.consultation_fee,
          i.medicine_fee,
          i.total_amount,
          u.full_name as creator,
          i.invoice_code, 
          i.payment_status,
          mr.created_at AS exam_date,
          p.full_name AS patient_name,
          p.phone AS patient_phone,
          p.address AS patient_address,
          p.patient_id, 
          da.appointment_date, 
          mr.status,
          i.created_at as invoice_date

        FROM invoices i
        JOIN medical_records mr 
          ON mr.medical_record_id = i.medical_record_id
        
        JOIN daily_appointments da 
          ON da.medical_record_id = mr.medical_record_id
        
        JOIN patients p 
          ON p.patient_id = da.patient_id
        
          JOIN users u 
        ON u.user_id = i.created_by_id
        WHERE i.invoice_id = $1
      `;

      const { rows } = await pool.query(sql, [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      return res.json({
        success: true,
        data: rows[0],
      });
    } catch (error) {
      console.error("Error fetching basic invoice:", error);
      return res.status(500).json({
        success: false,
        message: "Server error fetching invoice",
      });
    }
  }
);

router.get('/by-medical-record/:id', 
  [authenticateToken, authorizeRoles("receptionist", "admin")],
  async (req, res) => {
    const { id } = req.params; 
    const result = await pool.query(
      `SELECT * FROM invoices WHERE medical_record_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({
      data: result.rows[0],  // <-- chỉ trả 1 hóa đơn đầu tiên
      success: true,
      message: "Fetched Invoice successfully",
    });
});

router.put(
  "/:id/pay",
  [authenticateToken, authorizeRoles("receptionist", "admin")],
  async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invoice ID phải là số hợp lệ" });
    }

    try {
      const existingInvoice = await pool.query(
        "SELECT invoice_id, payment_status, daily_appointment_id FROM invoices WHERE invoice_id = $1",
        [id]
      );

      if (existingInvoice.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Invoice not found" });
      }

      if (existingInvoice.rows[0].payment_status === "paid") {
        return res.status(400).json({ success: false, message: "Invoice is already paid" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Update invoice
        await client.query(
          "UPDATE invoices SET payment_status=$1, updated_at=CURRENT_TIMESTAMP WHERE invoice_id=$2",
          ["paid", id]
        );

        // Update daily appointment nếu có
        const dailyAppointmentId = existingInvoice.rows[0].daily_appointment_id;
        if (dailyAppointmentId) {
          await client.query(
            "UPDATE daily_appointments SET status='completed', updated_at=CURRENT_TIMESTAMP WHERE daily_appointment_id=$1",
            [dailyAppointmentId]
          );
        }

        await client.query("COMMIT");

        res.json({ success: true, message: "Payment confirmed successfully" });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Transaction error:", err);
        res.status(500).json({ success: false, message: "Transaction failed" });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Confirm payment error:", err);
      res.status(500).json({ success: false, message: "Server error while confirming payment" });
    }
  }
);
router.get(
  "/",
  [authenticateToken, authorizeRoles("receptionist", "admin")],
  async (req, res) => {
    try {
      const {
        patient_id,
        payment_status,
        start_date,
        end_date,
        page = 1,
        limit = 10,
        search // ← thêm search param
      } = req.query;

      const offset = (page - 1) * limit;

      // === Base query chung cho main + count ===
      let baseQuery = `
      FROM invoices i
      JOIN medical_records mr ON mr.medical_record_id = i.medical_record_id
      JOIN daily_appointments da ON da.medical_record_id = mr.medical_record_id
      JOIN patients p ON da.patient_id = p.patient_id
      WHERE 1=1
    `;
      let queryParams = [];
      let paramCount = 0;

      if (patient_id) {
        paramCount++;
        baseQuery += ` AND da.patient_id = $${paramCount}`;
        queryParams.push(patient_id);
      }

      if (payment_status) {
        paramCount++;
        baseQuery += ` AND i.payment_status = $${paramCount}`;
        queryParams.push(payment_status);
      }

      if (start_date) {
        paramCount++;
        baseQuery += ` AND DATE(i.created_at) >= $${paramCount}`;
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        baseQuery += ` AND DATE(i.created_at) <= $${paramCount}`;
        queryParams.push(end_date);
      }

      // === THÊM SEARCH ===
      if (search && search.trim() !== "") {
        paramCount++;
        baseQuery += ` AND (
          LOWER(p.full_name) LIKE LOWER($${paramCount}) OR
          LOWER(i.invoice_code) LIKE LOWER($${paramCount})
        )`;
        queryParams.push(`%${search.trim()}%`);
      }

      // === Main query ===
      const mainQuery = `
      SELECT 
        i.invoice_id,
        p.patient_id,
        p.full_name AS patient_name,
        p.phone,
        i.consultation_fee,
        i.medicine_fee,
        i.total_amount,
        i.payment_status,
        i.created_at, 
        i.invoice_code
      ${baseQuery}
      ORDER BY i.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
      const mainParams = [...queryParams, parseInt(limit), offset];
      const result = await pool.query(mainQuery, mainParams);

      // === Count query ===
      const countQuery = `SELECT COUNT(*) ${baseQuery}`;
      const countParams = queryParams; // chỉ lấy filter, không cần limit/offset
      const countResult = await pool.query(countQuery, countParams);
      const totalItems = parseInt(countResult.rows[0].count);

      // === Response ===
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching invoices",
      });
    }
  }
);

/// Delete Invoice pending implementation
router.delete(
  "/:id",
  [authenticateToken, authorizeRoles("admin", 'receptionist')],
  async (req, res) => {
    const { id } = req.params;
    try {
      const existingInvoice = await pool.query(
        "SELECT invoice_id, payment_status FROM invoices WHERE invoice_id = $1",
        [id]
      );
      if (existingInvoice.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Invoice not found" });
      }
      if (existingInvoice.rows[0].payment_status === "paid") {
        return res.status(400).json({ success: false, message: "Cannot delete a paid invoice" });
      }

      await pool.query("DELETE FROM invoices WHERE invoice_id = $1", [id]);
      return res.json({ success: true, message: "Invoice deleted successfully" });
      
    }
    catch (error) {
      console.error("Delete invoice error:", error);
      return res.status(500).json({ success: false, message: "Server error while deleting invoice" });
    }
  }
);

module.exports = router;
