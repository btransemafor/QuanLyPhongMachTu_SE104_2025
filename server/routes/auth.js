const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const crypto = require("crypto");
const router = express.Router();
const { sendTokensViaEmail } = require("../services/email.services");
const { isValidPhone } = require("../utils/CheckPhoneNumber");
/// --------- Login --------- ///
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
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

      const { username, password } = req.body;

      console.log("Username", username);

      const userResult = await pool.query(
        `SELECT user_id, username, password, role_name, full_name, is_active, users.created_at, email, phone FROM users
        JOIN roles ON users.role_id = roles.role_id
        WHERE username = $1`,
        [username]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Tên đăng nhập không tồn tại",
        });
      }

      const user = userResult.rows[0];

      console.log("ROLE OF USER: ", user.role_name);

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Mật khẩu không chính xác",
        });
      }

      const token = jwt.sign(
        {
          userId: user.user_id,
          username: user.username,
          role: user.role_name,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user.user_id,
            username: user.username,
            role_name: user.role_name,
            full_name: user.full_name,
            email: user.email, 
            created_at: user.created_at, 
            is_active: user.is_active, 
            phone: user.phone
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }
  }
);

router.get("/me", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user.user_id,
        username: req.user.username,
        role_name: req.user.role_name,
        fullname: req.user.full_name,
        email: req.user.email, 
        created_at: req.user.created_at, 
        is_active: req.user.is_active, 
        phone: req.user.phone
      },
    });
  } catch (error) {
    console.error("Get user info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// --------------- Đăng ký --------------- //
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("confirm password is required"),
    /*     body("role").optional().isIn(["user", "admin"]).withMessage("Invalid role"), */
    body("fullname").notEmpty().withMessage("Full name is required"),
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .isMobilePhone()
      .withMessage("Invalid phone number"),
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email"),
  ],
  async (req, res) => {
    try {
      /*       const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      } */

      const { username, password, confirmPassword, fullname, phone, email } =
        req.body;

      if (password !== confirmPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Mật khẩu không khớp" });
      }

      // Check Format Phone
      const isValidPhoneNumber = isValidPhone(phone);
      if (!isValidPhoneNumber) {
        return res
          .status(400)
          .json({ success: false, message: "Số điện thoại không hợp lệ" });
      }
      // ---- CHECK TRÙNG ----
      // (1) username
      const userExist = await pool.query(
        "SELECT user_id FROM users WHERE username = $1",
        [username.trim()]
      );
      if (userExist.rows.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Tên đăng nhập đã tồn tại" });
      }
      // (2) email
      const emailExist = await pool.query(
        "SELECT user_id FROM users WHERE email = $1",
        [email.trim()]
      );
      if (emailExist.rows.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Email đã tồn tại" });
      }
      // (3) phone
      const phoneExist = await pool.query(
        "SELECT user_id FROM users WHERE phone = $1",
        [phone.trim()]
      );
      if (phoneExist.rows.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Số điện thoại đã tồn tại" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const role_default = "Receptionist";
      // Query the role
      const roleResult = await pool.query(
        "SELECT role_id FROM roles WHERE role_name = $1",
        [role_default]
      );

      if (roleResult.rowCount === 0) {
        throw new Error(`Role '${role_default}' not found in database`);
      }

      const role_id = roleResult.rows[0].role_id;

      await pool.query(
        `INSERT INTO users (username, password, role_id, full_name, phone, email, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [username, hashedPassword, role_id, fullname, phone, email]
      );

      res.json({ success: true, message: "Đăng ký tài khoản thành công" });
    } catch (err) {
      console.error("Register error:", err);
      res
        .status(500)
        .json({ success: false, message: "Server error during registration" });
    }
  }
);

// --- Forgot Password ---
router.post(
  "/forgot-password",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array()); // ← print ra console để xem chi tiết
        return res.status(400).json({
          success: false,
          message: errors.array(),
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      // Check if user exists
      const userResult = await pool.query(
        "SELECT user_id FROM users WHERE email = $1",
        [email]
      );

      // Always respond the same to avoid email enumeration
      res.json({
        success: true,
        message: "If the email exists, a reset link has been sent.",
      });

      if (userResult.rows.length === 0) return;

      const userId = userResult.rows[0].user_id;

      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Insert or update token in DB
      await pool.query(
        `
      INSERT INTO password_reset_tokens(user_id, token, token_expiry)
      VALUES ($1, $2, $3);
      `,
        [userId, tokenHash, expiresAt]
      );

      // Send email (non-blocking)
      void sendTokensViaEmail(email, token);
    } catch (err) {
      console.error("Forgot password error:", err);
    }
  }
);

// --- Reset Password ---
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    console.log("Your new password: ", newPassword);

    try {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const tokenResult = await pool.query(
        "SELECT user_id, token_expiry FROM password_reset_tokens WHERE token = $1",
        [tokenHash]
      );

      if (tokenResult.rows.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token" });
      }

      const { user_id, token_expiry } = tokenResult.rows[0];

      if (new Date() > token_expiry) {
        return res
          .status(400)
          .json({ success: false, message: "Token has expired" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(
        "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
        [hashedPassword, user_id]
      );

      await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [
        user_id,
      ]);

      res.json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.post(
  "/change-password",
  [
    authenticateToken,
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
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

      const userId = req.user.user_id; // ✔ CHUẨN HÓA ID
      const { currentPassword, newPassword } = req.body;

      // Lấy password hiện tại
      const userResult = await pool.query(
        "SELECT password FROM users WHERE user_id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Kiểm tra mật khẩu hiện tại
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].password
      );

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại không chính xác",
        });
      }

      // Hash mật khẩu mới
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update mật khẩu
      await pool.query(
        "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
        [hashedNewPassword, userId] // ✔ SỬA LẠI CHO ĐÚNG
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      });

    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during password change",
      });
    }
  }
);


module.exports = router;
