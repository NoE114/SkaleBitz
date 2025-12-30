import { useEffect, useMemo, useRef, useState } from 'react';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
// Business guardrail: cap simulated allocations at $1B to avoid unrealistic inputs
const MAX_INVESTMENT_AMOUNT = 1_000_000_000;
const formatInvestAmount = (amount) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const sanitizeNumberInput = (value) => {
  const input = typeof value === 'string' ? value : String(value ?? '');
  const withoutMinus = input.startsWith('-') ? input.slice(1) : input;
  const sanitized = withoutMinus.replace(/[^\d.]/g, '');
  // Keep only the first decimal point; strip any additional ones
  const firstDot = sanitized.indexOf('.');
  if (firstDot === -1) {
    return sanitized;
  }
  const integer = sanitized.slice(0, firstDot);
  const decimal = sanitized
    .slice(firstDot + 1)
    .replace(/\./g, '');
  return decimal ? `${integer}.${decimal}` : integer;
};
const getFocusableElements = (root) => (root ? root.querySelectorAll(FOCUSABLE_SELECTOR) : []);
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  FileText,
  LineChart,
  MapPin,
  UserRound,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { fetchDealById } from '../services/dealService';
import { allocateInvestment } from '../services/investorService';
import { buildDealProfile } from '../utils/dealMeta';
import { formatMetricValue } from '../utils/formatters';
import { computeFinancialMetrics } from '../utils/financialMetrics';
import useAuth from '../hooks/useAuth';
import Container from '../components/layout/Container';

const documents = [
  { name: 'Certificate of incorporation', status: 'Signed' },
  { name: 'Latest bank statements', status: 'Verified' },
  { name: 'Director ID (front/back)', status: 'Signed' },
  { name: 'Address proof', status: 'Pending' },
];

