const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const router = express.Router();
router.put(
  "/:id",
  [authenticateToken, authorizeRoles("admin"), body("note").optional()],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { note } = req.body;

      console.log("NOte: ", note);

      //  Check batch tồn tại
      const exist = await pool.query(
        `SELECT batch_id FROM batches WHERE batch_id = $1`,
        [id]
      );

      if (exist.rows.length === 0) {
        return res.status(404).json({
          message: "Lô thuốc không tồn tại",
        });
      }

      try {
        await pool.query(`UPDATE batches SET note = $1 WHERE batch_id = $2`, [
          note || null,
          id,
        ]);
      } catch (err) {
        console.error("Error updating batch:", err);
      }

      return res.status(200).json({
        success: true, 
        message: "Cập nhật ghi chú lô thuốc thành công",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Lỗi server",
      });
    }
  }
);

module.exports = router;
