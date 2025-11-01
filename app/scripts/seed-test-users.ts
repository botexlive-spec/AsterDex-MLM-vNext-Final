/**
 * Database Seeding Script
 * Creates 100 test users across 30 MLM levels with complete data
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials - using actual project URL from config.js
const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.Gc6k-yF9lLhG3E7xqV4cNhJxN0nxKR2BdZDzHCE48SU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sample data arrays
const firstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Paul', 'Joshua', 'Kenneth',
  'Emily', 'Ashley', 'Kimberly', 'Melissa', 'Donna', 'Michelle', 'Carol', 'Amanda', 'Dorothy', 'Betty',
  'Charles', 'Ryan', 'Jason', 'Justin', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy',
  'Nancy', 'Sandra', 'Helen', 'Deborah', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather',
  'Nicholas', 'Eric', 'Jacob', 'Jonathan', 'Larry', 'Frank', 'Scott', 'Brandon', 'Benjamin', 'Samuel',
  'Rebecca', 'Sharon', 'Cynthia', 'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela',
  'Alexander', 'Raymond', 'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Jose', 'Adam',
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

const ranks = ['Starter', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Spain', 'Italy'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];

// Helper functions
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@testuser.com`;
}

function generatePhone(): string {
  return `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
}

function generateAddress(): string {
  return `${randomInt(100, 9999)} ${randomElement(['Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm'])} ${randomElement(['St', 'Ave', 'Blvd', 'Dr', 'Ln'])}`;
}

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Step 1: Create admin user first
    console.log('1️⃣ Creating admin user...');
    const adminEmail = 'admin@finaster.com';
    const adminPassword = 'Admin@123';

    // Check if admin exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    let adminId: string;

    if (!existingAdmin) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });

      if (authError) throw authError;
      adminId = authData.user!.id;

      await supabase.from('users').upsert({
        id: adminId,
        email: adminEmail,
        full_name: 'System Administrator',
        role: 'admin',
        is_active: true,
        wallet_balance: 1000000,
        total_investment: 0,
        total_earnings: 0,
        rank: 'Diamond',
        kyc_status: 'approved',
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      console.log('✅ Admin user created:', adminEmail);
    } else {
      adminId = existingAdmin.id;
      console.log('✅ Admin user already exists');
    }

    // Step 2: Create 100 users across 30 levels
    console.log('\n2️⃣ Creating 100 users across 30 levels...');

    const users: any[] = [];
    const userIds: string[] = [];
    let currentLevel = 1;
    let usersPerLevel = 3; // Start with 3 users per level
    let userIndex = 0;

    for (let level = 1; level <= 30 && userIndex < 100; level++) {
      const usersInThisLevel = Math.min(usersPerLevel, 100 - userIndex);

      for (let i = 0; i < usersInThisLevel && userIndex < 100; i++) {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        const email = generateEmail(firstName, lastName, userIndex + 1);
        const password = 'Test@123';

        try {
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });

          if (authError) {
            console.log(`⚠️  Skipping ${email}: ${authError.message}`);
            continue;
          }

          const userId = authData.user!.id;
          userIds.push(userId);

          // Determine sponsor (create MLM structure)
          let referredBy = null;
          if (level > 1 && userIds.length > 1) {
            // Randomly pick a user from previous levels as sponsor
            const sponsorIndex = randomInt(0, Math.min(userIds.length - 2, userIndex - 1));
            referredBy = userIds[sponsorIndex];
          }

          // Determine rank based on level
          let rank = ranks[0];
          if (level > 25) rank = ranks[5];
          else if (level > 20) rank = ranks[4];
          else if (level > 15) rank = ranks[3];
          else if (level > 10) rank = ranks[2];
          else if (level > 5) rank = ranks[1];

          // Random wallet balance and investment
          const totalInvestment = randomFloat(0, 50000);
          const walletBalance = randomFloat(100, 20000);
          const totalEarnings = randomFloat(0, totalInvestment * 0.5);

          // Random KYC status
          const kycStatuses = ['approved', 'pending', 'rejected', 'not_submitted'];
          const kycWeights = [0.6, 0.2, 0.1, 0.1]; // 60% approved, 20% pending, etc.
          let kycStatus = 'not_submitted';
          const rand = Math.random();
          if (rand < kycWeights[0]) kycStatus = 'approved';
          else if (rand < kycWeights[0] + kycWeights[1]) kycStatus = 'pending';
          else if (rand < kycWeights[0] + kycWeights[1] + kycWeights[2]) kycStatus = 'rejected';

          const user = {
            id: userId,
            email,
            full_name: `${firstName} ${lastName}`,
            phone: generatePhone(),
            role: 'user',
            is_active: Math.random() > 0.1, // 90% active
            wallet_balance: walletBalance,
            total_investment: totalInvestment,
            total_earnings: totalEarnings,
            referral_code: `REF${userId.substring(0, 8).toUpperCase()}`,
            referred_by: referredBy,
            rank,
            kyc_status: kycStatus,
            created_at: new Date(Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000).toISOString(),
          };

          await supabase.from('users').upsert(user);
          users.push(user);

          userIndex++;
          if (userIndex % 10 === 0) {
            console.log(`✅ Created ${userIndex}/100 users...`);
          }
        } catch (error: any) {
          console.log(`⚠️  Error creating user ${email}:`, error.message);
        }
      }

      // Increase users per level gradually (pyramid structure)
      if (level % 3 === 0) usersPerLevel++;
    }

    console.log(`\n✅ Created ${users.length} users total\n`);

    // Step 3: Create packages for users
    console.log('3️⃣ Creating package purchases...');
    const packages = [
      { name: 'Starter Pack', price: 1000, daily_return_percentage: 0.5, max_return_percentage: 150, duration_days: 180 },
      { name: 'Bronze Pack', price: 5000, daily_return_percentage: 0.6, max_return_percentage: 160, duration_days: 180 },
      { name: 'Silver Pack', price: 10000, daily_return_percentage: 0.7, max_return_percentage: 170, duration_days: 180 },
      { name: 'Gold Pack', price: 25000, daily_return_percentage: 0.8, max_return_percentage: 180, duration_days: 180 },
      { name: 'Platinum Pack', price: 50000, daily_return_percentage: 1.0, max_return_percentage: 200, duration_days: 180 },
    ];

    // Get or create packages
    for (const pkg of packages) {
      await supabase.from('packages').upsert({
        name: pkg.name,
        description: `${pkg.name} - ${pkg.daily_return_percentage}% daily returns`,
        price: pkg.price,
        min_investment: pkg.price,
        max_investment: pkg.price * 10,
        daily_return_percentage: pkg.daily_return_percentage,
        max_return_percentage: pkg.max_return_percentage,
        duration_days: pkg.duration_days,
        is_active: true,
        is_featured: true,
        sort_order: packages.indexOf(pkg),
      }, { onConflict: 'name' });
    }

    const { data: pkgList } = await supabase.from('packages').select('*');

    let packageCount = 0;
    for (const user of users) {
      // 70% of users have at least one package
      if (Math.random() < 0.7 && pkgList && pkgList.length > 0) {
        const numPackages = randomInt(1, 3);

        for (let i = 0; i < numPackages; i++) {
          const pkg = randomElement(pkgList);
          const investmentAmount = randomFloat(pkg.min_investment || pkg.price, Math.min(pkg.max_investment || pkg.price * 2, user.total_investment || pkg.price));
          const dailyReturn = (investmentAmount * pkg.daily_return_percentage) / 100;
          const totalReturn = (investmentAmount * pkg.max_return_percentage) / 100;
          const claimedReturn = randomFloat(0, totalReturn * 0.6);

          const startDate = new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000);
          const endDate = new Date(startDate.getTime() + pkg.duration_days * 24 * 60 * 60 * 1000);

          const statuses = ['active', 'completed', 'cancelled'];
          const status = randomElement(statuses);

          await supabase.from('user_packages').insert({
            user_id: user.id,
            package_id: pkg.id,
            amount_invested: investmentAmount,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            daily_return: dailyReturn,
            total_return: totalReturn,
            claimed_return: claimedReturn,
            last_claim_date: new Date(Date.now() - randomInt(1, 7) * 24 * 60 * 60 * 1000).toISOString(),
            status,
          });

          packageCount++;
        }
      }
    }

    console.log(`✅ Created ${packageCount} package purchases\n`);

    // Step 4: Create transactions
    console.log('4️⃣ Creating transactions...');
    let txCount = 0;
    for (const user of users) {
      const numTransactions = randomInt(5, 20);

      for (let i = 0; i < numTransactions; i++) {
        const txTypes = ['deposit', 'withdrawal', 'package_purchase', 'package_return', 'referral_commission', 'binary_commission'];
        const txType = randomElement(txTypes);

        let amount = 0;
        if (txType === 'deposit') amount = randomFloat(100, 10000);
        else if (txType === 'withdrawal') amount = -randomFloat(100, 5000);
        else if (txType === 'package_purchase') amount = -randomFloat(1000, 25000);
        else if (txType === 'package_return') amount = randomFloat(10, 500);
        else if (txType === 'referral_commission') amount = randomFloat(50, 1000);
        else if (txType === 'binary_commission') amount = randomFloat(20, 500);

        const statuses = ['completed', 'pending', 'failed'];
        const status = txType === 'withdrawal' && Math.random() < 0.3 ? 'pending' : randomElement(statuses);

        await supabase.from('mlm_transactions').insert({
          user_id: user.id,
          transaction_type: txType,
          amount,
          status,
          metadata: {
            description: `${txType} transaction`,
            auto_generated: true,
          },
          created_at: new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000).toISOString(),
        });

        txCount++;
      }
    }

    console.log(`✅ Created ${txCount} transactions\n`);

    // Step 5: Create KYC submissions for users with approved/pending/rejected status
    console.log('5️⃣ Creating KYC submissions...');
    let kycCount = 0;
    for (const user of users) {
      if (user.kyc_status !== 'not_submitted') {
        await supabase.from('kyc_submissions').insert({
          user_id: user.id,
          status: user.kyc_status,
          document_type: randomElement(['passport', 'drivers_license', 'national_id']),
          document_number: `DOC${randomInt(100000, 999999)}`,
          full_name: user.full_name,
          date_of_birth: new Date(Date.now() - randomInt(18, 65) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nationality: randomElement(countries),
          address: generateAddress(),
          city: randomElement(cities),
          state: randomElement(['CA', 'NY', 'TX', 'FL', 'IL']),
          postal_code: `${randomInt(10000, 99999)}`,
          country: randomElement(countries),
          phone: user.phone,
          front_document_url: `https://example.com/docs/front_${user.id}.jpg`,
          back_document_url: `https://example.com/docs/back_${user.id}.jpg`,
          selfie_url: `https://example.com/docs/selfie_${user.id}.jpg`,
          proof_of_address_url: `https://example.com/docs/address_${user.id}.jpg`,
          submitted_at: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000).toISOString(),
          reviewed_at: user.kyc_status !== 'pending' ? new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString() : null,
          reviewed_by: user.kyc_status !== 'pending' ? adminId : null,
          rejection_reason: user.kyc_status === 'rejected' ? 'Document quality is poor. Please resubmit.' : null,
        });

        kycCount++;
      }
    }

    console.log(`✅ Created ${kycCount} KYC submissions\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ DATABASE SEEDING COMPLETED!');
    console.log('═══════════════════════════════════════');
    console.log(`👥 Users created: ${users.length}`);
    console.log(`📦 Package purchases: ${packageCount}`);
    console.log(`💳 Transactions: ${txCount}`);
    console.log(`🆔 KYC submissions: ${kycCount}`);
    console.log('═══════════════════════════════════════');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@finaster.com / Admin@123');
    console.log('Users: [firstname].[lastname][1-100]@testuser.com / Test@123');
    console.log('\nExample: john.smith1@testuser.com / Test@123\n');

  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
