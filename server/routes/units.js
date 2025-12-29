const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { active_only = true, search = "" } = req.query;

    let query = `
      SELECT unit_id, unit_name, is_active, created_at
      FROM units
      WHERE 1=1
    `;

    let queryParams = [];
    let paramCount = 0;

    //  Lọc active
    if (active_only === "true") {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      queryParams.push(true);
    }

    if (active_only === "false") {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      queryParams.push(false);
    }
    //  Search theo tên (LIKE %keyword%)
    if (search && search.trim() !== "") {
      paramCount++;
      query += ` AND unit_name ILIKE $${paramCount}`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY unit_name ASC`;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get units error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching units",
    });
  }
});

router.post(
  "/",
  [
    authenticateToken,
    authorizeRoles("admin"),
    body("unit_name").notEmpty().withMessage("Unit name is required"),
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

      const { unit_name, is_active } = req.body;

      const existingUnit = await pool.query(
        "SELECT unit_id FROM units WHERE LOWER(unit_name) ILIKE $1",
        [unit_name.trim().toLowerCase()]
      );

      if (existingUnit.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Tên đơn vị tính đã được sử dụng trước đó",
        });
      }

      const result = await pool.query(
        `INSERT INTO units (unit_name, is_active)
       VALUES ($1, $2)
       RETURNING *`,
        [unit_name, is_active]
      );

      res.status(201).json({
        success: true,
        message: "Unit created successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Create unit error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while creating unit",
      });
    }
  }
);

router.put(
  "/:id",
  [
    authenticateToken,
    authorizeRoles("admin"),
    body("unit_name")
      .optional()
      .notEmpty()
      .withMessage("Unit name cannot be empty"),
    body("is_active").optional(),
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
      const { unit_name, is_active } = req.body;

      console.log(
        "TUI CAP NHAT DON VI CO ID: ",
        id,
        "voi ten moi la: ",
        unit_name
      );

      const existingUnit = await pool.query(
        "SELECT unit_id FROM units WHERE unit_id = $1",
        [id]
      );

      if (existingUnit.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Unit not found",
        });
      }

      if (unit_name) {
        const duplicateCheck = await pool.query(
          "SELECT unit_id FROM units WHERE LOWER(unit_name) = $1 AND unit_id != $2",
          [unit_name.trim().toLowerCase(), id]
        );

        if (duplicateCheck.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Unit with this name already exists",
          });
        }
      }

      const result = await pool.query(
        `UPDATE units 
       SET unit_name = COALESCE($1, unit_name),
           is_active = COALESCE($2, is_active)
       WHERE unit_id = $3
       RETURNING *`,
        [unit_name, is_active, id]
      );

      res.json({
        success: true,
        message: "Unit updated successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Update unit error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating unit",
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
      console.log("Tui xoa don vi co id: ", id);

      const existingUnit = await pool.query(
        "SELECT unit_id FROM units WHERE unit_id = $1",
        [id]
      );

      if (existingUnit.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Unit not found",
        });
      }

      const result = await pool.query(
        `SELECT EXISTS (SELECT * FROM medicines WHERE unit_id = $1) as is_linked`,
        [id]
      );

      const is_linked = result.rows[0].is_linked;

      if (is_linked) {
        return res.status(400).json({
          success: false,
          message: "Đơn vị tính này đã được liên kết",
        });
      }

      await pool.query("DELETE FROM units WHERE unit_id = $1", [id]);

      res.json({
        success: true,
        message: "Unit deleted successfully",
      });
    } catch (error) {
      console.error("Delete unit error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting unit",
      });
    }
  }
);

module.exports = router;
