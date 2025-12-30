import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LineChart,
  ShieldCheck,
  Sparkles,
  Activity,
  Clock3,
  Globe2,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const kpis = [
  { label: 'Active capital', value: '$2.4M', change: '+12% MoM' },
  { label: 'Active deals', value: '18', change: '+3 new' },
  { label: 'Avg. yield', value: '11.4%', change: '+0.3pp' },
  { label: 'DSO (days)', value: '38', change: '-2 days' },
];

const recentDeals = [
  { name: 'BrightMart Supplies', status: 'Active', amount: '$120k', yieldPct: '11.8%', region: 'Singapore' },
  { name: 'AgroLink MSME', status: 'Active', amount: '$85k', yieldPct: '10.9%', region: 'Malaysia' },
  { name: 'Nova Parts Co', status: 'Pending', amount: '$140k', yieldPct: '11.2%', region: 'Vietnam' },
];

const riskAlerts = [
  { title: 'Exposure guardrail', detail: 'Retail bundle at 74% of limit', severity: 'medium' },
  { title: 'Payout velocity', detail: '+12% vs baseline this week', severity: 'low' },
  { title: 'Delinquency', detail: 'Portfolio at 0.4%', severity: 'info' },
];

const opsQueue = [
  { id: 'Q-1026', title: 'Payout: BrightMart', eta: '5m', status: 'Pending approval' },
  { id: 'Q-1027', title: 'Review: Nova Parts Co', eta: '10m', status: 'Review' },
  { id: 'Q-1028', title: 'Reconcile transfers', eta: '15m', status: 'In progress' },
];

export default function MsmeDashboard() {
  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827] px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">MSME Dashboard</p>
              <h1 className="text-2xl font-semibold text-[#0F172A]">Portfolio overview</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
            >
              View deals
            </Link>
            <Link
              to="/risk"
              className="inline-flex items-center gap-2 rounded-full bg-[#1F6FEB] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7]"
            >
              Risk & controls
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm shadow-[#E0E7FF]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0EA5E9]">{kpi.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#0F172A]">{kpi.value}</p>
              <p className="text-xs text-[#10B981] mt-1">{kpi.change}</p>
            </div>
          ))}
        </section>

        {/* Live volume + payouts */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="relative rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-2xl shadow-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5563]">Live volume</p>
                <p className="text-3xl font-semibold text-[#0F172A]">$8.4M</p>
                <p className="text-xs text-[#10B981] mt-1">+18% MoM</p>
              </div>
              <div className="rounded-full bg-[#E6F0FF] px-3 py-1 text-xs font-semibold text-[#1F6FEB] inline-flex items-center gap-2">
                <LineChart size={16} />
                Real-time
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs text-[#4B5563]">
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#0F172A]">$2.1M</p>
                <p>Card payments</p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#0F172A]">$4.3M</p>
                <p>Bank transfers</p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#0F172A]">$1.9M</p>
                <p>Payouts</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-[#4B5563]">
              “We deployed and monitored diversified MSME capital in days, not months— with compliance built-in.”
              <p className="mt-3 text-xs text-[#0F172A] font-semibold">Maya Chen · VP Product</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Risk</p>
                <h3 className="text-lg font-semibold text-[#0F172A]">Alerts & guardrails</h3>
              </div>
              <ShieldCheck className="text-[#10B981]" size={20} />
            </div>
            <div className="space-y-3 text-sm text-[#4B5563]">
              {riskAlerts.map((a) => (
                <div
                  key={a.title}
                  className="flex items-start justify-between rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{a.title}</p>
                    <p className="text-xs text-[#4B5563]">{a.detail}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      a.severity === 'medium'
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : a.severity === 'low'
                        ? 'bg-[#E6F0FF] text-[#1F6FEB]'
                        : 'bg-[#F8FAFC] text-[#4B5563]'
                    }`}
                  >
                    {a.severity}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/risk"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F6FEB] hover:underline"
            >
              View risk report
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Deals & Ops */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Deals</p>
                <h3 className="text-lg font-semibold text-[#0F172A]">Recent activity</h3>
              </div>
              <Link className="text-sm font-semibold text-[#1F6FEB] hover:underline" to="/deals">
                View all deals
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentDeals.map((deal) => (
                <div
                  key={deal.name}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{deal.name}</p>
                    <p className="text-xs text-[#4B5563]">{deal.sector || deal.tag}</p>
                    <p className="text-xs text-[#4B5563] inline-flex items-center gap-1">
                      <Globe2 size={14} className="text-[#1F6FEB]" />
                      {deal.region}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#4B5563]">
                    <span className="rounded-full bg-[#E6F0FF] px-3 py-1 font-semibold text-[#1F6FEB]">{deal.status}</span>
                    <span className="font-semibold text-[#0F172A]">{deal.amount}</span>
                    <span className="font-semibold text-[#0F172A]">{deal.yieldPct}</span>
                    <Link
                      to="/deals"
                      className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 font-semibold text-[#1F2937] hover:border-[#CBD5E1]"
                    >
                      View
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Ops queue</p>
                <h3 className="text-lg font-semibold text-[#0F172A]">Tasks</h3>
              </div>
              <Activity className="text-[#1F6FEB]" size={18} />
            </div>
            <div className="space-y-3 text-sm text-[#4B5563]">
              {opsQueue.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0EA5E9]">{task.id}</p>
                    <p className="text-sm font-semibold text-[#0F172A]">{task.title}</p>
                    <p className="text-xs text-[#4B5563] inline-flex items-center gap-1">
                      <Clock3 size={14} className="text-[#1F6FEB]" />
                      ETA {task.eta}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#B45309]">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/ops"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F6FEB] hover:underline"
            >
              Open ops queue
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Compliance / trust strip */}
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm shadow-[#E0E7FF]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Trust</p>
              <h3 className="text-lg font-semibold text-[#0F172A]">Security & compliance</h3>
            </div>
            <ShieldCheck className="text-[#10B981]" size={20} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-[#4B5563]">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#10B981] mt-0.5" />
              Bank-grade encryption, RBAC, audit trails.
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#10B981] mt-0.5" />
              KYC/KYB, AML, sanction screening automated.
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 flex items-start gap-2">
              <LineChart size={16} className="text-[#1F6FEB] mt-0.5" />
              Real-time risk monitoring and payout controls.
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 flex items-start gap-2">
              <CreditCard size={16} className="text-[#1F6FEB] mt-0.5" />
              Segregated funds, dual-approval for disbursements.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}