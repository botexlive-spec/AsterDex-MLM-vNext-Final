/**
 * Admin Reports Routes - MySQL Backend
 * Handles various admin reports and analytics
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
 * GET /api/reports/users - User registration report
 * Query params: startDate, endDate, period (day, week, month)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, period = 'day' } = req.query;

    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE createdAt BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get total users
    const [totalUsers] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM users ${dateFilter}`,
      params
    );

    // Get users by registration date
    let dateFormat = '%Y-%m-%d';
    if (period === 'week') {
      dateFormat = '%Y-%u'; // Year-Week
    } else if (period === 'month') {
      dateFormat = '%Y-%m'; // Year-Month
    }

    const [registrations] = await pool.query<RowDataPacket[]>(
      `SELECT
        DATE_FORMAT(createdAt, ?) as period,
        COUNT(*) as count
      FROM users
      ${dateFilter}
      GROUP BY period
      ORDER BY period ASC`,
      [dateFormat, ...params]
    );

    // Get users by role
    const [usersByRole] = await pool.query<RowDataPacket[]>(
      `SELECT
        role,
        COUNT(*) as count
      FROM users
      ${dateFilter}
      GROUP BY role`,
      params
    );

    // Get users by status
    const [usersByStatus] = await pool.query<RowDataPacket[]>(
      `SELECT
        CASE
          WHEN kyc_verified = true THEN 'verified'
          WHEN email_verified = true THEN 'email_verified'
          ELSE 'unverified'
        END as status,
        COUNT(*) as count
      FROM users
      ${dateFilter}
      GROUP BY status`,
      params
    );

    // Get users with packages
    const [usersWithPackages] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT userId) as count
      FROM user_packages
      WHERE status = 'active'`
    );

    res.json({
      totalUsers: totalUsers[0].count,
      registrationsByPeriod: registrations,
      usersByRole,
      usersByStatus,
      activePackageHolders: usersWithPackages[0]?.count || 0
    });
  } catch (error: any) {
    console.error('Error generating user report:', error);
    res.status(500).json({ error: 'Failed to generate user report' });
  }
});

/**
 * GET /api/reports/transactions - Transaction report
 * Query params: startDate, endDate, type, status
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, status } = req.query;

    let query = 'SELECT * FROM mlm_transactions WHERE 1=1';
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' AND createdAt BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (type) {
      query += ' AND transaction_type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    const [transactions] = await pool.query<RowDataPacket[]>(
      query + ' ORDER BY createdAt DESC',
      params
    );

    // Calculate totals by type
    const totals: Record<string, { count: number; amount: number }> = {};
    transactions.forEach((t: any) => {
      if (!totals[t.transaction_type]) {
        totals[t.transaction_type] = { count: 0, amount: 0 };
      }
      totals[t.transaction_type].count++;
      totals[t.transaction_type].amount += parseFloat(t.amount || 0);
    });

    // Calculate totals by status
    const statusTotals: Record<string, { count: number; amount: number }> = {};
    transactions.forEach((t: any) => {
      if (!statusTotals[t.status]) {
        statusTotals[t.status] = { count: 0, amount: 0 };
      }
      statusTotals[t.status].count++;
      statusTotals[t.status].amount += parseFloat(t.amount || 0);
    });

    // Calculate total amount
    const totalAmount = transactions.reduce((sum, t: any) => sum + parseFloat(t.amount || 0), 0);

    res.json({
      totalTransactions: transactions.length,
      totalAmount,
      transactionsByType: totals,
      transactionsByStatus: statusTotals,
      transactions: transactions.slice(0, 100) // Return last 100 transactions
    });
  } catch (error: any) {
    console.error('Error generating transaction report:', error);
    res.status(500).json({ error: 'Failed to generate transaction report' });
  }
});

/**
 * GET /api/reports/commissions - Commission report
 * Query params: startDate, endDate, userId
 */