export default function InvestorDealDetail() {
  const { dealId } = useParams();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [investError, setInvestError] = useState('');
  const [investFeedback, setInvestFeedback] = useState('');
  const [investLoading, setInvestLoading] = useState(false);
  const investModalRef = useRef(null);
  const investTriggerRef = useRef(null);
  const { user, updateUser } = useAuth();
  const dashboardPath = user?.id ? `/dashboard/${user.id}` : '/dashboard';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchDealById(dealId);
        setDeal(data || null);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Failed to load deal', err);
        }
        setError('Unable to load deal details right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dealId]);

  const profile = useMemo(() => buildDealProfile(deal || {}), [deal]);
  const financialMetrics = useMemo(() => computeFinancialMetrics(deal || {}), [deal]);
  const nextCashflow = useMemo(
    () => profile.cashflows.find((c) => c.status?.toLowerCase() !== 'settled') || profile.cashflows[0],
    [profile.cashflows]
  );

  const openInvestModal = () => {
    investTriggerRef.current = document.activeElement;
    setInvestAmount('');
    setInvestError('');
    setInvestFeedback('');
    setShowInvestModal(true);
  };

  const closeInvestModal = () => {
    setShowInvestModal(false);
    if (investTriggerRef.current) {
      investTriggerRef.current.focus();
    }
  };

  const handleInvestConfirm = async () => {
    setInvestFeedback('');
    if (!investAmount) {
      setInvestError('Please enter an amount to allocate.');
      return;
    }
    const numericAmount = parseFloat(investAmount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setInvestError('Please enter a valid amount to allocate.');
      return;
    }
    const decimals = investAmount.includes('.') ? investAmount.split('.')[1]?.length ?? 0 : 0;
    if (decimals > 2) {
      setInvestError('Please limit amounts to 2 decimal places.');
      return;
    }
    if (remainingCapacity != null && numericAmount > remainingCapacity) {
      setInvestError(`Amount exceeds remaining capacity of ${formatInvestAmount(remainingCapacity)}.`);
      return;
    }
    if (numericAmount > MAX_INVESTMENT_AMOUNT) {
      setInvestError(`Please enter an amount under ${formatInvestAmount(MAX_INVESTMENT_AMOUNT)}.`);
      return;
    }
    setInvestError('');
    setInvestLoading(true);
    try {
      const { investment, user: updatedUser } = await allocateInvestment(dealId, numericAmount);
      if (updatedUser) {
        updateUser(updatedUser);
      }
      setDeal((prev) => {
        if (!prev) return prev;
        const facility = Number(prev.facilitySize ?? 10000);
        const nextUtilized = Number(prev.utilizedAmount || 0) + numericAmount;
        const nextRemaining = Math.max(0, facility - nextUtilized);
        return { ...prev, utilizedAmount: nextUtilized, remainingCapacity: nextRemaining };
      });
      setInvestFeedback(
        `Funding confirmed for ${formatInvestAmount(numericAmount)}${investment?._id ? ` (Ref: ${investment._id})` : ''}.`
      );
      closeInvestModal();
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to allocate funds right now.';
      setInvestError(message);
    } finally {
      setInvestLoading(false);
    }
  };

  useEffect(() => {
    if (!showInvestModal || !investModalRef.current) return;
    const dialog = investModalRef.current;
    const focusable = getFocusableElements(dialog);
    const first = focusable[0];
    if (first) {
      first.focus();
    } else {
      dialog.focus();
    }
  }, [showInvestModal]);

  const handleInvestKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeInvestModal();
      return;
    }
    if (e.key !== 'Tab' || !investModalRef.current) return;
    const focusable = getFocusableElements(investModalRef.current);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const remainingCapacity = useMemo(() => {
    if (deal?.remainingCapacity != null) {
      const numeric = Number(deal.remainingCapacity);
      return Number.isFinite(numeric) ? Math.max(0, numeric) : null;
    }
    const facility = Number(deal?.facilitySize ?? 10000);
    const utilized = Number(deal?.utilizedAmount ?? 0);
    if (!Number.isFinite(facility) || !Number.isFinite(utilized)) return null;
    return Math.max(0, facility - utilized);
  }, [deal]);

  const canAllocate = user?.accountType === 'investor' && (remainingCapacity ?? 1) > 0;

  const profitMetrics = [
    { label: 'Total revenue', value: financialMetrics.total_revenue, type: 'currency' },
    { label: 'Total expenses', value: financialMetrics.total_expenses, type: 'currency' },
    { label: 'Net profit / loss', value: financialMetrics.net_profit_loss, type: 'currency' },
    {
      label: 'Profit margin',
      value: financialMetrics.profit_margin,
      type: 'percent',
      helper: financialMetrics.profitability_health,
    },
    { label: 'Expense ratio', value: financialMetrics.expense_ratio, type: 'percent' },
    { label: 'Avg monthly revenue', value: financialMetrics.avg_monthly_revenue, type: 'currency' },
    { label: 'Avg monthly expenses', value: financialMetrics.avg_monthly_expenses, type: 'currency' },
    { label: 'Profitability health', value: financialMetrics.profitability_health, type: 'text' },
  ];

  const survivalMetrics = [
    { label: 'Runway (months)', value: financialMetrics.runway_months, type: 'months' },
    { label: 'Survival probability', value: financialMetrics.survival_probability, type: 'percent' },
  ];

  const growthMetrics = [
    {
      label: 'LTV/CAC ratio',
      value: financialMetrics.ltv_cac_ratio,
      type: 'ratio',
      helper: financialMetrics.marketing_efficiency,
    },
    { label: 'Marketing efficiency', value: financialMetrics.marketing_efficiency, type: 'text' },
    {
      label: 'Customer growth rate',
      value: financialMetrics.customer_growth_rate,
      type: 'percent',
      helper: financialMetrics.growth_status,
    },
    { label: 'Growth status', value: financialMetrics.growth_status, type: 'text' },
    {
      label: 'Avg churn rate',
      value: financialMetrics.avg_churn_rate,
      type: 'percent',
      helper: financialMetrics.retention_health,
    },
    { label: 'Retention health', value: financialMetrics.retention_health, type: 'text' },
  ];

  const financialMetricGroups = [
    { title: 'Profit & expenses', items: profitMetrics },
    { title: 'Survival & runway', items: survivalMetrics },
    { title: 'Marketing & growth', items: growthMetrics },
  ];

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex flex-col gap-8 py-10">
        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={dashboardPath}
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
            
          </div>
          <div className="flex flex-wrap gap-3">
            {canAllocate && (
              <button
                onClick={openInvestModal}
                className="inline-flex items-center gap-2 rounded-full bg-[#1F6FEB] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7]"
              >
                Allocate Funds
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C] shadow-sm shadow-[#FEE2E2]">
            {error}
          </div>
        )}
        {investFeedback && (
          <div className="rounded-2xl border border-[#BBF7D0] bg-[#ECFDF3] p-4 text-sm text-[#166534] shadow-sm shadow-[#DCFCE7]">
            {investFeedback}
          </div>
        )}

        {/* Deal summary */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">MSME Deal</p>
                <h1 className="text-2xl font-semibold text-[#0F172A]">{profile.name}</h1>
                <p className="text-sm text-[#4B5563] mt-1">{profile.sector}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className={`rounded-full px-3 py-1 font-semibold ${profile.statusMeta.className}`}>
                    {profile.statusMeta.label}
                  </span>
                  <span className="rounded-full bg-[#ECFDF3] px-3 py-1 font-semibold text-[#15803D]">
                    {profile.riskLabel}
                  </span>
                  {profile.tenorDisplay && (
                    <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-[#4B5563]">
                      {profile.tenorDisplay}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-[#4B5563]">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F8FAFC] px-3 py-1 border border-[#E5E7EB]">
                  <ShieldCheck size={16} className="text-[#10B981]" />
                  Risk controls enabled
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#0F172A]">Facility size</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-1">{profile.facilitySize}</p>
                <p className="text-sm text-[#4B5563] mt-1">
                  Utilized: {profile.utilizedLabel || 'Pending drawdown'}
                </p>
                <p className="text-sm text-[#4B5563] mt-1">
                  Remaining capacity:{' '}
                  {remainingCapacity != null ? formatInvestAmount(remainingCapacity) : 'Pending'}
                </p>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#0F172A]">Target yield</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-1">{profile.targetYield}</p>
                <p className="text-sm text-[#10B981] mt-1">On plan</p>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#0F172A]">Repayment cadence</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-1">{profile.repaymentCadence}</p>
                <p className="text-sm text-[#4B5563] mt-1 flex items-center gap-2">
                  <Calendar size={14} className="text-[#1F6FEB]" />
                  Next: {nextCashflow?.date || 'Scheduled'}
                </p>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#0F172A]">Location</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-1">{profile.location}</p>
                <p className="text-sm text-[#4B5563] mt-1 flex items-center gap-2">
                  <MapPin size={14} className="text-[#1F6FEB]" />
                  Regional diversification enabled
                </p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Performance</p>
                <BarChart3 className="text-[#1F6FEB]" size={18} />
              </div>
              <div className="mt-4 space-y-3 text-sm text-[#4B5563]">
                <div className="flex justify-between">
                  <span>Tenor</span>
                  <span className="font-semibold text-[#0F172A]">{profile.performance.tenor}</span>
                </div>
                <div className="flex justify-between">
                  <span>DSO (days)</span>
                  <span className="font-semibold text-[#0F172A]">{profile.performance.dso}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delinquency</span>
                  <span className="font-semibold text-[#10B981]">{profile.performance.delinquency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Realized MOIC</span>
                  <span className="font-semibold text-[#0F172A]">{profile.performance.realizedMoic}</span>
                </div>
                <div className="flex justify-between">
                  <span>Utilization</span>
                  <span className="font-semibold text-[#1F6FEB]">{profile.performance.utilization}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Risk</p>
                <ShieldCheck className="text-[#10B981]" size={18} />
              </div>
              <ul className="mt-4 space-y-2 text-sm text-[#4B5563]">
                <li className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className={profile.riskControls.kyc ? 'text-[#10B981]' : 'text-[#B91C1C]'}
                  />
                  KYC/KYB verified
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className={profile.riskControls.payoutMonitoring ? 'text-[#10B981]' : 'text-[#B91C1C]'}
                  />
                  Payout monitoring active
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className={profile.riskControls.diversification ? 'text-[#10B981]' : 'text-[#B91C1C]'}
                  />
                  Diversification guardrails met
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Financial analytics */}
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Financial analytics</p>
              <h2 className="text-xl font-semibold text-[#0F172A]">Deal-level KPIs</h2>
              <p className="text-sm text-[#4B5563]">Calculated in real time from the MSME&apos;s submitted financials.</p>
            </div>
            <Sparkles className="text-[#1F6FEB]" size={18} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {financialMetricGroups.map((group) => (
              <div key={group.title} className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 shadow-sm shadow-[#E0E7FF]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">{group.title}</p>
                <div className="mt-3 space-y-3 text-sm text-[#4B5563]">
                  {group.items.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#0F172A]">{item.label}</p>
                        {item.helper && <p className="text-xs text-[#4B5563]">{item.helper}</p>}
                      </div>
                      <span className="text-sm font-semibold text-[#0F172A]">{formatMetricValue(item.value, item.type)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {deal && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Business</p>
                <h2 className="text-xl font-semibold text-[#0F172A]">Business Contact Information</h2>
                <p className="text-sm text-[#4B5563]">
                  Reach out to the MSME directly for diligence or coordination.
                </p>
              </div>
              <Sparkles className="text-[#1F6FEB]" size={18} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">Registered Address</p>
                <div className="mt-2 flex items-start gap-2 text-sm text-[#0F172A]">
                  <MapPin size={16} className="text-[#1F6FEB]" />
                  <span>{deal.registeredAddress || 'Not provided'}</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">Contact Name</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-[#0F172A]">
                  <UserRound size={16} className="text-[#1F6FEB]" />
                  <span>{deal.contactName || 'Not provided'}</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">Contact Email</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-[#0F172A]">
                  <Mail size={16} className="text-[#1F6FEB]" />
                  {deal.contactEmail ? (
                    <a className="text-[#1F6FEB] hover:underline" href={`mailto:${deal.contactEmail}`}>
                      {deal.contactEmail}
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">Contact Phone</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-[#0F172A]">
                  <Phone size={16} className="text-[#1F6FEB]" />
                  {deal.contactPhone ? (
                    <a className="text-[#1F6FEB] hover:underline" href={`tel:${deal.contactPhone}`}>
                      {deal.contactPhone}
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">Website</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-[#0F172A]">
                  <Globe size={16} className="text-[#1F6FEB]" />
                  {deal.website ? (
                    <a className="text-[#1F6FEB] hover:underline" href={deal.website} target="_blank" rel="noreferrer">
                      {deal.website}
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Repayment & Documents */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Cashflows</p>
                <h2 className="text-xl font-semibold text-[#0F172A]">Repayment schedule</h2>
              </div>
              <LineChart className="text-[#1F6FEB]" size={18} />
            </div>
            <div className="mt-4 divide-y divide-[#E5E7EB]">
              {profile.cashflows.map((r) => (
                <div key={r.cycle} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{r.cycle}</p>
                    <p className="text-xs text-[#4B5563]">{r.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0F172A]">{r.amount}</p>
                    <p
                      className={`text-xs ${
                        r.status === 'Settled' ? 'text-[#10B981]' : 'text-[#1F6FEB]'
                      }`}
                    >
                      {r.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to={`/deals/${dealId}/cashflows`}
              className="mt-4 flex w-full items-center justify-center rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
            >
              View cashflow history
            </Link>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Docs</p>
                <h2 className="text-xl font-semibold text-[#0F172A]">Agreements</h2>
              </div>
              <FileText className="text-[#1F6FEB]" size={18} />
            </div>
            <div className="mt-4 space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{doc.name}</p>
                    <p className="text-xs text-[#4B5563]">{doc.status}</p>
                  </div>
                  <button className="text-sm font-semibold text-[#1F6FEB] hover:underline">View</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
      {loading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center text-sm text-[#4B5563]">
          Loading deal...
        </div>
      )}
      {showInvestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeInvestModal}
        >
          <div
            ref={investModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invest-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl shadow-[#11182733]"
            onKeyDown={handleInvestKeyDown}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Invest</p>
                <h3 id="invest-modal-title" className="text-lg font-semibold text-[#0F172A]">
                  Allocate funds to this deal
                </h3>
                <p className="text-sm text-[#4B5563] mt-1">
                  Enter the amount you want to commit. This flow simulates funding for review and does not move funds.
                </p>
              </div>
              <button
                type="button"
                onClick={closeInvestModal}
                className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
                aria-label="Close invest modal"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label htmlFor="invest-amount" className="text-sm font-semibold text-[#0F172A]">
                Amount to invest
              </label>
              <input
                id="invest-amount"
                type="text"
                inputMode="decimal"
                value={investAmount}
                onChange={(e) => {
                  setInvestAmount(sanitizeNumberInput(e.target.value));
                }}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#1F6FEB] focus:ring-2 focus:ring-[#1F6FEB33]"
                placeholder="e.g., 25000"
              />
              <p className="text-xs text-[#4B5563]">
                Available balance: {formatInvestAmount(Number(user?.balance ?? 0))}
              </p>
              {remainingCapacity != null && (
                <p className="text-xs text-[#4B5563]">
                  Remaining capacity: {formatInvestAmount(remainingCapacity)}
                </p>
              )}
              {investError && <p className="text-sm text-[#B91C1C]">{investError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeInvestModal}
                className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInvestConfirm}
                disabled={investLoading}
                className={`inline-flex items-center gap-2 rounded-full bg-[#1F6FEB] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7] ${
                  investLoading ? 'cursor-not-allowed opacity-60' : ''
                }`}
              >
                {investLoading ? 'Processing...' : 'Confirm funding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
