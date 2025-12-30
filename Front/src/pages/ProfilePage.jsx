import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, Mail, User, LogOut, Trash2, UploadCloud, Sparkles, BadgeCheck, KeyRound } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { fetchUserById, updateProfile } from '../services/userService';
import { requestPasswordReset } from '../services/authService';
import Container from '../components/layout/Container';

export default function ProfilePage({ onSave = () => {} }) {
  const navigate = useNavigate();
  const { user, logout, deleteAccount, updateUser, refreshUser } = useAuth();
  const { userId } = useParams();
  const targetUserId = userId || user?.id;
  const [viewedUser, setViewedUser] = useState(user || null);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.pendingEmail || user?.email || '',
    about: user?.about || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [pendingEmail, setPendingEmail] = useState(user?.pendingEmail || '');
  const [actionError, setActionError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [resetNotice, setResetNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const isOwnProfile = Boolean(user?.id) && (!userId || userId === String(user.id));

  useEffect(() => {
    if (!targetUserId) {
      setLoadingProfile(false);
      return;
    }

    const loadProfile = async () => {
      setLoadingProfile(true);
      setActionError('');
      try {
        const response = await fetchUserById(targetUserId);
        const profile = response?.user || response;
        setViewedUser(profile);
        const source = profile;
        setForm({
          name: source?.name || '',
          email: isOwnProfile ? user?.pendingEmail || user?.email || '' : '',
          about: source?.about || '',
          avatarUrl: source?.avatarUrl || '',
        });
        setPendingEmail(isOwnProfile ? user?.pendingEmail || '' : '');
      } catch (err) {
        setActionError(err.response?.data?.error || 'Unable to load profile.');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [targetUserId, isOwnProfile, user]);

  const role = viewedUser?.accountType || viewedUser?.role || 'investor';
  const roleLabel = role === 'investor' ? 'Investor' : 'MSME';
  const roleColor = role === 'investor' ? 'bg-[#E6F0FF] text-[#1F6FEB]' : 'bg-[#FEF3C7] text-[#B45309]';
  const readOnly = !isOwnProfile;

  const handleAvatarChange = (e) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setActionError('Profile picture must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleFieldChange = (field) => (e) => {
    if (!isOwnProfile) return;
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setActionError('');
    setStatusMessage('');
    if (!isOwnProfile) {
      setActionError('You can only edit your own profile.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        about: form.about,
        avatar: form.avatarUrl,
      };
      const data = await updateProfile(payload);
      if (data?.user) {
        updateUser(data.user);
        setViewedUser(data.user);
        setForm({
          name: data.user.name || '',
          email: data.user.pendingEmail || data.user.email || '',
          about: data.user.about || '',
          avatarUrl: data.user.avatarUrl || '',
        });
        setPendingEmail(data.pendingEmail || data.user.pendingEmail || '');
      }
      onSave(data?.user);
      setStatusMessage(data?.message || 'Profile updated');
    } catch (err) {
      const apiError = err.response?.data?.error || err.response?.data?.message;
      setActionError(apiError || 'Unable to update your profile right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetProfile = async () => {
    setActionError('');
    setStatusMessage('');
    if (!isOwnProfile) return;
    try {
      const latest = await refreshUser();
      const source = latest || user;
      setForm({
        name: source?.name || '',
        email: source?.pendingEmail || source?.email || '',
        about: source?.about || '',
        avatarUrl: source?.avatarUrl || '',
      });
      setPendingEmail(source?.pendingEmail || '');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Unable to refresh profile details.');
    }
  };

  const handleForgotPassword = async () => {
    setResetNotice('');
    setActionError('');
    if (!isOwnProfile) {
      setActionError('Password reset is only available for your own account.');
      return;
    }
    const targetEmail = user?.email || form.email;
    if (!targetEmail) {
      setActionError('Add an email to receive reset instructions.');
      return;
    }
    try {
      const data = await requestPasswordReset(targetEmail);
      setResetNotice(data?.message || 'Password reset email sent.');
    } catch (err) {
      const apiError = err.response?.data?.error || err.response?.data?.message;
      setActionError(apiError || 'Unable to send reset email right now.');
    }
  };

  const handleLogout = () => {
    if (!isOwnProfile) return;
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      logout();
      navigate('/');
    }
  };

  const handleDelete = async () => {
    if (!isOwnProfile) return;
    const confirmed = window.confirm('This will permanently delete your account. Continue?');
    if (!confirmed) return;
    try {
      setActionError('');
      await deleteAccount();
      navigate('/');
    } catch (err) {
      const apiError = err.response?.data?.error;
      setActionError(apiError || 'Unable to delete your account right now.');
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
        <Container className="flex items-center justify-center py-8">
          <p className="text-sm text-[#4B5563]">Loading profile...</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827]">
      <Container className="flex flex-col gap-8 py-8">
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
          {isOwnProfile && (
            <div className="flex gap-3">
              <button
                onClick={handleForgotPassword}
                className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1] cursor-pointer"
              >
                <KeyRound size={16} />
                Forgot password
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1] cursor-pointer"
              >
                <LogOut size={16} />
                Logout
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-full border border-[#FECACA] bg-[#FEE2E2] px-4 py-2 text-sm font-semibold text-[#B91C1C] transition hover:border-[#FCA5A5] cursor-pointer"
              >
                <Trash2 size={16} />
                Delete account
              </button>
            </div>
          )}
        </header>

        {actionError && (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">
            {actionError}
          </div>
        )}
        {!isOwnProfile && (
          <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">
            Viewing public profile. Editing is limited to your own account.
          </div>
        )}
        {statusMessage && (
          <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm text-[#166534]">
            {statusMessage}
          </div>
        )}
        {resetNotice && (
          <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">
            {resetNotice}
          </div>
        )}
        {pendingEmail && (
          <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
            Email change is pending verification for <span className="font-semibold">{pendingEmail}</span>. Check both
            inboxes for the confirmation link.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Avatar + role */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm shadow-[#E0E7FF] flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-[#E5E7EB] bg-[#F8FAFC]">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">No photo</div>
                  )}
                </div>
              {isOwnProfile && (
                <label className="absolute -right-2 -bottom-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#1F6FEB] text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7]">
                  <UploadCloud size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
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
                  value={form.name}
                  onChange={handleFieldChange('name')}
                  className="w-full bg-transparent text-sm text-[#0F172A] focus:outline-none disabled:text-[#9CA3AF]"
                  placeholder="Your name"
                  disabled={readOnly}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0EA5E9]">Email</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                <Mail size={16} className="text-[#1F6FEB]" />
                <input
                  value={isOwnProfile ? form.email : ''}
                  onChange={handleFieldChange('email')}
                  className="w-full bg-transparent text-sm text-[#0F172A] focus:outline-none disabled:text-[#9CA3AF]"
                  placeholder={isOwnProfile ? 'you@example.com' : 'Hidden'}
                  disabled={readOnly}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0EA5E9]">About</label>
              <textarea
                value={form.about}
                onChange={handleFieldChange('about')}
                rows={3}
                className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] focus:outline-none disabled:text-[#9CA3AF]"
                placeholder="Add a short bio or notes."
                disabled={readOnly}
              />
            </div>

            {isOwnProfile && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1F6FEB] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1F6FEB33] transition hover:bg-[#195cc7] disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                  <ShieldCheck size={16} />
                </button>
                <button
                  onClick={handleResetProfile}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#CBD5E1]"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
