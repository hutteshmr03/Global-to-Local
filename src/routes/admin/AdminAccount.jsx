import React, { useState } from 'react';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, 
  KeyRound, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../lib/auth-store';

export default function AdminAccount() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const updatePassword = useAuthStore((state) => state.updatePassword);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.name || user?.full_name || 'Global to Local Admin');
  const [email, setEmail] = useState(user?.email || 'admin@globaltolocal.in');
  const [phone, setPhone] = useState(user?.rawPhone || user?.phone?.replace(/\D/g, '').slice(-10) || '');

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!email.trim()) {
      setProfileError('Admin email address cannot be empty.');
      return;
    }

    setProfileSaving(true);
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const res = await updateProfile({
      name: fullName.trim(),
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone ? `+91 ${cleanPhone}` : undefined,
    });
    setProfileSaving(false);

    if (!res.ok) {
      setProfileError(res.error || 'Failed to update administrator profile.');
      return;
    }

    setProfileSuccess('Administrator profile updated successfully.');
    setTimeout(() => setProfileSuccess(''), 4000);
  };

  // Handle Direct Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordSaving(true);
    const res = await updatePassword({
      currentPassword: currentPassword || undefined,
      newPassword,
    });
    setPasswordSaving(false);

    if (!res.ok) {
      setPasswordError(res.error || 'Failed to update password.');
      return;
    }

    setPasswordSuccess('Admin password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(''), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-palm/10 text-palm border border-palm/20 shrink-0">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">Administrator Settings</span>
                <span className="rounded-pill bg-palm/15 border border-palm/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-palm">
                  Super Admin
                </span>
              </div>
              <h1 className="mt-0.5 font-display text-2xl sm:text-3xl font-bold text-content">
                My Account
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Admin Profile Details (Email & Phone Number) */}
        <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-border/50">
              <User className="w-5 h-5 text-palm" />
              <h2 className="text-base font-bold text-content">Admin Credentials & Contact Info</h2>
            </div>

            <AnimatePresence>
              {profileSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-3 text-xs font-semibold text-emerald-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccess}</span>
                </motion.div>
              )}
              {profileError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 flex items-center gap-2.5 rounded-2xl border border-accent/30 bg-accent/10 p-3 text-xs font-semibold text-accent"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form id="admin-profile-form" onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-content mb-1">
                  Administrator Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Global to Local Admin"
                    className="w-full rounded-pill border border-border bg-ground pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-content outline-none focus:border-palm transition-colors"
                  />
                </div>
              </div>

              {/* Login Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-content">
                    Login Email Address <span className="text-accent">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-content-subtle">Admin Portal ID</span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@globaltolocal.in"
                    className="w-full rounded-pill border border-border bg-ground pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-content outline-none focus:border-palm transition-colors font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-content-subtle">
                  This email is used to log in directly to the admin dashboard.
                </p>
              </div>

              {/* Mobile Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-content">
                    Mobile Number (SMS & WhatsApp Alerts)
                  </label>
                  <span className="text-[10px] font-medium text-content-subtle">India (+91)</span>
                </div>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-pill border border-r-0 border-border bg-ground text-xs font-mono font-bold text-content-muted">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9879998888"
                    className="w-full rounded-r-pill border border-border bg-ground px-3.5 py-2.5 text-xs sm:text-sm font-mono font-medium text-content outline-none focus:border-palm transition-colors"
                  />
                </div>
                <p className="mt-1 text-[11px] text-content-subtle">
                  Used for instant security notifications, order updates, and contact info.
                </p>
              </div>
            </form>
          </div>

          <div className="pt-5 mt-5 border-t border-border/50 flex justify-end">
            <button
              type="submit"
              form="admin-profile-form"
              disabled={profileSaving}
              className="inline-flex items-center justify-center gap-2 rounded-pill bg-palm px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-palm-shade transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {profileSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Password Management (Direct Password Update) */}
        <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-border/50">
              <Lock className="w-5 h-5 text-palm" />
              <h2 className="text-base font-bold text-content">Change Admin Password</h2>
            </div>

            <AnimatePresence>
              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-3 text-xs font-semibold text-emerald-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </motion.div>
              )}
              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 flex items-center gap-2.5 rounded-2xl border border-accent/30 bg-accent/10 p-3 text-xs font-semibold text-accent"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form id="admin-password-form" onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-content mb-1">
                  Current Password (Optional if resetting)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-pill border border-border bg-ground pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-content outline-none focus:border-palm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content"
                    aria-label="Toggle password visibility"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-content mb-1">
                  New Password <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-pill border border-border bg-ground pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-content outline-none focus:border-palm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-content mb-1">
                  Confirm New Password <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-pill border border-border bg-ground pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-content outline-none focus:border-palm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="pt-5 mt-5 border-t border-border/50 flex justify-end">
            <button
              type="submit"
              form="admin-password-form"
              disabled={passwordSaving}
              className="inline-flex items-center justify-center gap-2 rounded-pill bg-palm px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-palm-shade transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {passwordSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
