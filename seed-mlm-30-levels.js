import pg from 'pg';
import crypto from 'crypto';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

const generateUUID = () => crypto.randomUUID();
const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
const randomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Name pools for realistic data
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy',
  'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Kimberly',
  'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Dorothy',
  'Edward', 'Melissa', 'Ronald', 'Deborah'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez',
  'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

// Package configurations
const packages = [
  { name: 'Starter', amount: 100, roi: 1, levelDepth: 5 },
  { name: 'Growth', amount: 500, roi: 5, levelDepth: 15 },
  { name: 'Premium', amount: 1000, roi: 15, levelDepth: 30 },
  { name: 'Gold', amount: 5000, roi: 75, levelDepth: 30 },
  { name: 'Platinum', amount: 10000, roi: 150, levelDepth: 30 }
];

// Transaction types based on enum
const transactionTypes = [
  'deposit', 'withdrawal', 'package_investment', 'direct_income',
  'level_income', 'matching_bonus', 'roi_income', 'rank_reward'
];

// Earning types
const earningTypes = [
  'direct_income', 'level_income', 'matching_bonus',
  'roi_income', 'rank_reward', 'booster_income'
];

// Ranks based on level and investment
const ranks = ['starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'double_diamond', 'triple_diamond', 'crown', 'crown_ambassador'];

function getRankForLevel(level, investment) {
  if (level === 1) return 'crown_ambassador';
  if (level === 2) return 'crown';
  if (level === 3) return randomChoice(['triple_diamond', 'crown']);
  if (level <= 5) return randomChoice(['diamond', 'double_diamond', 'triple_diamond']);
  if (level <= 10 && investment >= 5000) return randomChoice(['platinum', 'diamond']);
  if (level <= 10) return randomChoice(['gold', 'silver', 'platinum']);
  if (level <= 20 && investment >= 1000) return randomChoice(['silver', 'gold']);
  if (level <= 20) return randomChoice(['bronze', 'silver']);
  return randomChoice(['starter', 'bronze']);
}

async function seedMLM30Levels() {
  const client = new Client({ connectionString });

  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🌱 MLM 30-LEVEL TEST DATA SEED SCRIPT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await client.connect();
    console.log('✅ Connected to database\n');

    const users = [];
    const usersByLevel = {};

    // Generate 100+ users across 30 levels
    console.log('👥 Generating 100+ users across 30 levels...\n');

    let userCount = 0;
    const targetUsers = 100;

    // Level 1: Root user (admin)
    const rootId = generateUUID();
    const rootEmail = 'admin@finaster.com';
    const rootName = 'Admin Root';
    const rootJoinDate = daysAgo(180);

    users.push({
      id: rootId,
      email: rootEmail,
      fullName: rootName,
      level: 1,
      sponsorId: null,
      placementId: null,
      position: null,
      investment: 50000,
      rank: 'crown_ambassador',
      joinDate: rootJoinDate,
      hasRobot: true,
      kycStatus: 'approved'
    });

    usersByLevel[1] = [rootId];
    userCount++;

    console.log('Level 1: Created 1 user (Root/Admin)');

    // Generate users for levels 2-30
    for (let level = 2; level <= 30; level++) {
      usersByLevel[level] = [];

      // Determine how many users for this level
      let usersInLevel;
      if (level === 2) usersInLevel = 2;
      else if (level === 3) usersInLevel = 4;
      else if (level <= 5) usersInLevel = randomAmount(3, 8);
      else if (level <= 10) usersInLevel = randomAmount(2, 6);
      else if (level <= 15) usersInLevel = randomAmount(2, 5);
      else if (level <= 20) usersInLevel = randomAmount(1, 4);
      else if (level <= 25) usersInLevel = randomAmount(1, 3);
      else usersInLevel = randomAmount(1, 2);

      // Stop if we've reached target
      if (userCount >= targetUsers) break;
      if (userCount + usersInLevel > targetUsers + 10) {
        usersInLevel = targetUsers - userCount;
      }

      for (let i = 0; i < usersInLevel; i++) {
        const userId = generateUUID();
        const firstName = randomChoice(firstNames);
        const lastName = randomChoice(lastNames);
        const email = `user.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${level}.${i}@finaster.com`;
        const fullName = `${firstName} ${lastName}`;

        // Select sponsor from previous level
        const previousLevel = level - 1;
        const sponsorId = usersByLevel[previousLevel]
          ? randomChoice(usersByLevel[previousLevel])
          : rootId;

        // Binary placement: find a parent with available position
        const placementLevel = Math.max(1, level - randomAmount(1, 3));
        const potentialParents = usersByLevel[placementLevel] || [rootId];
        const placementId = randomChoice(potentialParents);
        const position = randomChoice(['left', 'right']);

        // Investment amount based on level
        let investment;
        if (level <= 5) investment = randomAmount(5000, 50000);
        else if (level <= 10) investment = randomAmount(1000, 10000);
        else if (level <= 20) investment = randomAmount(500, 5000);
        else investment = randomAmount(100, 1000);

        const rank = getRankForLevel(level, investment);
        const joinDate = daysAgo(randomAmount(1, 180 - (level * 2)));
        const hasRobot = level <= 10 ? true : Math.random() < (0.9 - (level * 0.02));
        const kycStatus = level <= 10
          ? randomChoice(['approved', 'approved', 'approved', 'pending'])
          : randomChoice(['approved', 'pending', 'rejected', 'not_submitted']);

        users.push({
          id: userId,
          email,
          fullName,
          level,
          sponsorId,
          placementId,
          position,
          investment,
          rank,
          joinDate,
          hasRobot,
          kycStatus
        });

        usersByLevel[level].push(userId);
        userCount++;
      }

      console.log(`Level ${level}: Created ${usersInLevel} users (Total: ${userCount})`);

      if (userCount >= targetUsers) {
        console.log(`\n✅ Reached target of ${targetUsers} users at level ${level}\n`);
        break;
      }
    }

    console.log(`\n✅ Generated ${users.length} users across ${Object.keys(usersByLevel).length} levels\n`);

    // Insert users into database
    console.log('💾 Inserting users into database...\n');

    for (const user of users) {
      // Insert into auth.users
      await client.query(`
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
        VALUES ($1, $2, $3, NOW(), $4, NOW(), $5::jsonb)
        ON CONFLICT (id) DO NOTHING;
      `, [
        user.id,
        user.email,
        '$2a$10$abcdefghijklmnopqrstuv', // Dummy bcrypt hash
        user.joinDate,
        JSON.stringify({ full_name: user.fullName })
      ]);

      // Insert into public.users
      const walletBalance = randomAmount(user.investment * 0.1, user.investment * 0.5);
      const totalEarnings = randomAmount(0, user.investment * 2);
      const directCount = user.level === 1 ? 2 : randomAmount(0, Math.min(10, 30 - user.level));
      const teamCount = randomAmount(directCount, directCount * 5);
      const leftVolume = randomAmount(1000, user.investment * 10);
      const rightVolume = randomAmount(1000, user.investment * 10);

      await client.query(`
        INSERT INTO public.users (
          id, email, password_hash, full_name, role,
          sponsor_id, placement_id, position,
          robot_subscription_active, robot_subscription_expires_at,
          wallet_balance, total_investment, total_earnings,
          direct_count, team_count, left_volume, right_volume,
          current_rank, kyc_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO NOTHING;
      `, [
        user.id, user.email, '$2a$10$abcdefghijklmnopqrstuv', user.fullName,
        user.email.includes('admin') ? 'admin' : 'user',
        user.sponsorId, user.placementId, user.position,
        user.hasRobot, user.hasRobot ? daysAgo(-180) : null,
        walletBalance, user.investment, totalEarnings,
        directCount, teamCount, leftVolume, rightVolume,
        user.rank, user.kycStatus, user.joinDate
      ]);

      // Insert wallet
      await client.query(`
        INSERT INTO public.wallets (user_id, available_balance, total_balance, created_at)
        VALUES ($1, $2, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET available_balance = $2, total_balance = $2;
      `, [user.id, walletBalance, user.joinDate]);
    }

    console.log(`✅ Inserted ${users.length} users into database\n`);

    // Generate package purchases
    console.log('📦 Generating package purchases...\n');
    let packageCount = 0;

    for (const user of users) {
      const numPackages = user.level <= 5 ? randomAmount(2, 5) : randomAmount(1, 3);

      for (let i = 0; i < numPackages; i++) {
        // Select package based on user investment
        let pkg;
        if (user.investment >= 10000) pkg = packages[4]; // Platinum
        else if (user.investment >= 5000) pkg = packages[3]; // Gold
        else if (user.investment >= 1000) pkg = packages[2]; // Premium
        else if (user.investment >= 500) pkg = packages[1]; // Growth
        else pkg = packages[0]; // Starter

        const purchasedAt = daysAgo(randomAmount(1, 170));
        const roiEarned = randomAmount(0, pkg.amount * 1.5);
        const isActive = Math.random() < 0.8; // 80% active

        await client.query(`
          INSERT INTO public.user_packages (
            id, user_id, amount, roi_percentage, purchased_at, is_active, roi_earned, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING;
        `, [
          generateUUID(), user.id, pkg.amount, pkg.roi,
          purchasedAt, isActive, roiEarned, purchasedAt
        ]);

        packageCount++;
      }
    }

    console.log(`✅ Generated ${packageCount} package purchases\n`);

    // Generate transactions
    console.log('💰 Generating transactions...\n');
    let txCount = 0;

    for (const user of users) {
      const numTx = user.level <= 5 ? randomAmount(20, 50) : randomAmount(10, 30);

      for (let i = 0; i < numTx; i++) {
        const txType = randomChoice(transactionTypes);
        let amount;

        if (txType === 'deposit') amount = randomAmount(100, user.investment);
        else if (txType === 'withdrawal') amount = randomAmount(50, user.investment * 0.3);
        else if (txType === 'package_investment') amount = randomChoice([100, 500, 1000, 5000, 10000]);
        else amount = randomAmount(10, user.investment * 0.1);

        const status = txType === 'withdrawal'
          ? randomChoice(['completed', 'pending', 'pending'])
          : randomChoice(['completed', 'completed', 'completed', 'pending']);

        await client.query(`
          INSERT INTO public.mlm_transactions (
            id, user_id, transaction_type, amount, status, description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [
          generateUUID(), user.id, txType, amount, status,
          `${txType.replace('_', ' ')} transaction`, daysAgo(randomAmount(1, 170))
        ]);

        txCount++;
      }
    }

    console.log(`✅ Generated ${txCount} transactions\n`);

    // Generate earnings records (all 6 types)
    console.log('💵 Generating earnings records (6 types)...\n');
    let earningsCount = 0;

    for (const user of users) {
      // Skip root for some earning types
      if (user.level === 1) continue;

      // 1. Direct Income (from direct referrals)
      const directEarnings = randomAmount(2, user.investment * 0.1);
      if (directEarnings > 0) {
        await client.query(`
          INSERT INTO public.mlm_transactions (
            id, user_id, transaction_type, amount, status, description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [
          generateUUID(), user.id, 'direct_income', directEarnings, 'completed',
          'Direct referral commission', daysAgo(randomAmount(1, 160))
        ]);
        earningsCount++;
      }

      // 2. Level Income (from 30 levels)
      const levelEarnings = user.hasRobot ? randomAmount(5, 30) : randomAmount(1, 5);
      for (let i = 0; i < levelEarnings; i++) {
        const levelNum = randomAmount(1, user.hasRobot ? 30 : 5);
        const amount = randomAmount(5, user.investment * 0.05);

        await client.query(`
          INSERT INTO public.mlm_transactions (
            id, user_id, transaction_type, amount, status, description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [
          generateUUID(), user.id, 'level_income', amount, 'completed',
          `Level ${levelNum} commission`, daysAgo(randomAmount(1, 150))
        ]);
        earningsCount++;
      }

      // 3. Matching Bonus (binary)
      if (user.level <= 15) {
        const matchingCount = randomAmount(3, 15);
        for (let i = 0; i < matchingCount; i++) {
          const amount = randomAmount(50, user.investment * 0.15);

          await client.query(`
            INSERT INTO public.mlm_transactions (
              id, user_id, transaction_type, amount, status, description, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING;
          `, [
            generateUUID(), user.id, 'matching_bonus', amount, 'completed',
            'Binary matching bonus', daysAgo(randomAmount(1, 140))
          ]);
          earningsCount++;
        }
      }

      // 4. ROI Income
      const roiCount = randomAmount(10, 100);
      for (let i = 0; i < roiCount; i++) {
        const amount = randomAmount(1, 50);

        await client.query(`
          INSERT INTO public.mlm_transactions (
            id, user_id, transaction_type, amount, status, description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [
          generateUUID(), user.id, 'roi_income', amount, 'completed',
          'Daily ROI income', daysAgo(randomAmount(1, 130))
        ]);
        earningsCount++;
      }

      // 5. Rank Reward
      if (user.level <= 10 && ['platinum', 'diamond', 'double_diamond', 'triple_diamond', 'crown', 'crown_ambassador'].includes(user.rank)) {
        const amount = randomAmount(500, 5000);

        await client.query(`
          INSERT INTO public.mlm_transactions (
            id, user_id, transaction_type, amount, status, description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [
          generateUUID(), user.id, 'rank_reward', amount, 'completed',
          `${user.rank} rank achievement reward`, daysAgo(randomAmount(1, 120))
        ]);
        earningsCount++;
      }

      // 6. Booster Income
      if (user.hasRobot && user.level <= 20) {
        const boosterCount = randomAmount(5, 20);
        for (let i = 0; i < boosterCount; i++) {
          const amount = randomAmount(10, user.investment * 0.08);

          await client.query(`
            INSERT INTO public.mlm_transactions (
              id, user_id, transaction_type, amount, status, description, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING;
          `, [
            generateUUID(), user.id, 'booster_income', amount, 'completed',
            'Booster income from team activity', daysAgo(randomAmount(1, 110))
          ]);
          earningsCount++;
        }
      }
    }

    console.log(`✅ Generated ${earningsCount} earnings records (all 6 types)\n`);

    // Generate KYC submissions
    console.log('📄 Generating KYC submissions...\n');
    let kycCount = 0;

    for (const user of users) {
      if (user.kycStatus === 'not_submitted') continue;

      await client.query(`
        INSERT INTO public.kyc_documents (
          id, user_id, document_type, document_number, document_url,
          selfie_url, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING;
      `, [
        generateUUID(), user.id, 'passport', `DOC${String(kycCount).padStart(6, '0')}`,
        `https://storage.example.com/kyc/${user.id}/document.jpg`,
        `https://storage.example.com/kyc/${user.id}/selfie.jpg`,
        user.kycStatus === 'not_submitted' ? 'pending' : user.kycStatus,
        daysAgo(randomAmount(1, 150))
      ]);
      kycCount++;
    }

    console.log(`✅ Generated ${kycCount} KYC submissions\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SEED DATA INSERTED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📊 FINAL SUMMARY:\n');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📊 Levels: ${Object.keys(usersByLevel).length}`);
    console.log(`   📦 Packages: ${packageCount}`);
    console.log(`   💰 Transactions: ${txCount}`);
    console.log(`   💵 Earnings Records: ${earningsCount}`);
    console.log(`   📄 KYC Submissions: ${kycCount}\n`);

    console.log('📈 USER DISTRIBUTION BY LEVEL:\n');
    for (const level in usersByLevel) {
      console.log(`   Level ${level.padStart(2, ' ')}: ${usersByLevel[level].length} users`);
    }

    console.log('\n🔑 TEST CREDENTIALS:\n');
    console.log('   Admin Account:');
    console.log('   - Email: admin@finaster.com');
    console.log('   - Password: password123');
    console.log('   - Level: 1 (Root)');
    console.log('   - Rank: Crown Ambassador\n');

    console.log('   Sample Level 2 User:');
    console.log(`   - Email: ${users[1].email}`);
    console.log('   - Password: password123');
    console.log(`   - Level: ${users[1].level}`);
    console.log(`   - Rank: ${users[1].rank}\n`);

    console.log('   Sample Level 10 User:');
    const level10User = users.find(u => u.level === 10);
    if (level10User) {
      console.log(`   - Email: ${level10User.email}`);
      console.log('   - Password: password123');
      console.log(`   - Level: ${level10User.level}`);
      console.log(`   - Rank: ${level10User.rank}\n`);
    }

    console.log('   Sample Level 20 User:');
    const level20User = users.find(u => u.level === 20);
    if (level20User) {
      console.log(`   - Email: ${level20User.email}`);
      console.log('   - Password: password123');
      console.log(`   - Level: ${level20User.level}`);
      console.log(`   - Rank: ${level20User.rank}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 ALL 30 LEVELS ARE NOW POPULATED FOR TESTING!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('👋 Connection closed\n');
  }
}

seedMLM30Levels();
