/**
 * Admin Support Routes - MySQL Backend
 * Handles support ticket system
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
 * GET /api/support/tickets - Get all support tickets
 * Query params: status, priority, category, search
 */
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const { status, priority, category, search } = req.query;

    let query = `
      SELECT
        t.*,
        u.email as user_email,
        u.full_name as user_meta,
        a.email as assigned_to_email
      FROM support_ticket t
      LEFT JOIN users u ON t.userId = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (category) {
      query += ' AND t.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (t.subject LIKE ? OR t.description LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.priority DESC, t.createdAt DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({ data: rows });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

/**
 * GET /api/support/tickets/:id - Get ticket by ID
 */
router.get('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get ticket details
    const [tickets] = await pool.query<RowDataPacket[]>(
      `SELECT
        t.*,
        u.email as user_email,
        u.full_name as user_meta,
        a.email as assigned_to_email
      FROM support_ticket t
      LEFT JOIN users u ON t.userId = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ?`,
      [id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get ticket replies
    const [replies] = await pool.query<RowDataPacket[]>(
      `SELECT
        r.*,
        u.email as user_email,
        u.full_name as user_meta
      FROM support_ticket_replies r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.ticket_id = ?
      ORDER BY r.createdAt ASC`,
      [id]
    );

    res.json({
      data: {
        ...tickets[0],
        replies
      }
    });
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

/**
 * PUT /api/support/tickets/:id - Update ticket status/priority
 */
router.put('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');

    await pool.query(
      `UPDATE support_ticket SET ${setClause}, updatedAt = NOW() WHERE id = ?`,
      [...values, id]
    );

    // Log audit entry
    const adminId = (req as any).user.id;
    await pool.query(
      `INSERT INTO audit_logs (
        userId, action, details, createdAt
      ) VALUES (?, ?, ?, NOW())`,
      [adminId, 'ticket_updated', `Updated ticket ${id}: ${JSON.stringify(updates)}`]
    );

    res.json({ message: 'Ticket updated successfully' });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

/**
 * POST /api/support/tickets/:id/reply - Add reply to ticket
 */
router.post('/tickets/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, isInternal } = req.body;
    const adminId = (req as any).user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create reply
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO support_ticket_replies (
        ticket_id, userId, message, is_admin_reply, is_internal, createdAt
      ) VALUES (?, ?, ?, true, ?, NOW())`,
      [id, adminId, message, isInternal || false]
    );

    // Update ticket's last response time and status if needed
    await pool.query(
      `UPDATE support_ticket SET
        last_response_at = NOW(),
        status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
        updatedAt = NOW()
      WHERE id = ?`,
      [id]
    );

    // Fetch the created reply
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        r.*,
        u.email as user_email
      FROM support_ticket_replies r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.id = ?`,
      [result.insertId]
    );

    res.json({ data: rows[0] });
  } catch (error: any) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

/**
 * GET /api/support/stats - Get support statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [tickets] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM support_ticket'
    );

    const totalTickets = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;

    // Priority breakdown
    const high = tickets.filter(t => t.priority === 'high').length;
    const medium = tickets.filter(t => t.priority === 'medium').length;
    const low = tickets.filter(t => t.priority === 'low').length;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    tickets.forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
    });

    // Average response time (in hours)
    const ticketsWithResponse = tickets.filter(t => t.last_response_at);
    let avgResponseTime = 0;
    if (ticketsWithResponse.length > 0) {
      const totalResponseTime = ticketsWithResponse.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const responded = new Date(t.last_response_at).getTime();
        return sum + (responded - created);
      }, 0);
      avgResponseTime = Math.round(totalResponseTime / ticketsWithResponse.length / (1000 * 60 * 60)); // Convert to hours
    }

    // Recent tickets
    const [recent] = await pool.query<RowDataPacket[]>(
      `SELECT
        t.*,
        u.email as user_email
      FROM support_ticket t
      LEFT JOIN users u ON t.userId = u.id
      ORDER BY t.createdAt DESC
      LIMIT 10`
    );

    res.json({
      totalTickets,
      open,
      inProgress,
      resolved,
      closed,
      priorityBreakdown: { high, medium, low },
      categoryBreakdown,
      avgResponseTimeHours: avgResponseTime,
      recentTickets: recent
    });
  } catch (error: any) {
    console.error('Error fetching support stats:', error);
    res.status(500).json({ error: 'Failed to fetch support stats' });
  }
});

export default router;
