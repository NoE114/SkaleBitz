import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDealInvestors } from '../services/investorService';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import useAuth from '../hooks/useAuth';
import Container from '../components/layout/Container';

export default function DealInvestors() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [investors, setInvestors] = useState([]);
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;
    const cleanup = () => {
      isActive = false;
    };
    const isAuthorized =
      Boolean(user?.dealId) && String(user.dealId || '') === String(dealId || '');

    if (!isAuthorized) {
      navigate(user?.dealId ? `/msme/dashboard/${user.dealId}` : '/msme/dashboard', { replace: true });
      setLoading(false);
      setInvestors([]);
    } else {
      const loadInvestors = async () => {
        setLoading(true);
        setError('');
        try {
          const data = await fetchDealInvestors(dealId);
          if (!isActive) return;
          setDeal(data.deal || null);
          setInvestors(data.investors || []);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('Failed to load investors', err);
          }
          if (isActive) {
            setError('Unable to load investors right now.');
            setInvestors([]);
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      loadInvestors();
    }

    return cleanup;
  }, [dealId, navigate, user?.dealId]);

  const dealName = deal?.name || 'Deal';
  const backHref = useMemo(
    () => (dealId ? `/msme/dashboard/${dealId}` : '/msme/dashboard'),
    [dealId]
  );
  const formatStatus = (status) => (status ? status.charAt(0).toUpperCase() + status.slice(1) : '—');

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex flex-col gap-8 py-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(backHref)}
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F6FEB]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
              <Users size={18} />
            </div>
            {dealName} · Investors
          </div>
        </div>

        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-[#0F172A]">Investors</h1>
          <p className="text-sm text-[#4B5563]">
            Full investor list for this deal. Only visible to your MSME account.
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C] shadow-sm shadow-[#FEE2E2]">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">
                Investors
              </p>
              <h2 className="text-xl font-semibold text-[#0F172A]">Investor roster</h2>
            </div>
            <div className="rounded-full bg-[#E6F0FF] px-4 py-2 text-xs font-semibold text-[#1F6FEB]">
              {investors.length} total
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-left text-xs uppercase tracking-[0.08em] text-[#4B5563]">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4 text-right">Amount</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="py-3 text-[#4B5563]" colSpan={4}>
                      Loading investors...
                    </td>
                  </tr>
                )}
                {!loading && investors.length === 0 && (
                  <tr>
                    <td className="py-3 text-[#4B5563]" colSpan={4}>
                      No investors have been recorded for this deal yet.
                    </td>
                  </tr>
                )}
                {!loading &&
                  investors.map((inv) => (
                    <tr key={inv.id || inv._id} className="border-b border-[#F1F5F9] last:border-none">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-[#0F172A]">
                          {inv?.investor?.name || inv?.investor?.email || 'Investor'}
                        </p>
                        {inv?.investor?.email && (
                          <p className="text-xs text-[#4B5563]">{inv.investor.email}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right text-[#0F172A]">
                        {formatCurrency(inv?.amount || 0)}
                      </td>
                      <td className="py-3 pr-4 text-[#0F172A]">
                        {inv?.createdAt ? formatDateShort(inv.createdAt) : '—'}
                      </td>
                      <td
                        className={`py-3 text-right text-xs font-semibold ${
                          inv?.status === 'completed' ? 'text-[#10B981]' : 'text-[#1F6FEB]'
                        }`}
                      >
                        {formatStatus(inv?.status)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </div>
  );
}
