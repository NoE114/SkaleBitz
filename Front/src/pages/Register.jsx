import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { signup } from '../services/authService';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    accountType: 'investor',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

    const handleChange = (field) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAccountType = (value) => {
    setForm((prev) => ({ ...prev, accountType: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirm) {
      setError('Passwords must match.');
      return;
    }


    try {
      setLoading(true);
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        accountType: form.accountType,
      });
      setSuccess('Signup successful. Check your email to verify your account.');
      setForm({ name: '', email: '', password: '', confirm: '', accountType: 'investor' });
    } catch (err) {
      const apiError = err.response?.data?.error || err.response?.data?.message;
      setError(apiError || 'Unable to create your account right now.');
    } finally {
      setLoading(false);
    }
  };

    const accountOptions = [
    {
      value: 'investor',
      title: 'Investor account',
    },
    {
      value: 'msme',
      title: 'MSME account',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827] flex items-center justify-center px-6 py-16">
      <div className="relative w-full max-w-5xl">
        <div className="absolute inset-0 blur-3xl">
          <div className="h-full rounded-3xl bg-linear-to-br from-[#DCEBFF] via-[#E6F7FF] to-[#F4F3FF]" />
        </div>

        <div className="relative grid gap-10 rounded-3xl border border-[#E5E7EB] bg-white p-10 shadow-2xl shadow-[#E0E7FF] lg:grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-sm font-semibold text-[#1F6FEB]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
                <Sparkles size={20} />
              </div>
              FintechOS
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Create account</p>
              <h1 className="text-3xl font-semibold text-[#0F172A]">Join modern teams shipping fintech faster</h1>
              <p className="text-[#4B5563]">
                Spin up a secure workspace, invite your team, and start building compliant banking, payments, or lending flows in days.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#0F172A]">Built for trust</p>
                <p className="text-sm text-[#4B5563] mt-1">Bank-grade security, audit trails, and granular roles from day one.</p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <p className="text-sm font-semibold text-[#0F172A]">Launch-ready APIs</p>
                <p className="text-sm text-[#4B5563] mt-1">Payments, onboarding, risk controls, and KYC you can ship quickly.</p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#0F172A]">Full name</span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 focus-within:border-[#1F6FEB] focus-within:ring-2 focus-within:ring-[#1F6FEB33]">
                  <User size={18} className="text-[#1F6FEB]" />
                  <input
                    value={form.name}
                    onChange={handleChange('name')}
                    type="text"
                    placeholder="Alex Morgan"
                    className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#0F172A]">Work email</span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 focus-within:border-[#1F6FEB] focus-within:ring-2 focus-within:ring-[#1F6FEB33]">
                  <Mail size={18} className="text-[#1F6FEB]" />
                  <input
                    value={form.email}
                    onChange={handleChange('email')}
                    type="email"
                    placeholder="you@company.com"
                    className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                </div>
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-[#0F172A]">Account type</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {accountOptions.map((option) => {
                    const isActive = form.accountType === option.value;
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => handleAccountType(option.value)}
                        className={`rounded-2xl border px-4 py-2 text-left transition ${
                          isActive
                            ? 'border-[#1F6FEB] bg-[#E6F0FF] shadow-sm shadow-[#1F6FEB33]'
                            : 'border-[#E5E7EB] bg-white hover:border-[#1F6FEB]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#0F172A]">{option.title}</span>
                          {isActive && <ShieldCheck size={16} className="text-[#1F6FEB]" />}
                        </div>
                        <p className="mt-1 text-sm text-[#4B5563]">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-[#0F172A]">Password</span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 focus-within:border-[#1F6FEB] focus-within:ring-2 focus-within:ring-[#1F6FEB33]">
                  <Lock size={18} className="text-[#1F6FEB]" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="text-[#4B5563] hover:text-[#1F6FEB]"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#4B5563]">Use 8+ characters with letters, numbers, and symbols.</p>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#0F172A]">Confirm password</span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 focus-within:border-[#1F6FEB] focus-within:ring-2 focus-within:ring-[#1F6FEB33]">
                  <Lock size={18} className="text-[#1F6FEB]" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={handleChange('confirm')}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="text-[#4B5563] hover:text-[#1F6FEB]"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="flex items-start gap-2 text-sm text-[#4B5563]">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#1F6FEB] focus:ring-[#1F6FEB]" />
                <span>
                  I agree to the <Link to="/terms" className="text-[#1F6FEB] underline">Terms</Link> and <Link to="/privacy" className="text-[#1F6FEB] underline">Privacy Policy</Link>.
                </span>
              </label>

              {error && <p className="text-sm font-semibold text-[#DC2626]">{error}</p>}
              {success && <p className="text-sm font-semibold text-[#15803D]">{success}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1F6FEB] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1F6FEB33] transition hover:bg-[#195cc7] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {loading ? 'Creating account...' : 'Create account'}
              <ArrowRight size={18} />
            </button>

            <p className="text-center text-sm text-[#4B5563]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1F6FEB] font-semibold hover:underline">
                Sign in
              </Link>
            </p>

            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-[#4B5563]">
              <div className="flex items-center gap-2 text-[#0F172A] font-semibold">
                <ShieldCheck size={18} className="text-[#10B981]" />
                Security-first by design
              </div>
              <p className="mt-2">
                Encrypted data at rest and in transit, role-based access control, and continuous monitoring to keep your workspace safe.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}