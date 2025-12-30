import { useState } from 'react';
import { ShieldCheck, Mail, User, LogOut, Trash2, UploadCloud, Sparkles, BadgeCheck } from 'lucide-react';

export default function ProfilePage({ user = { name: 'Jordan Lee', email: 'jordan@example.com', role: 'msme', avatarUrl: '' }, onSave = () => {}, onLogout = () => {}, onDelete = () => {} }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [about, setAbout] = useState(user.about || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  const roleLabel = user.role === 'investor' ? 'Investor' : 'MSME';
  const roleColor = user.role === 'investor' ? 'bg-[#E6F0FF] text-[#1F6FEB]' : 'bg-[#FEF3C7] text-[#B45309]';

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      // TODO: upload to backend
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827] px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F0FF] text-[#1F6FEB]">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">Account</p>
              <h1 className="text-2xl font-semibold text-[#0F172A]">Profile & Settings</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
            >
              <LogOut size={16} />
              Logout
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-full border border-[#FECACA] bg-[#FEE2E2] px-4 py-2 text-sm font-semibold text-[#B91C1C] transition hover:border-[#FCA5A5]"
            >
              <Trash2 size={16} />
              Delete account
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Avatar + role */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm shadow-[#E0E7FF] flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border border-[#E5E7EB] bg-[#F8FAFC]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">No photo</div>
                )}
              </div>
              <label className="absolute -right-2 -bottom-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#1F6FEB] text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7]">
                <UploadCloud size={18} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${roleColor}`}>
              <BadgeCheck size={14} />
              {roleLabel}
            </div>
            <p className="text-sm text-[#4B5563] text-center px-4">
              Manage your profile details and account preferences.
            </p>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm shadow-[#E0E7FF] space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0EA5E9]">Name</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                <User size={16} className="text-[#1F6FEB]" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#0F172A] focus:outline-none"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0EA5E9]">Email</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                <Mail size={16} className="text-[#1F6FEB]" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#0F172A] focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0EA5E9]">About</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] focus:outline-none"
                placeholder="Add a short bio or notes."
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onSave({ name, email, about, avatarUrl })}
                className="inline-flex items-center gap-2 rounded-full bg-[#1F6FEB] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7]"
              >
                Save changes
                <ShieldCheck size={16} />
              </button>
              <button
                onClick={() => {
                  setName(user.name || '');
                  setEmail(user.email || '');
                  setAbout(user.about || '');
                  setAvatarUrl(user.avatarUrl || '');
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}