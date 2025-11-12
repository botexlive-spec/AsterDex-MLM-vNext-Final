/**
 * Admin Impersonation Routes - MySQL Backend
 * Handles user impersonation for admin support
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
 * POST /api/impersonate/:userId - Start impersonating a user
 */
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user.id;
    const { reason } = req.body;

    // Get user details
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Prevent impersonating other admins
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot impersonate admin users' });
    }

    // Create impersonation token
    const impersonationToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        impersonatedBy: adminId,
        isImpersonating: true
      },
      JWT_SECRET,
      { expiresIn: '2h' } // Impersonation tokens expire in 2 hours
    );

    // Log impersonation start
    await pool.query(
      `INSERT INTO audit_logs (
        userId, action, details, target_user_id, createdAt
      ) VALUES (?, ?, ?, ?, NOW())`,
      [
        adminId,
        'impersonation_started',
        `Started impersonating user ${user.email}. Reason: ${reason || 'Support'}`,
        userId
      ]
    );

    // Create impersonation session record
    await pool.query(
      `INSERT INTO impersonation_sessions (
        admin_id, userId, reason, started_at, expires_at, is_active
      ) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), true)`,
      [adminId, userId, reason || 'Support']
    );

    res.json({
      token: impersonationToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      expiresIn: 7200, // 2 hours in seconds
      isImpersonating: true,
      impersonatedBy: adminId
    });
  } catch (error: any) {
    console.error('Error starting impersonation:', error);
    res.status(500).json({ error: 'Failed to start impersonation' });
  }
});

/**
 * POST /api/impersonate/stop - Stop current impersonation session
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Update impersonation session
    await pool.query(
      `UPDATE impersonation_sessions SET
        is_active = false,
        ended_at = NOW()
      WHERE admin_id = ? AND userId = ? AND is_active = true`,
      [adminId, userId]
    );

    // Log impersonation end
    await pool.query(
      `INSERT INTO audit_logs (
        userId, action, details, target_user_id, createdAt
      ) VALUES (?, ?, ?, ?, NOW())`,
      [adminId, 'impersonation_stopped', `Stopped impersonating user`, userId]
    );

    res.json({ message: 'Impersonation session ended successfully' });
  } catch (error: any) {
    console.error('Error stopping impersonation:', error);
    res.status(500).json({ error: 'Failed to stop impersonation' });
  }
});

/**
 * GET /api/impersonate/sessions - Get all impersonation sessions
 * Query params: active, limit
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const { active, limit = '100' } = req.query;

    let query = `
      SELECT
        i.*,
        a.email as admin_email,
        u.email as user_email
      FROM impersonation_sessions i
      LEFT JOIN users a ON i.admin_id = a.id
      LEFT JOIN users u ON i.userId = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (active === 'true') {
      query += ' AND i.is_active = true';
    } else if (active === 'false') {
      query += ' AND i.is_active = false';
    }

    query += ' ORDER BY i.started_at DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({ data: rows });
  } catch (error: any) {
    console.error('Error fetching impersonation sessions:', error);
    res.status(500).json({ error: 'Failed to fetch impersonation sessions' });
  }
});

/**
 * GET /api/impersonate/active - Get currently active impersonation sessions
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        i.*,
        a.email as admin_email,
        u.email as user_email
      FROM impersonation_sessions i
      LEFT JOIN users a ON i.admin_id = a.id
      LEFT JOIN users u ON i.userId = u.id
      WHERE i.is_active = true AND i.expires_at > NOW()
      ORDER BY i.started_at DESC`
    );

    res.json({ data: rows });
  } catch (error: any) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

/**
 * GET /api/impersonate/history/:userId - Get impersonation history for a user
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '50' } = req.query;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        i.*,
        a.email as admin_email
      FROM impersonation_sessions i
      LEFT JOIN users a ON i.admin_id = a.id
      WHERE i.userId = ?
      ORDER BY i.started_at DESC
      LIMIT ?`,
      [userId, parseInt(limit as string)]
    );

    res.json({ data: rows });
  } catch (error: any) {
    console.error('Error fetching impersonation history:', error);
    res.status(500).json({ error: 'Failed to fetch impersonation history' });
  }
});

/**
 * POST /api/impersonate/verify - Verify if current token is impersonation
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ isImpersonating: false });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.isImpersonating && decoded.impersonatedBy) {
      // Get admin details
      const [admins] = await pool.query<RowDataPacket[]>(
        'SELECT email FROM users WHERE id = ?',
        [decoded.impersonatedBy]
      );

      return res.json({
        isImpersonating: true,
        impersonatedBy: {
          id: decoded.impersonatedBy,
          email: admins[0]?.email
        },
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        }
      });
    }

    res.json({ isImpersonating: false });
  } catch (error: any) {
    res.json({ isImpersonating: false });
  }
});

export default router;
