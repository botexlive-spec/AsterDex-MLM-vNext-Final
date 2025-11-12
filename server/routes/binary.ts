/**
 * Binary Tree API Routes
 * Provides binary tree stats and matching history
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || '';

// Authentication middleware
function authenticateToken(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.use(authenticateToken);

/**
 * GET /api/binary/stats
 * Get user's binary tree statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get binary tree node
    const nodeResult = await query(
      `SELECT
        left_volume,
        right_volume,
        left_unmatched,
        right_unmatched,
        matched_to_date,
        last_matched_at,
        position,
        level
       FROM binary_tree
       WHERE userId = ?
       LIMIT 1`,
      [userId]
    );

    if (nodeResult.rows.length === 0) {
      return res.json({
        has_node: false,
        message: 'Binary tree node not created yet'
      });
    }

    const node = nodeResult.rows[0];

    // Get today's match total
    const today = new Date().toISOString().split('T')[0];
    const todayMatchResult = await query(
      `SELECT COALESCE(SUM(matched_volume), 0) as today_matched
       FROM binary_matches
       WHERE userId = ? AND DATE(createdAt) = ?`,
      [userId, today]
    );

    // Get total matches count
    const matchCountResult = await query(
      `SELECT COUNT(*) as total_matches
       FROM binary_matches
       WHERE userId = ?`,
      [userId]
    );

    // Get total payout from binary
    const payoutResult = await query(
      `SELECT COALESCE(SUM(payout_amount), 0) as total_payout
       FROM binary_matches
       WHERE userId = ?`,
      [userId]
    );

    res.json({
      has_node: true,
      position: node.position,
      level: node.level,
      left_volume: parseFloat(node.left_volume),
      right_volume: parseFloat(node.right_volume),
      left_unmatched: parseFloat(node.left_unmatched),
      right_unmatched: parseFloat(node.right_unmatched),
      matched_to_date: parseFloat(node.matched_to_date),
      last_matched_at: node.last_matched_at,
      today_matched: parseFloat(todayMatchResult.rows[0].today_matched),
      total_matches: parseInt(matchCountResult.rows[0].total_matches),
      total_payout: parseFloat(payoutResult.rows[0].total_payout)
    });

  } catch (error: any) {
    console.error('❌ Binary stats error:', error);
    res.status(500).json({ error: 'Failed to get binary stats' });
  }
});

/**
 * GET /api/binary/matches
 * Get user's binary matching history
 */
router.get('/matches', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query(
      `SELECT
        id,
        matched_volume,
        left_volume_before,
        right_volume_before,
        left_volume_after,
        right_volume_after,
        payout_amount,
        payout_percentage,
        createdAt
       FROM binary_matches
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      matches: result.rows.map(row => ({
        id: row.id,
        matched_volume: parseFloat(row.matched_volume),
        left_volume_before: parseFloat(row.left_volume_before),
        right_volume_before: parseFloat(row.right_volume_before),
        left_volume_after: parseFloat(row.left_volume_after),
        right_volume_after: parseFloat(row.right_volume_after),
        payout_amount: parseFloat(row.payout_amount),
        payout_percentage: parseFloat(row.payout_percentage),
        createdAt: row.createdAt
      })),
      total: result.rows.length
    });

  } catch (error: any) {
    console.error('❌ Binary matches error:', error);
    res.status(500).json({ error: 'Failed to get binary matches' });
  }
});

/**
 * GET /api/binary/tree
 * Get user's binary tree structure (simple view)
 */
router.get('/tree', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get user's node
    const nodeResult = await query(
      `SELECT
        id,
        parent_id,
        left_child_id,
        right_child_id,
        position,
        level
       FROM binary_tree
       WHERE userId = ?
       LIMIT 1`,
      [userId]
    );

    if (nodeResult.rows.length === 0) {
      return res.json({
        has_node: false,
        message: 'Binary tree node not created yet'
      });
    }

    const node = nodeResult.rows[0];

    // Get children info
    const childrenResult = await query(
      `SELECT
        bt.id,
        bt.userId,
        bt.position,
        bt.left_volume,
        bt.right_volume,
        u.email,
        u.full_name
       FROM binary_tree bt
       LEFT JOIN users u ON bt.userId = u.id
       WHERE bt.id IN (?, ?)`,
      [node.left_child_id, node.right_child_id]
    );

    const leftChild = childrenResult.rows.find((r: any) => r.id === node.left_child_id);
    const rightChild = childrenResult.rows.find((r: any) => r.id === node.right_child_id);

    res.json({
      has_node: true,
      node: {
        id: node.id,
        parent_id: node.parent_id,
        position: node.position,
        level: node.level,
        left_child: leftChild ? {
          userId: leftChild.userId,
          email: leftChild.email,
          full_name: leftChild.full_name,
          left_volume: parseFloat(leftChild.left_volume),
          right_volume: parseFloat(leftChild.right_volume)
        } : null,
        right_child: rightChild ? {
          userId: rightChild.userId,
          email: rightChild.email,
          full_name: rightChild.full_name,
          left_volume: parseFloat(rightChild.left_volume),
          right_volume: parseFloat(rightChild.right_volume)
        } : null
      }
    });

  } catch (error: any) {
    console.error('❌ Binary tree error:', error);
    res.status(500).json({ error: 'Failed to get binary tree' });
  }
});

export default router;
