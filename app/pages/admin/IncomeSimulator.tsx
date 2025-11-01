/**
 * INCOME DISTRIBUTION SIMULATOR - Admin Tool
 * Visualize live commission breakdown based on package and investment
 */

import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Users, DollarSign, Percent, Award, CheckCircle, XCircle } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui/DesignSystem';
import { getActivePackages, getPackageLevelCommissions, type Package } from '../../services/admin-package.service';
import toast from 'react-hot-toast';

interface LevelCommissionResult {
  level: number;
  percentage: number;
  amount: number;
  cumulative: number;
  status: 'active' | 'locked';
}

interface SimulationResult {
  package: Package;
  investment: number;
  hasRobot: boolean;
  dailyRoi: { min: number; max: number };
  totalReturn: { min: number; max: number };
  directCommission: number;
  levelCommissions: LevelCommissionResult[];
  totalLevelIncome: number;
  binaryBonus: number;
  totalEarnings: number;
  activelevels: number;
}

export const IncomeSimulator: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [investment, setInvestment] = useState<number>(1000);
  const [hasRobot, setHasRobot] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await getActivePackages();
      setPackages(data);
      if (data.length > 0) {
        setSelectedPackage(data[0]);
        setInvestment(data[0].min_investment);
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast.error('Failed to load packages');
    }
  };

  const handlePackageChange = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      setSelectedPackage(pkg);
      setInvestment(pkg.min_investment);
      setResult(null);
    }
  };

  const handleInvestmentChange = (value: number) => {
    if (!selectedPackage) return;

    if (value < selectedPackage.min_investment) {
      setInvestment(selectedPackage.min_investment);
    } else if (value > selectedPackage.max_investment) {
      setInvestment(selectedPackage.max_investment);
    } else {
      setInvestment(value);
    }
  };

  const calculateDistribution = async () => {
    if (!selectedPackage) {
      toast.error('Please select a package');
      return;
    }

    setLoading(true);

    try {
      // Fetch level commissions for the package
      const levelCommissionsData = await getPackageLevelCommissions(selectedPackage.id);

      // Determine active levels based on robot subscription
      const activeLevels = hasRobot ? selectedPackage.level_depth : Math.min(5, selectedPackage.level_depth);

      // Calculate daily ROI range
      const dailyRoiMin = investment * (selectedPackage.daily_return_percentage / 100);
      const dailyRoiMax = investment * (selectedPackage.daily_return_percentage * 1.4 / 100); // 40% variance

      // Calculate total return range
      const totalReturnMin = dailyRoiMin * selectedPackage.duration_days;
      const totalReturnMax = dailyRoiMax * selectedPackage.duration_days;

      // Calculate direct commission
      const directCommission = investment * (selectedPackage.direct_commission_percentage / 100);

      // Calculate level commissions
      const levelCommissions: LevelCommissionResult[] = [];
      let cumulativeAmount = 0;

      for (let i = 1; i <= selectedPackage.level_depth; i++) {
        const commissionData = levelCommissionsData.find(lc => lc.level === i);
        const percentage = commissionData?.commission_percentage || 0;
        const amount = investment * (percentage / 100);
        cumulativeAmount += amount;

        levelCommissions.push({
          level: i,
          percentage,
          amount,
          cumulative: cumulativeAmount,
          status: i <= activeLevels ? 'active' : 'locked',
        });
      }

      // Calculate total level income (only active levels)
      const totalLevelIncome = levelCommissions
        .filter(lc => lc.status === 'active')
        .reduce((sum, lc) => sum + lc.amount, 0);

      // Calculate binary bonus (simplified simulation)
      const binaryBonus = investment * (selectedPackage.binary_bonus_percentage / 100);

      // Calculate total earnings
      const totalEarnings = directCommission + totalLevelIncome + binaryBonus;

      const simulationResult: SimulationResult = {
        package: selectedPackage,
        investment,
        hasRobot,
        dailyRoi: { min: dailyRoiMin, max: dailyRoiMax },
        totalReturn: { min: totalReturnMin, max: totalReturnMax },
        directCommission,
        levelCommissions,
        totalLevelIncome,
        binaryBonus,
        totalEarnings,
        activelevels: activeLevels,
      };

      setResult(simulationResult);
      toast.success('Distribution calculated!');
    } catch (error) {
      console.error('Calculation error:', error);
      toast.error('Failed to calculate distribution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-8 h-8 text-[#00C7D1]" />
          <h1 className="text-3xl font-bold text-[#f8fafc]">Income Distribution Simulator</h1>
        </div>
        <p className="text-[#cbd5e1]">
          Visualize live commission breakdown based on package and investment amount
        </p>
      </div>

      {/* Input Section */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#f8fafc] mb-6">Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Package Selection */}
            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Select Package <span className="text-[#ef4444]">*</span>
              </label>
              <select
                value={selectedPackage?.id || ''}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
              >
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} (${pkg.min_investment.toLocaleString()} - ${pkg.max_investment.toLocaleString()})
                  </option>
                ))}
              </select>
              {selectedPackage && (
                <p className="text-[#94a3b8] text-sm mt-1">
                  Min: ${selectedPackage.min_investment.toLocaleString()} | Max: ${selectedPackage.max_investment.toLocaleString()}
                </p>
              )}
            </div>

            {/* Investment Amount */}
            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Investment Amount <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">$</span>
                <input
                  type="number"
                  value={investment}
                  onChange={(e) => handleInvestmentChange(parseFloat(e.target.value) || 0)}
                  min={selectedPackage?.min_investment}
                  max={selectedPackage?.max_investment}
                  step="100"
                  className="w-full pl-8 pr-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
                />
              </div>
              {selectedPackage && (
                <input
                  type="range"
                  value={investment}
                  onChange={(e) => handleInvestmentChange(parseFloat(e.target.value))}
                  min={selectedPackage.min_investment}
                  max={selectedPackage.max_investment}
                  step="100"
                  className="w-full mt-2"
                />
              )}
            </div>

            {/* Robot Subscription */}
            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">Robot Subscription</label>
              <label className="flex items-center gap-3 p-4 bg-[#1e293b] rounded-lg cursor-pointer border-2 border-transparent hover:border-[#00C7D1] transition-colors">
                <input
                  type="checkbox"
                  checked={hasRobot}
                  onChange={(e) => setHasRobot(e.target.checked)}
                  className="w-5 h-5"
                />
                <div>
                  <span className="text-[#f8fafc] font-semibold">With Robot ($100/month)</span>
                  <p className="text-[#94a3b8] text-xs">
                    {hasRobot ? `Earns ${selectedPackage?.level_depth || 30} levels` : 'Earns only 5 levels'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <Button
            onClick={calculateDistribution}
            disabled={!selectedPackage || loading}
            className="w-full md:w-auto bg-gradient-to-r from-[#00C7D1] to-[#00e5f0] hover:from-[#00b0ba] hover:to-[#00C7D1]"
          >
            <Calculator className="w-5 h-5 mr-2" />
            {loading ? 'Calculating...' : 'Calculate Distribution'}
          </Button>
        </div>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Investment Summary */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#f8fafc] mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-[#00C7D1]" />
                Investment Summary
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-1">Package</p>
                  <p className="text-[#f8fafc] font-bold">{result.package.name}</p>
                </div>

                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-1">Investment</p>
                  <p className="text-[#00C7D1] font-bold text-lg">${result.investment.toLocaleString()}</p>
                </div>

                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-1">Robot Status</p>
                  <div className="flex items-center gap-2">
                    {result.hasRobot ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-[#10b981]" />
                        <span className="text-[#10b981] font-bold">Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-[#64748b]" />
                        <span className="text-[#64748b] font-bold">Inactive</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-1">Duration</p>
                  <p className="text-[#f8fafc] font-bold">{result.package.duration_days} days</p>
                </div>

                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-1">Daily ROI Range</p>
                  <p className="text-[#10b981] font-bold">
                    ${result.dailyRoi.min.toFixed(2)} - ${result.dailyRoi.max.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-1">Total ROI Return</p>
                  <p className="text-[#10b981] font-bold text-lg">
                    ${result.totalReturn.min.toLocaleString()} - ${result.totalReturn.max.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-1">Active Levels</p>
                  <p className="text-[#f59e0b] font-bold">{result.activelevels} / {result.package.level_depth}</p>
                </div>

                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-1">ROI %</p>
                  <p className="text-[#f8fafc] font-bold">{result.package.daily_return_percentage}%</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Level Income Distribution */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#f8fafc] mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-[#00C7D1]" />
                Level Income Distribution
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#475569]">
                      <th className="text-left py-3 px-4 text-[#94a3b8] font-semibold">Level</th>
                      <th className="text-left py-3 px-4 text-[#94a3b8] font-semibold">Commission %</th>
                      <th className="text-right py-3 px-4 text-[#94a3b8] font-semibold">Amount</th>
                      <th className="text-right py-3 px-4 text-[#94a3b8] font-semibold">Cumulative</th>
                      <th className="text-center py-3 px-4 text-[#94a3b8] font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.levelCommissions.map((lc) => (
                      <tr
                        key={lc.level}
                        className={`border-b border-[#334155] ${
                          lc.status === 'locked' ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="text-[#f8fafc] font-semibold">Level {lc.level}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[#00C7D1] font-bold">{lc.percentage}%</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[#10b981] font-bold">
                            ${lc.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[#f8fafc]">${lc.cumulative.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {lc.status === 'active' ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="default">
                              🔒 Locked
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1e293b]">
                      <td colSpan={2} className="py-4 px-4">
                        <span className="text-[#f8fafc] font-bold text-lg">Total Level Income</span>
                      </td>
                      <td className="py-4 px-4 text-right" colSpan={3}>
                        <span className="text-[#00C7D1] font-bold text-xl">
                          ${result.totalLevelIncome.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </Card>

          {/* Commission Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Direct Commission */}
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-[#1e293b] rounded-lg">
                    <Award className="w-6 h-6 text-[#f59e0b]" />
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-sm">Direct Commission</p>
                    <p className="text-[#f8fafc] font-semibold">{result.package.direct_commission_percentage}%</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#f59e0b]">
                  ${result.directCommission.toFixed(2)}
                </p>
              </div>
            </Card>

            {/* Binary Bonus */}
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-[#1e293b] rounded-lg">
                    <Percent className="w-6 h-6 text-[#a855f7]" />
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-sm">Binary Bonus</p>
                    <p className="text-[#f8fafc] font-semibold">{result.package.binary_bonus_percentage}%</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#a855f7]">
                  ${result.binaryBonus.toFixed(2)}
                </p>
              </div>
            </Card>

            {/* Total Earnings */}
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-[#1e293b] rounded-lg">
                    <DollarSign className="w-6 h-6 text-[#10b981]" />
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-sm">Total Commission Earnings</p>
                    <p className="text-[#f8fafc] font-semibold text-xs">
                      (From this 1 referral purchase)
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#10b981]">
                  ${result.totalEarnings.toFixed(2)}
                </p>
              </div>
            </Card>
          </div>

          {/* ROI Info */}
          <Card className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-2 border-[#00C7D1]">
            <div className="p-6">
              <h3 className="text-lg font-bold text-[#f8fafc] mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00C7D1]" />
                💡 ROI Income (Separate from Commissions)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[#cbd5e1] mb-2">
                    The <span className="text-[#00C7D1] font-bold">Daily ROI</span> of{' '}
                    <span className="text-[#10b981] font-bold">
                      ${result.dailyRoi.min.toFixed(2)} - ${result.dailyRoi.max.toFixed(2)}
                    </span>{' '}
                    is paid directly to the investor daily for {result.package.duration_days} days.
                  </p>
                </div>
                <div>
                  <p className="text-[#cbd5e1]">
                    Total ROI earnings:{' '}
                    <span className="text-[#10b981] font-bold text-lg">
                      ${result.totalReturn.min.toLocaleString()} - ${result.totalReturn.max.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-[#94a3b8] text-sm mt-1">
                    This is <span className="font-semibold">separate</span> from the commission earnings shown above.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <Card className="text-center py-16">
          <Calculator className="w-16 h-16 text-[#64748b] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-[#f8fafc] mb-2">Ready to Simulate</h3>
          <p className="text-[#cbd5e1] mb-6">
            Select a package and investment amount above, then click Calculate Distribution
          </p>
        </Card>
      )}
    </div>
  );
};

export default IncomeSimulator;
