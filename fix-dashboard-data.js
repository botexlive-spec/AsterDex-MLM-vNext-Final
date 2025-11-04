import fs from 'fs';

console.log('🔧 Fixing DashboardNew.tsx to use real database data...\\n');

const filePath = 'app/pages/user/DashboardNew.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports
const oldImports = `import { Button, Card, Badge, StatCard } from '../../components/ui/DesignSystem';`;
const newImports = `import { Button, Card, Badge, StatCard } from '../../components/ui/DesignSystem';
import { getUserDashboard, getTeamStats } from '../../services/mlm.service';`;

content = content.replace(oldImports, newImports);

// 2. Replace fake useEffect with real data loading
const oldUseEffect = `  // Simulate data loading
  useEffect(() => {
    setTimeout(() => setLoading(false), 1500);

    // Real-time data updates (every 30 seconds)
    const interval = setInterval(() => {
      setRefreshing(true);
      // Simulate data fetch
      setTimeout(() => setRefreshing(false), 500);
    }, 30000);

    return () => clearInterval(interval);
  }, []);`;

const newUseEffect = `  // Load real dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardData, teamStats] = await Promise.all([
          getUserDashboard(),
          getTeamStats()
        ]);

        // Update user data
        setUserData({
          name: dashboardData.user.full_name || dashboardData.user.email,
          avatar: '',
          userId: dashboardData.user.id.substring(0, 10).toUpperCase(),
          currentRank: dashboardData.user.current_rank.replace('_', ' ').toUpperCase(),
          memberSince: new Date(dashboardData.user.created_at || Date.now()).toISOString().split('T')[0],
        });

        // Update metrics with REAL data
        setMetrics({
          walletBalance: dashboardData.user.wallet_balance || 0,
          totalInvestment: dashboardData.user.total_investment || 0,
          roi: dashboardData.statistics.roi_earned || 0,
          totalEarningsToday: dashboardData.statistics.today_earnings || 0,
          totalEarningsWeek: dashboardData.statistics.week_earnings || 0,
          totalEarningsMonth: dashboardData.statistics.month_earnings || 0,
          teamSize: {
            directs: teamStats.directCount || 0,
            total: teamStats.totalTeamSize || 0
          },
          binaryVolume: {
            left: dashboardData.statistics.left_volume || 0,
            right: dashboardData.statistics.right_volume || 0
          },
          nextRank: {
            current: dashboardData.user.current_rank.replace('_', ' ').toUpperCase(),
            next: dashboardData.next_rank.rank.replace('_', ' ').toUpperCase(),
            progress: Math.round((dashboardData.statistics.total_volume / dashboardData.next_rank.min_volume) * 100)
          },
          activePackages: {
            count: dashboardData.active_packages.length || 0,
            expiring: 0
          },
        });

        // Update transactions
        if (dashboardData.recent_transactions && dashboardData.recent_transactions.length > 0) {
          setRecentTransactions(
            dashboardData.recent_transactions.map((tx: any) => ({
              id: tx.id,
              date: new Date(tx.created_at),
              type: tx.transaction_type.replace('_', ' ').toUpperCase(),
              amount: parseFloat(tx.amount),
              status: tx.status || 'completed'
            }))
          );
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
        setLoading(false);
      }
    };

    loadDashboardData();

    // Real-time data updates (every 30 seconds)
    const interval = setInterval(loadDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);`;

content = content.replace(oldUseEffect, newUseEffect);

fs.writeFileSync(filePath, content, 'utf-8');

console.log('✅ Fixed DashboardNew.tsx:');
console.log('   • Added getUserDashboard and getTeamStats imports');
console.log('   • Replaced fake setTimeout with real API calls');
console.log('   • Team Size now shows REAL data from database');
console.log('   • Binary Volume now shows REAL left/right values');
console.log('   • All metrics updated from actual database');
console.log('\\n💡 Restart your dev server to see changes!');
