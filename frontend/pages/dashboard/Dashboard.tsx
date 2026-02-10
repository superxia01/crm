import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, DollarSign, AlertTriangle,
  BrainCircuit, Activity as ActivityIcon, BarChart3, PieChart, Clock, ArrowRight, Wallet, Loader2
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/UI';
import { customerService, Customer } from '../../lib/services/customerService';
import { dashboardService, FunnelData } from '../../lib/services/dashboardService';
import { activityService, Activity, RevenueHistory, PipelineRisk } from '../../lib/services/activityService';
import { useLanguage } from '../../contexts';
import { handleApiError } from '../../lib/apiClient';
import { useToast } from '../../contexts';

// --- Components for Visuals ---

const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
  const height = 40;
  const width = 120;
  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} className="overflow-visible opacity-80">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity={0.5} />
      </svg>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.length === 1
    ? `0,${height - ((data[0] - min) / range) * height} ${width},${height - ((data[0] - min) / range) * height}`
    : data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      }).join(' ');
  const pointsAttr = points;

  return (
    <svg width={width} height={height} className="overflow-visible opacity-80">
      <polyline points={pointsAttr} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const AreaChart: React.FC<{ data: { label: string, val1: number, val2: number }[] }> = ({ data }) => {
  const height = 220;
  const width = 600;
  const padding = 30;

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[250px] relative flex items-center justify-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm">暂无数据</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.val1, d.val2))) * 1.1 || 1;

  const getPoints = (key: 'val1' | 'val2') => {
    if (data.length === 1) {
      const x = padding + (width - 2 * padding) / 2;
      const y = height - padding - (data[0][key] / maxVal) * (height - 2 * padding);
      return `${x},${y}`;
    }
    return data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d[key] / maxVal) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
  };

  const getAreaPath = (key: 'val1' | 'val2') => {
    const points = getPoints(key);
    const firstX = padding;
    const lastX = width - padding;
    const bottomY = height - padding;
    // Ensure path starts with M command
    if (!points) {
      return `M${firstX},${bottomY} L${lastX},${bottomY} Z`;
    }
    // Convert points string "x1,y1 x2,y2 ..." to path "M x1,y1 L x2,y2 ..."
    const pointArray = points.split(' ');
    const firstPoint = pointArray[0];
    const restPoints = pointArray.slice(1).map(p => `L${p}`).join(' ');
    return `M${firstPoint} ${restPoints} L${lastX},${bottomY} L${firstX},${bottomY} Z`;
  };

  return (
    <div className="w-full h-full min-h-[250px] relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={padding}
            y1={height - padding - tick * (height - 2 * padding)}
            x2={width - padding}
            y2={height - padding - tick * (height - 2 * padding)}
            stroke="currentColor"
            className="text-gray-100 dark:text-slate-700"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={getAreaPath('val1')} fill="url(#grad1)" />
        <polyline points={getPoints('val1')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        <path d={getAreaPath('val2')} fill="url(#grad2)" />
        <polyline points={getPoints('val2')} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
          return (
            <text
              key={i}
              x={x}
              y={height - 5}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 font-medium"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
      <div className="absolute top-0 right-0 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div> Revenue
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div> Target
        </div>
      </div>
    </div>
  );
};


export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { showError } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<RevenueHistory[]>([]);
  const [pipelineRisks, setPipelineRisks] = useState<PipelineRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch all customers for statistics
      const response = await customerService.listCustomers({
        page: 1,
        per_page: 1000, // Get all customers for stats
      });
      setCustomers(response.customers);

      // Fetch sales funnel data
      try {
        const funnel = await dashboardService.getSalesFunnel();
        setFunnelData(funnel);
      } catch (err) {
        console.error('Failed to load funnel data:', err);
        // Continue without funnel data
      }

      // Fetch recent activities
      try {
        const activityData = await activityService.getRecentActivities(10);
        setActivities(activityData);
      } catch (err) {
        console.error('Failed to load activities:', err);
        // Use empty array as fallback
        setActivities([]);
      }

      // Fetch revenue history
      try {
        const revenueData = await activityService.getRevenueHistory();
        setRevenueHistory(revenueData);
      } catch (err) {
        console.error('Failed to load revenue history:', err);
        // Use empty array as fallback
        setRevenueHistory([]);
      }

      // Fetch pipeline risks
      try {
        const risksData = await activityService.getPipelineRisks();
        setPipelineRisks(risksData);
      } catch (err) {
        console.error('Failed to load pipeline risks:', err);
        // Use empty array as fallback
        setPipelineRisks([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics from real customer data
  const stats = {
    totalProspects: customers.length,
    pipelineValue: customers
      .filter(c => c.contract_value)
      .reduce((sum, c) => sum + (parseInt(c.contract_value) || 0), 0),
    leads: customers.filter(c => c.stage === 'Leads').length,
    qualified: customers.filter(c => c.stage === 'Qualified').length,
    proposal: customers.filter(c => c.stage === 'Proposal').length,
    negotiation: customers.filter(c => c.stage === 'Negotiation').length,
    closedWon: customers.filter(c => c.stage === 'Closed Won').length,
    highIntent: customers.filter(c => c.intent_level === 'High').length,
    mediumIntent: customers.filter(c => c.intent_level === 'Medium').length,
    lowIntent: customers.filter(c => c.intent_level === 'Low').length,
    // Contract stats
    pendingContracts: customers.filter(c => c.contract_status === 'Pending').length,
    signedContracts: customers.filter(c => c.contract_status === 'Signed').length,
    activeContracts: customers.filter(c => c.contract_status === 'Active').length,
    expiredContracts: customers.filter(c => c.contract_status === 'Expired').length,
  };

  const winRate = stats.totalProspects > 0
    ? Math.round((stats.closedWon / stats.totalProspects) * 100)
    : 0;

  const avgDealSize = stats.totalProspects > 0
    ? Math.round(stats.pipelineValue / stats.totalProspects)
    : 0;

  // Get top deals by contract value
  const topDeals = customers
    .filter(c => c.contract_value)
    .sort((a, b) => (parseInt(b.contract_value) || 0) - (parseInt(a.contract_value) || 0))
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      client: c.name,
      company: c.company,
      stage: c.stage || 'Leads',
      value: c.contract_value || '-',
      probability: c.probability || 0,
    }));

  // Get upcoming expected close dates
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcomingCloses = customers
    .filter(c => c.expected_close_date)
    .filter(c => {
      const closeDate = new Date(c.expected_close_date);
      return closeDate >= today && closeDate <= nextMonth;
    })
    .sort((a, b) => new Date(a.expected_close_date!).getTime() - new Date(b.expected_close_date!).getTime())
    .slice(0, 5)
    .map(c => {
      const closeDate = new Date(c.expected_close_date!);
      const daysUntil = Math.ceil((closeDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      return {
        id: c.id,
        client: c.name,
        company: c.company,
        expectedCloseDate: c.expected_close_date!,
        daysUntil,
        stage: c.stage || 'Leads',
        value: c.contract_value || '-',
      };
    });

  // Sales funnel data - use API data if available, otherwise calculate from customers
  const salesFunnel = funnelData.length > 0 ? funnelData : [
    { stage: 'Leads', count: stats.leads, value: '$50K', color: 'bg-gray-400' },
    { stage: 'Qualified', count: stats.qualified, value: '$120K', color: 'bg-blue-400' },
    { stage: 'Proposal', count: stats.proposal, value: '$250K', color: 'bg-purple-400' },
    { stage: 'Negotiation', count: stats.negotiation, value: '$500K', color: 'bg-orange-400' },
    { stage: 'Closed Won', count: stats.closedWon, value: '$800K', color: 'bg-green-400' },
  ];

  // Color mapping for stages
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Leads': return 'bg-gray-400';
      case 'Qualified': return 'bg-blue-400';
      case 'Proposal': return 'bg-purple-400';
      case 'Negotiation': return 'bg-orange-400';
      case 'Closed Won': return 'bg-green-400';
      default: return 'bg-gray-400';
    }
  };

  const renderGrowth = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`text-xs font-semibold flex items-center ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
        {Math.abs(value)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
          <p className="text-slate-500 dark:text-slate-400">加载仪表板数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>重试</Button>
        </div>
      </div>
    );
  }

  const revenueChartData = revenueHistory.map(h => ({
    label: h.month,
    val1: h.revenue,
    val2: h.target
  }));

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('dashboardTitle')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('dashboardSubtitle')}</p>
      </div>

      {/* --- KPI Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('totalProspects')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalProspects}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between z-10 relative">
            {renderGrowth(12)}
            <Sparkline data={Array(7).fill(stats.totalProspects)} color="#3b82f6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('pipelineValue')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">¥{stats.pipelineValue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-400 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between z-10 relative">
            {renderGrowth(8)}
            <Sparkline data={Array(7).fill(stats.pipelineValue || 0)} color="#a855f7" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('winRate')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{winRate}%</h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ActivityIcon size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between z-10 relative">
            {renderGrowth(5)}
            <Sparkline data={Array(7).fill(winRate)} color="#10b981" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('avgDealSize')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">¥{avgDealSize.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-slate-700 text-orange-600 dark:text-orange-400 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between z-10 relative">
            {renderGrowth(-3)}
            <Sparkline data={Array(7).fill(avgDealSize)} color="#f97316" />
          </div>
        </div>
      </div>

      {/* --- Main Chart & Funnel Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" />
              {t('revenueVsTarget')}
            </h3>
            <select className="bg-gray-50 dark:bg-slate-700 border-none text-xs rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 outline-none">
              <option>最近 6 个月</option>
              <option>最近一年</option>
            </select>
          </div>
          <AreaChart data={revenueChartData} />
        </div>

        {/* Sales Funnel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
            <PieChart size={18} className="text-purple-500" />
            {t('salesFunnel')}
          </h3>
          <div className="space-y-5">
            {salesFunnel.map((stage) => (
              <div key={stage.stage} className="relative group">
                <div className="flex justify-between text-xs mb-1.5 z-10 relative">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">{stage.count} 个客户</span>
                    {stage.percentage > 0 && (
                      <span className="text-xs text-slate-400">({stage.percentage}%)</span>
                    )}
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${(stage as any).color || getStageColor(stage.stage)} opacity-80 group-hover:opacity-100 transition-all duration-500`}
                    style={{ width: `${stage.percentage || Math.min((stage.count / (stats.totalProspects || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                {stage.value && stage.value !== '0' && (
                  <div className="absolute right-0 top-0 translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow-lg z-20">
                    {stage.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Contract Management Overview --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
          <DollarSign size={18} className="text-green-500" />
          合同管理概览
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Contracts */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">待签约</span>
              <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full">
                Pending
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingContracts}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">个客户</p>
          </div>

          {/* Signed Contracts */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">已签约</span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                Signed
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.signedContracts}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">个合同</p>
          </div>

          {/* Active Contracts */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">执行中</span>
              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                Active
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeContracts}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">个合同</p>
          </div>

          {/* Expired Contracts */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">已过期</span>
              <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">
                Expired
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.expiredContracts}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">个合同</p>
          </div>
        </div>

        {/* Contract Value Summary */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">合同总价值</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">¥{stats.pipelineValue.toLocaleString()}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/customers?stage=Negotiation'}
            >
              查看详情 <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* --- Upcoming Expected Close Dates --- */}
      {upcomingCloses.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-orange-500" />
            预期成交日期提醒
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingCloses.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/customers/${item.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">{item.client}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.company}</p>
                  </div>
                  <Badge color={item.daysUntil <= 7 ? 'red' : item.daysUntil <= 14 ? 'yellow' : 'blue'}>
                    {item.daysUntil <= 7 ? '紧急' : item.daysUntil <= 14 ? '即将' : '关注'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-100 dark:border-orange-900/30">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <div>预期: {new Date(item.expectedCloseDate).toLocaleDateString('zh-CN')}</div>
                    <div className="mt-0.5">{item.daysUntil === 0 ? '今天到期' : item.daysUntil === 1 ? '明天到期' : `${item.daysUntil}天后到期`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.value}</div>
                    <div className="text-xs text-slate-400">{item.stage}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- AI Risks & Activity --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Pipeline Risks */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
            <BrainCircuit size={20} className="text-rose-500" />
            {t('aiLoopholeAnalysis')}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {topDeals.slice(0, 3).map((deal) => (
              <div key={deal.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:border-rose-200 dark:hover:border-rose-900/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">{deal.client}</h4>
                      <span className="text-xs text-slate-400">({deal.company})</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                      <span>{deal.value}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>{deal.stage}</span>
                    </div>
                  </div>
                  <Badge color={deal.probability >= 80 ? 'green' : deal.probability >= 50 ? 'yellow' : 'red'}>
                    {deal.probability}% 概率
                  </Badge>
                </div>

                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    💡 建议优先跟进此客户，意向度较高
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Activity & Top Deals */}
        <div className="space-y-6">
          {/* Top Deals */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" />
                高价值客户
              </h3>
            </div>
            <div className="space-y-4">
              {topDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{deal.client}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{deal.stage}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{deal.value}</p>
                    <p className="text-xs text-emerald-500">{deal.probability}% 概率</p>
                  </div>
                </div>
              ))}
              {topDeals.length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  暂无高价值客户
                </div>
              )}
            </div>
            <button
              className="w-full mt-4 py-2 text-xs font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors flex items-center justify-center gap-1"
              onClick={() => window.location.href = '/customers'}
            >
              查看全部 <ArrowRight size={12} />
            </button>
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Clock size={18} className="text-orange-500" />
              {t('recentActivity')}
            </h3>
            <div className="relative pl-4 space-y-6">
              {/* Timeline Line */}
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gray-100 dark:bg-slate-700"></div>

              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="relative pl-4">
                    <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                      activity.type === 'ai' ? 'bg-purple-500' : 'bg-blue-400'
                    }`}></div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{activity.user}</span> {activity.text}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  暂无活动记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
