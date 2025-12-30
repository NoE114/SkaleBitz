import { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import Container from '../components/layout/Container';

export default function ResetPasswordConfirm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const data = await resetPassword({ token, password: form.password });
      setStatus(data?.message || 'Password updated successfully. You can log in now.');
      setForm({ password: '', confirm: '' });
    } catch (err) {
      const apiError = err.response?.data?.error || err.response?.data?.message;
      setError(apiError || 'Unable to update your password right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex items-center justify-center py-16">
        <div className="relative w-full max-w-3xl">
        <div className="absolute inset-0 blur-3xl">
          <div className="h-full rounded-3xl bg-linear-to-br from-[#DCEBFF] via-[#E6F7FF] to-[#F4F3FF]" />
        </div>

        <div className="relative rounded-3xl border border-[#E5E7EB] bg-white p-10 shadow-2xl shadow-[#E0E7FF] space-y-6">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#1F6FEB]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
              <Sparkles size={20} />
            </div>
            SkaleBitz · Set new password
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-[#0F172A]">Choose a new password</h1>
            <p className="text-[#4B5563]">
              Enter and confirm your new password. The link works for a limited time to keep your account secure.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-[#0F172A]">New password</span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 focus-within:border-[#1F6FEB] focus-within:ring-2 focus-within:ring-[#1F6FEB33]">
                <Lock size={18} className="text-[#1F6FEB]" />
                <input
                  value={form.password}
                  onChange={handleChange('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#0F172A]">Confirm password</span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 focus-within:border-[#1F6FEB] focus-within:ring-2 focus-within:ring-[#1F6FEB33]">
                <Lock size={18} className="text-[#1F6FEB]" />
                <input
                  value={form.confirm}
                  onChange={handleChange('confirm')}
                  type="password"
                  placeholder="Repeat password"
                  className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>
            </label>

            {error && <p className="text-sm font-semibold text-[#DC2626]">{error}</p>}
            {status && <p className="text-sm font-semibold text-[#16A34A]">{status}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1F6FEB] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1F6FEB33] transition hover:bg-[#195cc7] disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update password'}
              <ShieldCheck size={18} />
            </button>
          </form>

          <div className="flex flex-wrap gap-3 text-sm text-[#4B5563]">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>
            <Link to="/support" className="font-semibold text-[#1F6FEB] hover:underline">
              Need more help?
            </Link>
          </div>
        </div>
      </div>
      </Container>
    </div>
  );
}
