const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

/**
 * ============================
 *  GET /api/medicines
 *  Get all medicines (with pagination, search, and filter by active)
 * ============================
 */
/* router.get("/", authenticateToken, async (req, res) => {
  try {
    // 1. Lấy query params với giá trị mặc định
    const {
      search,
      page = 1,
      limit = 10,
      active_only = "true",
      filterStatus,
      onset = false,
      mr_id,
      unit_id,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    console.log("status:", filterStatus);

    const activeOnly = active_only === "true";
const onsetFlag = onset === "true";


    // 2. Xử lý filterStatus từ client (nếu có)
    let selectedStatus = [];
    if (filterStatus && typeof filterStatus === "object") {
      selectedStatus = Object.keys(filterStatus).filter(
        (key) => filterStatus[key] === "true" || filterStatus[key] === true
      );
    }

    // 3. Build SQL query động
    let query = `
      SELECT m.medicine_id, m.medicine_name, m.stock_quantity, m.min_stock_level, m.note,
             m.unit_id, u.unit_name AS unit_name, m.is_active, m.status, m.created_at, m.updated_at
      FROM medicines m
      LEFT JOIN units u ON m.unit_id = u.unit_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // 3a. Filter theo status
    if (selectedStatus.length > 0) {
      const placeholders = selectedStatus
        .map(() => `$${paramIndex++}`)
        .join(", ");
      query += ` AND m.status IN (${placeholders})`;
      params.push(...selectedStatus);
    }

    // 3a2. Filter theo unit_id
    if (unit_id) {
      query += ` AND m.unit_id = $${paramIndex++}`;
      params.push(parseInt(unit_id));
    }

    // 3b. Filter active_only
    if (activeOnly && onsetFlag) {
  query += ` AND m.is_active = $${paramIndex++}`;
  params.push(true);
}

    // 3c. Search fuzzy match
    if (search) {
      query += ` AND (m.medicine_name ILIKE '%' || $${paramIndex} || '%' OR m.medicine_name % $${
        paramIndex + 1
      })`;
      params.push(search, search);
      query += ` ORDER BY similarity(m.medicine_name, $${paramIndex + 1}) DESC`;
      paramIndex += 2;
    } else {
      query += ` ORDER BY m.medicine_name ASC`;
    }

    // 3d. Pagination
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limitNum, offset);

    // 4. Thực hiện query
    const result = await pool.query(query, params);

    // 5. Count total cho pagination
    let countQuery = "SELECT COUNT(*) FROM medicines WHERE 1=1";
    const countParams = [];
    let countIndex = 1;

    if (selectedStatus.length > 0) {
      const placeholders = selectedStatus
        .map(() => `$${countIndex++}`)
        .join(", ");
      countQuery += ` AND status IN (${placeholders})`;
      countParams.push(...selectedStatus);
    }

    if (unit_id) {
      countQuery += ` AND unit_id = $${countIndex++}`;
      countParams.push(parseInt(unit_id));
    }

    if (active_only === "true") {
      countQuery += ` AND is_active = $${countIndex++}`;
      countParams.push(true);
    }

    if (search) {
      countQuery += ` AND medicine_name % $${countIndex++}`;
      countParams.push(search);
    }

    const total = parseInt(
      (await pool.query(countQuery, countParams)).rows[0].count
    );

    // 6. Trả dữ liệu
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (err) {
    console.error("Get medicines error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching medicines",
    });
  }
});
 */



