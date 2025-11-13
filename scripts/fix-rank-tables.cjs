/**
 * Fix Rank Tables Schema and Seed Initial Data
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
    console.log('🔧 Fixing rank_rewards table schema...\n');

    // Drop existing rank_rewards table
    await connection.query('DROP TABLE IF EXISTS rank_rewards');
    console.log('✓ Dropped old rank_rewards table');

    // Create new rank_rewards table with correct schema
    await connection.query(`
      CREATE TABLE rank_rewards (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        rank_name VARCHAR(100) NOT NULL UNIQUE,
        reward_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        rank_order INT NOT NULL UNIQUE,
        min_direct_referrals INT NOT NULL DEFAULT 0,
        min_team_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
        min_active_directs INT NOT NULL DEFAULT 0,
        min_personal_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
        terms_conditions TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        reward_type ENUM('one_time', 'monthly', 'quarterly') NOT NULL DEFAULT 'one_time',
        bonus_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rank_order (rank_order),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created new rank_rewards table with correct schema\n');

    // Insert 10 rank levels
    console.log('📊 Inserting 10 rank levels...\n');

    const ranks = [
      {
        name: 'Bronze',
        order: 1,
        personal: 100,
        teamVolume: 500,
        directs: 2,
        activeDirects: 2,
        reward: 50,
        benefits: 'Welcome bonus\\nBasic trading access\\nCommunity forum access',
        bonus: 0
      },
      {
        name: 'Silver',
        order: 2,
        personal: 500,
        teamVolume: 2500,
        directs: 5,
        activeDirects: 5,
        reward: 200,
        benefits: '5% Level commission boost\\nPriority support\\nTrading signals access',
        bonus: 5
      },
      {
        name: 'Gold',
        order: 3,
        personal: 1000,
        teamVolume: 5000,
        directs: 10,
        activeDirects: 8,
        reward: 500,
        benefits: '10% Level commission boost\\nVIP support\\nPremium trading tools\\nMonthly webinar access',
        bonus: 10
      },
      {
        name: 'Platinum',
        order: 4,
        personal: 2500,
        teamVolume: 15000,
        directs: 15,
        activeDirects: 12,
        reward: 1500,
        benefits: '15% Level boost\\nBinary matching bonus\\nTravel incentive fund\\nOne-on-one coaching',
        bonus: 15
      },
      {
        name: 'Ruby',
        order: 5,
        personal: 5000,
        teamVolume: 30000,
        directs: 20,
        activeDirects: 16,
        reward: 3000,
        benefits: '20% Level boost\\nCar fund ($5,000)\\nAnnual trip\\nLeadership training',
        bonus: 20
      },
      {
        name: 'Emerald',
        order: 6,
        personal: 10000,
        teamVolume: 60000,
        directs: 25,
        activeDirects: 20,
        reward: 7500,
        benefits: '25% Level boost\\nHouse fund ($15,000)\\nQuarterly luxury trips\\nPrivate mastermind group',
        bonus: 25
      },
      {
        name: 'Sapphire',
        order: 7,
        personal: 25000,
        teamVolume: 150000,
        directs: 30,
        activeDirects: 25,
        reward: 15000,
        benefits: '30% Level boost\\nGlobal recognition award\\nLeadership seminars\\nEquity participation',
        bonus: 30
      },
      {
        name: 'Diamond',
        order: 8,
        personal: 50000,
        teamVolume: 300000,
        directs: 40,
        activeDirects: 32,
        reward: 30000,
        benefits: '35% Level boost\\nYacht club membership\\nEquity participation\\nAdvisory board seat',
        bonus: 35
      },
      {
        name: 'Crown',
        order: 9,
        personal: 100000,
        teamVolume: 750000,
        directs: 50,
        activeDirects: 40,
        reward: 75000,
        benefits: '40% Level boost\\nPrivate jet access\\nBoard advisor role\\nProfit sharing program',
        bonus: 40
      },
      {
        name: 'Royal Crown',
        order: 10,
        personal: 250000,
        teamVolume: 2000000,
        directs: 75,
        activeDirects: 60,
        reward: 200000,
        benefits: '50% Level boost\\nCompany shares (0.5%)\\nGlobal ambassador\\nExecutive profit sharing',
        bonus: 50
      }
    ];

    for (const rank of ranks) {
      await connection.query(`
        INSERT INTO rank_rewards (
          rank_name, rank_order, min_personal_sales, min_team_volume,
          min_direct_referrals, min_active_directs, reward_amount,
          terms_conditions, bonus_percentage, is_active, reward_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'one_time')
      `, [
        rank.name,
        rank.order,
        rank.personal,
        rank.teamVolume,
        rank.directs,
        rank.activeDirects,
        rank.reward,
        rank.benefits,
        rank.bonus
      ]);

      console.log(`✓ Inserted ${rank.name} rank (Order: ${rank.order}, Reward: $${rank.reward})`);
    }

    console.log('\n✅ All ranks inserted successfully!\n');

    // Check rank_distribution_history table
    console.log('🔧 Checking rank_distribution_history table...\n');

    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'rank_distribution_history'"
    );

    if (tables.length === 0) {
      await connection.query(`
        CREATE TABLE rank_distribution_history (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          userId VARCHAR(36) NOT NULL,
          rank_name VARCHAR(100) NOT NULL,
          reward_amount DECIMAL(15,2) NOT NULL,
          distributed_by VARCHAR(36),
          distribution_type ENUM('automatic', 'manual') NOT NULL DEFAULT 'automatic',
          notes TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_userId (userId),
          INDEX idx_rank_name (rank_name),
          INDEX idx_created (createdAt),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ Created rank_distribution_history table\n');
    } else {
      console.log('✓ rank_distribution_history table already exists\n');
    }

    // Show summary
    const [countResult] = await connection.query('SELECT COUNT(*) as count FROM rank_rewards');
    console.log(`\n📊 Summary:`);
    console.log(`   Total ranks in database: ${countResult[0].count}`);
    console.log(`\n✅ Rank Management tables are ready!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
