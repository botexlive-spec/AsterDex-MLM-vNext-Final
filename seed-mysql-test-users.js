/**
 * MySQL Test Data Seeder
 * Creates test admin and users for the Finaster MLM platform
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DATABASE || 'finaster_mlm',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
};

// Helper to generate UUID (MySQL compatible)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to generate referral code
function generateReferralCode() {
  return 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function seedDatabase() {
  let connection;

  try {
    console.log('🌱 Starting MySQL database seeding...\n');
    console.log('📊 Database Config:');
    console.log(`   Host: ${DB_CONFIG.host}`);
    console.log(`   Port: ${DB_CONFIG.port}`);
    console.log(`   Database: ${DB_CONFIG.database}\n`);

    // Create connection
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to MySQL database\n');

    // Check if admin already exists
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      ['admin@asterdex.com']
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists: admin@asterdex.com');
      console.log('🔑 Use password: admin123\n');
    } else {
      // Create admin user
      console.log('1️⃣ Creating admin user...');
      const adminId = generateUUID();
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      const adminReferralCode = generateReferralCode();

      await connection.execute(`
        INSERT INTO users (
          id, email, password_hash, full_name, role,
          referral_code, wallet_balance, total_investment, total_earnings,
          current_rank, kyc_status, email_verified, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        adminId,
        'admin@asterdex.com',
        adminPasswordHash,
        'System Administrator',
        'admin',
        adminReferralCode,
        1000000, // wallet_balance
        0, // total_investment
        0, // total_earnings
        'diamond', // current_rank (lowercase to match enum)
        'approved', // kyc_status
        true, // email_verified
        true, // is_active
      ]);

      console.log('✅ Admin user created successfully!');
      console.log('   Email: admin@asterdex.com');
      console.log('   Password: admin123');
      console.log('   Role: admin\n');
    }

    // Check if test users already exist
    const [existingUsers] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE email LIKE ?',
      ['testuser%@asterdex.com']
    );

    const userCount = existingUsers[0].count;

    if (userCount >= 5) {
      console.log(`⚠️  ${userCount} test users already exist\n`);
    } else {
      // Create 5 test users
      console.log('2️⃣ Creating 5 test users...');
      const testPasswordHash = await bcrypt.hash('test123', 10);

      const testUsers = [
        { name: 'John Doe', email: 'testuser1@asterdex.com', rank: 'Bronze' },
        { name: 'Jane Smith', email: 'testuser2@asterdex.com', rank: 'Silver' },
        { name: 'Mike Johnson', email: 'testuser3@asterdex.com', rank: 'Gold' },
        { name: 'Sarah Williams', email: 'testuser4@asterdex.com', rank: 'Platinum' },
        { name: 'David Brown', email: 'testuser5@asterdex.com', rank: 'Starter' },
      ];

      for (const user of testUsers) {
        const userId = generateUUID();
        const referralCode = generateReferralCode();

        // Check if user exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE email = ? LIMIT 1',
          [user.email]
        );

        if (existing.length === 0) {
          await connection.execute(`
            INSERT INTO users (
              id, email, password_hash, full_name, role,
              referral_code, wallet_balance, total_investment, total_earnings,
              current_rank, kyc_status, email_verified, is_active,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            userId,
            user.email,
            testPasswordHash,
            user.name,
            'user',
            referralCode,
            Math.floor(Math.random() * 10000) + 1000, // random wallet balance
            Math.floor(Math.random() * 50000), // random investment
            Math.floor(Math.random() * 10000), // random earnings
            user.rank.toLowerCase(), // current_rank (lowercase to match enum)
            Math.random() > 0.5 ? 'approved' : 'pending',
            true,
            true,
          ]);

          console.log(`   ✅ Created: ${user.email} (${user.rank})`);
        } else {
          console.log(`   ⚠️  Already exists: ${user.email}`);
        }
      }

      console.log('\n✅ Test users created successfully!\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DATABASE SEEDING COMPLETED!');
    console.log('═══════════════════════════════════════════════════════════════');

    // Get final user count
    const [finalCount] = await connection.execute(
      'SELECT COUNT(*) as total FROM users'
    );

    console.log(`📊 Total users in database: ${finalCount[0].total}`);
    console.log('\n🔑 Test Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@asterdex.com');
    console.log('     Password: admin123');
    console.log('\n   Test Users:');
    console.log('     Email: testuser[1-5]@asterdex.com');
    console.log('     Password: test123');
    console.log('\n   Examples:');
    console.log('     - testuser1@asterdex.com / test123');
    console.log('     - testuser2@asterdex.com / test123');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('👋 Connection closed\n');
    }
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  });
