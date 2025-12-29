const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// ======================= CREATE =======================
router.post(
  "/",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { supplier_name, receipt_date, user_id, batches, status, note } =
        req.body;
      console.log("USER ID: ", user_id, "status", status);

      // 2025-11-24 14:13

      if (!supplier_name || !receipt_date || !batches || batches.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin phiếu nhập hoặc danh sách thuốc",
        });
      }

      await client.query("BEGIN");

      const totalAmount = batches.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      // 1️ Tạo phiếu nhập
      const result = await client.query(
        `INSERT INTO import_receipts (supplier_name, receipt_date, user_id, total_amount, note, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING import_receipt_id`,
        [supplier_name, receipt_date, user_id, totalAmount, note, status]
      );

      // 2025-11-24 14:13
      const receiptId = result.rows[0].import_receipt_id;

      // 2 Tạo chi tiết các lô thuốc
      for (const b of batches) {
        console.log("Batch", b);
        await client.query(
          `INSERT INTO batches (medicine_id, import_receipt_id, batch_code, expiry_date, quantity, unit_price,  remaining_quantity, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            b.medicine_id,
            receiptId,
            b.batch_code,
            b.expiry_date,
            b.quantity,
            b.unit_price,
            b.quantity,
            b.note_batch,
          ]
        );
      }

      await client.query("COMMIT");
      res.json({
        success: true,
        message: "Thêm phiếu nhập thành công",
        receipt_id: receiptId,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Lỗi thêm phiếu nhập:", err);
      res
        .status(500)
        .json({ success: false, message: "Lỗi khi thêm phiếu nhập thuốc" });
    } finally {
      client.release();
    }
  }
);


router.get("/", authenticateToken, async (req, res) => {
  try {
    // Extract filter parameters from query string
    const {
      search,           // Tìm kiếm theo mã phiếu, nhà cung cấp, ghi chú
      status,           // Lọc theo trạng thái: draft, completed, cancelled
      supplier,         // Lọc theo nhà cung cấp
      created_by,       // Lọc theo người tạo (user_id)
      date_from,        // Lọc từ ngày
      date_to,          // Lọc đến ngày
      sort_by = 'receipt_date',  // Cột sort: receipt_date, created_at, total_amount
      sort_order = 'DESC',       // Thứ tự: ASC, DESC
      page = 1,         // Trang hiện tại
      limit = 20        // Số bản ghi/trang
    } = req.query;

    // Parse and validate pagination params
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    // Build WHERE clause dynamically
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Search filter (tìm kiếm mã phiếu, nhà cung cấp, ghi chú)
    if (search) {
      whereConditions.push(`(
        ir.import_receipt_id::text ILIKE $${paramIndex} OR 
        ir.supplier_name ILIKE $${paramIndex} OR 
        ir.note ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Status filter
    if (status) {
      whereConditions.push(`ir.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Supplier filter
    if (supplier) {
      whereConditions.push(`ir.supplier_name ILIKE $${paramIndex}`);
      queryParams.push(`%${supplier}%`);
      paramIndex++;
    }

    // Created by filter
    if (created_by) {
      whereConditions.push(`ir.user_id = $${paramIndex}`);
      queryParams.push(created_by);
      paramIndex++;
    }

    // Date range filter
    if (date_from) {
      whereConditions.push(`ir.receipt_date >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereConditions.push(`ir.receipt_date <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Validate sort_by to prevent SQL injection
    const allowedSortColumns = ['receipt_date', 'created_at', 'total_amount', 'receipt_id'];
    const validSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'receipt_date';
    const validSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Calculate pagination
    const offset = (pageNum - 1) * limitNum;

    // Count query for pagination (execute first to get total)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM import_receipts ir
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query with filters, sorting, and pagination
    const dataQuery = `
      SELECT 
        ir.import_receipt_id,
        ir.receipt_date,
        ir.supplier_name,
        ir.total_amount,
        ir.status,
        ir.note,
        ir.created_at,
        u.full_name AS created_by,
        u.user_id
      FROM import_receipts ir
      LEFT JOIN users u ON ir.user_id = u.user_id
      ${whereClause}
      ORDER BY ir.${validSortBy} ${validSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...queryParams, limitNum, offset];
    const dataResult = await pool.query(dataQuery, dataParams);

    // Response with pagination format
    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
      filters: {
        search: search || null,
        status: status || null,
        supplier: supplier || null,
        created_by: created_by || null,
        date_from: date_from || null,
        date_to: date_to || null,
        sort_by: validSortBy,
        sort_order: validSortOrder
      }
    });

  } catch (err) {
    console.error("Get import receipts error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching import receipts",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
// =========================
// GET ONE Import Receipt + batches
// =========================
// ======================= GET ONE + BATCHES =======================
router.get("/:id", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Tìm phiếu nhập theo import_receipt_id (CHỮ KHÓA CHÍNH)
    const receiptRes = await client.query(
      `SELECT ir.*, u.full_name AS created_by
       FROM import_receipts ir
       LEFT JOIN users u ON ir.user_id = u.user_id
       WHERE ir.import_receipt_id = $1`,
      [id]
    );

    if (receiptRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiếu nhập" });
    }

    const receipt = receiptRes.rows[0];

    // Lấy danh sách lô + tên thuốc + đơn vị
    const batchesRes = await client.query(
      `SELECT 
         b.*,
         m.medicine_name,
         m.medicine_id,
         u.unit_name, 
         b.note as note_batch
       FROM batches b
       LEFT JOIN medicines m ON b.medicine_id = m.medicine_id
       LEFT JOIN units u ON m.unit_id = u.unit_id
       WHERE b.import_receipt_id = $1
       ORDER BY b.created_at`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...receipt,
        items: batchesRes.rows, // tên field frontend đang dùng
      },
    });
  } catch (err) {
    console.error("Lỗi lấy chi tiết phiếu:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  } finally {
    client.release();
  }
});
// =========================
//  UPDATE Import Receipt
// =========================

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  body("supplier_name")
    .optional()
    .notEmpty()
    .withMessage("Nhà cung cấp không thể rỗng"),
  body("receipt_date").optional().isString().withMessage("Ngày không hợp lệ"),
  body("status").optional(),
  body("batches").optional().isArray(),

  async (req, res) => {
    const client = await pool.connect();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { supplier_name, receipt_date, status, batches } = req.body;

      console.log("Data: ", req.body);

      await client.query("BEGIN");

      //  Lấy phiếu nhập hiện tại
      const receiptRes = await client.query(
        `SELECT * FROM import_receipts WHERE import_receipt_id = $1`,
        [id]
      );

      if (receiptRes.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy phiếu nhập" });
      }

      const receipt = receiptRes.rows[0];

      // Cập nhật import_receipts
      const fields = [];
      const values = [];
      let idx = 1;

      if (supplier_name !== undefined) {
        fields.push(`supplier_name = $${idx}`);
        values.push(supplier_name);
        idx++;
      }

      if (receipt_date !== undefined) {
        fields.push(`receipt_date = $${idx}`);
        values.push(receipt_date);
        idx++;
      }

      if (status !== undefined) {
        fields.push(`status = $${idx}`);
        values.push(status);
        idx++;
      }

      if (fields.length > 0) {
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        const query = `UPDATE import_receipts SET ${fields.join(
          ", "
        )} WHERE import_receipt_id = $${idx}`;
        values.push(id);
        await client.query(query, values);
      }

      // Xử lý khi status thay đổi draft -> confirmed
      if (receipt.status === "draft" && status === "confirmed") {
        // Lấy các lô cũ
        const oldBatches = await client.query(
          `SELECT * FROM batches WHERE import_receipt_id = $1`,
          [id]
        );

        // Cộng tồn kho vào medicines
        for (const ob of oldBatches.rows) {
   /*        await client.query(
            `UPDATE medicines SET stock_quantity = COALESCE(stock_quantity,0) + $1 WHERE medicine_id = $2`,
            [ob.quantity, ob.medicine_id]
          );

          const result = await client.query(
            "SELECT * FROM medicines WHERE medicine_id = $1",
            [ob.medicine_id]
          );

          const row = result.rows[0];

          let status = "";
          if (row.is_active !== true) {
            status = "inactive";
          } else if (row.min_stock_level > row.quantity) {
            status = "low_stock";
          } else if (row.quantity <= 0) {
            status = "out_of_stock";
          } else if (row.quantity < row.min_stock_level) {
            status = "low_stock";
          } else {
            status = "active";
          } */

          await updateMedicineStockAndStatus(client, ob.medicine_id, ob.quantity);
        }
      }

      //  Xử lý batches: chỉ update khi phiếu đang là draft
      if (
        Array.isArray(batches) &&
        batches.length > 0 &&
        receipt.status === "draft"
      ) {
        // 3a. Lấy lô cũ
        const oldBatches = await client.query(
          `SELECT * FROM batches WHERE import_receipt_id = $1`,
          [id]
        );

        /*  // 3b. Trừ tồn kho cũ
        for (const ob of oldBatches.rows) {
          await client.query(
            `UPDATE medicines SET stock_quantity = COALESCE(stock_quantity,0) - $1 WHERE medicine_id = $2`,
            [ob.quantity, ob.medicine_id]
          );
        } */

        // 3c. Xóa lô cũ
        await client.query(`DELETE FROM batches WHERE import_receipt_id = $1`, [
          id,
        ]);

        // 3d. Thêm lô mới và cộng tồn kho
        let totalAmount = 0;
        for (const b of batches) {
          await client.query(
            `INSERT INTO batches (medicine_id, import_receipt_id, batch_code, expiry_date, quantity, unit_price, remaining_quantity, note)
             VALUES ($1, $2, $3, $4, $5, $6, $5, $7)`,
            [
              b.medicine_id,
              id,
              b.batch_code,
              b.expiry_date,
              b.quantity,
              b.unit_price,
              b.note_batch,
            ]
          );

          /*  await client.query(
            `UPDATE medicines SET stock_quantity = COALESCE(stock_quantity,0) + $1 WHERE medicine_id = $2`,
            [b.quantity, b.medicine_id]
          ); */

          totalAmount += b.quantity * b.unit_price;
        }

        // 3e. Update tổng tiền
        await client.query(
          `UPDATE import_receipts SET total_amount = $1 WHERE import_receipt_id = $2`,
          [totalAmount, id]
        );
      }

      /*  if (Array.isArray(batches) && batches.length > 0 && status ==='confirmed') */

      await client.query("COMMIT");
      res.json({
        success: true,
        message: "Import receipt updated successfully",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Update import receipt error:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error while updating import receipt",
        });
    } finally {
      client.release();
    }
  }
);