router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      active_only = "true",
      filterStatus,
      onset = "false", // Sửa default thành string
      unit_id,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const activeOnly = active_only === "true";
    const onsetFlag = onset === "true";

    console.log("Filters:", { activeOnly, onsetFlag, filterStatus, unit_id });

    // Xử lý filterStatus
    let selectedStatus = [];
    if (filterStatus && typeof filterStatus === "object") {
      selectedStatus = Object.keys(filterStatus).filter(
        (key) => filterStatus[key] === "true" || filterStatus[key] === true
      );
    }

    // Build main query
    let query = `
      SELECT m.medicine_id, m.medicine_name, m.stock_quantity, m.min_stock_level, 
             m.note, m.unit_id, u.unit_name AS unit_name, m.is_active, m.status, 
             m.created_at, m.updated_at
      FROM medicines m
      LEFT JOIN units u ON m.unit_id = u.unit_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter theo status
    if (selectedStatus.length > 0) {
      const placeholders = selectedStatus.map(() => `$${paramIndex++}`).join(", ");
      query += ` AND m.status IN (${placeholders})`;
      params.push(...selectedStatus);
    }

    // Filter theo unit_id
    if (unit_id) {
      query += ` AND m.unit_id = $${paramIndex++}`;
      params.push(parseInt(unit_id));
    }

    // Filter is_active - SỬA Ở ĐÂY
    // Nếu activeOnly = true thì chỉ lấy active, không cần kiểm tra onset
    if (activeOnly) {
      query += ` AND m.is_active = $${paramIndex++}`;
      params.push(true);
    }

    // Search fuzzy match
    if (search) {
      query += ` AND (m.medicine_name ILIKE $${paramIndex} OR m.medicine_name % $${paramIndex + 1})`;
      params.push(`%${search}%`, search);
      query += ` ORDER BY similarity(m.medicine_name, $${paramIndex + 1}) DESC`;
      paramIndex += 2;
    } else {
      query += ` ORDER BY m.medicine_name ASC`;
    }

    // Pagination
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limitNum, offset);

    console.log("Query:", query);
    console.log("Params:", params);

    const result = await pool.query(query, params);

    // Count query - PHẢI KHỚP VỚI MAIN QUERY
    let countQuery = "SELECT COUNT(*) FROM medicines m WHERE 1=1";
    const countParams = [];
    let countIndex = 1;

    if (selectedStatus.length > 0) {
      const placeholders = selectedStatus.map(() => `$${countIndex++}`).join(", ");
      countQuery += ` AND m.status IN (${placeholders})`;
      countParams.push(...selectedStatus);
    }

    if (unit_id) {
      countQuery += ` AND m.unit_id = $${countIndex++}`;
      countParams.push(parseInt(unit_id));
    }

    // SỬA: Phải giống main query
    if (activeOnly) {
      countQuery += ` AND m.is_active = $${countIndex++}`;
      countParams.push(true);
    }

    if (search) {
      countQuery += ` AND (m.medicine_name ILIKE $${countIndex} OR m.medicine_name % $${countIndex + 1})`;
      countParams.push(`%${search}%`, search);
      countIndex += 2;
    }

    const total = parseInt((await pool.query(countQuery, countParams)).rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (err) {
    console.error("Get medicines error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching medicines",
    });
  }
});

/// Fetch Thuốc dựa theo phiếu nhập thuốc /api/available-medicines
//  Lấy danh sách thuốc khả dụng (ưu tiên lô cũ nhất còn hàng)
router.get("/available-medicines", authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10, active_only = "true" } = req.query;
    const offset = (page - 1) * limit;

    //  Query chính dùng CTE để phân biệt batch cũ nhất
    let query = `
      WITH ranked_medicines AS (
        SELECT 
          m.id,
          m.name,
          m.description,
          m.unit_id,
          u.name AS unit_name,
          m.is_active,
          b.id AS batch_id,
          b.quantity AS batch_quantity,
          b.remaining_quantity,
          b.unit_price,
          ir.receipt_date,
          --  Xếp hạng các batch theo ưu tiên này hết hạn,  ngày nhập
          ROW_NUMBER() OVER (PARTITION BY m.id ORDER BY b.expiry_date ASC NULLS LAST, ir.receipt_date ASC) AS row_num,
          --  Tổng tồn kho của thuốc (gộp mọi batch)
          COALESCE(SUM(b.remaining_quantity) OVER (PARTITION BY m.id), 0) AS total_stock,
          --  Gợi ý giá bán = giá nhập * 1.2 (lãi 20%)
          ROUND(b.unit_price * 1.2, 0) AS suggested_price
        FROM medicines m
        LEFT JOIN units u ON m.unit_id = u.id
        LEFT JOIN batches b ON b.medicine_id = m.id
        LEFT JOIN import_receipts ir ON ir.id = b.import_receipt_id
        WHERE b.remaining_quantity > 0
      )
      SELECT *
      FROM ranked_medicines
      WHERE row_num = 1
    `;

    const params = [];

    //  Lọc theo trạng thái hoạt động
    if (active_only === "true") {
      params.push(true);
      query += ` AND is_active = $${params.length}`;
    }

    //  Tìm kiếm theo tên thuốc
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    //  Phân trang
    params.push(limit, offset);
    query += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${
      params.length
    }`;

    //  Thực thi
    const result = await pool.query(query, params);

    //  Đếm tổng thuốc
    let countQuery = `
      SELECT COUNT(DISTINCT m.id)
      FROM medicines m
      LEFT JOIN batches b ON b.medicine_id = m.id
      WHERE b.remaining_quantity > 0
    `;
    const countParams = [];
    if (active_only === "true") {
      countParams.push(true);
      countQuery += ` AND m.is_active = $${countParams.length}`;
    }
    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND m.name ILIKE $${countParams.length}`;
    }

    const total = parseInt(
      (await pool.query(countQuery, countParams)).rows[0].count
    );

    //  Kết quả trả về
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Get available medicines error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching medicines",
    });
  }
});


router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mr_id } = req.query;

    console.log('Co lay duoc mr_id o BE ko: ', 'id ne: ', id , mr_id)

    //  Lấy thông tin thuốc + batches
    const result = await pool.query(
      `
      SELECT 
        m.medicine_id,
        m.medicine_name,
        m.unit_id,
        u.unit_name AS unit_name,
        m.is_active,
        m.status,
        m.stock_quantity,
        m.created_at,
        m.updated_at,
        m.min_stock_level,

        COALESCE(SUM(b.remaining_quantity), 0) AS total_quantity,

        COALESCE(
          json_agg(
            json_build_object(
              'batch_id', b.batch_id,
              'batch_code', b.batch_code,
              'import_date', ir.receipt_date,
              'remaining_quantity', b.remaining_quantity,
              'expiry_date', b.expiry_date,
              'import_receipt_id', b.import_receipt_id,
              'import_price', b.unit_price,
              'notes', b.note,
              'initial_quantity', b.quantity
            )
            ORDER BY b.batch_id
          ) FILTER (WHERE b.batch_id IS NOT NULL),
          '[]'
        ) AS batches

      FROM medicines m
      LEFT JOIN units u ON m.unit_id = u.unit_id
      LEFT JOIN batches b ON m.medicine_id = b.medicine_id
      LEFT JOIN import_receipts ir ON b.import_receipt_id = ir.import_receipt_id
      AND ir.status = 'confirmed'
      WHERE m.medicine_id = $1 

      GROUP BY m.medicine_id, u.unit_name
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    let medicine = result.rows[0];

    //  Không có MR → trả về luôn
    if (!mr_id) {
      return res.json({ success: true, data: medicine });
    }

    // Lấy các batch đã dùng trong MR
    const usedRes = await pool.query(
      `
      SELECT batch_id, quantity 
      FROM prescription_detail
      WHERE medical_record_id = $1 AND medicine_id = $2
      `,
      [mr_id, id]
    );

    const usedMap = {};
    usedRes.rows.forEach(r => {
      usedMap[r.batch_id] = (usedMap[r.batch_id] || 0) + r.quantity;
    });

    // Cộng dồn vào remaining_quantity
    medicine.batches = medicine.batches.map(b => {
      const used = usedMap[b.batch_id] || 0;
      return {
        ...b,
        remaining_quantity: Number(b.remaining_quantity) + Number(used)
      };
    });

    return res.json({
      success: true,
      data: medicine
    });

  } catch (err) {
    console.error("Get medicine error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching medicine",
    });
  }
});


