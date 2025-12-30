import useAuth from '../hooks/useAuth';
import Container from '../components/layout/Container';

export default function Settings() {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex flex-col gap-6 py-10">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm shadow-[#E0E7FF]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F0FF] text-[#1F6FEB] text-lg font-semibold">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Profile</p>
              <h1 className="text-xl font-semibold text-[#0F172A]">{user?.name || 'Settings'}</h1>
              <p className="text-sm text-[#4B5563]">{user?.email || 'Update your preferences below.'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#E0E7FF]">
            <h2 className="text-lg font-semibold text-[#0F172A]">Notifications</h2>
            <p className="text-sm text-[#4B5563] mt-1">
              Configure alerts for payouts, risk events, and account activity.
            </p>
            <div className="mt-3 space-y-2 text-sm text-[#111827]">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[#CBD5E1]" />
                Payout updates
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[#CBD5E1]" />
                Risk alerts
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-[#CBD5E1]" />
                Product announcements
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#E0E7FF]">
            <h2 className="text-lg font-semibold text-[#0F172A]">Security</h2>
            <p className="text-sm text-[#4B5563] mt-1">Keep your account secure with MFA and session controls.</p>
            <div className="mt-3 space-y-3 text-sm text-[#111827]">
              <button className="w-full rounded-full border border-[#E5E7EB] px-4 py-2 font-semibold text-[#1F2937] hover:border-[#CBD5E1]">
                Enable multi-factor auth
              </button>
              <button className="w-full rounded-full border border-[#E5E7EB] px-4 py-2 font-semibold text-[#1F2937] hover:border-[#CBD5E1]">
                View active sessions
              </button>
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}
