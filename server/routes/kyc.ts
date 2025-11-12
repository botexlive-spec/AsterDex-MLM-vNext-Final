/**
 * Admin KYC Routes - MySQL Backend
 * Handles KYC verification management
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
 * GET /api/kyc - Get all KYC submissions
 * Query params: status, search
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT
        k.*,
        u.email as user_email,
        u.full_name as user_name
      FROM kyc k
      LEFT JOIN users u ON k.userId = u.id
      WHERE k.deletedAt IS NULL
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND k.status = ?';
      params.push(status.toUpperCase());
    }

    if (search) {
      query += ' AND (u.email LIKE ? OR u.full_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY k.createdAt DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({ data: rows });
  } catch (error: any) {
    console.error('Error fetching KYC submissions:', error);
    res.status(500).json({ error: 'Failed to fetch KYC submissions' });
  }
});

/**
 * GET /api/kyc/stats - Get KYC statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [submissions] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM kyc WHERE deletedAt IS NULL'
    );

    const totalSubmissions = submissions.length;
    const pending = submissions.filter(s => s.status === 'PENDING').length;
    const approved = submissions.filter(s => s.status === 'APPROVED').length;
    const rejected = submissions.filter(s => s.status === 'REJECTED').length;
    const resubmitRequired = 0; // No resubmit status in current schema

    // Recent submissions (last 10)
    const [recent] = await pool.query<RowDataPacket[]>(
      `SELECT
        k.*,
        u.email as user_email
      FROM kyc k
      LEFT JOIN users u ON k.userId = u.id
      WHERE k.deletedAt IS NULL
      ORDER BY k.createdAt DESC
      LIMIT 10`
    );

    res.json({
      totalSubmissions,
      pending,
      approved,
      rejected,
      resubmitRequired,
      recentSubmissions: recent
    });
  } catch (error: any) {
    console.error('Error fetching KYC stats:', error);
    res.status(500).json({ error: 'Failed to fetch KYC stats' });
  }
});

/**
 * GET /api/kyc/:id - Get submission by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        k.*,
        u.email as user_email,
        u.full_name as user_name
      FROM kyc k
      LEFT JOIN users u ON k.userId = u.id
      WHERE k.id = ? AND k.deletedAt IS NULL`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'KYC submission not found' });
    }

    res.json({ data: rows[0] });
  } catch (error: any) {
    console.error('Error fetching KYC submission:', error);
    res.status(500).json({ error: 'Failed to fetch KYC submission' });
  }
});

/**
 * POST /api/kyc/:id/approve - Approve KYC submission
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = (req as any).user.id;

    await pool.query(
      `UPDATE kyc SET
        status = 'APPROVED',
        notes = ?,
        updatedAt = NOW()
      WHERE id = ?`,
      [`Approved by admin ${adminId}. Notes: ${notes || 'None'}`, id]
    );

    // Update user verification status
    const [kyc] = await pool.query<RowDataPacket[]>(
      'SELECT userId FROM kyc WHERE id = ?',
      [id]
    );

    if (kyc.length > 0) {
      await pool.query(
        `UPDATE users SET
          updatedAt = NOW()
        WHERE id = ?`,
        [kyc[0].userId]
      );

      // Log audit entry (if audit_logs table exists)
      // Commented out since table doesn't exist yet
      // await pool.query(
      //   `INSERT INTO audit_logs (
      //     userId, action, details, createdAt
      //   ) VALUES (?, ?, ?, NOW())`,
      //   [adminId, 'kyc_approved', `Approved KYC submission ${id}`]
      // );
    }

    res.json({ message: 'KYC submission approved successfully' });
  } catch (error: any) {
    console.error('Error approving KYC submission:', error);
    res.status(500).json({ error: 'Failed to approve KYC submission' });
  }
});

/**
 * POST /api/kyc/:id/reject - Reject KYC submission
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.id;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    await pool.query(
      `UPDATE kyc SET
        status = 'REJECTED',
        notes = ?,
        updatedAt = NOW()
      WHERE id = ?`,
      [`Rejected by admin ${adminId}. Reason: ${reason}`, id]
    );

    // Log audit entry (commented out - table doesn't exist)
    /*
    await pool.query(
      `INSERT INTO audit_logs (
        userId, action, details, createdAt
      ) VALUES (?, ?, ?, NOW())`,
      [adminId, 'kyc_rejected', `Rejected KYC submission ${id}: ${reason}`]
    );
    */

    res.json({ message: 'KYC submission rejected successfully' });
  } catch (error: any) {
    console.error('Error rejecting KYC submission:', error);
    res.status(500).json({ error: 'Failed to reject KYC submission' });
  }
});

/**
 * POST /api/kyc/:id/resubmit - Request resubmission
 */
router.post('/:id/resubmit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = (req as any).user.id;

    await pool.query(
      `UPDATE kyc SET
        status = 'PENDING',
        notes = ?,
        updatedAt = NOW()
      WHERE id = ?`,
      [`Resubmit requested by admin ${adminId}: ${message || 'Please resubmit your documents'}`, id]
    );

    // Log audit entry (commented out - table doesn't exist)
    /*
    await pool.query(
      `INSERT INTO audit_logs (
        userId, action, details, createdAt
      ) VALUES (?, ?, ?, NOW())`,
      [adminId, 'kyc_resubmit_requested', `Requested resubmission for KYC ${id}`]
    );
    */

    res.json({ message: 'Resubmission requested successfully' });
  } catch (error: any) {
    console.error('Error requesting resubmission:', error);
    res.status(500).json({ error: 'Failed to request resubmission' });
  }
});

export default router;
