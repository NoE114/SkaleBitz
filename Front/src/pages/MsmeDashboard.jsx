import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  LineChart,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  UserRound,
  FileText,
  Banknote,
  Eye,
  UploadCloud,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatCurrency, formatDateShort, formatPercent, formatMetricValue } from '../utils/formatters';
import { fetchDealById, updateDealContact } from '../services/dealService';
import { fetchInvestmentsByDeal } from '../services/investorService';
import { fetchMsmeUtilization } from '../services/statsService';
import useAuth from '../hooks/useAuth';
import { buildDealProfile } from '../utils/dealMeta';
import { computeFinancialMetrics } from '../utils/financialMetrics';
import Container from '../components/layout/Container';

const UTILIZATION_REFRESH_INTERVAL = 60000; // 60s refresh cadence for utilization

const documents = [
  { name: 'Certificate of incorporation', status: 'Signed' },
  { name: 'Latest bank statements', status: 'Verified' },
  { name: 'Director ID (front/back)', status: 'Signed' },
  { name: 'Address proof', status: 'Pending' },
];

export default function MsmeDashboard() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [dealError, setDealError] = useState('');
  const [investments, setInvestments] = useState([]);
  const [investmentsLoading, setInvestmentsLoading] = useState(false);
  const [investmentsError, setInvestmentsError] = useState('');
  const [hasStartup, setHasStartup] = useState(Boolean(user?.dealId));
  const [utilizedTotal, setUtilizedTotal] = useState(0);
  const [utilizedLoading, setUtilizedLoading] = useState(false);
  const [utilizedError, setUtilizedError] = useState('');
  const [contactForm, setContactForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
  });
  const [contactStatus, setContactStatus] = useState({ saving: false, error: '', success: '' });

  useEffect(() => {
    setHasStartup(Boolean(user?.dealId));
  }, [user?.dealId]);

  useEffect(() => {
    let isActive = true;
    let intervalId;

    const loadUtilized = async () => {
      if (!isActive) return;
      if (!user?.id) {
        setUtilizedTotal(0);
        setUtilizedError('');
        setUtilizedLoading(false);
        return;
      }

      setUtilizedLoading(true);
      setUtilizedError('');
      try {
        const data = await fetchMsmeUtilization();
        if (isActive) {
          setUtilizedTotal(data?.utilized || 0);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to load MSME utilization', error);
        }
        if (isActive) {
          setUtilizedError('Unable to load utilized capital.');
          setUtilizedTotal(0);
        }
      } finally {
        if (isActive) {
          setUtilizedLoading(false);
        }
      }
    };

    loadUtilized();
    intervalId = setInterval(loadUtilized, UTILIZATION_REFRESH_INTERVAL);

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.id]);

  useEffect(() => {
    const loadDeal = async () => {
      setLoadingDeal(true);
      setDealError('');
      try {
        if (!user?.dealId) {
          setSelectedDeal(null);
          return;
        }

        const shouldRedirect = !dealId || dealId !== user.dealId;
        const data = await fetchDealById(user.dealId);
        setSelectedDeal(data || null);

        if (shouldRedirect) {
          navigate(`/msme/dashboard/${user.dealId}`, { replace: true });
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to load MSME deal', error);
        }
        setDealError('Unable to load deal details right now.');
        setSelectedDeal(null);
      } finally {
        setLoadingDeal(false);
      }
    };
    loadDeal();
  }, [dealId, navigate, user?.dealId]);

  useEffect(() => {
    setContactForm({
      contactName: selectedDeal?.contactName || '',
      contactEmail: selectedDeal?.contactEmail || '',
      contactPhone: selectedDeal?.contactPhone || '',
      website: selectedDeal?.website || '',
    });
    setContactStatus((prev) => ({ ...prev, error: '', success: '' }));
  }, [
    selectedDeal?.contactEmail,
    selectedDeal?.contactName,
    selectedDeal?.contactPhone,
    selectedDeal?.website,
  ]);

  useEffect(() => {
    let isActive = true;
    let intervalId;

    if (!selectedDeal?._id) {
      setInvestments([]);
      setInvestmentsError('');
      setInvestmentsLoading(false);
      return undefined;
    }

    const loadInvestments = async () => {
      if (!isActive) return;
      setInvestmentsLoading(true);
      setInvestmentsError('');
      try {
        const data = await fetchInvestmentsByDeal(selectedDeal._id);
        if (isActive) {
          setInvestments(data);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to load investments', error);
        }
        if (isActive) {
          setInvestmentsError('Unable to load investor activity right now.');
          setInvestments([]);
        }
      } finally {
        if (isActive) {
          setInvestmentsLoading(false);
        }
      }
    };

    loadInvestments();
    intervalId = setInterval(loadInvestments, 30000);

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedDeal?._id]);

  const profile = useMemo(() => buildDealProfile(selectedDeal || {}), [selectedDeal]);
  const financialMetrics = useMemo(() => computeFinancialMetrics(selectedDeal || {}), [selectedDeal]);
  const latestInvestments = useMemo(() => investments.slice(0, 2), [investments]);
  const hasMoreInvestors = investments.length > 2;
  const formatStatus = (status) => (status ? status.charAt(0).toUpperCase() + status.slice(1) : '—');

  const msmeKpis = [
    {
      label: 'Profit margin',
      value: financialMetrics.profit_margin,
      type: 'percent',
      helper: financialMetrics.profitability_health,
    },
    {
      label: 'Runway',
      value: financialMetrics.runway_months,
      type: 'months',
      helper:
        financialMetrics.survival_probability != null
          ? `Survival probability ${financialMetrics.survival_probability}%`
          : 'Not enough data',
    },
    {
      label: 'Survival probability',
      value:
        financialMetrics.survival_probability != null
          ? `${financialMetrics.survival_probability}%`
          : null,
      type: 'text',
      helper: financialMetrics.runway_months != null ? 'Based on cash / burn rate' : 'Not enough data',
    },
    {
      label: 'LTV/CAC ratio',
      value: financialMetrics.ltv_cac_ratio,
      type: 'ratio',
      helper: financialMetrics.marketing_efficiency,
    },
    {
      label: 'Growth status',
      value: financialMetrics.growth_status,
      type: 'text',
      helper:
        financialMetrics.customer_growth_rate != null
          ? `Growth rate ${formatPercent(financialMetrics.customer_growth_rate, 1)}`
          : null,
    },
    {
      label: 'Retention health',
      value: financialMetrics.retention_health,
      type: 'text',
      helper:
        financialMetrics.avg_churn_rate != null
          ? `Avg churn ${formatPercent(financialMetrics.avg_churn_rate, 1)}`
          : null,
    },
  ];

  const handleContactChange = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
    setContactStatus((prev) => ({ ...prev, error: '', success: '' }));
  };

  const handleContactSave = async (e) => {
    e.preventDefault();
    if (!selectedDeal?._id) return;

    const payload = {
      contactName: contactForm.contactName.trim(),
      contactEmail: contactForm.contactEmail.trim(),
      contactPhone: contactForm.contactPhone.trim(),
      website: contactForm.website.trim(),
    };

    if (!payload.contactName) {
      setContactStatus({ saving: false, error: 'Contact name is required', success: '' });
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!payload.contactEmail || !emailPattern.test(payload.contactEmail)) {
      setContactStatus({ saving: false, error: 'Enter a valid contact email', success: '' });
      return;
    }

    setContactStatus({ saving: true, error: '', success: '' });
    try {
      const updatedDeal = await updateDealContact(selectedDeal._id, payload);
      setSelectedDeal((prev) => (prev ? { ...prev, ...(updatedDeal || payload) } : prev));
      setContactStatus({ saving: false, error: '', success: 'Business contact information updated.' });
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to update contact details right now.';
      setContactStatus({ saving: false, error: message, success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex flex-col gap-8 py-8">
        {/* Header */}
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">MSME Dashboard</p>
              <h1 className="text-2xl font-semibold text-[#0F172A]">Business Overview</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">Utilized</span>
              <span className="text-sm font-semibold text-[#0F172A]" aria-live="polite">
                {utilizedLoading ? 'Loading...' : formatCurrency(utilizedTotal)}
              </span>
            </div>
            {utilizedError && (
              <span className="text-xs font-semibold text-[#B91C1C]" aria-live="polite">
                {utilizedError}
              </span>
            )}
          </div>
        </header>

        {/* CTA */}
        {!hasStartup && !selectedDeal && !loadingDeal && (
          <>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#E0E7FF] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Get started</p>
                <p className="text-lg font-semibold text-[#0F172A]">Add your startup via the MSME wizard</p>
                <p className="text-sm text-[#4B5563]">Share your business profile to unlock tailored deals and financing.</p>
              </div>
              <Link
                to="/msme/wizard"
                className="inline-flex items-center gap-2 rounded-full bg-[#1F6FEB] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7]"
              >
                Launch MSME wizard
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* If no startup added, stop here */}
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-6 text-sm text-[#4B5563] shadow-sm shadow-[#E0E7FF]">
              Complete the MSME wizard to see your dashboard insights.
            </div>
          </>
        )}

        {(hasStartup || selectedDeal || loadingDeal) && (
          <>
            {dealError && (
              <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C] shadow-sm shadow-[#FEE2E2]">
                {dealError}
              </div>
            )}

            {loadingDeal && (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-6 text-sm text-[#4B5563] shadow-sm shadow-[#E0E7FF]">
                Loading your MSME deal...
              </div>
            )}

            {!loadingDeal && !selectedDeal && !dealError && (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-6 text-sm text-[#4B5563] shadow-sm shadow-[#E0E7FF]">
                No MSME deal found. Launch the wizard to list your startup and view live metrics.
              </div>
            )}

            {!loadingDeal && selectedDeal && (
              <>
                {/* MSME Deal + Performance + Risk */}
                <section className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">MSME Deal</p>
                        <h2 className="text-2xl font-semibold text-[#0F172A]">{profile.name}</h2>
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
                          Next: {profile.cashflows[0]?.date || 'Scheduled'}
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

                  <div className="space-y-5 self-start">
                    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#E0E7FF]">
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

                    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#E0E7FF]">
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
                </section>

                {/* Financial analytics */}
                <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Financial health</p>
                      <h2 className="text-xl font-semibold text-[#0F172A]">Key MSME KPIs</h2>
                      <p className="text-sm text-[#4B5563]">Calculated per deal from your latest financial inputs.</p>
                    </div>
                    <Sparkles className="text-[#1F6FEB]" size={18} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {msmeKpis.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 shadow-sm shadow-[#E0E7FF]"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">{item.label}</p>
                        <p className="text-lg font-semibold text-[#0F172A] mt-1">{formatMetricValue(item.value, item.type)}</p>
                        {item.helper && <p className="text-xs text-[#4B5563] mt-1">{item.helper}</p>}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Business contact information */}
                <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm shadow-[#E0E7FF] space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Business</p>
                      <h2 className="text-xl font-semibold text-[#0F172A]">Business Contact Information</h2>
                      <p className="text-sm text-[#4B5563]">
                        Update the contact details investors will see. Registered address is read-only.
                      </p>
                    </div>
                    {contactStatus.success && (
                      <span className="rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#166534]">
                        {contactStatus.success}
                      </span>
                    )}
                    {contactStatus.error && (
                      <span className="rounded-full bg-[#FEF2F2] px-3 py-1 text-xs font-semibold text-[#B91C1C]">
                        {contactStatus.error}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">Registered Address</p>
                      <div className="mt-2 flex items-start gap-2 text-sm text-[#0F172A]">
                        <MapPin size={16} className="text-[#1F6FEB]" />
                        <span>{selectedDeal?.registeredAddress || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  <form className="grid gap-4 md:grid-cols-2" onSubmit={handleContactSave}>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-[#0F172A]">
                      <span className="flex items-center gap-2 text-[#4B5563]">
                        <UserRound size={16} className="text-[#1F6FEB]" />
                        Contact Name
                      </span>
                      <input
                        type="text"
                        value={contactForm.contactName}
                        onChange={(e) => handleContactChange('contactName', e.target.value)}
                        className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#1F6FEB] focus:ring-2 focus:ring-[#1F6FEB33]"
                        placeholder="Jane Doe"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-[#0F172A]">
                      <span className="flex items-center gap-2 text-[#4B5563]">
                        <Mail size={16} className="text-[#1F6FEB]" />
                        Contact Email
                      </span>
                      <input
                        type="email"
                        value={contactForm.contactEmail}
                        onChange={(e) => handleContactChange('contactEmail', e.target.value)}
                        className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#1F6FEB] focus:ring-2 focus:ring-[#1F6FEB33]"
                        placeholder="contact@business.com"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-[#0F172A]">
                      <span className="flex items-center gap-2 text-[#4B5563]">
                        <Phone size={16} className="text-[#1F6FEB]" />
                        Contact Phone
                      </span>
                      <input
                        type="tel"
                        value={contactForm.contactPhone}
                        onChange={(e) => handleContactChange('contactPhone', e.target.value)}
                        className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#1F6FEB] focus:ring-2 focus:ring-[#1F6FEB33]"
                        placeholder="+1 555 123 4567"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-[#0F172A]">
                      <span className="flex items-center gap-2 text-[#4B5563]">
                        <Globe size={16} className="text-[#1F6FEB]" />
                        Website
                      </span>
                      <input
                        type="url"
                        value={contactForm.website}
                        onChange={(e) => handleContactChange('website', e.target.value)}
                        className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#1F6FEB] focus:ring-2 focus:ring-[#1F6FEB33]"
                        placeholder="https://business.com"
                      />
                    </label>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={contactStatus.saving || !selectedDeal?._id}
                        className={`inline-flex items-center gap-2 rounded-full bg-[#1F6FEB] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7] ${
                          contactStatus.saving ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                      >
                        {contactStatus.saving ? 'Saving...' : 'Save contact info'}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Cashflows + Docs */}
                <section className="grid gap-4 lg:grid-cols-3">
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
                      to={selectedDeal?._id ? `/deals/${selectedDeal._id}/cashflows` : '/deals'}
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
                          <div className="flex items-center gap-2">
                            <button
                              aria-label="View document"
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] text-[#1F6FEB] hover:border-[#CBD5E1] transition"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              aria-label="Reupload document"
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] text-[#1F6FEB] hover:border-[#CBD5E1] transition"
                            >
                              <UploadCloud size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Investors */}
                <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Investors</p>
                      <h2 className="text-xl font-semibold text-[#0F172A]">Investors in this deal</h2>
                    </div>
                    <Banknote className="text-[#1F6FEB]" size={18} />
                  </div>
                  {investmentsError && (
                    <div className="mt-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                      {investmentsError}
                    </div>
                  )}
                  <div className="mt-4 space-y-3">
                    {investmentsLoading && (
                      <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#4B5563]">
                        Loading investor activity...
                      </div>
                    )}
                    {!investmentsLoading && !investments.length && !investmentsError && (
                      <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#4B5563]">
                        No investors have allocated to this deal yet.
                      </div>
                    )}
                    {!investmentsLoading &&
                      latestInvestments.map((inv) => (
                        <div
                          key={inv.id || inv._id}
                          className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A]">
                              {inv?.investor?.name || inv?.investor?.email || 'Investor'}
                            </p>
                            <p className="text-xs text-[#4B5563]">{formatDateShort(inv?.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#0F172A]">{formatCurrency(inv?.amount || 0)}</p>
                            <p className="text-xs text-[#1F6FEB]">{formatStatus(inv?.status)}</p>
                          </div>
                        </div>
                      ))}
                    {hasMoreInvestors && selectedDeal?._id && (
                      <Link
                        to={`/deals/${selectedDeal._id}/investors`}
                        className="block w-full rounded-full border border-[#E5E7EB] px-4 py-2 text-center text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
                      >
                        View all investors
                      </Link>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