router.get('/commissions', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let query = `
      SELECT
        c.*,
        u.email as user_email,
        u.full_name as user_meta,
        r.email as from_user_email
      FROM commissions c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN users r ON c.from_user_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' AND c.createdAt BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (userId) {
      query += ' AND c.userId = ?';
      params.push(userId);
    }

    const [commissions] = await pool.query<RowDataPacket[]>(
      query + ' ORDER BY c.createdAt DESC',
      params
    );

    // Calculate totals by level
    const levelTotals: Record<number, { count: number; amount: number }> = {};
    commissions.forEach((c: any) => {
      if (!levelTotals[c.level]) {
        levelTotals[c.level] = { count: 0, amount: 0 };
      }
      levelTotals[c.level].count++;
      levelTotals[c.level].amount += parseFloat(c.commission_amount || 0);
    });

    // Calculate totals by type
    const typeTotals: Record<string, { count: number; amount: number }> = {};
    commissions.forEach((c: any) => {
      if (!typeTotals[c.commission_type]) {
        typeTotals[c.commission_type] = { count: 0, amount: 0 };
      }
      typeTotals[c.commission_type].count++;
      typeTotals[c.commission_type].amount += parseFloat(c.commission_amount || 0);
    });

    // Calculate total amount
    const totalAmount = commissions.reduce((sum, c: any) => sum + parseFloat(c.commission_amount || 0), 0);

    // Top earners
    const [topEarners] = await pool.query<RowDataPacket[]>(
      `SELECT
        u.id,
        u.email,
        u.full_name as user_meta,
        SUM(c.commission_amount) as total_commission,
        COUNT(*) as commission_count
      FROM commissions c
      LEFT JOIN users u ON c.userId = u.id
      WHERE 1=1 ${startDate && endDate ? 'AND c.createdAt BETWEEN ? AND ?' : ''}
      GROUP BY u.id, u.email, u.full_name
      ORDER BY total_commission DESC
      LIMIT 10`,
      startDate && endDate ? [startDate, endDate] : []
    );

    res.json({
      totalCommissions: commissions.length,
      totalAmount,
      commissionsByLevel: levelTotals,
      commissionsByType: typeTotals,
      topEarners,
      commissions: commissions.slice(0, 100) // Return last 100 commissions
    });
  } catch (error: any) {
    console.error('Error generating commission report:', error);
    res.status(500).json({ error: 'Failed to generate commission report' });
  }
});

/**
 * GET /api/reports/revenue - Revenue report
 * Query params: startDate, endDate, period (day, week, month)
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, period = 'day' } = req.query;

    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE createdAt BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get total revenue from packages
    const [packageRevenue] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(price) as total,
        COUNT(*) as count
      FROM user_packages
      ${dateFilter}`,
      params
    );

    // Revenue by period
    let dateFormat = '%Y-%m-%d';
    if (period === 'week') {
      dateFormat = '%Y-%u';
    } else if (period === 'month') {
      dateFormat = '%Y-%m';
    }

    const [revenueByPeriod] = await pool.query<RowDataPacket[]>(
      `SELECT
        DATE_FORMAT(createdAt, ?) as period,
        SUM(price) as revenue,
        COUNT(*) as sales
      FROM user_packages
      ${dateFilter}
      GROUP BY period
      ORDER BY period ASC`,
      [dateFormat, ...params]
    );

    // Revenue by package
    const [revenueByPackage] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.package_name,
        SUM(up.price) as revenue,
        COUNT(*) as sales
      FROM user_packages up
      LEFT JOIN packages p ON up.package_id = p.id
      ${dateFilter}
      GROUP BY p.package_name
      ORDER BY revenue DESC`,
      params
    );

    // Total commissions paid out
    const [commissionsQuery] = await pool.query<RowDataPacket[]>(
      `SELECT
        SUM(commission_amount) as total,
        COUNT(*) as count
      FROM commissions
      ${dateFilter}`,
      params
    );

    const totalRevenue = parseFloat(packageRevenue[0]?.total || 0);
    const totalCommissions = parseFloat(commissionsQuery[0]?.total || 0);
    const netRevenue = totalRevenue - totalCommissions;

    res.json({
      totalRevenue,
      totalPackagesSold: packageRevenue[0]?.count || 0,
      totalCommissionsPaid: totalCommissions,
      netRevenue,
      profitMargin: totalRevenue > 0 ? ((netRevenue / totalRevenue) * 100).toFixed(2) : 0,
      revenueByPeriod,
      revenueByPackage
    });
  } catch (error: any) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
});

export default router;
