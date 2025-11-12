const mysql = require('mysql2/promise');

/**
 * Schema Alignment Script
 * Aligns existing database schema with application requirements
 */

const MIGRATIONS = [];

let db;

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
    console.log('✅ Connected to database');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('\n🔧 Running schema alignments...\n');

  // 1. Add placement_id to users table
  try {
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS placement_id VARCHAR(36) NULL AFTER sponsor_id,
      ADD INDEX IF NOT EXISTS idx_placement (placement_id)
    `);
    console.log('✓ Added placement_id to users table');
    MIGRATIONS.push('Added placement_id to users');
  } catch (error) {
    console.log(`⚠️  placement_id: ${error.message}`);
  }

  // 2. Add price column to packages (as alias for min_investment)
  try {
    await db.query(`
      ALTER TABLE packages
      ADD COLUMN IF NOT EXISTS price DECIMAL(15,6) NULL AFTER name
    `);
    // Update price from min_investment
    await db.query(`
      UPDATE packages SET price = min_investment WHERE price IS NULL
    `);
    console.log('✓ Added price column to packages');
    MIGRATIONS.push('Added price to packages');
  } catch (error) {
    console.log(`⚠️  price column: ${error.message}`);
  }

  // 3. Add missing columns to user_packages
  try {
    await db.query(`
      ALTER TABLE user_packages
      ADD COLUMN IF NOT EXISTS amount DECIMAL(15,6) DEFAULT 0.00 AFTER package_id,
      ADD COLUMN IF NOT EXISTS roi_earned DECIMAL(15,6) DEFAULT 0.00 AFTER status
    `);
    // Update amount from existing invested_amount if exists
    const [columns] = await db.query(`SHOW COLUMNS FROM user_packages LIKE 'invested_amount'`);
    if (columns.length > 0) {
      await db.query(`UPDATE user_packages SET amount = invested_amount WHERE amount = 0`);
    }
    console.log('✓ Added amount and roi_earned to user_packages');
    MIGRATIONS.push('Added amount and roi_earned to user_packages');
  } catch (error) {
    console.log(`⚠️  user_packages columns: ${error.message}`);
  }

  // 4. Fix commissions table
  try {
    const [typeColumn] = await db.query(`SHOW COLUMNS FROM commissions LIKE 'type'`);
    if (typeColumn.length === 0) {
      await db.query(`
        ALTER TABLE commissions
        ADD COLUMN type ENUM('direct', 'binary', 'level', 'rank', 'roi', 'matching', 'other') DEFAULT 'other' AFTER from_user_id
      `);
      console.log('✓ Added type column to commissions');
      MIGRATIONS.push('Added type to commissions');
    }

    const [statusColumn] = await db.query(`SHOW COLUMNS FROM commissions LIKE 'status'`);
    if (statusColumn.length === 0) {
      await db.query(`
        ALTER TABLE commissions
        ADD COLUMN status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'approved'
      `);
      console.log('✓ Added status column to commissions');
      MIGRATIONS.push('Added status to commissions');
    }
  } catch (error) {
    console.log(`⚠️  commissions columns: ${error.message}`);
  }

  // 5. Add amount column to withdrawals (as alias for requested_amount)
  try {
    await db.query(`
      ALTER TABLE withdrawals
      ADD COLUMN IF NOT EXISTS amount DECIMAL(15,6) NULL AFTER user_id
    `);
    await db.query(`
      UPDATE withdrawals SET amount = requested_amount WHERE amount IS NULL
    `);
    console.log('✓ Added amount to withdrawals');
    MIGRATIONS.push('Added amount to withdrawals');
  } catch (error) {
    console.log(`⚠️  withdrawals amount: ${error.message}`);
  }

  // 6. Create wallet view for compatibility
  try {
    await db.query(`DROP VIEW IF EXISTS wallet_compat`);
    await db.query(`
      CREATE VIEW wallet_compat AS
      SELECT
        id,
        userId as user_id,
        balance as available_balance,
        balance as commission_balance,
        inOrder as pending_balance,
        balance as total_deposits,
        0 as total_withdrawals,
        0 as total_earnings,
        0 as total_commissions,
        createdAt as created_at,
        updatedAt as updated_at
      FROM wallet
      WHERE type = 'FIAT'
    `);
    console.log('✓ Created wallet compatibility view');
    MIGRATIONS.push('Created wallet_compat view');
  } catch (error) {
    console.log(`⚠️  wallet view: ${error.message}`);
  }

  // 7. Ensure mlm_binary_node table has proper structure
  try {
    const [table] = await db.query(`SHOW TABLES LIKE 'mlm_binary_node'`);
    if (table.length > 0) {
      // Check and add missing columns
      const [columns] = await db.query(`DESCRIBE mlm_binary_node`);
      const columnNames = columns.map(c => c.Field);

      if (!columnNames.includes('left_volume')) {
        await db.query(`ALTER TABLE mlm_binary_node ADD COLUMN left_volume DECIMAL(15,6) DEFAULT 0.00`);
      }
      if (!columnNames.includes('right_volume')) {
        await db.query(`ALTER TABLE mlm_binary_node ADD COLUMN right_volume DECIMAL(15,6) DEFAULT 0.00`);
      }
      if (!columnNames.includes('total_left_members')) {
        await db.query(`ALTER TABLE mlm_binary_node ADD COLUMN total_left_members INT DEFAULT 0`);
      }
      if (!columnNames.includes('total_right_members')) {
        await db.query(`ALTER TABLE mlm_binary_node ADD COLUMN total_right_members INT DEFAULT 0`);
      }
      console.log('✓ Updated mlm_binary_node structure');
      MIGRATIONS.push('Updated mlm_binary_node structure');
    }
  } catch (error) {
    console.log(`⚠️  mlm_binary_node: ${error.message}`);
  }

  // 8. Create support_ticket_replies table properly
  try {
    // Drop if exists with wrong foreign key
    await db.query(`DROP TABLE IF EXISTS support_ticket_replies`);

    // Get the actual id column type from support_ticket
    const [ticketCols] = await db.query(`DESCRIBE support_ticket`);
    const idCol = ticketCols.find(c => c.Field === 'id');
    const idType = idCol ? idCol.Type : 'VARCHAR(36)';

    await db.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_replies (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        ticket_id ${idType} NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        message TEXT NOT NULL,
        attachments JSON,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ticket (ticket_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (ticket_id) REFERENCES support_ticket(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Created support_ticket_replies table');
    MIGRATIONS.push('Created support_ticket_replies table');
  } catch (error) {
    console.log(`⚠️  support_ticket_replies: ${error.message}`);
  }

  // 9. Create transactions table if needed
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        type ENUM('deposit', 'withdrawal', 'commission', 'purchase', 'transfer', 'bonus', 'roi', 'refund') NOT NULL,
        amount DECIMAL(15,6) NOT NULL,
        fee DECIMAL(15,6) DEFAULT 0.00,
        net_amount DECIMAL(15,6) NOT NULL,
        balance_before DECIMAL(15,6),
        balance_after DECIMAL(15,6),
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Ensured transactions table exists');
    MIGRATIONS.push('Ensured transactions table exists');
  } catch (error) {
    console.log(`⚠️  transactions table: ${error.message}`);
  }

  // 10. Create mlm_transactions if doesn't exist
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS mlm_transactions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        transaction_type ENUM('investment', 'commission', 'withdrawal', 'bonus', 'roi', 'transfer') NOT NULL,
        amount DECIMAL(15,6) NOT NULL,
        balance_before DECIMAL(15,6),
        balance_after DECIMAL(15,6),
        description TEXT,
        reference_id VARCHAR(100),
        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_type (transaction_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Ensured mlm_transactions table exists');
    MIGRATIONS.push('Ensured mlm_transactions table exists');
  } catch (error) {
    console.log(`⚠️  mlm_transactions: ${error.message}`);
  }

  // 11. Fix system_config table
  try {
    const [columns] = await db.query(`DESCRIBE system_config`);
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('key_name')) {
      // Rename 'key' to 'key_name' if exists
      if (columnNames.includes('key')) {
        await db.query(`ALTER TABLE system_config CHANGE COLUMN \`key\` key_name VARCHAR(100) UNIQUE NOT NULL`);
        console.log('✓ Renamed key to key_name in system_config');
      } else {
        await db.query(`ALTER TABLE system_config ADD COLUMN key_name VARCHAR(100) UNIQUE NOT NULL`);
        console.log('✓ Added key_name to system_config');
      }
      MIGRATIONS.push('Fixed system_config key_name column');
    }
  } catch (error) {
    console.log(`⚠️  system_config: ${error.message}`);
  }

  // 12. Create default ranks if not exist
  try {
    const [ranks] = await db.query(`SELECT COUNT(*) as count FROM ranks`);
    if (ranks[0].count === 0) {
      const defaultRanks = [
        ['1', 'Starter', 'Entry level rank', 1, 0, 0, 0, 0, 0],
        ['2', 'Bronze', 'Bronze level rank', 2, 2, 1000, 500, 1, 100],
        ['3', 'Silver', 'Silver level rank', 3, 5, 5000, 2000, 2, 500],
        ['4', 'Gold', 'Gold level rank', 4, 10, 15000, 5000, 3, 1500],
        ['5', 'Platinum', 'Platinum level rank', 5, 20, 50000, 15000, 5, 5000],
        ['6', 'Diamond', 'Diamond level rank', 6, 50, 150000, 50000, 8, 15000]
      ];

      for (const rank of defaultRanks) {
        await db.query(`
          INSERT INTO ranks (id, name, description, level, required_directs, required_team_volume, required_personal_volume, bonus_percentage, one_time_bonus, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, rank);
      }
      console.log('✓ Created default ranks');
      MIGRATIONS.push('Created default ranks');
    }
  } catch (error) {
    console.log(`⚠️  default ranks: ${error.message}`);
  }

  // 13. Create default packages if not exist
  try {
    const [packages] = await db.query(`SELECT COUNT(*) as count FROM packages`);
    if (packages[0].count === 0) {
      const defaultPackages = [
        ['Basic Package', 100, 500, 1.0, 100, '{"1":10,"2":5,"3":3,"4":2,"5":1}', 10],
        ['Standard Package', 500, 2000, 1.5, 150, '{"1":10,"2":5,"3":3,"4":2,"5":1}', 10],
        ['Premium Package', 2000, 10000, 2.0, 200, '{"1":10,"2":5,"3":3,"4":2,"5":1}', 10],
        ['VIP Package', 10000, 100000, 2.5, 250, '{"1":10,"2":5,"3":3,"4":2,"5":1}', 10]
      ];

      for (const pkg of defaultPackages) {
        await db.query(`
          INSERT INTO packages (name, min_investment, max_investment, daily_roi_percentage, duration_days, level_income_percentages, matching_bonus_percentage, price, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [...pkg, pkg[1]]); // Set price = min_investment
      }
      console.log('✓ Created default packages');
      MIGRATIONS.push('Created default packages');
    }
  } catch (error) {
    console.log(`⚠️  default packages: ${error.message}`);
  }
}

