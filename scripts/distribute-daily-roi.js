/**
 * Daily ROI Distribution Script
 *
 * This script should be run once per day (via cron job) to distribute ROI to all active packages.
 *
 * Setup cron job (Linux/Mac):
 * Run daily at 00:00 UTC:
 * 0 0 * * * cd /path/to/project && node scripts/distribute-daily-roi.js >> logs/roi-distribution.log 2>&1
 *
 * Windows Task Scheduler:
 * - Create a new task to run daily at 00:00
 * - Action: Start a program
 * - Program: C:\Program Files\nodejs\node.exe
 * - Arguments: C:\path\to\project\scripts\distribute-daily-roi.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing Supabase credentials');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Distribute daily ROI to all active packages
 */
async function distributeDailyROI() {
  try {
    console.log('=====================================');
    console.log(`Daily ROI Distribution Started: ${new Date().toISOString()}`);
    console.log('=====================================');

    // Get all active packages
    const { data: activePackages, error: packagesError } = await supabase
      .from('user_packages')
      .select(`
        id,
        user_id,
        package_id,
        amount,
        roi_percentage,
        roi_earned,
        purchased_at,
        is_active,
        packages (
          duration_days,
          name
        )
      `)
      .eq('is_active', true);

    if (packagesError) throw packagesError;

    if (!activePackages || activePackages.length === 0) {
      console.log('✓ No active packages found for ROI distribution');
      return { processed: 0, total_amount: 0, errors: 0 };
    }

    console.log(`Found ${activePackages.length} active packages`);

    let processedCount = 0;
    let totalAmountDistributed = 0;
    let errorCount = 0;
    let maturedCount = 0;

    const today = new Date();

    // Process each package
    for (const pkg of activePackages) {
      try {
        const packageData = pkg.packages;
        const durationDays = packageData?.duration_days || 365;
        const purchasedDate = new Date(pkg.purchased_at);

        // Calculate days since purchase
        const daysSincePurchase = Math.floor((today.getTime() - purchasedDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check if package has expired
        if (daysSincePurchase >= durationDays) {
          console.log(`  Package ${pkg.id}: MATURED (${daysSincePurchase}/${durationDays} days) - Deactivating`);

          // Deactivate the package
          await supabase
            .from('user_packages')
            .update({
              is_active: false,
              maturity_date: today.toISOString()
            })
            .eq('id', pkg.id);

          maturedCount++;
          continue; // Skip ROI distribution for matured package
        }

        // Calculate daily ROI
        const dailyRoiAmount = pkg.amount * (pkg.roi_percentage / 100);

        // Check if maximum ROI has been reached (300% max)
        const maxRoi = pkg.amount * 3;
        if (pkg.roi_earned + dailyRoiAmount > maxRoi) {
          console.log(`  Package ${pkg.id}: MAX ROI REACHED ($${pkg.roi_earned.toFixed(2)}/$${maxRoi.toFixed(2)}) - Deactivating`);

          // Deactivate package that reached max ROI
          await supabase
            .from('user_packages')
            .update({
              is_active: false,
              maturity_date: today.toISOString()
            })
            .eq('id', pkg.id);

          maturedCount++;
          continue;
        }

        // Get user's current wallet balance
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('wallet_balance, total_earnings')
          .eq('id', pkg.user_id)
          .single();

        if (userError || !userData) {
          console.error(`  ERROR: Failed to fetch user ${pkg.user_id}:`, userError?.message);
          errorCount++;
          continue;
        }

        // Credit ROI to user's wallet
        await supabase
          .from('users')
          .update({
            wallet_balance: userData.wallet_balance + dailyRoiAmount,
            total_earnings: userData.total_earnings + dailyRoiAmount
          })
          .eq('id', pkg.user_id);

        // Update package's ROI earned
        await supabase
          .from('user_packages')
          .update({
            roi_earned: pkg.roi_earned + dailyRoiAmount
          })
          .eq('id', pkg.id);

        // Create transaction record
        await supabase
          .from('mlm_transactions')
          .insert({
            user_id: pkg.user_id,
            transaction_type: 'roi_income',
            amount: dailyRoiAmount,
            status: 'completed',
            description: `Daily ROI from ${packageData?.name || 'package'} (Day ${daysSincePurchase + 1}/${durationDays})`,
            metadata: {
              package_id: pkg.package_id,
              user_package_id: pkg.id,
              daily_roi_percentage: pkg.roi_percentage,
              day_number: daysSincePurchase + 1,
              total_duration: durationDays
            }
          });

        processedCount++;
        totalAmountDistributed += dailyRoiAmount;

        console.log(`  ✓ Package ${pkg.id} (User ${pkg.user_id}): $${dailyRoiAmount.toFixed(2)} - Day ${daysSincePurchase + 1}/${durationDays}`);
      } catch (pkgError) {
        console.error(`  ERROR processing package ${pkg.id}:`, pkgError.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('=====================================');
    console.log('Distribution Summary:');
    console.log(`  Processed: ${processedCount} packages`);
    console.log(`  Matured: ${maturedCount} packages`);
    console.log(`  Errors: ${errorCount} packages`);
    console.log(`  Total Distributed: $${totalAmountDistributed.toFixed(2)}`);
    console.log('=====================================');

    return {
      processed: processedCount,
      matured: maturedCount,
      total_amount: totalAmountDistributed,
      errors: errorCount
    };
  } catch (error) {
    console.error('FATAL ERROR during daily ROI distribution:', error);
    throw error;
  }
}

// Run the distribution
distributeDailyROI()
  .then(result => {
    console.log(`Daily ROI distribution completed successfully at ${new Date().toISOString()}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`Daily ROI distribution failed at ${new Date().toISOString()}:`);
    console.error(error);
    process.exit(1);
  });