router.post(
  "/",
  [
    authenticateToken,
    authorizeRoles("admin"),
    body("medicine_name").notEmpty().withMessage("Medicine name is required"),
    body("unit_id").notEmpty().withMessage("Unit is required"),
    body("min_stock_level")
      .notEmpty()
      .withMessage("Minimum stock level is required"),
    body("is_active").notEmpty().withMessage("is_active is required"),
    body("note").optional(),
    //body('price').isFloat({ min: 0 }).withMessage('Price must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { medicine_name, unit_id, is_active, min_stock_level, note } =
        req.body;

      console.log("Create medicine: ", req.body);

      // Intitial Quantity
      const quantity = 0;

      // Check duplicate
      const exists = await pool.query(
        "SELECT unit_id FROM medicines WHERE LOWER(medicine_name) = LOWER($1) AND unit_id = $2",
        [medicine_name.trim(), unit_id]
      );

      if (exists.rows.length > 0)
        return res.status(409).json({
          success: false,
          message: "Thuốc này và đơn vị tương ứng đã tồn tại.",
        });

      let status = "";
      if (is_active !== true) {
        status = "inactive";
      } else if (min_stock_level > quantity) {
        status = "low_stock";
      } else if (quantity <= 0) {
        status = "out_of_stock";
      } else if (quantity < min_stock_level) {
        status = "low_stock";
      } else {
        status = "active";
      }

      const result = await pool.query(
        `INSERT INTO medicines (medicine_name, unit_id, min_stock_level, stock_quantity, is_active, status, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          medicine_name,
          unit_id,
          min_stock_level,
          quantity,
          is_active,
          status,
          note,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Medicine created",
        data: result.rows[0],
      });
    } catch (err) {
      console.error("Create medicine error:", err);
      res.status(500).json({
        success: false,
        message: "Server error while creating medicine",
      });
    }
  }
);

/**
 * ============================
 *  PUT /api/medicines/:id
 *  Update medicine
 * ============================
 */
router.put(
  "/:id",
  [
    authenticateToken,
    authorizeRoles("admin"),
    body("medicine_name").optional().notEmpty(),
    body("unit_id").optional().notEmpty(),
    body("is_active").optional().isBoolean(),
    body("min_stock_level").optional().isInt({ min: 0 }),
    body("quantity").optional().isInt({ min: 0 }),
    body("status").optional().notEmpty(),
    body('note').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const {
        medicine_name,
        unit_id,
        is_active,
        quantity,
        min_stock_level,
        status,
        note
      } = req.body;

      // Convert is_active "true"/"false" string → boolean
      const isActiveBool =
        typeof is_active === "string" ? is_active === "true" : is_active;

      // Check medicine
      const check = await pool.query(
        "SELECT * FROM medicines WHERE medicine_id = $1",
        [id]
      );

      if (check.rows.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Medicine not found" });

      const current = check.rows[0];

      // Check duplicate only if name+unit bị thay đổi
      if (medicine_name && unit_id) {
        const duplicate = await pool.query(
          "SELECT 1 FROM medicines WHERE LOWER(medicine_name) = $1 AND unit_id = $2 AND medicine_id != $3",
          [medicine_name.trim().toLowerCase(), unit_id, id]
        );

        if (duplicate.rows.length > 0)
          return res
            .status(409)
            .json({
              success: false,
              message: "Tên thuốc và đơn vị này đã tồn tại",
            });
      }

      // Determine new stock quantity
      const newQuantity = quantity ?? current.stock_quantity;
      const newMinStock = min_stock_level ?? current.min_stock_level;
      let newStatus = "active";
      if (status == null) {
        // Compute new status

        if (!isActiveBool) {
          newStatus = "inactive";
        } else if (newQuantity <= newMinStock) {
          newStatus = "low_stock";
        } else if (newQuantity <= 0) {
          newStatus = "out_of_stock";
        }
      }

      // Update
      const result = await pool.query(
        `UPDATE medicines
         SET medicine_name = COALESCE($1, medicine_name),
             unit_id = COALESCE($2, unit_id),
             is_active = COALESCE($3, is_active),
             min_stock_level = COALESCE($4, min_stock_level),
             stock_quantity = COALESCE($5, stock_quantity),
             status = $6,
             updated_at = CURRENT_TIMESTAMP, 
             note = COALESCE($8, note)
         WHERE medicine_id = $7
         RETURNING *`,
        [
          medicine_name,
          unit_id,
          isActiveBool,
          min_stock_level,
          quantity,
          status || newStatus,
          id,
          note
        ]
      );

      return res.json({
        success: true,
        message: "Medicine updated successfully",
        data: result.rows[0],
      });
    } catch (err) {
      console.error("Update medicine error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error while updating medicine",
      });
    }
  }
);

/**
 * ============================
 *  DELETE /api/medicines/:id
 *  Soft delete - only if no relations
 * ============================
 */
router.delete(
  "/:id",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { id } = req.params;

      // Kiểm tra thuốc tồn tại
      const medicineCheck = await pool.query(
        "SELECT medicine_id FROM medicines WHERE medicine_id = $1",
        [id]
      );

      if (medicineCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Medicine not found",
        });
      }

      //  Kiểm tra liên kết batch
      const batchCheck = await pool.query(
        "SELECT 1 FROM batches WHERE medicine_id = $1 LIMIT 1",
        [id]
      );

      if (batchCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Thuốc này đã được sử dụng trong hệ thống nên không thể xóa. Bạn có thể chuyển sang trạng thái Ngừng sử dụng.",
        });
      }

      //  Soft delete
      await pool.query(
        `
        UPDATE medicines
        SET is_active = false,
            status = 'inactive',
            updated_at = NOW()
        WHERE medicine_id = $1
        `,
        [id]
      );

      res.json({
        success: true,
        message: "Medicine deactivated successfully",
      });
    } catch (err) {
      console.error("Delete medicine error:", err);
      res.status(500).json({
        success: false,
        message: "Server error while deleting medicine",
      });
    }
  }
);


module.exports = router;
