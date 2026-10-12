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
  const findUserByPhone = useAuthStore((state) => state.findUserByPhone);
  const findUserByEmail = useAuthStore((state) => state.findUserByEmail);
  const registerUser = useAuthStore((state) => state.registerUser);
  const loginWithPhone = useAuthStore((state) => state.loginWithPhone);
  const loginWithEmail = useAuthStore((state) => state.loginWithEmail);

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

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Destination after login
  const redirectTarget = new URLSearchParams(location.search).get('redirect') || '/account';

  // Request OTP with strict account check
  const handleRequestOtp = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanDigits = (phoneNumber || '').replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    if (mode === 'signin') {
      const existingUser = findUserByPhone(cleanDigits);
      if (!existingUser) {
        setErrorMessage('No account found with this mobile number.');
        return;
      }
    } else {
      // signup mode
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name to create an account.');
        return;
      }
      const existingUser = findUserByPhone(cleanDigits);
      if (existingUser) {
        setErrorMessage('An account already exists with this mobile number.');
        return;
      }
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOtpSent(true);
      setOtpCode(['1', '2', '3', '4']); // Pre-fill demo OTP
    }, 500);
  };

  // Verify OTP & Complete Auth
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const entered = otpCode.join('');
    if (entered.length < 4) {
      setErrorMessage('Please enter the 4-digit OTP');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (mode === 'signup') {
        const result = registerUser({
          name: fullName.trim(),
          phone: phoneNumber.replace(/\D/g, ''),
          email: email.trim(),
        });
        if (result.error) {
          setIsSubmitting(false);
          setErrorMessage(result.error);
          return;
        }
        setIsSubmitting(false);
        setSuccessMessage(`Account created successfully! Welcome, ${result.user.name}.`);
        setTimeout(() => navigate(redirectTarget), 700);
      } else {
        const result = loginWithPhone(phoneNumber.replace(/\D/g, ''));
        if (result.error) {
          setIsSubmitting(false);
          setErrorMessage(result.error);
          return;
        }
        setIsSubmitting(false);
        setSuccessMessage(`Welcome back, ${result.user.name}! Signed in successfully.`);
        setTimeout(() => navigate(redirectTarget), 700);
      }
    }, 500);
  };

  // Handle Email & Password Submit
  const handleEmailAuth = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setIsSubmitting(false);
          setErrorMessage('Please enter your full name to create an account.');
          return;
        }
        const result = registerUser({
          name: fullName.trim(),
          email: email.trim(),
          phone: phoneNumber ? phoneNumber.replace(/\D/g, '') : '',
        });
        if (result.error) {
          setIsSubmitting(false);
          setErrorMessage(result.error);
          return;
        }
        setIsSubmitting(false);
        setSuccessMessage(`Account created! Welcome, ${result.user.name}.`);
        setTimeout(() => navigate(redirectTarget), 700);
      } else {
        const result = loginWithEmail(email.trim(), password);
        if (result.error) {
          setIsSubmitting(false);
          setErrorMessage(result.error);
          return;
        }
        setIsSubmitting(false);
        setSuccessMessage(`Welcome back, ${result.user.name}! Signed in successfully.`);
        setTimeout(() => navigate(redirectTarget), 700);
      }
    }, 500);
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
          <div className="relative isolate hidden lg:flex lg:col-span-5 flex-col justify-between overflow-hidden bg-palm p-10 xl:p-12 text-content-ondark">
            {/* Background image & gradient overlay */}
            <img
              src="/images/site/fontainhas-dusk.jpg"
              alt="Fontainhas Panaji street"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 brightness-75 saturate-125"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-palm via-palm/80 to-palm/40" />
            <ShellDrift tone="dark" />

            {/* Top Brand Tagline */}
            <div className="relative z-10">
              <h2 className="font-display text-3xl xl:text-4xl font-bold leading-tight text-content-ondark">
                Taste the authentic soul of Goa.
              </h2>
              <p className="mt-3 text-sm text-content-ondark-muted leading-relaxed">
                Sign in to manage your artisanal Goan pantry, track live couriers across India, and save your favourite Fontainhas delicacies.
              </p>
            </div>

            {/* Highlights List */}
            <div className="relative z-10 space-y-3 pt-8 border-t border-white/15">
              <div className="flex items-center gap-3 text-xs text-content-ondark/90">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-white/15 shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 text-accent" />
                </div>
                <span>Thirteen shelves of curated Goan treasures</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-content-ondark/90">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-white/15 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                </div>
                <span>80% crafted by women self-help cooperatives</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Customer Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 xl:p-12 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-md">
              
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

              {/* 1. PHONE / OTP AUTH FLOW (Flipkart / Blinkit style) */}
              {authMethod === 'phone' && (
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

                      <div>
                        <label className="block text-xs font-semibold text-content mb-1">Enter 4-Digit OTP</label>
                        <div className="flex gap-3 justify-center py-2">
                          {otpCode.map((digit, idx) => (
                            <input
                              key={idx}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => {
                                if (errorMessage) setErrorMessage('');
                                const val = e.target.value.replace(/\D/g, '');
                                const copy = [...otpCode];
                                copy[idx] = val;
                                setOtpCode(copy);
                              }}
                              className={`h-12 w-12 rounded-xl border bg-ground text-center text-lg font-bold text-content outline-none transition-all shadow-xs ${
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
                        <p className="text-center text-[11px] text-content-muted mt-1.5">
                          Demo OTP: <strong>1234</strong>
                        </p>
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
                          onClick={() => alert('New OTP sent: 1234')}
                          className="text-xs font-semibold text-content-muted hover:text-accent"
                        >
                          Resend OTP in 25s
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* 2. EMAIL & PASSWORD AUTH FLOW */}
              {authMethod === 'email' && (
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
                          onClick={() => alert('Password reset instructions sent to your email.')}
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
