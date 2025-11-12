const mysql = require('mysql2/promise');

let db;
const FIXES = [];

async function connectDatabase() {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'finaster_mlm',
    port: 3306
  });
  console.log('✅ Connected to database\n');
}

async function columnExists(table, column) {
  const [columns] = await db.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
  return columns.length > 0;
}

async function addColumnIfMissing(table, column, definition, after = null) {
  const exists = await columnExists(table, column);
  if (!exists) {
    const afterClause = after ? `AFTER ${after}` : '';
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition} ${afterClause}`);
    console.log(`✓ Added ${column} to ${table}`);
    FIXES.push(`Added ${column} to ${table}`);
    return true;
  }
  return false;
}

async function main() {
  console.log('🔧 Fixing Missing Columns...\n');

  await connectDatabase();

  // 1. Add placement_id to users
  try {
    await addColumnIfMissing('users', 'placement_id', 'VARCHAR(36) NULL', 'sponsor_id');
  } catch (e) {
    console.log(`⚠️  placement_id: ${e.message}`);
  }

  // 2. Add price to packages
  try {
    const added = await addColumnIfMissing('packages', 'price', 'DECIMAL(15,6) NULL', 'name');
    if (added) {
      await db.query(`UPDATE packages SET price = min_investment WHERE price IS NULL`);
      console.log('✓ Updated price from min_investment');
    }
  } catch (e) {
    console.log(`⚠️  price: ${e.message}`);
  }

  // 3. Add amount and roi_earned to user_packages
  try {
    await addColumnIfMissing('user_packages', 'amount', 'DECIMAL(15,6) DEFAULT 0.00', 'package_id');
    await addColumnIfMissing('user_packages', 'roi_earned', 'DECIMAL(15,6) DEFAULT 0.00', 'status');

    // Try to update amount from invested_amount if it exists
    const hasInvestedAmount = await columnExists('user_packages', 'invested_amount');
    if (hasInvestedAmount) {
      await db.query(`UPDATE user_packages SET amount = invested_amount WHERE amount = 0`);
      console.log('✓ Updated amount from invested_amount');
    }
  } catch (e) {
    console.log(`⚠️  user_packages: ${e.message}`);
  }

  // 4. Add amount to withdrawals
  try {
    const added = await addColumnIfMissing('withdrawals', 'amount', 'DECIMAL(15,6) NULL', 'user_id');
    if (added) {
      await db.query(`UPDATE withdrawals SET amount = requested_amount WHERE amount IS NULL`);
      console.log('✓ Updated amount from requested_amount');
    }
  } catch (e) {
    console.log(`⚠️  withdrawals amount: ${e.message}`);
  }

  // 5. Add level to ranks if missing
  try {
    await addColumnIfMissing('ranks', 'level', 'INT NOT NULL DEFAULT 0', 'name');
  } catch (e) {
    console.log(`⚠️  ranks level: ${e.message}`);
  }

  // 6. Fix support_ticket_replies
  try {
    // Drop and recreate with correct foreign key
    await db.query(`DROP TABLE IF EXISTS support_ticket_replies`);

    // Get support_ticket id column type
    const [ticketCols] = await db.query(`DESCRIBE support_ticket`);
    const idCol = ticketCols.find(c => c.Field === 'id');
    const idType = idCol.Type.toUpperCase();

    await db.query(`
      CREATE TABLE support_ticket_replies (
        id ${idType} PRIMARY KEY DEFAULT (UUID()),
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
    console.log('✓ Recreated support_ticket_replies table');
    FIXES.push('Recreated support_ticket_replies');
  } catch (e) {
    console.log(`⚠️  support_ticket_replies: ${e.message}`);
  }

  // 7. Add indexes
  try {
    const [indexes] = await db.query(`SHOW INDEX FROM users WHERE Key_name = 'idx_placement'`);
    if (indexes.length === 0) {
      await db.query(`ALTER TABLE users ADD INDEX idx_placement (placement_id)`);
      console.log('✓ Added idx_placement index');
      FIXES.push('Added idx_placement index');
    }
  } catch (e) {
    console.log(`⚠️  index: ${e.message}`);
  }

  console.log(`\n✅ Complete! Applied ${FIXES.length} fixes:\n`);
  FIXES.forEach(fix => console.log(`   - ${fix}`));

  await db.end();
}

main().catch(console.error);
