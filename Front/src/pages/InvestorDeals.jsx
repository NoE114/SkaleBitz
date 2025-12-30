import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DealCard from '../components/deal/DealCard';
import { fetchInvestorDeals } from '../services/statsService';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { deriveLocation } from '../utils/dealMeta';
import useAuth from '../hooks/useAuth';
import Container from '../components/layout/Container';

export default function InvestorDeals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setError('');
      setLoading(true);
      if (!user?.id) {
        setDeals([]);
        setLoading(false);
        return;
      }
      try {
        const data = await fetchInvestorDeals();
        setDeals(data || []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Failed to load investor deals', err);
        }
        setError('Unable to load your deals right now.');
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const cards = useMemo(
    () =>
      deals.map((deal) => ({
        key: deal.id || deal._id,
        name: deal.name || 'Deal',
        sector: deal.sector || '—',
        amount: formatCurrency(Number(deal.utilizedAmount ?? deal.invested ?? 0)),
        yieldPct: formatPercent(deal.targetYield ?? deal.yieldPct ?? 0, 1),
        status: deal.status || 'Active',
        location: deriveLocation(deal),
        tenor: deal.tenorMonths ? `${deal.tenorMonths} months` : '',
        risk: deal.risk || 'On track',
        href: deal.id ? `/deals/${deal.id}` : '/deals',
      })),
    [deals]
  );

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex flex-col gap-8 py-10">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F6FEB]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
              <Sparkles size={18} />
            </div>
            {user?.name || 'Investor'} · Your deals
          </div>
          <button
            type="button"
            onClick={() => navigate('/deals')}
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
          >
            Browse marketplace
          </button>
        </header>

        {error && (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C] shadow-sm shadow-[#FEE2E2]">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {loading && (
            <div className="col-span-full rounded-2xl border border-[#E5E7EB] bg-white p-6 text-sm text-[#4B5563] shadow-sm shadow-[#E0E7FF]">
              Loading your deals...
            </div>
          )}
          {!loading &&
            cards.map((deal) => (
              <DealCard
                key={deal.key}
                name={deal.name}
                sector={deal.sector}
                amount={deal.amount}
                yieldPct={deal.yieldPct}
                status={deal.status}
                location={deal.location}
                tenor={deal.tenor}
                risk={deal.risk}
                href={deal.href}
                ctaLabel="Open deal"
              />
            ))}
          {!loading && cards.length === 0 && (
            <div className="col-span-full rounded-2xl border border-[#E5E7EB] bg-white p-6 text-sm text-[#4B5563] shadow-sm shadow-[#E0E7FF]">
              You have not invested in any deals yet.
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
