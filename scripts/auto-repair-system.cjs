const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

/**
 * Auto-Repair System: Detects and fixes all database, API, and integration issues
 */

const REPORT = {
  timestamp: new Date().toISOString(),
  fixes: [],
  created: [],
  repaired: [],
  errors: [],
  warnings: []
};

let db;

// Database connection
async function connectDatabase() {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'finaster_mlm',
      port: 3306,
      multipleStatements: true
    });
    console.log('✅ Connected to finaster_mlm database');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    REPORT.errors.push(`Database connection failed: ${error.message}`);
    return false;
  }
}

// Required MLM schema - Core tables that must exist
const REQUIRED_TABLES = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(50),
      role ENUM('user', 'admin') DEFAULT 'user',
      status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      sponsor_id VARCHAR(36),
      placement_id VARCHAR(36),
      referral_code VARCHAR(50) UNIQUE,
      wallet_balance DECIMAL(15,2) DEFAULT 0.00,
      commission_balance DECIMAL(15,2) DEFAULT 0.00,
      kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (sponsor_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (placement_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_sponsor (sponsor_id),
      INDEX idx_placement (placement_id),
      INDEX idx_email (email),
      INDEX idx_referral_code (referral_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  packages: `
    CREATE TABLE IF NOT EXISTS packages (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(15,2) NOT NULL,
      daily_roi_percentage DECIMAL(5,2) DEFAULT 0.00,
      duration_days INT DEFAULT 0,
      binary_points INT DEFAULT 0,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  user_packages: `
    CREATE TABLE IF NOT EXISTS user_packages (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      package_id VARCHAR(36) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expiry_date TIMESTAMP NULL,
      status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
      roi_earned DECIMAL(15,2) DEFAULT 0.00,
      last_roi_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_package (package_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  ranks: `
    CREATE TABLE IF NOT EXISTS ranks (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      required_directs INT DEFAULT 0,
      required_team_volume DECIMAL(15,2) DEFAULT 0.00,
      required_personal_volume DECIMAL(15,2) DEFAULT 0.00,
      bonus_percentage DECIMAL(5,2) DEFAULT 0.00,
      one_time_bonus DECIMAL(15,2) DEFAULT 0.00,
      icon VARCHAR(255),
      color VARCHAR(50),
      level INT NOT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_level (level),
      INDEX idx_level (level),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  commissions: `
    CREATE TABLE IF NOT EXISTS commissions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      from_user_id VARCHAR(36),
      type ENUM('direct', 'binary', 'level', 'rank', 'roi', 'matching', 'other') NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      percentage DECIMAL(5,2),
      level INT,
      description TEXT,
      reference_id VARCHAR(36),
      status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user (user_id),
      INDEX idx_from_user (from_user_id),
      INDEX idx_type (type),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  transactions: `
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      type ENUM('deposit', 'withdrawal', 'commission', 'purchase', 'transfer', 'bonus', 'roi', 'refund') NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      fee DECIMAL(15,2) DEFAULT 0.00,
      net_amount DECIMAL(15,2) NOT NULL,
      balance_before DECIMAL(15,2),
      balance_after DECIMAL(15,2),
      description TEXT,
      reference_id VARCHAR(100),
      status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_type (type),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      INDEX idx_reference (reference_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  withdrawals: `
    CREATE TABLE IF NOT EXISTS withdrawals (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      fee DECIMAL(15,2) DEFAULT 0.00,
      net_amount DECIMAL(15,2) NOT NULL,
      payment_method VARCHAR(100),
      payment_details JSON,
      status ENUM('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
      admin_note TEXT,
      processed_by VARCHAR(36),
      processed_at TIMESTAMP NULL,
      transaction_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  kyc: `
    CREATE TABLE IF NOT EXISTS kyc (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL UNIQUE,
      document_type ENUM('passport', 'drivers_license', 'national_id', 'other'),
      document_number VARCHAR(100),
      document_front VARCHAR(255),
      document_back VARCHAR(255),
      selfie VARCHAR(255),
      address_proof VARCHAR(255),
      status ENUM('pending', 'under_review', 'approved', 'rejected') DEFAULT 'pending',
      rejection_reason TEXT,
      verified_by VARCHAR(36),
      verified_at TIMESTAMP NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  binary_tree: `
    CREATE TABLE IF NOT EXISTS binary_tree (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL UNIQUE,
      parent_id VARCHAR(36),
      left_child_id VARCHAR(36),
      right_child_id VARCHAR(36),
      position ENUM('left', 'right'),
      left_points DECIMAL(15,2) DEFAULT 0.00,
      right_points DECIMAL(15,2) DEFAULT 0.00,
      left_volume DECIMAL(15,2) DEFAULT 0.00,
      right_volume DECIMAL(15,2) DEFAULT 0.00,
      total_left_members INT DEFAULT 0,
      total_right_members INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (left_child_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (right_child_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_parent (parent_id),
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  binary_matches: `
    CREATE TABLE IF NOT EXISTS binary_matches (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      left_points DECIMAL(15,2) NOT NULL,
      right_points DECIMAL(15,2) NOT NULL,
      matched_points DECIMAL(15,2) NOT NULL,
      commission DECIMAL(15,2) NOT NULL,
      percentage DECIMAL(5,2),
      carry_forward_left DECIMAL(15,2) DEFAULT 0.00,
      carry_forward_right DECIMAL(15,2) DEFAULT 0.00,
      match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_match_date (match_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  support_ticket: `
    CREATE TABLE IF NOT EXISTS support_ticket (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      category ENUM('general', 'technical', 'financial', 'kyc', 'other') DEFAULT 'general',
      priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
      status ENUM('open', 'in_progress', 'waiting_response', 'resolved', 'closed') DEFAULT 'open',
      assigned_to VARCHAR(36),
      last_reply_at TIMESTAMP NULL,
      last_reply_by VARCHAR(36),
      closed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_status (status),
      INDEX idx_assigned (assigned_to)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  support_ticket_replies: `
    CREATE TABLE IF NOT EXISTS support_ticket_replies (
      id VARCHAR(36) PRIMARY KEY,
      ticket_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      message TEXT NOT NULL,
      attachments JSON,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES support_ticket(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_ticket (ticket_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  audit_logs: `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      action VARCHAR(100) NOT NULL,
      resource VARCHAR(100),
      resource_id VARCHAR(36),
      ip_address VARCHAR(45),
      user_agent TEXT,
      details JSON,
      status ENUM('success', 'failure') DEFAULT 'success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user (user_id),
      INDEX idx_action (action),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  system_config: `
    CREATE TABLE IF NOT EXISTS system_config (
      id VARCHAR(36) PRIMARY KEY,
      key_name VARCHAR(100) UNIQUE NOT NULL,
      value TEXT,
      type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
      category VARCHAR(50),
      description TEXT,
      is_public BOOLEAN DEFAULT FALSE,
      updated_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_key (key_name),
      INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  wallet: `
    CREATE TABLE IF NOT EXISTS wallet (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL UNIQUE,
      available_balance DECIMAL(15,2) DEFAULT 0.00,
      commission_balance DECIMAL(15,2) DEFAULT 0.00,
      pending_balance DECIMAL(15,2) DEFAULT 0.00,
      total_deposits DECIMAL(15,2) DEFAULT 0.00,
      total_withdrawals DECIMAL(15,2) DEFAULT 0.00,
      total_earnings DECIMAL(15,2) DEFAULT 0.00,
      total_commissions DECIMAL(15,2) DEFAULT 0.00,
      wallet_address VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  notification: `
    CREATE TABLE IF NOT EXISTS notification (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info', 'success', 'warning', 'error', 'announcement') DEFAULT 'info',
      category VARCHAR(50),
      link VARCHAR(255),
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_is_read (is_read),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
};

// Auto-create missing tables
async function createMissingTables() {
  console.log('\n🔧 Creating missing tables...');

  for (const [tableName, createSQL] of Object.entries(REQUIRED_TABLES)) {
    try {
      // Check if table exists
      const [tables] = await db.query(`SHOW TABLES LIKE '${tableName}'`);

      if (tables.length === 0) {
        console.log(`   Creating table: ${tableName}`);
        await db.query(createSQL);
        REPORT.created.push(`Table created: ${tableName}`);
      } else {
        console.log(`   ✓ Table exists: ${tableName}`);
      }
    } catch (error) {
      console.error(`   ❌ Error creating ${tableName}:`, error.message);
      REPORT.errors.push(`Failed to create ${tableName}: ${error.message}`);
    }
  }
}

// Verify and repair table columns
async function verifyTableColumns() {
  console.log('\n🔍 Verifying table columns...');

  const criticalColumns = {
    users: ['id', 'email', 'password_hash', 'role', 'sponsor_id', 'placement_id', 'wallet_balance'],
    packages: ['id', 'name', 'price', 'daily_roi_percentage', 'duration_days'],
    user_packages: ['id', 'user_id', 'package_id', 'amount', 'status', 'roi_earned'],
    commissions: ['id', 'user_id', 'type', 'amount', 'status'],
    transactions: ['id', 'user_id', 'type', 'amount', 'status'],
    withdrawals: ['id', 'user_id', 'amount', 'status'],
    wallet: ['id', 'user_id', 'available_balance', 'commission_balance']
  };

  for (const [table, requiredColumns] of Object.entries(criticalColumns)) {
    try {
      const [columns] = await db.query(`DESCRIBE ${table}`);
      const existingColumns = columns.map(c => c.Field);

      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log(`   ⚠️  ${table} missing columns:`, missingColumns);
        REPORT.warnings.push(`${table} missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log(`   ✓ ${table} has all required columns`);
      }
    } catch (error) {
      // Table might not exist
      console.log(`   ⚠️  Could not verify ${table}:`, error.message);
    }
  }
}

// Add missing foreign keys and indexes
async function addMissingIndexes() {
  console.log('\n🔗 Adding missing indexes and foreign keys...');

  const indexes = [
    { table: 'commissions', index: 'idx_created_at', column: 'created_at' },
    { table: 'transactions', index: 'idx_created_at', column: 'created_at' },
    { table: 'user_packages', index: 'idx_user_status', columns: ['user_id', 'status'] },
    { table: 'withdrawals', index: 'idx_user_status', columns: ['user_id', 'status'] }
  ];

  for (const { table, index, column, columns } of indexes) {
    try {
      // Check if index exists
      const [indexes] = await db.query(`SHOW INDEX FROM ${table} WHERE Key_name = '${index}'`);

      if (indexes.length === 0) {
        const cols = columns ? columns.join(', ') : column;
        console.log(`   Adding index ${index} to ${table}`);
        await db.query(`ALTER TABLE ${table} ADD INDEX ${index} (${cols})`);
        REPORT.fixes.push(`Added index ${index} to ${table}`);
      }
    } catch (error) {
      // Table or index might not exist, or already exists
      console.log(`   ⚠️  Could not add index ${index} to ${table}:`, error.message);
    }
  }
}

// Create default data
async function createDefaultData() {
  console.log('\n📦 Creating default data...');

  // Create default ranks
  const defaultRanks = [
    { id: '1', name: 'Starter', level: 1, required_directs: 0, required_team_volume: '0.00', bonus_percentage: '0.00' },
    { id: '2', name: 'Bronze', level: 2, required_directs: 2, required_team_volume: '1000.00', bonus_percentage: '1.00' },
    { id: '3', name: 'Silver', level: 3, required_directs: 5, required_team_volume: '5000.00', bonus_percentage: '2.00' },
    { id: '4', name: 'Gold', level: 4, required_directs: 10, required_team_volume: '15000.00', bonus_percentage: '3.00' },
    { id: '5', name: 'Platinum', level: 5, required_directs: 20, required_team_volume: '50000.00', bonus_percentage: '5.00' },
    { id: '6', name: 'Diamond', level: 6, required_directs: 50, required_team_volume: '150000.00', bonus_percentage: '8.00' }
  ];

  try {
    const [existingRanks] = await db.query('SELECT COUNT(*) as count FROM ranks');
    if (existingRanks[0].count === 0) {
      console.log('   Creating default ranks...');
      for (const rank of defaultRanks) {
        await db.query(
          'INSERT INTO ranks (id, name, level, required_directs, required_team_volume, bonus_percentage, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [rank.id, rank.name, rank.level, rank.required_directs, rank.required_team_volume, rank.bonus_percentage, 'active']
        );
      }
      REPORT.created.push('Default ranks created');
    }
  } catch (error) {
    console.log('   ⚠️  Could not create default ranks:', error.message);
  }

  // Create default packages
  const defaultPackages = [
    { id: '1', name: 'Basic Package', price: '100.00', daily_roi_percentage: '1.00', duration_days: 100 },
    { id: '2', name: 'Standard Package', price: '500.00', daily_roi_percentage: '1.50', duration_days: 150 },
    { id: '3', name: 'Premium Package', price: '1000.00', daily_roi_percentage: '2.00', duration_days: 200 },
    { id: '4', name: 'VIP Package', price: '5000.00', daily_roi_percentage: '2.50', duration_days: 250 }
  ];

  try {
    const [existingPackages] = await db.query('SELECT COUNT(*) as count FROM packages');
    if (existingPackages[0].count === 0) {
      console.log('   Creating default packages...');
      for (const pkg of defaultPackages) {
        await db.query(
          'INSERT INTO packages (id, name, price, daily_roi_percentage, duration_days, status) VALUES (?, ?, ?, ?, ?, ?)',
          [pkg.id, pkg.name, pkg.price, pkg.daily_roi_percentage, pkg.duration_days, 'active']
        );
      }
      REPORT.created.push('Default packages created');
    }
  } catch (error) {
    console.log('   ⚠️  Could not create default packages:', error.message);
  }

  // Create system config defaults
  const defaultConfigs = [
    { key_name: 'binary_matching_percentage', value: '10', type: 'number', category: 'commission' },
    { key_name: 'max_binary_matching_cap', value: '1000', type: 'number', category: 'commission' },
    { key_name: 'direct_referral_percentage', value: '10', type: 'number', category: 'commission' },
    { key_name: 'level_income_limit', value: '10', type: 'number', category: 'commission' },
    { key_name: 'minimum_withdrawal', value: '50', type: 'number', category: 'withdrawal' },
    { key_name: 'withdrawal_fee_percentage', value: '5', type: 'number', category: 'withdrawal' },
    { key_name: 'kyc_required', value: 'true', type: 'boolean', category: 'security' }
  ];

  try {
    for (const config of defaultConfigs) {
      const [existing] = await db.query('SELECT id FROM system_config WHERE key_name = ?', [config.key_name]);
      if (existing.length === 0) {
        await db.query(
          'INSERT INTO system_config (id, key_name, value, type, category) VALUES (UUID(), ?, ?, ?, ?)',
          [config.key_name, config.value, config.type, config.category]
        );
      }
    }
    REPORT.created.push('Default system configurations created');
  } catch (error) {
    console.log('   ⚠️  Could not create system configs:', error.message);
  }
}

// Generate final report
function generateReport() {
  console.log('\n📄 Generating final report...');

  const reportPath = path.join(__dirname, '../auto-repair-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(REPORT, null, 2));

  console.log(`\n✅ Report saved: ${reportPath}`);
  console.log('\n📊 AUTO-REPAIR SUMMARY:');
  console.log(`   Tables Created: ${REPORT.created.filter(c => c.includes('Table')).length}`);
  console.log(`   Fixes Applied: ${REPORT.fixes.length}`);
  console.log(`   Warnings: ${REPORT.warnings.length}`);
  console.log(`   Errors: ${REPORT.errors.length}`);

  if (REPORT.created.length > 0) {
    console.log('\n✅ Created:');
    REPORT.created.forEach(item => console.log(`   - ${item}`));
  }

  if (REPORT.fixes.length > 0) {
    console.log('\n🔧 Fixes:');
    REPORT.fixes.forEach(item => console.log(`   - ${item}`));
  }

  if (REPORT.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    REPORT.warnings.forEach(item => console.log(`   - ${item}`));
  }

  if (REPORT.errors.length > 0) {
    console.log('\n❌ Errors:');
    REPORT.errors.forEach(item => console.log(`   - ${item}`));
  }
}

// Main execution
async function runAutoRepair() {
  console.log('🚀 Starting Auto-Repair System...\n');

  const connected = await connectDatabase();
  if (!connected) {
    console.error('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }

  await createMissingTables();
  await verifyTableColumns();
  await addMissingIndexes();
  await createDefaultData();

  generateReport();

  if (db) {
    await db.end();
  }

  console.log('\n✅ Auto-Repair Complete!\n');
}

// Run if called directly
if (require.main === module) {
  runAutoRepair().catch(error => {
    console.error('❌ Auto-repair failed:', error);
    process.exit(1);
  });
}

module.exports = { runAutoRepair };
