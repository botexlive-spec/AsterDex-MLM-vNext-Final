/**
 * Admin Audit Routes - MySQL Backend
 * Handles audit log retrieval and management
 */

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

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
 * GET /api/audit/logs - Get audit logs
 * Query params: limit, action, userId, startDate, endDate
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const {
      limit = '100',
      action,
      userId,
      startDate,
      endDate
    } = req.query;

    let query = `
      SELECT
        a.*,
        u.email as user_email,
        u.full_name as user_meta
      FROM audit_logs a
      LEFT JOIN users u ON a.userId = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (action) {
      query += ' AND a.action = ?';
      params.push(action);
    }

    if (userId) {
      query += ' AND a.userId = ?';
      params.push(userId);
    }

    if (startDate && endDate) {
      query += ' AND a.createdAt BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY a.createdAt DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({ data: rows });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * GET /api/audit/logs/:userId - Get user-specific audit logs
 * Query params: limit, action
 */
router.get('/logs/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '100', action } = req.query;

    let query = `
      SELECT
        a.*,
        u.email as user_email,
        u.full_name as user_meta
      FROM audit_logs a
      LEFT JOIN users u ON a.userId = u.id
      WHERE a.userId = ?
    `;
    const params: any[] = [userId];

    if (action) {
      query += ' AND a.action = ?';
      params.push(action);
    }

    query += ' ORDER BY a.createdAt DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({ data: rows });
  } catch (error: any) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch user audit logs' });
  }
});

/**
 * GET /api/audit/stats - Get audit statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [logs] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM audit_logs ORDER BY createdAt DESC'
    );

    const totalLogs = logs.length;

    // Count by action type
    const actionCounts: Record<string, number> = {};
    logs.forEach((log: any) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    // Most active users
    const userActivity: Record<string, number> = {};
    logs.forEach((log: any) => {
      userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
    });

    const [topUsers] = await pool.query<RowDataPacket[]>(
      `SELECT
        u.id,
        u.email,
        COUNT(*) as activity_count
      FROM audit_logs a
      LEFT JOIN users u ON a.userId = u.id
      GROUP BY u.id, u.email
      ORDER BY activity_count DESC
      LIMIT 10`
    );

    // Recent activity (last 24 hours)
    const [recentActivity] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
      FROM audit_logs
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    // Activity by date (last 7 days)
    const [activityByDate] = await pool.query<RowDataPacket[]>(
      `SELECT
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM audit_logs
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date DESC`
    );

    res.json({
      totalLogs,
      actionCounts,
      topUsers,
      recentActivityCount: recentActivity[0]?.count || 0,
      activityByDate
    });
  } catch (error: any) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: 'Failed to fetch audit stats' });
  }
});

/**
 * GET /api/audit/actions - Get list of all action types
 */
router.get('/actions', async (req: Request, res: Response) => {
  try {
    const [actions] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT action FROM audit_logs ORDER BY action ASC`
    );

    res.json({ data: actions.map((a: any) => a.action) });
  } catch (error: any) {
    console.error('Error fetching action types:', error);
    res.status(500).json({ error: 'Failed to fetch action types' });
  }
});

/**
 * POST /api/audit/log - Create audit log entry
 */
router.post('/log', async (req: Request, res: Response) => {
  try {
    const { action, details, targetUserId } = req.body;
    const adminId = (req as any).user.id;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    await pool.query(
      `INSERT INTO audit_logs (
        userId, action, details, target_user_id, createdAt
      ) VALUES (?, ?, ?, ?, NOW())`,
      [adminId, action, details || '', targetUserId || null]
    );

    res.json({ message: 'Audit log created successfully' });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

export default router;
