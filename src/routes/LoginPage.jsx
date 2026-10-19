import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, 
  Sparkles, ShieldCheck, ShoppingBag, ArrowLeft 
} from 'lucide-react';
import { useAuthStore } from '../lib/auth-store';
import ShellDrift from '../components/common/ShellDrift';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestOtp = useAuthStore((state) => state.requestOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const registerUser = useAuthStore((state) => state.registerUser);
  const loginWithEmail = useAuthStore((state) => state.loginWithEmail);
  const setupMfa = useAuthStore((state) => state.setupMfa);
  const confirmMfa = useAuthStore((state) => state.confirmMfa);
  const verifyMfa = useAuthStore((state) => state.verifyMfa);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const searchParams = new URLSearchParams(location.search);
  const resetTokenFromUrl = searchParams.get('reset_token') || '';
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // 'phone' or 'email'
  const [authMethod, setAuthMethod] = useState('phone');
  // 'signin' or 'signup'
  const [mode, setMode] = useState('signin');

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP State (6-digit code)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // MFA permanently disabled for smooth direct admin login
  const mfaStep = 'none';
  const setMfaStep = () => {};
  const [mfaTempToken, setMfaTempToken] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrUri, setMfaQrUri] = useState('');
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState([]);
  const [mfaInputCode, setMfaInputCode] = useState('');
  const [isUsingRecoveryCode, setIsUsingRecoveryCode] = useState(false);

  const [devOtp, setDevOtp] = useState('');
  const [devTotp, setDevTotp] = useState('');

  // Destination after login
  const redirectTarget = searchParams.get('redirect') || '/account';

  // Request 6-digit OTP via API
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const cleanDigits = (phoneNumber || '').replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name to create an account.');
      return;
    }

    setIsSubmitting(true);
    const result = await requestOtp({
      phone: cleanDigits,
      mode,
      name: fullName.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    if (result.data?.not_registered) {
      setErrorMessage("No account found with this mobile number. Please click below to register with your name.");
      return;
    }

    if (result.data?.dev_otp) {
      setDevOtp(result.data.dev_otp);
    } else {
      setDevOtp('');
    }

    setOtpSent(true);
    setOtpCode(['', '', '', '', '', '']);
  };

  // Verify 6-digit OTP & Complete Auth
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const entered = otpCode.join('');
    if (entered.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOtp({
      phone: phoneNumber.replace(/\D/g, ''),
      otp: entered,
      mode,
      name: fullName.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage(
      mode === 'signup'
        ? `Account created successfully! Welcome, ${result.user.name}.`
        : `Welcome back, ${result.user.name}! Signed in successfully.`
    );
    setTimeout(() => navigate(redirectTarget), 500);
  };

  // Handle Email & Password Submit
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name to create an account.');
      return;
    }

    setIsSubmitting(true);
    if (mode === 'signup') {
      const result = await registerUser({
        name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phoneNumber ? phoneNumber.replace(/\D/g, '') : '',
      });
      setIsSubmitting(false);
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
      setSuccessMessage(`Account created! Welcome, ${result.user.name}.`);
      setTimeout(() => navigate(redirectTarget), 500);
    } else {
      const result = await loginWithEmail(email.trim(), password);
      setIsSubmitting(false);
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
      setSuccessMessage(`Welcome back, ${result.user?.name || 'Admin'}! Signed in successfully.`);
      const destination = result.user?.role === 'admin' ? '/admin' : redirectTarget;
      setTimeout(() => navigate(destination), 300);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!mfaInputCode.trim()) {
      setErrorMessage(isUsingRecoveryCode ? 'Please enter a recovery code.' : 'Please enter the 6-digit authenticator code.');
      return;
    }

    setIsSubmitting(true);
    let result;
    if (mfaStep === 'setup') {
      result = await confirmMfa(mfaTempToken, mfaInputCode.trim());
    } else {
      result = await verifyMfa(mfaTempToken, mfaInputCode.trim());
    }
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage('Admin authentication successful! Redirecting to dashboard...');
    setTimeout(() => navigate('/admin'), 500);
  };

  const handleForgotPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter your email address first to request a password reset link.');
      return;
    }
    const res = await forgotPassword(email.trim());
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(res.message || 'If an account is registered with that email address, we have sent a password reset link.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setErrorMessage('Please enter a new password of at least 6 characters.');
      return;
    }
    setIsSubmitting(true);
    const res = await resetPassword(resetTokenFromUrl, newPasswordInput);
    setIsSubmitting(false);
    if (res.error) {
      setErrorMessage(res.error);
      return;
    }
    setSuccessMessage(res.message || 'Your password has been updated. Please sign in.');
    setTimeout(() => {
      setAuthMethod('email');
      setMode('signin');
      navigate('/login', { replace: true });
    }, 800);
  };

  return (
    <main id="main-content" className="min-h-screen bg-ground flex flex-col justify-between pt-20 lg:pt-24 pb-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
        {/* Navigation Breadcrumb back to store */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-content-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </Link>
          <span className="font-display italic text-xs sm:text-sm text-content-subtle">
            Global to Local • Fontainhas
          </span>
        </div>

        {/* Premium Auth Container */}
        <div className="overflow-hidden rounded-3xl border border-border/50 bg-surface shadow-xl grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* LEFT: Atmospheric Brand Showcase (Desktop / Tablet) */}
          <div className="relative isolate hidden lg:flex lg:col-span-5 flex-col justify-between overflow-hidden bg-[#241A14] p-10 xl:p-12 text-white">
            {/* Rich cinematic photographic background with soft scrim */}
            <img
              src="/images/site/fontainhas-dusk.jpg"
              alt="Fontainhas Panaji street"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 brightness-90 saturate-[1.1] scale-105"
            />
            {/* Subtle radial & linear scrim for clean text contrast */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1C140F]/95 via-[#1C140F]/60 to-[#1C140F]/30" />
            <ShellDrift tone="dark" />

            {/* Top Brand Tagline */}
            <div className="relative z-10">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#E5A823] mb-3">
                Fontainhas Heritage
              </span>
              <h2 className="font-display text-3xl xl:text-4xl font-semibold leading-tight text-white tracking-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
                Taste the authentic soul of Goa.
              </h2>
              <p className="mt-3 text-sm text-white/80 leading-relaxed font-normal">
                Sign in to manage your artisanal Goan pantry, track live couriers across India, and save your favourite Fontainhas delicacies.
              </p>
            </div>

            {/* Highlights List */}
            <div className="relative z-10 space-y-3 pt-6 border-t border-white/15">
              <div className="flex items-center gap-3 text-xs text-white/90">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 backdrop-blur-sm shrink-0 text-[#E5A823] border border-white/10">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <span>Thirteen shelves of curated Goan treasures</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/90">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 backdrop-blur-sm shrink-0 text-[#E5A823] border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>80% crafted by women self-help cooperatives</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Customer Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 xl:p-12 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-md">
              
              {mfaStep !== 'none' ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-palm shrink-0" />
                    <span className="font-sans text-xs font-bold uppercase tracking-widest text-accent">
                      {mfaStep === 'setup' ? 'Admin 2FA Setup' : 'Admin Two-Factor Authentication'}
                    </span>
                  </div>

                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-content">
                    {mfaStep === 'setup'
                      ? 'Configure Authenticator'
                      : isUsingRecoveryCode
                      ? 'Enter Recovery Code'
                      : 'Two-Factor Challenge'}
                  </h1>

                  <p className="mt-1 text-xs sm:text-sm text-content-muted leading-relaxed">
                    {mfaStep === 'setup'
                      ? 'Enter the secret key into your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password) to generate verification codes.'
                      : isUsingRecoveryCode
                      ? 'Enter one of your 8-character recovery codes (e.g. ABCD-1234).'
                      : 'Enter the 6-digit code from your authenticator app to access the admin portal.'}
                  </p>

                  <AnimatePresence>
                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 flex items-center gap-2.5 rounded-xl border border-palm/40 bg-palm/10 p-3 text-sm font-semibold text-palm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-palm shrink-0" />
                        <span>{successMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {mfaStep === 'setup' && (
                    <div className="mt-4 space-y-3.5">
                      <div className="rounded-2xl border border-border/80 bg-ground p-3.5">
                        <span className="block text-[11px] font-semibold text-content-subtle mb-1">
                          Secret Key (Manual Entry):
                        </span>
                        <code className="block font-mono text-xs sm:text-sm font-bold text-palm tracking-wider select-all break-all">
                          {mfaSecret}
                        </code>
                      </div>

                      {mfaRecoveryCodes && mfaRecoveryCodes.length > 0 && (
                        <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
                          <span className="block text-xs font-bold text-accent mb-1">
                            Save One-Time Recovery Codes:
                          </span>
                          <p className="text-[11px] text-content-muted mb-2">
                            Save these 10 recovery codes safely. Each code can be used once if you lose access to your authenticator app.
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 font-mono text-xs font-semibold text-content select-all">
                            {mfaRecoveryCodes.map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setMfaInputCode(c)}
                                className="rounded-lg border border-border/40 bg-surface px-2 py-1 text-center hover:border-palm hover:text-palm transition-colors cursor-pointer"
                                title="Click to use this recovery code"
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {devTotp && !isUsingRecoveryCode && (
                    <div className="mt-4 rounded-2xl border border-palm/40 bg-palm/10 p-3 flex items-center justify-between">
                      <div>
                        <span className="block text-[11px] font-semibold text-content-subtle">
                          Active Authenticator Code:
                        </span>
                        <span className="font-mono text-base font-bold text-palm tracking-widest">
                          {devTotp}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMfaInputCode(devTotp)}
                        className="rounded-pill bg-palm px-2.5 py-1 text-[11px] font-bold text-white hover:bg-palm-shade transition-colors cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">
                        {mfaStep === 'setup'
                          ? 'Verification Code (from App) *'
                          : isUsingRecoveryCode
                          ? 'Recovery Code *'
                          : '6-Digit Authenticator Code *'}
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={mfaInputCode}
                        onChange={(e) => {
                          if (errorMessage) setErrorMessage('');
                          setMfaInputCode(e.target.value);
                        }}
                        placeholder={isUsingRecoveryCode ? 'e.g. A1B2-C3D4' : '123456'}
                        maxLength={isUsingRecoveryCode ? 20 : 8}
                        className="w-full rounded-pill border border-border bg-ground px-4 py-3 text-sm font-mono tracking-widest text-content outline-none focus:border-palm transition-colors shadow-xs"
                      />
                      {errorMessage && (
                        <p className="mt-1.5 px-3 text-xs font-medium text-accent">{errorMessage}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 rounded-pill bg-palm py-3.5 text-sm font-bold text-white hover:bg-palm-shade transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting
                        ? 'Verifying...'
                        : mfaStep === 'setup'
                        ? 'Confirm & Enable 2FA'
                        : 'Verify & Sign In'}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-2">
                      {mfaStep === 'verify' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUsingRecoveryCode(!isUsingRecoveryCode);
                            setMfaInputCode('');
                            setErrorMessage('');
                          }}
                          className="font-semibold text-accent hover:underline cursor-pointer"
                        >
                          {isUsingRecoveryCode ? 'Use Authenticator Code' : 'Use a Recovery Code'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMfaStep('none');
                          setMfaInputCode('');
                          setErrorMessage('');
                        }}
                        className="text-content-muted hover:text-content hover:underline cursor-pointer ml-auto"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  {/* Header Title & Switcher */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-bold uppercase tracking-widest text-accent">
                        {mode === 'signin' ? 'Customer Sign In' : 'New Customer Registration'}
                      </span>
                  <div className="flex gap-1 rounded-pill bg-ground p-1 border border-border/40 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('phone');
                        setErrorMessage('');
                        setOtpSent(false);
                      }}
                      className={`px-3 py-1 rounded-pill font-semibold transition-all ${
                        authMethod === 'phone' ? 'bg-surface text-content shadow-xs' : 'text-content-muted hover:text-content'
                      }`}
                    >
                      Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('email');
                        setErrorMessage('');
                        setOtpSent(false);
                      }}
                      className={`px-3 py-1 rounded-pill font-semibold transition-all ${
                        authMethod === 'email' ? 'bg-surface text-content shadow-xs' : 'text-content-muted hover:text-content'
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>

                <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-content">
                  {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h1>
                {redirectTarget === '/checkout' && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-accent/10 border border-accent/25 px-3 py-0.5 text-xs font-semibold text-accent">
                    <span>Sign in required to proceed to checkout</span>
                  </div>
                )}
                <p className="mt-1 text-xs sm:text-sm text-content-muted">
                  {authMethod === 'phone'
                    ? 'Enter your mobile number to receive a secure instant OTP.'
                    : 'Access your saved addresses and order tracking.'}
                </p>
              </div>

              {/* Success Notification Alert */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 flex items-center gap-2.5 rounded-xl border border-palm/40 bg-palm/10 p-3 text-sm font-semibold text-palm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-palm shrink-0" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PASSWORD RESET VIA EMAILED SINGLE-USE LINK */}
              {resetTokenFromUrl && (
                <form onSubmit={handleResetPasswordSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPasswordInput}
                      onChange={(e) => {
                        if (errorMessage) setErrorMessage('');
                        setNewPasswordInput(e.target.value);
                      }}
                      placeholder="Enter new password (min 6 chars)"
                      className="w-full rounded-pill border border-border bg-ground px-4 py-3 text-sm text-content outline-none focus:border-accent transition-colors shadow-xs"
                    />
                    {errorMessage && (
                      <p className="mt-1.5 px-3 text-xs font-medium text-accent">{errorMessage}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-pill bg-palm py-3.5 text-sm font-bold text-white hover:bg-palm-shade transition-all shadow-sm"
                  >
                    {isSubmitting ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              )}

              {/* 1. PHONE / OTP AUTH FLOW (Flipkart / Blinkit style) */}
              {!resetTokenFromUrl && authMethod === 'phone' && (
                <div className="mt-6">
                  {!otpSent ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      {mode === 'signup' && (
                        <div>
                          <label className="block text-xs font-semibold text-content mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => {
                              if (errorMessage) setErrorMessage('');
                              setFullName(e.target.value);
                            }}
                            placeholder="e.g. Rahul Naik"
                            className="w-full rounded-pill border border-border bg-ground px-4 py-3 text-sm text-content outline-none focus:border-accent transition-colors shadow-xs"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-content mb-1">Mobile Number</label>
                        <div
                          className={`flex rounded-pill border transition-all shadow-xs overflow-hidden ${
                            errorMessage
                              ? 'border-accent ring-2 ring-accent/20 bg-accent/[0.02]'
                              : 'border-border bg-ground focus-within:border-accent'
                          }`}
                        >
                          <span
                            className={`flex items-center px-4 border-r text-xs font-bold select-none ${
                              errorMessage
                                ? 'bg-accent/5 border-accent/30 text-accent'
                                : 'bg-surface-muted border-border/50 text-content'
                            }`}
                          >
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            value={phoneNumber}
                            onChange={(e) => {
                              if (errorMessage) setErrorMessage('');
                              setPhoneNumber(e.target.value.replace(/\D/g, ''));
                            }}
                            placeholder="Enter 10-digit number"
                            className="w-full bg-transparent px-4 py-3 text-sm font-medium text-content outline-none"
                            autoFocus
                          />
                        </div>
                        {errorMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1.5 px-3 text-xs font-medium text-accent flex flex-wrap items-center gap-1"
                          >
                            <span>{errorMessage}</span>
                            {mode === 'signin' && errorMessage.toLowerCase().includes('no account') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setErrorMessage('');
                                  setMode('signup');
                                  setOtpSent(false);
                                }}
                                className="font-bold underline hover:text-accent-hover cursor-pointer ml-1"
                              >
                                Create an account
                              </button>
                            )}
                            {mode === 'signup' && errorMessage.toLowerCase().includes('already exists') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setErrorMessage('');
                                  setMode('signin');
                                  setOtpSent(false);
                                }}
                                className="font-bold underline hover:text-accent-hover cursor-pointer ml-1"
                              >
                                Sign in
                              </button>
                            )}
                          </motion.div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || phoneNumber.length < 10}
                        className="mt-2 w-full flex items-center justify-center gap-2 rounded-pill bg-palm py-3.5 text-sm font-bold text-white hover:bg-palm-shade transition-all active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isSubmitting ? 'Sending OTP...' : 'Request OTP'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    /* OTP VERIFICATION STEP */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="rounded-xl border border-border/60 bg-surface-muted p-3.5 text-xs text-content flex items-center justify-between">
                        <span>OTP sent to <strong>+91 {phoneNumber}</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="font-bold text-accent hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      {devOtp ? (
                        <div className="rounded-xl border border-palm/40 bg-palm/10 p-3 text-xs text-content flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-content-subtle">Verification Code: </span>
                            <span className="font-mono text-sm font-bold tracking-widest text-palm">{devOtp}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOtpCode(devOtp.split(''))}
                            className="rounded-pill bg-palm px-2.5 py-1 text-[11px] font-bold text-white hover:bg-palm-shade transition-colors cursor-pointer"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      ) : mode === 'signin' ? (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                          <span>If this number is not registered yet, click </span>
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage('');
                              setMode('signup');
                              setOtpSent(false);
                            }}
                            className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer ml-1"
                          >
                            Create an account
                          </button>
                          <span> to sign up.</span>
                        </div>
                      ) : null}

                      <div>
                        <label className="block text-xs font-semibold text-content mb-1">Enter 6-Digit OTP</label>
                        <div className="flex gap-2.5 justify-center py-2">
                          {otpCode.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`otp-digit-${idx}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => {
                                if (errorMessage) setErrorMessage('');
                                const val = e.target.value.replace(/\D/g, '');
                                const copy = [...otpCode];
                                copy[idx] = val;
                                setOtpCode(copy);
                                if (val && idx < 5) {
                                  const nextEl = document.getElementById(`otp-digit-${idx + 1}`);
                                  if (nextEl) nextEl.focus();
                                }
                              }}
                              className={`h-12 w-11 rounded-xl border bg-ground text-center text-lg font-bold text-content outline-none transition-all shadow-xs ${
                                errorMessage
                                  ? 'border-accent ring-2 ring-accent/20 bg-accent/[0.02]'
                                  : 'border-border focus:border-accent'
                              }`}
                            />
                          ))}
                        </div>
                        {errorMessage && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center text-xs font-medium text-accent mt-1"
                          >
                            {errorMessage}
                          </motion.p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 rounded-pill bg-palm py-3.5 text-sm font-bold text-white hover:bg-palm-shade transition-all active:scale-[0.985] shadow-sm"
                      >
                        {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          className="text-xs font-semibold text-content-muted hover:text-accent"
                        >
                          Resend OTP
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* 2. EMAIL & PASSWORD AUTH FLOW */}
              {!resetTokenFromUrl && authMethod === 'email' && (
                <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => {
                          if (errorMessage) setErrorMessage('');
                          setFullName(e.target.value);
                        }}
                        placeholder="e.g. Maria D'Souza"
                        className="w-full rounded-pill border border-border bg-ground px-4 py-3 text-sm text-content outline-none focus:border-accent transition-colors shadow-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          if (errorMessage) setErrorMessage('');
                          setEmail(e.target.value);
                        }}
                        placeholder="name@example.com"
                        className={`w-full rounded-pill border bg-ground pl-11 pr-4 py-3 text-sm text-content outline-none transition-colors shadow-xs ${
                          errorMessage && errorMessage.toLowerCase().includes('email')
                            ? 'border-accent ring-2 ring-accent/20 bg-accent/[0.02]'
                            : 'border-border focus:border-accent'
                        }`}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-content">Password</label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] font-semibold text-accent hover:underline"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => {
                          if (errorMessage) setErrorMessage('');
                          setPassword(e.target.value);
                        }}
                        placeholder="••••••••"
                        className={`w-full rounded-pill border bg-ground pl-11 pr-11 py-3 text-sm text-content outline-none transition-colors shadow-xs ${
                          errorMessage && !errorMessage.toLowerCase().includes('email')
                            ? 'border-accent ring-2 ring-accent/20 bg-accent/[0.02]'
                            : 'border-border focus:border-accent'
                        }`}
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errorMessage && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 px-3 text-xs font-medium text-accent"
                      >
                        {errorMessage}
                      </motion.p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-pill bg-palm py-3.5 text-sm font-bold text-white hover:bg-palm-shade transition-all active:scale-[0.985] shadow-sm"
                  >
                    {isSubmitting ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Customer Account'}
                  </button>
                </form>
              )}

              {/* Mode Toggle Footer (Sign In <-> Sign Up) */}
              <div className="mt-6 text-center text-xs text-content-muted">
                {mode === 'signin' ? (
                  <p>
                    New to Global to Local?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMessage('');
                        setOtpSent(false);
                      }}
                      className="font-bold text-accent hover:underline ml-1 cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setErrorMessage('');
                        setOtpSent(false);
                      }}
                      className="font-bold text-accent hover:underline ml-1 cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>
              </>
            )}

              {/* Privacy & Terms Note */}
              <p className="mt-4 text-center text-[11px] text-content-subtle leading-relaxed">
                By continuing, you agree to our{' '}
                <Link to="/terms-and-conditions" className="underline hover:text-content">Terms & Conditions</Link> and{' '}
                <Link to="/privacy-policy" className="underline hover:text-content">Privacy Policy</Link>.
              </p>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
