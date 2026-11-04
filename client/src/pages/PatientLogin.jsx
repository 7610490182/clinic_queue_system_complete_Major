import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import {
  FiUser,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiArrowRight,
  FiShield,
  FiAlertCircle,
  FiClock,
  FiCreditCard,
  FiActivity,
  FiKey
} from 'react-icons/fi';

const PatientLogin = () => {
  const [formData, setFormData] = useState({
    email: 'patient@clinic.com',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [mockOTP, setMockOTP] = useState('');

  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please provide both email and password');
      setLoading(false);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address format (e.g. patient@example.com)');
      setLoading(false);
      return;
    }

    try {
      const res = await login(formData.email.trim().toLowerCase(), formData.password);
      if (res?.requires2FA) {
        setRequires2FA(true);
        setMockOTP(res.mockOTP || '');
        return;
      }
      if (res?.role === 'patient') {
        navigate('/doctors');
      } else {
        setError('Please login with a patient account or use the appropriate role portal.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid credentials or patient account not found');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      setLoading(false);
      return;
    }

    try {
      const user = await verify2FA(formData.email.trim().toLowerCase(), twoFactorCode.trim());
      if (user.role === 'patient') {
        navigate('/doctors');
      } else {
        setError('Verified, but this account is not registered as patient.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired 2FA code.');
    } finally {
      setLoading(false);
    }
  };

  const patientBenefits = [
    { text: 'Live Token Radar & Queue Tracking', icon: <FiActivity className="w-5 h-5 text-blue-400" /> },
    { text: 'Book Verified Doctors with AI slot ranking', icon: <FiClock className="w-5 h-5 text-indigo-400" /> },
    { text: 'Digital Patient Profile & QR Health Pass', icon: <FiUser className="w-5 h-5 text-cyan-400" /> },
    { text: 'Instant Consultation Payments (Razorpay & Mock)', icon: <FiCreditCard className="w-5 h-5 text-emerald-400" /> },
    { text: 'Real-time SMS & In-App Notification Alerts', icon: <FiCheckCircle className="w-5 h-5 text-yellow-400" /> }
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-10 items-stretch">
          {/* Left Column: Visual Benefits (Desktop) */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-6">
                <FiShield className="w-3.5 h-3.5" />
                <span>Patient Self-Service Portal</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3">
                Experience Smarter Healthcare Visits.
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-8">
                Skip crowded waiting rooms. Track your exact queue position from home and arrive just when your doctor is ready.
              </p>

              <div className="space-y-4">
                {patientBenefits.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10"
                  >
                    <div className="p-2 bg-white/10 rounded-xl shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium text-slate-100">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-blue-200">
              <span>Zero Waiting Anxiety</span>
              <span>24/7 AI Health Chatbot</span>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl p-8 md:p-10 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                {requires2FA ? <FiKey className="w-6 h-6" /> : <FiUser className="w-6 h-6" />}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {requires2FA ? 'Two-Factor Verification' : 'Patient Login'}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {requires2FA
                  ? `Enter the 6-digit security code sent to ${formData.email}`
                  : 'Enter your registered email and password to access your appointments.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <FiAlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {requires2FA ? (
              <form onSubmit={handle2FASubmit} className="space-y-5">
                {mockOTP && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-2xl text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                    <span>Clinical Passcode: <strong>{mockOTP}</strong></span>
                    <button
                      type="button"
                      onClick={() => setTwoFactorCode(mockOTP)}
                      className="text-blue-600 underline font-bold"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <FiShield className="w-3.5 h-3.5 text-blue-600" /> 6-Digit 2FA Security Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Verifying 2FA...' : 'Confirm & Access Records'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setRequires2FA(false)}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    ← Back to standard login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1-Click Demo Fill */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl text-xs">
                  <div className="font-bold text-blue-900 dark:text-blue-200 mb-1.5 flex items-center gap-1.5">
                    <FiKey className="text-blue-600" /> Quick Demo Patient Logins:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ email: 'patient@clinic.com', password: 'patient123' })}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-semibold rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition text-[11px]"
                    >
                      Demo Patient (patient@clinic.com)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ email: 'kushwahamit7610@gmail.com', password: 'patient123' })}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-semibold rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition text-[11px]"
                    >
                      Amit Kushwah (kushwahamit7610@gmail.com)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <FiMail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <FiLock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Password
                    </label>
                    <Link
                      to="/forgot-password?role=patient"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Don&apos;t have an account?{' '}
                <Link to="/register/patient" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Register here
                </Link>
              </span>
              <Link to="/login" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                Switch role
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;
