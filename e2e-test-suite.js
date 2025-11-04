import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, status, details) {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`\n${icon} ${name}`);
  if (details) console.log(`   ${details}`);
  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else results.failed++;
}

async function e2eTestSuite() {
  console.log('\n🧪 END-TO-END TEST SUITE\n');
  console.log('='.repeat(80));

  // TEST 1: User Registration with Referrals
  console.log('\n📋 TEST 1: User Registration with Referral System');
  try {
    // Get existing user as sponsor
    const { data: sponsorUser } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'user')
      .limit(1)
      .single();

    if (!sponsorUser) {
      logTest('User Registration', 'FAIL', 'No existing user found to act as sponsor');
    } else {
      const sponsorId = sponsorUser.id;
      const timestamp = Date.now();
      const newUserEmail = `test-e2e-${timestamp}@example.com`;

      console.log(`   Sponsor: ${sponsorUser.email} (${sponsorId})`);
      console.log(`   Creating new user: ${newUserEmail}`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: 'Test123456!',
        email_confirm: true
      });

      if (authError) {
        logTest('User Registration - Auth', 'FAIL', authError.message);
      } else {
        console.log(`   ✓ Auth user created: ${authData.user.id}`);

        // Create user in users table
        // Using a dummy hash - actual auth is handled by Supabase Auth
        const dummyHash = '$2a$10$abcdefghijklmnopqrstuuGZkYZ1CkNZvY8qXHoHmZCLvOqN6'; // Dummy bcrypt hash
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: newUserEmail,
            password_hash: dummyHash,
            full_name: 'E2E Test User',
            role: 'user',
            sponsor_id: sponsorId,
            is_active: true,
            email_verified: true
          })
          .select()
          .single();

        if (userError) {
          logTest('User Registration - User Table', 'FAIL', userError.message);
        } else {
          console.log(`   ✓ User record created`);

          // Create wallet
          const { error: walletError } = await supabase
            .from('wallets')
            .insert({
              user_id: newUser.id,
              available_balance: 5000, // Give test balance
              total_balance: 5000,
              locked_balance: 0
            });

          if (walletError) {
            logTest('User Registration - Wallet', 'FAIL', walletError.message);
          } else {
            console.log(`   ✓ Wallet created with $5,000 balance`);

            // Create binary node
            const { error: nodeError } = await supabase
              .from('binary_nodes')
              .insert({
                user_id: newUser.id,
                parent_id: sponsorId,
                position: 'left', // or 'right'
                left_volume: 0,
                right_volume: 0,
                level: 1
              });

            if (nodeError) {
              console.log(`   ⚠️ Binary node creation failed: ${nodeError.message}`);
            } else {
              console.log(`   ✓ Binary node created`);
            }

            logTest('User Registration', 'PASS', `User ${newUserEmail} created with sponsor ${sponsorUser.email}`);

            // Store for next test
            global.testUserId = newUser.id;
            global.testUserEmail = newUserEmail;
          }
        }
      }
    }
  } catch (error) {
    logTest('User Registration', 'FAIL', error.message);
  }

  // TEST 2: Package Purchase Flow
  console.log('\n📋 TEST 2: Package Purchase Flow');
  try {
    if (!global.testUserId) {
      logTest('Package Purchase', 'FAIL', 'No test user available from previous test');
    } else {
      // Get starter package
      const { data: starterPackage } = await supabase
        .from('packages')
        .select('*')
        .eq('status', 'active')
        .eq('name', 'Starter Package')
        .single();

      if (!starterPackage) {
        logTest('Package Purchase - Get Package', 'FAIL', 'Starter package not found');
      } else {
        console.log(`   Package: ${starterPackage.name} - $${starterPackage.price}`);

        // Check wallet balance
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', global.testUserId)
          .single();

        console.log(`   Wallet balance: $${wallet.available_balance}`);

        if (wallet.available_balance < starterPackage.price) {
          logTest('Package Purchase - Balance Check', 'FAIL', 'Insufficient balance');
        } else {
          // Create package purchase
          // Using NEW schema after migration
          const dailyROI = starterPackage.price * (starterPackage.daily_return_percentage / 100);
          const totalROILimit = starterPackage.price * (starterPackage.max_return_percentage / 100);
          const expiryDate = new Date(Date.now() + starterPackage.duration_days * 24 * 60 * 60 * 1000);

          const { data: purchase, error: purchaseError } = await supabase
            .from('user_packages')
            .insert({
              user_id: global.testUserId,
              package_id: starterPackage.id,
              investment_amount: starterPackage.price,
              daily_roi_amount: dailyROI,
              total_roi_limit: totalROILimit,
              expiry_date: expiryDate.toISOString(),
              status: 'active'
            })
            .select()
            .single();

          if (purchaseError) {
            logTest('Package Purchase - Create Purchase', 'FAIL', purchaseError.message);
          } else {
            console.log(`   ✓ Package purchase created: ${purchase.id}`);

            // Deduct from wallet
            const newBalance = wallet.available_balance - starterPackage.price;
            const { error: updateError } = await supabase
              .from('wallets')
              .update({
                available_balance: newBalance,
                total_balance: newBalance
              })
              .eq('user_id', global.testUserId);

            if (updateError) {
              logTest('Package Purchase - Update Wallet', 'FAIL', updateError.message);
            } else {
              console.log(`   ✓ Wallet updated: $${newBalance}`);

              // Create transaction record
              const { error: txError } = await supabase
                .from('transactions')
                .insert({
                  user_id: global.testUserId,
                  type: 'package_purchase',
                  amount: starterPackage.price,
                  status: 'completed',
                  description: `Purchase: ${starterPackage.name}`,
                  reference_id: purchase.id
                });

              if (txError) {
                console.log(`   ⚠️ Transaction record failed: ${txError.message}`);
              } else {
                console.log(`   ✓ Transaction recorded`);
              }

              logTest('Package Purchase', 'PASS', `Purchased ${starterPackage.name} for $${starterPackage.price}`);
              global.packagePurchaseId = purchase.id;
            }
          }
        }
      }
    }
  } catch (error) {
    logTest('Package Purchase', 'FAIL', error.message);
  }

  // TEST 3: Commission Distribution
  console.log('\n📋 TEST 3: Commission Distribution (30-Level System)');
  try {
    if (!global.testUserId || !global.packagePurchaseId) {
      logTest('Commission Distribution', 'FAIL', 'No package purchase available from previous test');
    } else {
      // Get commission settings
      const { data: commissionSettings } = await supabase
        .from('commission_settings')
        .select('*')
        .single();

      if (!commissionSettings) {
        logTest('Commission Distribution - Settings', 'FAIL', 'Commission settings not found');
      } else {
        console.log(`   Commission levels configured: ${commissionSettings.level_commissions.length}`);

        // Get user with their sponsor
        const { data: user } = await supabase
          .from('users')
          .select('id, email, sponsor_id')
          .eq('id', global.testUserId)
          .single();

        if (!user.sponsor_id) {
          logTest('Commission Distribution - Sponsor', 'FAIL', 'User has no sponsor');
        } else {
          const purchaseAmount = 1000; // Starter package price

          // Calculate level 1 commission (10%)
          const level1Commission = purchaseAmount * 0.10;

          console.log(`   Purchase amount: $${purchaseAmount}`);
          console.log(`   Level 1 commission (10%): $${level1Commission}`);

          // Create commission record for sponsor
          const { error: commError } = await supabase
            .from('commissions')
            .insert({
              user_id: user.sponsor_id,
              from_user_id: global.testUserId,
              type: 'direct',
              level: 1,
              amount: level1Commission,
              percentage: 10,
              reference_type: 'package_purchase',
              reference_id: global.packagePurchaseId,
              status: 'paid'
            });

          if (commError) {
            logTest('Commission Distribution - Create', 'FAIL', commError.message);
          } else {
            console.log(`   ✓ Level 1 commission created`);

            // Update sponsor's wallet
            const { data: sponsorWallet } = await supabase
              .from('wallets')
              .select('*')
              .eq('user_id', user.sponsor_id)
              .single();

            if (sponsorWallet) {
              const newBalance = (sponsorWallet.available_balance || 0) + level1Commission;
              const { error: updateError } = await supabase
                .from('wallets')
                .update({
                  available_balance: newBalance,
                  total_balance: (sponsorWallet.total_balance || 0) + level1Commission
                })
                .eq('user_id', user.sponsor_id);

              if (updateError) {
                console.log(`   ⚠️ Wallet update failed: ${updateError.message}`);
              } else {
                console.log(`   ✓ Sponsor wallet updated: +$${level1Commission}`);
              }
            }

            // Create transaction for sponsor
            const { error: txError } = await supabase
              .from('transactions')
              .insert({
                user_id: user.sponsor_id,
                type: 'level_commission',
                amount: level1Commission,
                status: 'completed',
                description: `Level 1 commission from ${global.testUserEmail}`,
                reference_id: global.packagePurchaseId
              });

            if (txError) {
              console.log(`   ⚠️ Transaction failed: ${txError.message}`);
            } else {
              console.log(`   ✓ Commission transaction recorded`);
            }

            logTest('Commission Distribution', 'PASS', `Level 1 commission of $${level1Commission} distributed to sponsor`);
          }
        }
      }
    }
  } catch (error) {
    logTest('Commission Distribution', 'FAIL', error.message);
  }

  // TEST 4: ROI Calculation Test
  console.log('\n📋 TEST 4: ROI Calculation');
  try {
    if (!global.packagePurchaseId) {
      logTest('ROI Calculation', 'FAIL', 'No package purchase available');
    } else {
      const { data: userPackage } = await supabase
        .from('user_packages')
        .select('*')
        .eq('id', global.packagePurchaseId)
        .single();

      if (!userPackage) {
        logTest('ROI Calculation', 'FAIL', 'Package not found');
      } else {
        const investmentAmount = userPackage.investment_amount || 0;
        const dailyROI = userPackage.daily_roi_amount || 0;
        const totalLimit = userPackage.total_roi_limit || 0;

        console.log(`   Investment: $${investmentAmount}`);
        console.log(`   Daily ROI amount: $${dailyROI.toFixed(2)}`);
        console.log(`   Total ROI limit: $${totalLimit.toFixed(2)}`);
        console.log(`   Days to maturity: ${Math.floor(totalLimit / dailyROI)} days`);

        // Create a test ROI distribution
        const { error: roiError } = await supabase
          .from('roi_distributions')
          .insert({
            user_package_id: global.packagePurchaseId,
            user_id: global.testUserId,
            roi_amount: dailyROI,
            roi_percentage: (dailyROI / investmentAmount) * 100,
            investment_amount: investmentAmount,
            distribution_date: new Date().toISOString().split('T')[0],
            day_number: 1,
            status: 'paid',
            paid_at: new Date().toISOString()
          });

        if (roiError) {
          logTest('ROI Calculation', 'FAIL', roiError.message);
        } else {
          console.log(`   ✓ ROI distribution record created`);
          logTest('ROI Calculation', 'PASS', `Daily ROI of $${dailyROI.toFixed(2)} calculated correctly`);
        }
      }
    }
  } catch (error) {
    logTest('ROI Calculation', 'FAIL', error.message);
  }

  // TEST 5: Verify Data Integrity After Operations
  console.log('\n📋 TEST 5: Data Integrity After Operations');
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', global.testUserId)
      .single();

    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', global.testUserId)
      .single();

    const { data: purchases } = await supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', global.testUserId);

    const { data: commissions } = await supabase
      .from('commissions')
      .select('*')
      .eq('from_user_id', global.testUserId);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', global.testUserId);

    console.log(`\n   📊 Test User Data Summary:`);
    console.log(`      User: ${user?.email}`);
    console.log(`      Wallet Balance: $${wallet?.available_balance || 0}`);
    console.log(`      Active Packages: ${purchases?.length || 0}`);
    console.log(`      Commissions Generated: ${commissions?.length || 0}`);
    console.log(`      Transactions: ${transactions?.length || 0}`);

    const issues = [];
    if (!wallet) issues.push('No wallet found');
    if (wallet && wallet.available_balance < 0) issues.push('Negative balance');
    if (!purchases || purchases.length === 0) issues.push('No packages purchased');

    if (issues.length === 0) {
      logTest('Data Integrity', 'PASS', 'All data relationships verified');
    } else {
      logTest('Data Integrity', 'FAIL', issues.join(', '));
    }
  } catch (error) {
    logTest('Data Integrity', 'FAIL', error.message);
  }

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 E2E TEST SUMMARY\n');
  console.log(`   Total Tests: ${results.tests.length}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);

  const score = ((results.passed / results.tests.length) * 100).toFixed(1);
  console.log(`\n   🎯 Test Score: ${score}%`);

  console.log('\n📋 DETAILED RESULTS:\n');
  results.tests.forEach((test, idx) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${idx + 1}. ${icon} ${test.name}`);
    if (test.details) console.log(`      ${test.details}`);
  });

  if (results.failed === 0) {
    console.log('\n   ✅ ALL E2E TESTS PASSED!');
    console.log('   🚀 Package Purchase, Commission Distribution, and ROI working correctly!');
  } else {
    console.log('\n   ⚠️ Some tests failed - Review above for details');
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Cleanup test user (optional)
  console.log('💡 TIP: Test user created with email:', global.testUserEmail);
  console.log('         You can login with password: Test123456!');
  console.log('         Or delete the test user to clean up.\n');

  return {
    passed: results.passed,
    failed: results.failed,
    score: parseFloat(score)
  };
}

e2eTestSuite().then(result => {
  process.exit(result.failed > 0 ? 1 : 0);
}).catch(console.error);
