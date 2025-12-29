const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, is_active } = req.query;
    

    console.log('ACTIVE: ', is_active)

    let query = 'SELECT usage_method_id, usage_method_name, is_active, created_at FROM usage_methods WHERE 1=1';
    let queryParams = [];
    let paramCount = 0;

    // Filter by search term
    if (search && search.trim()) {
      paramCount++;
      query += ` AND usage_method_name ILIKE $${paramCount}`;
      queryParams.push(`%${search.trim()}%`);
    }

    // Filter by active status
    if (is_active !== undefined && is_active !== null && is_active !== '') {
      paramCount++;
      const isActiveValue = is_active === 'true' || is_active === true;
      query += ` AND is_active = $${paramCount}`;
      queryParams.push(isActiveValue);
    }

    query += ' ORDER BY usage_method_name ASC';

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get usage methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching usage methods'
    });
  }
});


/// ------------  Them cách dùng thuốc --------- /// 
router.post('/', [
  authenticateToken,
  authorizeRoles('admin'),
  body('usage_method_name').notEmpty().withMessage('Usage method name is required'), 
  body('is_active')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { usage_method_name, is_active } = req.body;

    
    const existingUsageMethod = await pool.query(
      'SELECT usage_method_id FROM usage_methods WHERE LOWER(usage_method_name) = $1',
      [usage_method_name.trim().toLowerCase()]
    );

    if (existingUsageMethod.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cách dùng này đã tồn tại trong hệ thống!'
      });
    }

    const result = await pool.query(
      `INSERT INTO usage_methods (usage_method_name, is_active)
       VALUES ($1,$2)
       RETURNING *`,
      [usage_method_name, is_active]
    );

    res.status(201).json({
      success: true,
      message: 'Usage method created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create usage method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating usage method'
    });
  }
});

/// ================ Sửa cách dùng ====================
router.put('/:id', [
  authenticateToken,
  authorizeRoles('admin'),
  body('usage_method_name').optional().notEmpty().withMessage('Usage method name cannot be empty'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { usage_method_name, is_active } = req.body;

    console.log("Update usage method: ", id, usage_method_name, is_active);

    
    const existingUsageMethod = await pool.query(
      'SELECT usage_method_id FROM usage_methods WHERE usage_method_id = $1',
      [id]
    );

    if (existingUsageMethod.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usage method not found'
      });
    }

    
    if (usage_method_name) {
      const duplicateCheck = await pool.query(
        'SELECT usage_method_id FROM usage_methods WHERE usage_method_name = $1 AND usage_method_id != $2',
        [usage_method_name, id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Usage method with this name already exists'
        });
      }
    }

    const result = await pool.query(
      `UPDATE usage_methods 
       SET usage_method_name = COALESCE($1, usage_method_name),
           is_active = COALESCE($2, is_active)
       WHERE usage_method_id = $3
       RETURNING *`,
      [usage_method_name, is_active, id]
    );

    res.json({
      success: true,
      message: 'Usage method updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update usage method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating usage method'
    });
  }
});

router.delete(
  "/:id",
  [authenticateToken, authorizeRoles("admin")],
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingUsageMethod = await pool.query(
        "SELECT usage_method_id FROM usage_methods WHERE usage_method_id = $1",
        [id]
      );
      if (existingUsageMethod.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Usage method not found",
        });
      }


      // Check có liên kết không ? 
      const checkLink = await pool.query(`SELECT EXISTS (SELECT usage_method_id FROM prescription_detail WHERE usage_method_id = $1) AS is_link`, [id]); 
      const isLinked = checkLink.rows[0].is_link; 

      if (isLinked) {
        return res.status(400).json({
          success: false, 
          message: 'Cách dùng này đã được liên kết'
        })
      }
      await pool.query("DELETE FROM usage_methods WHERE usage_method_id = $1", [
        id,
      ]);

      res.json({
        success: true,
        message: "Usage method deleted successfully",
      });
    } catch (error) {
      console.error("Delete usage method error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting usage method",
      });
    }
  }
);

module.exports = router;
