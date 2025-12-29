const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// ----------------- Load USER ----------------- //
router.get(
  "/",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        role_name,
        is_active,
        search,
        sort_by = "created_at",
        sort_order = "DESC",
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT user_id, username, full_name, r.role_id, phone, email, 
               is_active, u.created_at, u.updated_at, role_name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE 1=1
      `;
      let params = [];
      let count = 0;

      //  Filter role
      if (role_name) {
        params.push(role_name);
        query += ` AND r.role_name = $${++count}`;
      }

      // Filter active
      if (is_active === "true" || is_active === "false") {
        params.push(is_active === "true");
        query += ` AND u.is_active = $${++count}`;
      }

      // Search (username, full_name, email, phone)
      if (search) {
        params.push(`%${search}%`);
        params.push(`%${search}%`);
        params.push(`%${search}%`);
        params.push(`%${search}%`);
        query += `
          AND (
            u.username ILIKE $${count + 1} OR
            u.full_name ILIKE $${count + 2} OR
            u.email ILIKE $${count + 3} OR
            u.phone ILIKE $${count + 4}
          )
        `;
        count += 4;
      }

      //  Sort 
      const allowSort = ["created_at", "full_name", "email"];
      const sortField = allowSort.includes(sort_by) ? sort_by : "created_at";
      const sortOrder = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

      query += ` ORDER BY ${sortField} ${sortOrder}`;

      //  Pagination
      params.push(limit);
      params.push(offset);
      query += ` LIMIT $${count + 1} OFFSET $${count + 2}`;

      const result = await pool.query(query, params);

      // ---------------------------------------------
      // Count total
      // ---------------------------------------------
      let countQuery = `
        SELECT COUNT(*)
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE 1=1
      `;
      let countParams = [];
      let c = 0;

      if (role_name) {
        countParams.push(role_name);
        countQuery += ` AND r.role_name = $${++c}`;
      }

      if (is_active === "true" || is_active === "false") {
        countParams.push(is_active === "true");
        countQuery += ` AND u.is_active = $${++c}`;
      }

      if (search) {
        countParams.push(`%${search}%`);
        countParams.push(`%${search}%`);
        countParams.push(`%${search}%`);
        countParams.push(`%${search}%`);
        countQuery += `
          AND (
            u.username ILIKE $${c + 1} OR
            u.full_name ILIKE $${c + 2} OR
            u.email ILIKE $${c + 3} OR
            u.phone ILIKE $${c + 4}
          )
        `;
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      // 👉 Response
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number(limit),
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching users",
      });
    }
  }
);


router.get(
  "/:id",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "SELECT id, username, role, is_active, created_at, updated_at FROM users WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching user",
      });
    }
  }
);
router.post(
  "/",
  [
    authenticateToken,
    authorizeRoles("admin"),

    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),

    body("role_id").isInt().withMessage("role_id must be a number"),
    body("full_name").notEmpty().withMessage("full_name is required"),

    body("email")
      .isEmail()
      .withMessage("Invalid email format"),

    body("phone")
      .isMobilePhone("vi-VN")
      .withMessage("Invalid Vietnamese phone number"),

    body("is_active")
      .isBoolean()
      .withMessage("is_active must be true/false"),
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
        username,
        password,
        role_id,
        full_name,
        email,
        phone,
        is_active,
      } = req.body;

      // Check username
      const existingUser = await pool.query(
        "SELECT user_id FROM users WHERE username = $1",
        [username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const result = await pool.query(
        `
        INSERT INTO users 
          (username, password, role_id, full_name, email, phone, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          user_id, username, role_id, full_name, email, phone, is_active, created_at
        `,
        [
          username,
          hashedPassword,
          role_id,
          full_name,
          email,
          phone,
          is_active,
        ]
      );

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while creating user",
      });
    }
  }
);


router.put('/:id', [
  authenticateToken,
  authorizeRoles('admin')
], async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const updates = req.body;

    console.log("Dữ liệu FE gửi lên:", updates);

    // Không có gì thay đổi
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "Không có dữ liệu cập nhật" });
    }

    await client.query("BEGIN");

    // Kiểm tra user tồn tại
    const userRes = await client.query(`
      SELECT * FROM users WHERE user_id = $1
    `, [id]);

    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate trùng username/email/phone nếu có các trường này
    const uniqueFields = ["username", "email", "phone"];
    for (let field of uniqueFields) {
      if (updates[field]) {
        const dup = await client.query(
          `SELECT user_id FROM users WHERE ${field} = $1 AND user_id != $2`,
          [updates[field], id]
        );
        if (dup.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ success: false, message: `${field} already exists` });
        }
      }
    }

    // Convert role_name → role_id nếu FE gửi role_name
    if (updates.role_id) {
      const roleRes = await client.query(
        `SELECT role_id FROM roles WHERE role_id = $1`,
        [updates.role_id]
      );
      if (roleRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Role not found" });
      }
      updates.role_id = roleRes.rows[0].role_id;
    }

    // Tạo dynamic query update
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setSQL = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");

    const updateSQL = `
      UPDATE users
      SET ${setSQL}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${fields.length + 1}
      RETURNING *
    `;

    const updateRes = await client.query(updateSQL, [...values, id]);

    const finalUser = await client.query(`
      SELECT 
        u.user_id, u.username, r.role_name,
        u.full_name, u.phone, u.email,
        u.is_active, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = $1
    `, [id]);

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "User updated successfully",
      data: finalUser.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: "Server error while updating user" });
  } finally {
    client.release();
  }
});


router.put(
  "/:id/password",
  [
    authenticateToken,
    authorizeRoles("admin"),
    body("new_password")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
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
      const { new_password } = req.body;

      const existingUser = await pool.query(
        "SELECT user_id FROM users WHERE user_id = $1",
        [id]
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await pool.query(
        "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
        [hashedPassword, id]
      );

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while resetting password",
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

      const existingUser = await pool.query(
        "SELECT user_id FROM users WHERE user_id = $1",
        [id]
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account",
        });
      }

      await pool.query(
        "DELETE FROM users WHERE user_id = $1",
        [id]
      );

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting user",
      });
    }
  }
);

module.exports = router;
