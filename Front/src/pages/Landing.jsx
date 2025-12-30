import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  CreditCard,
  LineChart,
  ShieldCheck,
  Sparkles,
  Star,
  Search,
  Globe2,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  { title: 'Working capital', desc: 'Bridge cash gaps for MSMEs with fast approval.', chips: ['Short tenor', 'Recurring'] },
  { title: 'Inventory finance', desc: 'Fund inventory turns with dynamic limits.', chips: ['PO-backed', 'Collateralized'] },
  { title: 'Purchase orders', desc: 'Finance POs and unlock supplier terms.', chips: ['Vendor-friendly', 'Milestone payouts'] },
  { title: 'Revenue share', desc: 'Participate in upside with flexible rev-share.', chips: ['Aligned incentives', 'Real-time data'] },
];

const featuredDeals = [
  { name: 'BrightMart Supplies', tag: 'Retail ops', amount: '$120k', yieldPct: '11.8%', status: 'Active' },
  { name: 'AgroLink MSME', tag: 'Agri inputs', amount: '$85k', yieldPct: '10.9%', status: 'Active' },
  { name: 'Nova Parts Co', tag: 'Manufacturing', amount: '$140k', yieldPct: '11.2%', status: 'Pending' },
];

const logos = ['Stripe', 'Plaid', 'Visa', 'Mastercard', 'AWS', 'Snowflake'];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      {/* Top nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[#0F172A]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
            <Sparkles size={22} />
          </div>
          FintechOS
        </div>
        
        <div className="flex items-center gap-3">
          <Link className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:text-[#1F6FEB] md:inline-block" to="/login">
            Log in
          </Link>
          <Link className="rounded-full bg-[#1F6FEB] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1F6FEB33] transition hover:bg-[#195cc7]" to="/register">
            Join now
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 lg:px-8">
        {/* Hero: search-first like marketplace */}
        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0EA5E9] ring-1 ring-[#E5E7EB]">
              Trusted MSME capital marketplace
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-[#0F172A] sm:text-5xl">
                Invest in vetted MSME deals with bank-grade controls.
              </h1>
              <p className="text-lg text-[#4B5563]">
                Discover diversified working-capital, inventory, and PO finance opportunities— with real-time risk, payouts, and compliance baked in.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm shadow-[#E0E7FF]">
                <Search size={18} className="text-[#1F6FEB]" />
                <input
                  placeholder="Search deals, sectors, or regions"
                  className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                />
                <button className="rounded-full bg-[#1F6FEB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#195cc7]">
                  Search
                </button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[#4B5563]">
                <span className="rounded-full bg-[#E6F0FF] px-3 py-1 font-semibold text-[#1F6FEB]">Working capital</span>
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 font-semibold">Inventory finance</span>
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 font-semibold">PO finance</span>
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 font-semibold">Rev-share</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm text-[#4B5563]">
              {[
                { value: '$2.4M', label: 'Active capital' },
                { value: '18', label: 'Active deals' },
                { value: '11.4%', label: 'Avg. yield' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-semibold text-[#0F172A]">{s.value}</p>
                  <p>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 blur-3xl">
              <div className="h-full rounded-3xl bg-linear-to-br from-[#DCEBFF] via-[#E6F7FF] to-[#F4F3FF]" />
            </div>
            <div className="relative space-y-4 rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-2xl shadow-[#E0E7FF]">
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

              <div className="grid gap-3 sm:grid-cols-3 text-xs text-[#4B5563]">
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

              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-[#4B5563]">
                “We deployed and monitored diversified MSME capital in days, not months— with compliance built-in.”
                <p className="mt-3 text-xs text-[#0F172A] font-semibold">Maya Chen · VP Product</p>
              </div>
            </div>
          </div>
        </section>

        {/* Marketplace strip */}
        <section id="market" className="mt-16 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Marketplace</p>
              <h2 className="text-2xl font-semibold text-[#0F172A]">Featured MSME opportunities</h2>
              <p className="text-sm text-[#4B5563]">Curated, risk-screened deals with live utilization.</p>
            </div>
            <Link className="hidden items-center gap-2 text-sm font-semibold text-[#1F6FEB] hover:underline md:inline-flex" to="/deals">
              View all deals
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featuredDeals.map((deal) => (
              <div key={deal.name} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-md shadow-[#E0E7FF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#1F6FEB]">{deal.status}</p>
                    <h3 className="text-lg font-semibold text-[#0F172A]">{deal.name}</h3>
                    <p className="text-xs text-[#4B5563]">{deal.tag}</p>
                  </div>
                  <div className="rounded-full bg-[#E6F0FF] px-3 py-1 text-xs font-semibold text-[#1F6FEB] inline-flex items-center gap-2">
                    <CreditCard size={14} />
                    Safe payouts
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0EA5E9]">Amount</p>
                    <p className="mt-1 text-lg font-semibold text-[#0F172A]">{deal.amount}</p>
                  </div>
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0EA5E9]">Target APY</p>
                    <p className="mt-1 text-lg font-semibold text-[#0F172A]">{deal.yieldPct}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#4B5563]">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck size={14} className="text-[#10B981]" />
                    Risk controls on
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Globe2 size={14} className="text-[#1F6FEB]" />
                    SEA region
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link className="inline-flex items-center gap-2 rounded-full bg-[#1F6FEB] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7]" to="/deals">
                    View deal
                    <ArrowRight size={14} />
                  </Link>
                  <button className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]">
                    View memo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & security */}
        <section id="trust" className="mt-16 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF] lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Trust</p>
                <h2 className="text-xl font-semibold text-[#0F172A]">Security & compliance</h2>
              </div>
              <ShieldCheck className="text-[#10B981]" size={20} />
            </div>
            <ul className="mt-4 grid gap-3 text-sm text-[#4B5563] md:grid-cols-2">
              <li className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 flex items-start gap-2">
                <ShieldCheck size={16} className="text-[#10B981] mt-0.5" />
                Bank-grade encryption, RBAC, and audit trails.
              </li>
              <li className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#10B981] mt-0.5" />
                KYC/KYB, AML, and sanction screening automated.
              </li>
              <li className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 flex items-start gap-2">
                <LineChart size={16} className="text-[#1F6FEB] mt-0.5" />
                Real-time risk monitoring and payout controls.
              </li>
              <li className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 flex items-start gap-2">
                <CreditCard size={16} className="text-[#1F6FEB] mt-0.5" />
                Segregated funds with dual-approval for disbursements.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Ratings</p>
            <h3 className="text-lg font-semibold text-[#0F172A]">Investors love the ops</h3>
            <div className="mt-4 flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className="fill-[#F59E0B] text-[#F59E0B]" />
              ))}
              <span className="text-sm text-[#4B5563]">4.9/5</span>
            </div>
            <p className="mt-3 text-sm text-[#4B5563]">
              “Fast diligence, clear guardrails, and transparent cashflow data. Feels like a pro marketplace for MSME capital.”
            </p>
            <p className="mt-2 text-xs font-semibold text-[#0F172A]">A. Raman · Investor</p>
          </div>
        </section>

        {/* Logos */}
        <section className="mt-12 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm shadow-[#E0E7FF]">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-[#4B5563]">
            {logos.map((logo) => (
              <span key={logo} className="rounded-full bg-[#F8FAFC] px-4 py-2 border border-[#E5E7EB]">
                {logo}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="mt-16 rounded-3xl bg-linear-to-r from-[#1F6FEB] via-[#0EA5E9] to-[#2563EB] p-px shadow-2xl shadow-[#CBD5F5]">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-white px-8 py-10 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-2xl font-semibold text-[#0F172A]">Start deploying capital with full visibility.</h3>
              <p className="mt-2 max-w-2xl text-[#4B5563]">
                Join investors funding vetted MSMEs with real-time risk controls and transparent cashflows.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">              <Link className="flex items-center gap-2 rounded-full bg-[#1F6FEB] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1F6FEB33] transition hover:bg-[#195cc7]" to="/register">
                Create free account
                <ArrowRight size={16} />
              </Link>
              <a className="rounded-full border border-[#E5E7EB] px-5 py-3 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]" href="/contact">
                Talk to sales
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}