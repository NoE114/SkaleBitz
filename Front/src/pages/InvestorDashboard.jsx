import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  Banknote,
  LineChart,
  PieChart,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { fetchInvestorDashboard } from '../services/statsService';
import { formatCurrency, formatPercent } from '../utils/formatters';
import useAuth from '../hooks/useAuth';
import Container from '../components/layout/Container';

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user, refreshUser } = useAuth();
  const normalizedUserId = user?.id ? String(user.id) : null;
  const hasUserMismatch = Boolean(userId && normalizedUserId && userId !== normalizedUserId);
  const [stats, setStats] = useState({ totalInvested: 0, averageYield: 0, activeDeals: 0 });
  const [allocationData, setAllocationData] = useState([]);
  const [recentDeals, setRecentDeals] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [statsError, setStatsError] = useState('');
  const resetDashboardState = useCallback(() => {
    setStats({ totalInvested: 0, averageYield: 0, activeDeals: 0 });
    setAllocationData([]);
    setRecentDeals([]);
    setActivity([]);
  }, []);

  useEffect(() => {
    if (hasUserMismatch && normalizedUserId) {
      navigate(`/dashboard/${normalizedUserId}`, { replace: true });
    }
  }, [hasUserMismatch, navigate, normalizedUserId]);

  useEffect(() => {
    const loadStats = async () => {
      setStatsError('');
      setLoadingDashboard(true);
      if (!user?.id) {
        resetDashboardState();
        setLoadingDashboard(false);
        return;
      }
      try {
        const data = await fetchInvestorDashboard();
        setStats({
          totalInvested: data?.totalInvested || 0,
          averageYield: data?.averageYield || 0,
          activeDeals: data?.activeDeals || 0,
        });
        setAllocationData(data?.allocation || []);
        setRecentDeals(data?.recentDeals || []);
        setActivity(data?.activity || []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Failed to load investor dashboard data', err);
        }
        resetDashboardState();
        setStatsError('Unable to load dashboard data right now.');
      } finally {
        setLoadingDashboard(false);
      }
    };
    if (hasUserMismatch) {
      return;
    }
    loadStats();
  }, [hasUserMismatch, resetDashboardState, user?.id, userId]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await refreshUser();
      } catch {
        // ignore and keep existing auth state
      }
    };
    loadProfile();
  }, [refreshUser]);

  const displayName = user?.name || 'Investor';
  const balance = user?.balance ?? 0;
  const summaryCards = useMemo(
    () => [
      { label: 'Total invested', value: formatCurrency(stats.totalInvested), icon: Banknote },
      { label: 'Active investments', value: String(stats.activeDeals ?? 0), icon: LineChart },
      { label: 'Avg. yield', value: formatPercent(stats.averageYield || 0, 1), icon: BarChart3 },
    ],
    [stats.activeDeals, stats.averageYield, stats.totalInvested]
  );
  const formatActivityTitle = (type) => {
    if (type === 'repayment') return 'Repayment received';
    if (type === 'refund') return 'Allocation refunded';
    return 'Allocation placed';
  };
  const formatActivityDescription = (item) =>
    `${formatCurrency(item.amount || 0)} · ${item.dealName || 'Deal'}`;
  const formatActivityTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex flex-col gap-8 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#1F6FEB]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
              <Sparkles size={20} />
            </div>
            {displayName} · Investor
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">
                Balance
              </span>
              <span className="text-sm font-semibold text-[#0F172A]">
                {formatCurrency(balance)}
              </span>
              <button
                type="button"
                onClick={() => navigate('/balance')}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1F6FEB] text-white transition hover:bg-[#195cc7]"
                aria-label="Top up balance"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/deals')}
              className="inline-flex items-center gap-2 rounded-full bg-[#1F6FEB] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7]"
            >
              New investment
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        {statsError && (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C] shadow-sm shadow-[#FEE2E2]">
            {statsError}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {summaryCards.map(({ label, value, icon: IconComponent }) => {
            const hasIcon = Boolean(IconComponent);
            return (
              <div
                key={label}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-md shadow-[#E0E7FF]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#4B5563]">{label}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F0FF] text-[#1F6FEB]">
                    {hasIcon && <IconComponent size={18} />}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-[#0F172A]">{value}</p>
              </div>
            );
          })}
        </div>

        {/* Portfolio & Risk */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF] lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Portfolio</p>
                <h2 className="text-xl font-semibold text-[#0F172A]">Allocation by strategy</h2>
              </div>
              <PieChart className="text-[#1F6FEB]" size={20} />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {allocationData.length === 0 && !loadingDashboard && (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-4 text-sm text-[#4B5563] md:col-span-2">
                  No allocations yet. Fund a deal to see your diversification.
                </div>
              )}
              {allocationData.map((item) => (
                <div
                  key={item.sector}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0F172A]">{item.sector}</p>
                    <span className="text-sm font-semibold text-[#1F6FEB]">
                      {Number(item.percent || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-[#E5E7EB]">
                    <div
                      className="h-2 rounded-full bg-[#1F6FEB]"
                      style={{ width: `${item.percent || 0}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#4B5563]">{formatCurrency(item.amount || 0)} invested</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Risk</p>
                <h2 className="text-xl font-semibold text-[#0F172A]">Controls</h2>
              </div>
              <ShieldCheck className="text-[#10B981]" size={20} />
            </div>
            <ul className="mt-4 space-y-3 text-sm text-[#4B5563]">
              <li>• KYC/KYB verified counterparties</li>
              <li>• Daily liquidity checks</li>
              <li>• Automated payout monitoring</li>
              <li>• Diversification guardrails</li>
            </ul>
            <button className="mt-5 w-full rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]">
              View risk report
            </button>
          </div>
        </div>

        {/* Recent deals & Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Pipeline</p>
                <h2 className="text-xl font-semibold text-[#0F172A]">Recent deals</h2>
              </div>
              <LineChart className="text-[#1F6FEB]" size={20} />
            </div>
            <div className="mt-4 divide-y divide-[#E5E7EB]">
              {recentDeals.length === 0 && !loadingDashboard && (
                <div className="py-3 text-sm text-[#4B5563]">No recent allocations yet.</div>
              )}
              {recentDeals.map((deal) => (
                <div key={deal.investmentId || deal.name} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{deal.name}</p>
                    <p className="text-xs text-[#4B5563]">{deal.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {formatCurrency(deal.amount || 0)}
                    </p>
                    <p className="text-xs text-[#1F6FEB]">{deal.status}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/investor/deals')}
              className="mt-4 w-full rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
            >
              View all deals
            </button>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Ops</p>
                <h2 className="text-xl font-semibold text-[#0F172A]">Activity</h2>
              </div>
              <BarChart3 className="text-[#1F6FEB]" size={20} />
            </div>
            <div className="mt-4 space-y-4">
              {activity.length === 0 && !loadingDashboard && (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-4 text-sm text-[#4B5563]">
                  No recent transactions yet.
                </div>
              )}
              {activity.map((item) => (
                <div
                  key={item.id || item.createdAt}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4"
                >
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {formatActivityTitle(item.type)}
                  </p>
                  <p className="text-sm text-[#4B5563]">{formatActivityDescription(item)}</p>
                  <p className="text-xs text-[#0EA5E9] mt-1">{formatActivityTime(item.createdAt)}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/investor/logs')}
              className="mt-4 w-full rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
            >
              View logs
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
