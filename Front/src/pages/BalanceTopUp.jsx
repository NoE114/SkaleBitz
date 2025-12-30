import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, Wallet } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatters';
import Container from '../components/layout/Container';

export default function BalanceTopUp() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const dashboardPath = user?.id ? `/dashboard/${user.id}` : '/dashboard';

  useEffect(() => {
    const load = async () => {
      try {
        await refreshUser();
      } catch {
        // ignore and keep existing auth state
      }
    };
    load();
  }, [refreshUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setStatus('Please enter a valid amount above zero.');
      return;
    }
    setStatus(
      `Top-up request for ${formatCurrency(parsed)} received. We'll notify you once it is processed.`
    );
    setAmount('');
    setNote('');
  };

  const balance = user?.balance ?? 0;

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex flex-col gap-6 py-10">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(dashboardPath)}
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
          <div className="rounded-full bg-[#E6F0FF] px-4 py-2 text-sm font-semibold text-[#1F6FEB]">
            Secure balance top-up
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-md shadow-[#E0E7FF]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">
                Account balance
              </p>
              <h1 className="text-3xl font-semibold text-[#0F172A]">{formatCurrency(balance)}</h1>
              <p className="mt-1 text-sm text-[#4B5563]">
                Funds available for immediate investment.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm text-[#1F2937]">
              <ShieldCheck className="text-[#10B981]" size={18} />
              PCI-compliant processing
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="flex items-center gap-3">
                <Wallet className="text-[#1F6FEB]" size={20} />
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Bank transfer</p>
                  <p className="text-xs text-[#4B5563]">Same-day credit on verification</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="text-[#1F6FEB]" size={20} />
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Card payment</p>
                  <p className="text-xs text-[#4B5563]">Instant availability, small fee applies</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#10B981]" size={20} />
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Verified account</p>
                  <p className="text-xs text-[#4B5563]">Funds protected with multi-layer controls</p>
                </div>
              </div>
            </div>
          </div>

          <form className="mt-8 grid gap-6 lg:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-[#0F172A]">
                Top-up amount
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-[#0F172A] focus:border-[#1F6FEB] focus:outline-none focus:ring-2 focus:ring-[#1F6FEB33]"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-[#0F172A]">
                Notes (optional)
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Reference, bank account details, or instructions"
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-[#0F172A] focus:border-[#1F6FEB] focus:outline-none focus:ring-2 focus:ring-[#1F6FEB33]"
                />
              </label>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="space-y-2 text-sm text-[#4B5563]">
                <p className="font-semibold text-[#0F172A]">Instructions</p>
                <p>1. Enter your desired amount and submit the request.</p>
                <p>2. We&apos;ll share funding details and confirm receipt.</p>
                <p>3. Balance updates automatically once funds clear.</p>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1F6FEB] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7]"
              >
                Confirm top-up request
              </button>
              {status && (
                <div className="rounded-lg bg-[#ECFDF3] px-4 py-3 text-sm font-semibold text-[#166534]">
                  {status}
                </div>
              )}
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}