// Helper function để update stock và status của từng thuốc
async function updateMedicineStockAndStatus(client, medicineId, quantityChange = 0) {
  // Cập nhật tồn kho
  const result = await client.query(
    `UPDATE medicines
     SET stock_quantity = COALESCE(stock_quantity,0) + $1
     WHERE medicine_id = $2
     RETURNING stock_quantity, min_stock_level, is_active`,
    [quantityChange, medicineId]
  );

  const row = result.rows[0];
  if (!row) return;

  // Xác định trạng thái mới
  let status = "";
  if (!row.is_active) {
    status = "inactive";
  } else if (row.stock_quantity <= 0) {
    status = "out_of_stock";
  } else if (row.stock_quantity < row.min_stock_level) {
    status = "low_stock";
  } else {
    status = "active";
  }

  // Cập nhật status vào medicines
  await client.query(
    `UPDATE medicines SET status = $1 WHERE medicine_id = $2`,
    [status, medicineId]
  );
}


// =========================
// DELETE Import Receipt
// =========================
router.delete("/:id", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query("BEGIN");

    const check = await client.query(
      `SELECT status FROM import_receipts WHERE import_receipt_id = $1`,
      [id]
    );

    // Không tìm thấy phiếu
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Phiếu nhập không tồn tại.",
      });
    }

    // Không phải trạng thái draft
    if (check.rows[0].status.toLowerCase() !== "draft") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Không thể xóa phiếu nhập đã xác nhận.",
      });
    }

    // Xóa
    await client.query(
      `DELETE FROM import_receipts WHERE import_receipt_id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Xóa phiếu nhập thành công.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete import receipt error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting import receipt",
    });
  } finally {
    client.release();
  }
});

module.exports = router;
