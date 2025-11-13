/**
 * Fix Impersonation Tables Schema
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'finaster_mlm'
};

async function main() {
  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    console.log('🔧 Fixing impersonation tables schema...\n');

    // Create audit_logs table if it doesn't exist
    console.log('Checking audit_logs table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        userId VARCHAR(36) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        target_user_id VARCHAR(36),
        metadata JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userId (userId),
        INDEX idx_action (action),
        INDEX idx_createdAt (createdAt),
        INDEX idx_target_user (target_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ audit_logs table ready\n');

    // Create impersonation_sessions table if it doesn't exist
    console.log('Checking impersonation_sessions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS impersonation_sessions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        admin_id VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        reason TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_admin (admin_id),
        INDEX idx_user (userId),
        INDEX idx_active (is_active),
        INDEX idx_started (started_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ impersonation_sessions table ready\n');

    // Verify tables exist
    const [auditLogs] = await connection.query(
      "SHOW TABLES LIKE 'audit_logs'"
    );
    const [impersonationSessions] = await connection.query(
      "SHOW TABLES LIKE 'impersonation_sessions'"
    );

    console.log('\n✅ Impersonation tables are ready!');
    console.log('   - audit_logs:', auditLogs.length > 0 ? 'EXISTS' : 'MISSING');
    console.log('   - impersonation_sessions:', impersonationSessions.length > 0 ? 'EXISTS' : 'MISSING');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
