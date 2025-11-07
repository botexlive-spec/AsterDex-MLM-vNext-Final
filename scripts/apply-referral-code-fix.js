/**
 * Apply referral_code column size fix to live database
 */
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function applyFix() {
  try {
    console.log('🔧 Applying referral_code column fix...\n');

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'finaster_mlm',
    });

    console.log('✅ Connected to MySQL\n');

    // Check current column size
    console.log('📊 Current referral_code column definition:');
    const [currentSchema] = await connection.query(
      `SELECT COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'referral_code'`,
      [process.env.MYSQL_DATABASE || 'finaster_mlm']
    );
    console.table(currentSchema);

    // Apply the fix
    console.log('\n🔄 Applying ALTER TABLE...');
    await connection.query('ALTER TABLE users MODIFY COLUMN referral_code VARCHAR(255) NULL');
    console.log('✅ Column altered successfully!\n');

    // Verify the change
    console.log('📊 Updated referral_code column definition:');
    const [updatedSchema] = await connection.query(
      `SELECT COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'referral_code'`,
      [process.env.MYSQL_DATABASE || 'finaster_mlm']
    );
    console.table(updatedSchema);

    await connection.end();
    console.log('\n✅ Fix applied successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error applying fix:', error.message);
    process.exit(1);
  }
}

applyFix();
