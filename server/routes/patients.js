const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { Archive } = require("lucide-react");

const router = express.Router();

const validatePatient = [
  body("full_name").notEmpty().withMessage("Full name is required"),
  body("gender").isIn(["Nam", "Nữ"]).withMessage("Gender must be Nam or Nữ"),
  body("birth_year")
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage("Invalid birth year"),
  body("phone")
    .isLength({ min: 10, max: 11 })
    .withMessage("Phone number must be 10-11 digits"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

const mapping = {
  female: "Nữ",
  male: "Nam",
};
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      gender,
      isArchived,
      is_active,
    } = req.query;

    console.log('IS ARCHIVED: ', isArchived)

  
    const offset = (page - 1) * limit;
    // const isArchivedBool = isArchived === "true";


    //console.log('isArchiveBool: ', isArchivedBool)

    // ============================================
    // BUILD WHERE CLAUSE DYNAMICALLY
    // ============================================
    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;

      // --- FILTER: isArchived ---
    if (typeof isArchived !== "undefined") {
      whereClauses.push(`isArchived = $${paramIndex}`);
      queryParams.push(isArchived === "true");
      paramIndex++;
    }


    // --- FILTER: Gender ---
    if (gender) {
      const genderArray = Array.isArray(gender) ? gender : [gender];

      if (genderArray.length > 0) {
        const placeholders = genderArray
          .map(() => `$${paramIndex++}`)
          .join(", ");
        whereClauses.push(`gender IN (${placeholders})`);
        queryParams.push(...genderArray);
      }
    }

    // --- FILTER: Search ---
    if (search && search.trim()) {
      whereClauses.push(
        `(full_name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

   /*  // --- FILTER: isArchived ---
    whereClauses.push(`isArchived = $${paramIndex}`);
    queryParams.push(isArchivedBool);
    paramIndex++;
 */
    // Combine all WHERE clauses
    const whereClause =
      whereClauses.length > 0 ? whereClauses.join(" AND ") : "1=1";

    // ============================================
    // QUERY: GET PATIENTS WITH LATEST REVISIT DATE
    // ============================================
    const dataQuery = `
      SELECT DISTINCT ON (p.patient_id)
        p.patient_id,
        p.full_name,
        p.gender,
        p.date_of_birth,
        p.address,
        p.phone,
        p.email,
        p.created_at,
        mr.revisit_date, 
        p.isarchived
      FROM patients p
      LEFT JOIN daily_appointments da ON da.patient_id = p.patient_id
      LEFT JOIN medical_records mr ON mr.medical_record_id = da.medical_record_id
      WHERE ${whereClause}
      ORDER BY 
        p.patient_id,
        mr.revisit_date DESC NULLS LAST,
        p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...queryParams, parseInt(limit), offset];

    console.log("Data Query:", dataQuery);
    console.log("Data Params:", dataParams);

    const result = await pool.query(dataQuery, dataParams);

    // ============================================
    // QUERY: COUNT TOTAL ITEMS
    // ============================================
    const countQuery = `
      SELECT COUNT(DISTINCT p.patient_id) 
      FROM patients p
      WHERE ${whereClause}
    `;

    console.log("Count Query:", countQuery);
    console.log("Count Params:", queryParams);

    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count);

    // ============================================
    // MAP DATA TO RESPONSE FORMAT
    // ============================================
    const data = result.rows.map((row) => ({
      id: row.patient_id,
      patient_id: row.patient_id,
      full_name: row.full_name || "-",
      gender: row.gender || "-",
      date_of_birth: row.date_of_birth,
      phone: row.phone || "-",
      address: row.address || "-",
      email: row.email || "-",
      created_at: row.created_at,
      revisit_date: row.revisit_date || null,
      isArchived: row.isarchived,
    }));

    // ============================================
    // SEND RESPONSE
    // ============================================
    res.json({
      success: true,
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching patients",
      error: error.message,
    });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM patients WHERE patient_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get patient error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching patient",
    });
  }
});

