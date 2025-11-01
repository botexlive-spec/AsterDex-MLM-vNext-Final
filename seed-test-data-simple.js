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

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

async function seedSimpleData() {
  const client = new Client({ connectionString });

  try {
    console.log('🌱 Seeding test data...\n');
    await client.connect();

    // Create 20 test users (simpler approach)
    console.log('👥 Creating 20 test users...');

    const users = [];

    for (let i = 0; i < 20; i++) {
      const userId = generateUUID();
      const email = `testuser${i + 1}@finaster.com`;
      const fullName = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
      const sponsorId = i === 0 ? null : users[Math.floor(i / 2)].id;
      const placementId = i === 0 ? null : users[Math.floor(i / 2)].id;
      const position = i === 0 ? null : (i % 2 === 0 ? 'left' : 'right');
      const joinDate = daysAgo(randomAmount(1, 180));
      const hasRobot = Math.random() < 0.7;
      const kycStatus = ['approved', 'approved', 'pending', 'pending', 'rejected'][Math.floor(Math.random() * 5)];
      const rank = ['starter', 'bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 5)];

      // Insert into auth.users
      await client.query(`
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
        VALUES ($1, $2, $3, NOW(), $4, NOW(), $5::jsonb)
        ON CONFLICT (id) DO NOTHING;
      `, [
        userId,
        email,
        '$2a$10$abcdefghijklmnopqrstuv', // Dummy password hash
        joinDate,
        JSON.stringify({ full_name: fullName })
      ]);

      // Insert into public.users
      await client.query(`
        INSERT INTO public.users (
          id, email, password_hash, full_name, role, sponsor_id, placement_id, position,
          robot_subscription_active, robot_subscription_expires_at, wallet_balance,
          total_investment, total_earnings, direct_count, team_count,
          left_volume, right_volume, current_rank, kyc_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO NOTHING;
      `, [
        userId, email, '$2a$10$abcdefghijklmnopqrstuv', fullName, 'user',
        sponsorId, placementId, position,
        hasRobot, hasRobot ? daysAgo(-180) : null,
        randomAmount(100, 10000), randomAmount(100, 5000), randomAmount(0, 2000),
        i === 0 ? 0 : randomAmount(0, 5), randomAmount(0, 20),
        randomAmount(1000, 100000), randomAmount(1000, 100000),
        rank, kycStatus, joinDate
      ]);

      // Insert wallet
      await client.query(`
        INSERT INTO public.wallets (user_id, available_balance, total_balance, created_at)
        VALUES ($1, $2, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET available_balance = $2, total_balance = $2;
      `, [userId, randomAmount(100, 10000), joinDate]);

      users.push({ id: userId, email, fullName });
    }

    console.log(`✅ Created ${users.length} users\n`);

    // Create packages for users
    console.log('📦 Creating package purchases...');
    let packageCount = 0;

    for (let i = 0; i < users.length; i++) {
      const numPackages = randomAmount(1, 3);

      for (let j = 0; j < numPackages; j++) {
        const packageTypes = [
          { amount: 100, roi: 1 },
          { amount: 500, roi: 5 },
          { amount: 1000, roi: 15 }
        ];
        const pkg = packageTypes[Math.floor(Math.random() * packageTypes.length)];

        await client.query(`
          INSERT INTO public.user_packages (
            id, user_id, amount, roi_percentage, purchased_at, is_active, roi_earned, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING;
        `, [
          generateUUID(), users[i].id, pkg.amount, pkg.roi,
          daysAgo(randomAmount(1, 180)), true, randomAmount(0, pkg.amount * 2),
          daysAgo(randomAmount(1, 180))
        ]);
        packageCount++;
      }
    }

    console.log(`✅ Created ${packageCount} packages\n`);

    // Create transactions
    console.log('💰 Creating transactions...');
    let txCount = 0;

    for (let i = 0; i < users.length; i++) {
      const numTx = randomAmount(5, 15);

      for (let j = 0; j < numTx; j++) {
        const txTypes = [
          'deposit', 'withdrawal', 'package_investment', 'direct_income',
          'level_income', 'matching_bonus', 'roi_income'
        ];
        const txType = txTypes[Math.floor(Math.random() * txTypes.length)];
        const amount = randomAmount(10, 1000);
        const status = Math.random() < 0.8 ? 'completed' : 'pending';

        await client.query(`
          INSERT INTO public.mlm_transactions (
            id, user_id, transaction_type, amount, status, description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [
          generateUUID(), users[i].id, txType, amount, status,
          `${txType} transaction`, daysAgo(randomAmount(1, 180))
        ]);
        txCount++;
      }
    }

    console.log(`✅ Created ${txCount} transactions\n`);

    // Create KYC submissions
    console.log('📄 Creating KYC submissions...');
    let kycCount = 0;

    for (let i = 0; i < users.length; i++) {
      if (Math.random() < 0.8) { // 80% have KYC submitted
        await client.query(`
          INSERT INTO public.kyc_documents (
            id, user_id, document_type, document_number, document_url,
            selfie_url, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING;
        `, [
          generateUUID(), users[i].id, 'passport', `DOC${String(i).padStart(6, '0')}`,
          `https://storage.example.com/kyc/${users[i].id}/document.jpg`,
          `https://storage.example.com/kyc/${users[i].id}/selfie.jpg`,
          ['approved', 'pending', 'rejected'][Math.floor(Math.random() * 3)],
          daysAgo(randomAmount(1, 180))
        ]);
        kycCount++;
      }
    }

    console.log(`✅ Created ${kycCount} KYC submissions\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SEED DATA CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Packages: ${packageCount}`);
    console.log(`   Transactions: ${txCount}`);
    console.log(`   KYC Submissions: ${kycCount}\n`);

    console.log('🔑 Test Credentials:');
    console.log('   Email: testuser1@finaster.com');
    console.log('   Password: password123\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

seedSimpleData();