async function verifySchema() {
  console.log('\n✅ Verifying schema...\n');

  const checks = [
    { table: 'users', columns: ['id', 'email', 'sponsor_id', 'placement_id', 'wallet_balance'] },
    { table: 'packages', columns: ['id', 'name', 'price', 'daily_roi_percentage'] },
    { table: 'user_packages', columns: ['id', 'user_id', 'package_id', 'amount', 'roi_earned'] },
    { table: 'commissions', columns: ['id', 'user_id', 'type', 'amount', 'status'] },
    { table: 'transactions', columns: ['id', 'user_id', 'type', 'amount', 'status'] },
    { table: 'withdrawals', columns: ['id', 'user_id', 'amount', 'status'] },
    { table: 'ranks', columns: ['id', 'name', 'level'] },
    { table: 'binary_tree', columns: ['id', 'user_id', 'parent_id'] }
  ];

  for (const check of checks) {
    try {
      const [columns] = await db.query(`DESCRIBE ${check.table}`);
      const existingColumns = columns.map(c => c.Field);
      const hasAll = check.columns.every(col => existingColumns.includes(col));

      if (hasAll) {
        console.log(`✓ ${check.table} - All required columns present`);
      } else {
        const missing = check.columns.filter(col => !existingColumns.includes(col));
        console.log(`⚠️  ${check.table} - Missing: ${missing.join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ ${check.table} - ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Schema Alignment...\n');

  const connected = await connectDatabase();
  if (!connected) {
    console.error('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }

  await runMigrations();
  await verifySchema();

  console.log(`\n✅ Schema alignment complete! Applied ${MIGRATIONS.length} migrations.\n`);

  if (db) {
    await db.end();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Schema alignment failed:', error);
    process.exit(1);
  });
}

module.exports = { main };
