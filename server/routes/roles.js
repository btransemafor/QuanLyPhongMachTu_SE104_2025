const express = require("express");
const pool = require("../config/database");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM roles");

    return res.json({
      message: "Fetched Roles Successfully",
      data: result.rows,
      success: true,
    });
  } catch (err) {
    console.error("Get settings error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching roles",
    });
  }
});

module.exports = router;
