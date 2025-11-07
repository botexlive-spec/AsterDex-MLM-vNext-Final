/**
 * Admin Config Routes - MySQL Backend
 * Handles system configuration management
 */

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware: Authenticate admin users
function authenticateAdmin(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role?: string };

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    (req as any).user = decoded;
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/config - Get all config settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM system_config ORDER BY config_key ASC'
    );

    // Convert to key-value object
    const config: Record<string, any> = {};
    rows.forEach((row: any) => {
      try {
        // Try to parse JSON values
        config[row.config_key] = JSON.parse(row.config_value);
      } catch {
        // If not JSON, use as string
        config[row.config_key] = row.config_value;
      }
    });

    res.json({ data: config, raw: rows });
  } catch (error: any) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

/**
 * GET /api/config/:key - Get specific config value
 */
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM system_config WHERE config_key = ?',
      [key]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Config key not found' });
    }

    const row = rows[0];
    let value;

    try {
      // Try to parse JSON values
      value = JSON.parse(row.config_value);
    } catch {
      // If not JSON, use as string
      value = row.config_value;
    }

    res.json({
      key: row.config_key,
      value,
      description: row.description,
      category: row.category,
      updatedAt: row.updated_at
    });
  } catch (error: any) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

/**
 * PUT /api/config/:key - Update config value
 */
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const adminId = (req as any).user.id;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Convert value to string (JSON if object/array)
    const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    // Check if config exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM system_config WHERE config_key = ?',
      [key]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Config key not found' });
    }

    // Update config
    await pool.query(
      `UPDATE system_config SET
        config_value = ?,
        description = COALESCE(?, description),
        updated_at = NOW()
      WHERE config_key = ?`,
      [configValue, description, key]
    );

    // Log audit entry
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, action, details, created_at
      ) VALUES (?, ?, ?, NOW())`,
      [adminId, 'config_updated', `Updated config ${key} to ${configValue}`]
    );

    res.json({ message: 'Config updated successfully' });
  } catch (error: any) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

/**
 * POST /api/config - Create new config
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { key, value, description, category } = req.body;
    const adminId = (req as any).user.id;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // Check if config already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM system_config WHERE config_key = ?',
      [key]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Config key already exists' });
    }

    // Convert value to string (JSON if object/array)
    const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    // Create config
    await pool.query(
      `INSERT INTO system_config (
        config_key, config_value, description, category, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [key, configValue, description || '', category || 'general']
    );

    // Log audit entry
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, action, details, created_at
      ) VALUES (?, ?, ?, NOW())`,
      [adminId, 'config_created', `Created config ${key} with value ${configValue}`]
    );

    res.json({ message: 'Config created successfully' });
  } catch (error: any) {
    console.error('Error creating config:', error);
    res.status(500).json({ error: 'Failed to create config' });
  }
});

/**
 * DELETE /api/config/:key - Delete config
 */
router.delete('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const adminId = (req as any).user.id;

    // Check if config exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM system_config WHERE config_key = ?',
      [key]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Config key not found' });
    }

    // Delete config
    await pool.query('DELETE FROM system_config WHERE config_key = ?', [key]);

    // Log audit entry
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, action, details, created_at
      ) VALUES (?, ?, ?, NOW())`,
      [adminId, 'config_deleted', `Deleted config ${key}`]
    );

    res.json({ message: 'Config deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting config:', error);
    res.status(500).json({ error: 'Failed to delete config' });
  }
});

export default router;
