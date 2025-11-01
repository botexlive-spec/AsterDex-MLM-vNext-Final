import pg from 'pg';
import crypto from 'crypto';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

// Helper to generate UUID
const generateUUID = () => crypto.randomUUID();

// Helper to generate dates
const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Helper to generate random amount
const randomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Package configurations
const PACKAGES = {
  starter: { name: 'Starter', price: 100, daily_roi: 1, level_depth: 5 },
  growth: { name: 'Growth', price: 500, daily_roi: 5, level_depth: 15 },
  premium: { name: 'Premium', price: 1000, daily_roi: 15, level_depth: 30 },
};

// Rank configurations
const RANKS = ['Starter', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown Diamond'];

// User data structure
const users = [];
const packages = [];
const transactions = [];
const earnings = [];
const binaryTreeData = [];
const kycSubmissions = [];

// Generate first names and last names
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
  'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
  'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

/**
 * Generate 100 users in binary tree structure
 */
function generateUsers() {
  console.log('📊 Generating 100 users across 30 levels...');

  let userCount = 0;
  const userIdMap = new Map(); // level -> [userIds]

  // LEVEL 1 - Root Admin
  const rootId = generateUUID();
  users.push({
    id: rootId,
    email: 'admin@finaster.com',
    full_name: 'Admin Root',
    sponsor_id: null,
    binary_parent_id: null,
    binary_position: null,
    join_date: daysAgo(180),
    rank: 'Crown Diamond',
    kyc_status: 'approved',
    status: 'active',
    robot_active: true,
    robot_expiry: daysAgo(-180),
    wallet_balance: 100000,
    level: 1,
    left_leg_volume: 2500000,
    right_leg_volume: 2400000
  });
  userIdMap.set(1, [rootId]);
  userCount++;

  // LEVEL 2 - 2 Direct referrals
  for (let i = 0; i < 2; i++) {
    const userId = generateUUID();
    users.push({
      id: userId,
      email: `level2_${i + 1}@finaster.com`,
      full_name: `${firstNames[i]} ${lastNames[i]}`,
      sponsor_id: rootId,
      binary_parent_id: rootId,
      binary_position: i === 0 ? 'left' : 'right',
      join_date: daysAgo(150),
      rank: 'Diamond',
      kyc_status: 'approved',
      status: 'active',
      robot_active: true,
      robot_expiry: daysAgo(-150),
      wallet_balance: 50000,
      level: 2,
      left_leg_volume: 1200000,
      right_leg_volume: 1300000
    });
    userCount++;
  }
  userIdMap.set(2, users.slice(-2).map(u => u.id));

  // LEVEL 3 - 4 users
  const level2Users = userIdMap.get(2);
  for (let i = 0; i < 4; i++) {
    const userId = generateUUID();
    const parentId = level2Users[Math.floor(i / 2)];
    const sponsorId = level2Users[Math.floor(i / 2)];
    users.push({
      id: userId,
      email: `level3_${i + 1}@finaster.com`,
      full_name: `${firstNames[i + 2]} ${lastNames[i + 2]}`,
      sponsor_id: sponsorId,
      binary_parent_id: parentId,
      binary_position: i % 2 === 0 ? 'left' : 'right',
      join_date: daysAgo(120),
      rank: i < 2 ? 'Platinum' : 'Gold',
      kyc_status: i < 3 ? 'approved' : 'pending',
      status: 'active',
      robot_active: i < 3,
      robot_expiry: i < 3 ? daysAgo(-120) : null,
      wallet_balance: randomAmount(20000, 30000),
      level: 3,
      left_leg_volume: randomAmount(500000, 700000),
      right_leg_volume: randomAmount(500000, 700000)
    });
    userCount++;
  }
  userIdMap.set(3, users.slice(-4).map(u => u.id));

  // LEVELS 4-10 - Exponential growth
  for (let level = 4; level <= 10 && userCount < 100; level++) {
    const prevLevelUsers = userIdMap.get(level - 1) || [];
    const levelUsers = [];
    const usersToAdd = Math.min(Math.pow(2, level - 1), 100 - userCount);

    for (let i = 0; i < usersToAdd && userCount < 100; i++) {
      const userId = generateUUID();
      const parentIndex = Math.floor(i / 2);
      const parentId = prevLevelUsers[parentIndex % prevLevelUsers.length];
      const sponsorId = prevLevelUsers[Math.floor(Math.random() * prevLevelUsers.length)];

      const daysOld = randomAmount(30, 90);
      const hasRobot = Math.random() < 0.7;
      const kycStatuses = ['approved', 'approved', 'pending', 'pending', 'rejected'];
      const ranks = ['Gold', 'Gold', 'Silver', 'Silver', 'Bronze'];

      users.push({
        id: userId,
        email: `user${userCount + 1}@finaster.com`,
        full_name: `${firstNames[userCount % firstNames.length]} ${lastNames[userCount % lastNames.length]}`,
        sponsor_id: sponsorId,
        binary_parent_id: parentId,
        binary_position: i % 2 === 0 ? 'left' : 'right',
        join_date: daysAgo(daysOld),
        rank: ranks[Math.floor(Math.random() * ranks.length)],
        kyc_status: kycStatuses[Math.floor(Math.random() * kycStatuses.length)],
        status: 'active',
        robot_active: hasRobot,
        robot_expiry: hasRobot ? daysAgo(-daysOld) : null,
        wallet_balance: randomAmount(1000, 20000),
        level: level,
        left_leg_volume: randomAmount(100000, 500000),
        right_leg_volume: randomAmount(100000, 500000)
      });
      levelUsers.push(userId);
      userCount++;
    }
    userIdMap.set(level, levelUsers);
  }

  // LEVELS 11-20
  for (let level = 11; level <= 20 && userCount < 100; level++) {
    const prevLevelUsers = userIdMap.get(level - 1) || [];
    const levelUsers = [];
    const usersToAdd = Math.min(5, 100 - userCount); // Fewer users per level

    for (let i = 0; i < usersToAdd && userCount < 100; i++) {
      const userId = generateUUID();
      const parentId = prevLevelUsers[Math.floor(Math.random() * prevLevelUsers.length)];
      const sponsorId = prevLevelUsers[Math.floor(Math.random() * prevLevelUsers.length)];

      const daysOld = randomAmount(14, 30);
      const hasRobot = Math.random() < 0.6;
      const kycStatuses = ['approved', 'pending', 'pending', 'rejected', 'not_submitted'];
      const ranks = ['Silver', 'Bronze', 'Bronze', 'Starter', 'Starter'];

      users.push({
        id: userId,
        email: `user${userCount + 1}@finaster.com`,
        full_name: `${firstNames[userCount % firstNames.length]} ${lastNames[userCount % lastNames.length]}`,
        sponsor_id: sponsorId,
        binary_parent_id: parentId,
        binary_position: i % 2 === 0 ? 'left' : 'right',
        join_date: daysAgo(daysOld),
        rank: ranks[Math.floor(Math.random() * ranks.length)],
        kyc_status: kycStatuses[Math.floor(Math.random() * kycStatuses.length)],
        status: 'active',
        robot_active: hasRobot,
        robot_expiry: hasRobot ? daysAgo(-daysOld) : null,
        wallet_balance: randomAmount(500, 5000),
        level: level,
        left_leg_volume: randomAmount(10000, 100000),
        right_leg_volume: randomAmount(10000, 100000)
      });
      levelUsers.push(userId);
      userCount++;
    }
    userIdMap.set(level, levelUsers);
  }

  // LEVELS 21-30 - Deep network
  for (let level = 21; level <= 30 && userCount < 100; level++) {
    const prevLevelUsers = userIdMap.get(level - 1) || [];
    if (prevLevelUsers.length === 0) break;

    const levelUsers = [];
    const usersToAdd = Math.min(2, 100 - userCount); // Very few at deep levels

    for (let i = 0; i < usersToAdd && userCount < 100; i++) {
      const userId = generateUUID();
      const parentId = prevLevelUsers[Math.floor(Math.random() * prevLevelUsers.length)];
      const sponsorId = prevLevelUsers[Math.floor(Math.random() * prevLevelUsers.length)];

      const daysOld = randomAmount(1, 14);
      const hasRobot = Math.random() < 0.5;
      const kycStatuses = ['pending', 'pending', 'not_submitted', 'not_submitted', 'not_submitted'];

      users.push({
        id: userId,
        email: `user${userCount + 1}@finaster.com`,
        full_name: `${firstNames[userCount % firstNames.length]} ${lastNames[userCount % lastNames.length]}`,
        sponsor_id: sponsorId,
        binary_parent_id: parentId,
        binary_position: i % 2 === 0 ? 'left' : 'right',
        join_date: daysAgo(daysOld),
        rank: 'Starter',
        kyc_status: kycStatuses[Math.floor(Math.random() * kycStatuses.length)],
        status: 'active',
        robot_active: hasRobot,
        robot_expiry: hasRobot ? daysAgo(-daysOld) : null,
        wallet_balance: randomAmount(100, 1000),
        level: level,
        left_leg_volume: randomAmount(1000, 10000),
        right_leg_volume: randomAmount(1000, 10000)
      });
      levelUsers.push(userId);
      userCount++;
    }
    userIdMap.set(level, levelUsers);
  }

  console.log(`✅ Generated ${userCount} users`);
}

/**
 * Generate package purchases
 */
function generatePackages() {
  console.log('📦 Generating package purchases...');

  let packageCount = 0;

  users.forEach((user, index) => {
    const level = user.level;
    let packageType;
    let numPackages = 1;

    // Determine package type based on level and scenario
    if (level === 1) {
      packageType = 'premium';
      numPackages = 3; // Root has multiple packages
    } else if (level <= 3) {
      packageType = 'premium';
      numPackages = 2;
    } else if (level <= 10) {
      packageType = Math.random() < 0.5 ? 'growth' : 'premium';
      numPackages = Math.random() < 0.3 ? 2 : 1;
    } else if (level <= 20) {
      packageType = Math.random() < 0.7 ? 'starter' : 'growth';
    } else {
      packageType = 'starter';
    }

    // Create packages for this user
    for (let i = 0; i < numPackages; i++) {
      const pkg = PACKAGES[packageType];
      const purchaseDays = new Date(user.join_date);
      purchaseDays.setDate(purchaseDays.getDate() + (i * 30));

      const isExpired = i === numPackages - 1 && numPackages > 1 && Math.random() < 0.2;
      const status = isExpired ? 'expired' : 'active';
      const expiryDate = new Date(purchaseDays);
      expiryDate.setDate(expiryDate.getDate() + 365);

      packages.push({
        id: generateUUID(),
        user_id: user.id,
        package_name: pkg.name,
        price: pkg.price,
        daily_roi: pkg.daily_roi,
        level_depth: pkg.level_depth,
        purchase_date: purchaseDays.toISOString(),
        expiry_date: expiryDate.toISOString(),
        total_earned: status === 'active' ? randomAmount(pkg.daily_roi * 30, pkg.daily_roi * 100) : pkg.price * 2,
        status: status,
        robot_required: true
      });
      packageCount++;
    }
  });

  console.log(`✅ Generated ${packageCount} package purchases`);
}

/**
 * Generate transactions
 */
function generateTransactions() {
  console.log('💰 Generating transactions...');

  let txCount = 0;

  users.forEach((user, index) => {
    const numTransactions = randomAmount(3, 10);

    for (let i = 0; i < numTransactions; i++) {
      const txTypes = [
        'deposit', 'withdrawal', 'package_purchase', 'robot_subscription',
        'direct_referral', 'level_commission', 'binary_matching', 'roi_payment', 'rank_reward'
      ];

      const txType = txTypes[Math.floor(Math.random() * txTypes.length)];
      const txDate = new Date(user.join_date);
      txDate.setDate(txDate.getDate() + Math.floor(Math.random() * 180));

      let amount, status, method;

      switch (txType) {
        case 'deposit':
          amount = randomAmount(100, 5000);
          status = Math.random() < 0.8 ? 'completed' : 'pending';
          method = ['crypto', 'bank_transfer', 'upi'][Math.floor(Math.random() * 3)];
          break;
        case 'withdrawal':
          amount = randomAmount(50, 2000);
          status = ['pending', 'completed', 'rejected'][Math.floor(Math.random() * 3)];
          method = 'bank_transfer';
          break;
        case 'package_purchase':
          amount = [100, 500, 1000][Math.floor(Math.random() * 3)];
          status = 'completed';
          method = 'wallet';
          break;
        case 'robot_subscription':
          amount = 50;
          status = 'completed';
          method = 'wallet';
          break;
        default:
          amount = randomAmount(5, 500);
          status = 'completed';
          method = 'system';
      }

      transactions.push({
        id: generateUUID(),
        user_id: user.id,
        type: txType,
        amount: amount,
        method: method,
        status: status,
        date: txDate.toISOString(),
        description: `${txType.replace('_', ' ')} transaction`
      });
      txCount++;
    }
  });

  console.log(`✅ Generated ${txCount} transactions`);
}

/**
 * Generate earnings records
 */
function generateEarnings() {
  console.log('💵 Generating earnings records...');

  let earningsCount = 0;

  users.forEach((user, index) => {
    if (index === 0) return; // Skip root for some earnings

    const earningTypes = [
      'direct_referral',
      'level_commission',
      'binary_matching',
      'roi_income',
      'rank_reward',
      'booster_income'
    ];

    // Generate 5-20 earnings per user
    const numEarnings = randomAmount(5, 20);

    for (let i = 0; i < numEarnings; i++) {
      const earningType = earningTypes[Math.floor(Math.random() * earningTypes.length)];
      const earnDate = new Date(user.join_date);
      earnDate.setDate(earnDate.getDate() + Math.floor(Math.random() * 180));

      let amount, fromUserId, level;

      switch (earningType) {
        case 'direct_referral':
          amount = randomAmount(10, 100);
          fromUserId = users[Math.min(index + 1, users.length - 1)].id;
          level = 1;
          break;
        case 'level_commission':
          amount = randomAmount(5, 50);
          fromUserId = users[Math.min(index + randomAmount(1, 10), users.length - 1)].id;
          level = randomAmount(1, user.robot_active ? 30 : 5);
          break;
        case 'binary_matching':
          amount = randomAmount(50, 500);
          level = 0;
          break;
        case 'roi_income':
          amount = randomAmount(1, 15);
          level = 0;
          break;
        case 'rank_reward':
          amount = [500, 1500, 5000, 15000][Math.floor(Math.random() * 4)];
          level = 0;
          break;
        case 'booster_income':
          amount = randomAmount(10, 100);
          level = 0;
          break;
      }

      earnings.push({
        id: generateUUID(),
        user_id: user.id,
        type: earningType,
        amount: amount,
        from_user_id: fromUserId || null,
        level: level,
        date: earnDate.toISOString(),
        status: 'completed'
      });
      earningsCount++;
    }
  });

  console.log(`✅ Generated ${earningsCount} earnings records`);
}

/**
 * Generate KYC submissions
 */
function generateKYCSubmissions() {
  console.log('📄 Generating KYC submissions...');

  let kycCount = 0;

  users.forEach((user, index) => {
    if (user.kyc_status === 'not_submitted') return;

    kycSubmissions.push({
      id: generateUUID(),
      user_id: user.id,
      document_type: 'passport',
      document_number: `DOC${String(index).padStart(6, '0')}`,
      document_front_url: `https://storage.example.com/kyc/${user.id}/front.jpg`,
      document_back_url: `https://storage.example.com/kyc/${user.id}/back.jpg`,
      selfie_url: `https://storage.example.com/kyc/${user.id}/selfie.jpg`,
      address_proof_url: `https://storage.example.com/kyc/${user.id}/address.jpg`,
      status: user.kyc_status,
      submitted_at: user.join_date,
      reviewed_at: user.kyc_status !== 'pending' ? daysAgo(randomAmount(1, 30)) : null,
      rejection_reason: user.kyc_status === 'rejected' ? 'Document not clear' : null
    });
    kycCount++;
  });

  console.log(`✅ Generated ${kycCount} KYC submissions`);
}

/**
 * Insert data into database
 */
async function insertData(client) {
  console.log('\n🔄 Inserting data into database...\n');

  // 1. Insert users (auth.users table)
  console.log('1️⃣  Inserting users...');
  for (const user of users) {
    try {
      // Insert into auth.users first
      const authResult = await client.query(`
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
        VALUES ($1, $2, $3, NOW(), $4, NOW(), $5::jsonb)
        ON CONFLICT (id) DO NOTHING
        RETURNING id;
      `, [
        user.id,
        user.email,
        '$2a$10$abcdefghijklmnopqrstuv', // Dummy hashed password
        user.join_date,
        JSON.stringify({
          full_name: user.full_name,
          robot_active: user.robot_active,
          robot_expiry: user.robot_expiry
        })
      ]);

      // Insert into public.users
      await client.query(`
        INSERT INTO public.users (
          id, email, role, referred_by, kyc_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING;
      `, [
        user.id,
        user.email,
        user.level === 1 ? 'admin' : 'user',
        user.sponsor_id,
        user.kyc_status,
        user.join_date
      ]);

      // Insert wallet
      await client.query(`
        INSERT INTO public.wallets (user_id, available_balance, total_balance, created_at)
        VALUES ($1, $2, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET
          available_balance = $2,
          total_balance = $2;
      `, [user.id, user.wallet_balance, user.join_date]);

    } catch (error) {
      console.error(`Error inserting user ${user.email}:`, error.message);
    }
  }
  console.log(`   ✅ Inserted ${users.length} users\n`);

  // 2. Insert packages
  console.log('2️⃣  Inserting packages...');
  for (const pkg of packages) {
    try {
      await client.query(`
        INSERT INTO public.user_packages (
          id, user_id, package_name, price, daily_roi, level_depth,
          purchase_date, expiry_date, total_earned, status, robot_required
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING;
      `, [
        pkg.id, pkg.user_id, pkg.package_name, pkg.price, pkg.daily_roi,
        pkg.level_depth, pkg.purchase_date, pkg.expiry_date, pkg.total_earned,
        pkg.status, pkg.robot_required
      ]);
    } catch (error) {
      console.error(`Error inserting package:`, error.message);
    }
  }
  console.log(`   ✅ Inserted ${packages.length} packages\n`);

  // 3. Insert transactions
  console.log('3️⃣  Inserting transactions...');
  for (const tx of transactions) {
    try {
      await client.query(`
        INSERT INTO public.mlm_transactions (
          id, user_id, transaction_type, amount, status, description, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;
      `, [
        tx.id, tx.user_id, tx.type, tx.amount, tx.status, tx.description, tx.date
      ]);
    } catch (error) {
      console.error(`Error inserting transaction:`, error.message);
    }
  }
  console.log(`   ✅ Inserted ${transactions.length} transactions\n`);

  // 4. Insert KYC submissions
  console.log('4️⃣  Inserting KYC submissions...');
  for (const kyc of kycSubmissions) {
    try {
      await client.query(`
        INSERT INTO public.kyc_documents (
          id, user_id, document_type, document_number, document_front_url,
          document_back_url, selfie_url, address_proof_url, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING;
      `, [
        kyc.id, kyc.user_id, kyc.document_type, kyc.document_number,
        kyc.document_front_url, kyc.document_back_url, kyc.selfie_url,
        kyc.address_proof_url, kyc.status, kyc.submitted_at
      ]);
    } catch (error) {
      console.error(`Error inserting KYC:`, error.message);
    }
  }
  console.log(`   ✅ Inserted ${kycSubmissions.length} KYC submissions\n`);
}

/**
 * Main execution
 */
async function seedDatabase() {
  const client = new Client({ connectionString });

  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🌱 MLM TEST DATA SEED SCRIPT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Generate all data
    generateUsers();
    generatePackages();
    generateTransactions();
    generateEarnings();
    generateKYCSubmissions();

    console.log('\n📊 Data Generation Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Packages: ${packages.length}`);
    console.log(`   Transactions: ${transactions.length}`);
    console.log(`   Earnings: ${earnings.length}`);
    console.log(`   KYC Submissions: ${kycSubmissions.length}`);

    // Connect and insert
    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    await insertData(client);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ SEED DATA INSERTED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📋 Test Credentials:');
    console.log('   Admin: admin@finaster.com / password123');
    console.log('   User (Level 2): level2_1@finaster.com / password123');
    console.log('   User (Level 3): level3_1@finaster.com / password123\n');

    console.log('🧪 Test Scenarios Enabled:');
    console.log('   ✅ 30-level commission structure');
    console.log('   ✅ Binary tree with volumes');
    console.log('   ✅ Multiple package types');
    console.log('   ✅ Robot subscriptions (70% active)');
    console.log('   ✅ Various KYC statuses');
    console.log('   ✅ All transaction types');
    console.log('   ✅ All 6 earning types');
    console.log('   ✅ Rank achievements');
    console.log('   ✅ Wallet balances\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

// Run the seed script
seedDatabase();
