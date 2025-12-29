const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      active_only,
      from_date,
      to_date,
      sort_by = "disease_name",
      sort_order = "asc",
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT disease_id, disease_name, description, created_at, is_active
      FROM diseases
      WHERE 1=1
    `;

    let params = [];
    let idx = 0;

    // SEARCH ADVANCED (không dấu + nhiều trường)
    if (search) {
      idx++;
      query += ` AND (
        unaccent(disease_name) ILIKE unaccent($${idx})
        OR unaccent(description) ILIKE unaccent($${idx})
      )`;
      params.push(`%${search}%`);
    }

    // FILTER: ACTIVE ONLY
    if (active_only === "true") {
      idx++;
      query += ` AND is_active = $${idx}`;
      params.push(true);
    } else if (active_only === "false") {
      idx++;
      query += ` AND is_active = $${idx}`;
      params.push(false);
    }

    // FILTER: DATE RANGE
    if (from_date) {
      idx++;
      query += ` AND created_at >= $${idx}`;
      params.push(from_date);
    }

    if (to_date) {
      idx++;
      query += ` AND created_at <= $${idx}`;
      params.push(to_date);
    }

    // SORTING (SAFE)
    const validSort = ["disease_name", "created_at"];
    const validOrder = ["asc", "desc"];

    const sortField = validSort.includes(sort_by) ? sort_by : "disease_name";
    const order = validOrder.includes(sort_order.toLowerCase())
      ? sort_order
      : "asc";

    query += ` ORDER BY ${sortField} ${order} `;

    // PAGINATION
    idx++;
    query += ` LIMIT $${idx}`;
    params.push(parseInt(limit));

    idx++;
    query += ` OFFSET $${idx}`;
    params.push(offset);

    // RUN MAIN QUERY
    const result = await pool.query(query, params);

    // COUNT QUERY
    let countQuery = `
      SELECT COUNT(*) FROM diseases WHERE 1=1
    `;
    let countParams = [];
    let cIdx = 0;

    if (search) {
      cIdx++;
      countQuery += ` AND (
        unaccent(disease_name) ILIKE unaccent($${cIdx})
        OR unaccent(description) ILIKE unaccent($${cIdx})
      )`;
      countParams.push(`%${search}%`);
    }

    if (active_only === "true") {
      cIdx++;
      countQuery += ` AND is_active = $${cIdx}`;
      countParams.push(true);
    } else if (active_only === "false") {
      cIdx++;
      countQuery += ` AND is_active = $${cIdx}`;
      countParams.push(false);
    }

    if (from_date) {
      cIdx++;
      countQuery += ` AND created_at >= $${cIdx}`;
      countParams.push(from_date);
    }

    if (to_date) {
      cIdx++;
      countQuery += ` AND created_at <= $${cIdx}`;
      countParams.push(to_date);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

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
  } catch (error) {
    console.error("Get diseases error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching diseases",
    });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM diseases WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Disease not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get disease error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching disease",
    });
  }
});

router.post(
  "/",
  [
    authenticateToken,
    authorizeRoles("admin", 'doctor'),
    body("disease_name").notEmpty().withMessage("Disease name is required"),
    body("description").optional().isString(),
    body("is_active"),
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

      const { disease_name, description, is_active } = req.body;

      console.log("Data Import Disease:", {
        disease_name,
        description,
        is_active,
      });

      // Check if disease already exists
      const existingDisease = await pool.query(
        "SELECT disease_id FROM diseases WHERE disease_name = $1",
        [disease_name]
      );

      if (existingDisease.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Disease with this name already exists",
        });
      }

      // Simple insert without ON CONFLICT
      const result = await pool.query(
        `INSERT INTO diseases (disease_name, description, is_active)
        VALUES ($1, $2, $3)
        RETURNING *;`,
        [disease_name, description, is_active]
      );

      res.status(201).json({
        success: true,
        message: "Disease created successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Create disease error:", error);

      // Handle duplicate key error if it somehow occurs
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          message: "Disease with this name already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error while creating disease",
      });
    }
  }
);

router.put(
  "/:id",
  [
    authenticateToken,
    authorizeRoles("admin", 'doctor'),
    body("disease_name")
      .optional()
      .notEmpty()
      .withMessage("Disease name cannot be empty"),
    body("description").optional().isString(),
    body("is_active").optional().isBoolean(),
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
      const { disease_name, description, is_active } = req.body;

      console.log("Update Disease ID: ", id, { disease_name, description, is_active });

      // Check existing
      const existingDisease = await pool.query(
        "SELECT disease_id FROM diseases WHERE disease_id = $1",
        [id]
      );

      if (existingDisease.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Disease not found",
        });
      }

      // Check duplicate name
      if (disease_name) {
        const duplicateCheck = await pool.query(
          "SELECT disease_id FROM diseases WHERE disease_name = $1 AND disease_id != $2",
          [disease_name, id]
        );

        if (duplicateCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Disease with this name already exists",
          });
        }
      }

      // Perform update
      const result = await pool.query(
        `UPDATE diseases 
         SET 
            disease_name = COALESCE($1, disease_name),
            description  = COALESCE($2, description),
            is_active    = COALESCE($3, is_active),
            updated_at   = CURRENT_TIMESTAMP
         WHERE disease_id = $4
         RETURNING *`,
        [disease_name, description, is_active, id]
      );

      res.json({
        success: true,
        message: "Disease updated successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Update disease error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating disease",
      });
    }
  }
);


router.delete(
  "/:id",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log("Delete Disease ID:", id);

      // 1. Kiểm tra bệnh có tồn tại
      const existingDisease = await pool.query(
        "SELECT disease_id FROM diseases WHERE disease_id = $1",
        [id]
      );

      if (existingDisease.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy loại bệnh.",
        });
      }

      // 2. Kiểm tra xem bệnh có đang được liên kết hay không
      const checkLinked = await pool.query(
        `SELECT EXISTS (
            SELECT 1 
            FROM disease_details 
            WHERE disease_id = $1
        ) AS is_linked`,
        [id]
      );

      if (checkLinked.rows[0].is_linked) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa: Loại bệnh này đang được liên kết.",
        });
      }

      // 3. Tiến hành xóa
      await pool.query(
        "DELETE FROM diseases WHERE disease_id = $1",
        [id]
      );

      return res.status(200).json({
        success: true,
        message: "Xóa loại bệnh thành công.",
      });
    } catch (error) {
      console.error("Delete disease error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi xóa loại bệnh.",
      });
    }
  }
);


module.exports = router;