router.post(
  "/",
  [
    authenticateToken,
    authorizeRoles("receptionist", "admin"),
    body("full_name").notEmpty().withMessage("Full name is required"),
    body("gender").isIn(["Nam", "Nữ"]).withMessage("Gender must be Nam or Nữ"),
    body("date_of_birth").notEmpty().withMessage("Invalid birth year"),
    body("phone")
      .isMobilePhone("vi-VN")
      .withMessage("Invalid phone number format"),
    body("email").optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Các trường nhập không hợp lệ",
          errors: errors.array(),
        });
      }

      const { full_name, gender, date_of_birth, address, phone, email } =
        req.body;

      const existingPatient = await pool.query(
        "SELECT patient_id FROM patients WHERE phone = $1",
        [phone]
      );

      if (existingPatient.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Số điện thoại này đã tồn tại",
        });
      }

      const result = await pool.query(
        `INSERT INTO patients (full_name, gender, date_of_birth, address, phone, email, isArchived)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [full_name, gender, date_of_birth, address, phone, email, false]
      );

      res.status(201).json({
        success: true,
        message: "Patient created successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Create patient error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while creating patient",
      });
    }
  }
);

/// ---------------- Update ---------------- ////
router.put(
  "/:id",
  [
    authenticateToken,
    authorizeRoles("receptionist", "doctor", "admin"),
    body("full_name").optional().notEmpty(),
    body("gender").optional().isIn(["Nam", "Nữ"]),
    body("date_of_birth").optional().isISO8601(),
    body("address").optional().isString(),
    body("phone_number").optional().isMobilePhone("vi-VN"),
    body("email").optional(),
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { full_name, gender, date_of_birth, address, phone_number, email } =
        req.body;

      console.log("Date updated: ", phone_number, full_name);

      // Check patient exists
      const checkPatient = await pool.query(
        "SELECT * FROM patients WHERE patient_id = $1",
        [id]
      );

      if (checkPatient.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Check duplicate phone
      if (phone_number) {
        const phoneExists = await pool.query(
          "SELECT patient_id FROM patients WHERE phone = $1 AND patient_id != $2",
          [phone_number, id]
        );

        if (phoneExists.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Số điện thoại này đã tồn tại",
          });
        }
      }

      // Update query
      const result = await pool.query(
        `
        UPDATE patients
        SET 
          full_name = COALESCE($1, full_name),
          gender = COALESCE($2, gender),
          date_of_birth = COALESCE($3, date_of_birth),
          address = COALESCE($4, address),
          phone = COALESCE($5, phone), 
          email= COALESCE($7, email)
        WHERE patient_id = $6
        RETURNING *;
      `,
        [
          full_name || null,
          gender || null,
          date_of_birth || null,
          address || null,
          phone_number || null,
          id,
          email,
        ]
      );

      res.json({
        success: true,
        message: "Patient updated successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Update patient error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating patient",
      });
    }
  }
);

router.get(
  "/:id/medical-history",
  [authenticateToken /* authorizeRoles("doctor", "admin") */],
  async (req, res) => {
    try {
      const { id } = req.params; // patient_id

      let patient = "";

      console.log("IDDDDD: ", id);

      // Lấy danh sách hồ sơ của bệnh nhân
      const recordsQuery = `
        SELECT 
          mr.medical_record_id,
          da.patient_id,
          mr.symptoms,
          mr.status,
          mr.created_at,
          u.full_name AS doctor_name, 
          p.full_name as patient_name
        FROM medical_records mr
        LEFT JOIN users u ON u.user_id = mr.doctor_id
        LEFT JOIN daily_appointments da ON da.medical_record_id = mr.medical_record_id
        LEFT JOIN patients p ON p.patient_id = da.patient_id
        WHERE da.patient_id = $1
        ORDER BY mr.created_at DESC
      `;
      const { rows: records } = await pool.query(recordsQuery, [id]);

      if (records.length === 0) {
        return res.json({ success: true, data: [] });
      }

      patient = records[0].patient_name;

      // Lấy toàn bộ disease_details theo danh sách MR
      const mrIds = records.map((r) => r.medical_record_id);

      const diseasesQuery = `
        SELECT 
          dd.medical_record_id,
          dd.disease_detail_id,
          d.disease_id,
          d.disease_name,
          dd.severity,
          dd.note AS disease_note
        FROM disease_details dd
        LEFT JOIN diseases d ON d.disease_id = dd.disease_id
        WHERE dd.medical_record_id = ANY($1)
      `;
      const { rows: diseaseDetails } = await pool.query(diseasesQuery, [mrIds]);

      // Gom bệnh theo MR
      const diseaseMap = {};
      diseaseDetails.forEach((d) => {
        if (!diseaseMap[d.medical_record_id]) {
          diseaseMap[d.medical_record_id] = [];
        }
        diseaseMap[d.medical_record_id].push(d);
      });

      // Lấy danh sách thuốc cho tất cả MR
      const prescriptionsQuery = `
        SELECT 
          pd.medical_record_id,
          pd.quantity,
          m.medicine_name,
          u.unit_name AS unit,
          um.usage_method_name AS usage_method
        FROM prescription_detail pd
        LEFT JOIN medicines m ON m.medicine_id = pd.medicine_id
        LEFT JOIN units u ON u.unit_id = m.unit_id
        LEFT JOIN usage_methods um ON um.usage_method_id = pd.usage_method_id
        WHERE pd.medical_record_id = ANY($1)
      `;
      const { rows: prescriptions } = await pool.query(prescriptionsQuery, [
        mrIds,
      ]);

      // Gom đơn thuốc theo MR
      const presMap = {};
      prescriptions.forEach((p) => {
        if (!presMap[p.medical_record_id]) {
          presMap[p.medical_record_id] = [];
        }
        presMap[p.medical_record_id].push(p);
      });

      // Gắn lại vào records
      const finalRecords = records.map((r) => ({
        ...r,
        diseases: diseaseMap[r.medical_record_id] || [],
        prescriptions: presMap[r.medical_record_id] || [],
      }));

      return res.json({
        success: true,
        data: {
          patient_name: patient,
          histories: finalRecords,
        },
      });
    } catch (error) {
      console.error("Get medical history error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching medical history",
      });
    }
  }
);

router.get(
  "/:id/relations",
  authenticateToken,
  /*  authorizeRoles(['admin']), */
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log("Xoa benh nhan: ", id);

      const result = await pool.query(
        `SELECT EXISTS (
            SELECT 1 FROM daily_appointments WHERE patient_id = $1
        ) AS is_linked;`,
        [id]
      );

      const isLinked = result.rows[0].is_linked;

      return res.json({
        success: true,
        message: "Checked successfully",
        linked: isLinked,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.put("/archive/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existingPatient = await pool.query(
      "SELECT patient_id FROM patients WHERE patient_id = $1",
      [id]
    );

    if (existingPatient.rows.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Bệnh nhân này không tồn tại.",
      });
    }

    const result = await pool.query(
      `UPDATE patients
        SET isArchived = 'true' 
        WHERE patient_id = $1
        `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Lưu trữ bệnh nhân thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.delete(
  "/:id",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log("Delete patient ID: ", id);
      const check = await pool.query(
        "SELECT patient_id FROM patients WHERE patient_id = $1",
        [id]
      );
      if (check.rows.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });

      // Check ton tai
      const is_link = await pool.query(
        `SELECT EXISTS (
            SELECT 1 FROM daily_appointments WHERE patient_id = $1
        ) AS is_linked;`,
        [id]
      );

      const is_linked = is_link.rows[0].is_linked;

      if (is_linked) {
        return res.status(400).json({
          success: false,
          message: "Bệnh nhân này đã được liên kết",
        });
      }

      await pool.query("DELETE FROM patients WHERE patient_id = $1", [id]);

      res.json({ success: true, message: "Patient deleted successfully" });
    } catch (err) {
      console.error("Delete patient error:", err);
      res.status(500).json({
        success: false,
        message: "Server error while deleting patient",
      });
    }
  }
);
router.put(
  "/unArchive/:id",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isArchived } = req.body;

      // Kiểm tra patient tồn tại
      const check = await pool.query(
        `SELECT * FROM patients WHERE patient_id = $1`,
        [id]
      );

      if (check.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      }

      // Cập nhật trạng thái bỏ lưu trữ
      await pool.query(
        `UPDATE patients SET isarchived = $1 WHERE patient_id = $2`,
        [isArchived, id]
      );

      res.json({ success: true, message: "Patient unarchived successfully" });
    } catch (err) {
      console.error("Unarchive patient error:", err);
      res.status(500).json({
        success: false,
        message: "Server error while unarchiving patient",
      });
    }
  }
);

module.exports = router;
