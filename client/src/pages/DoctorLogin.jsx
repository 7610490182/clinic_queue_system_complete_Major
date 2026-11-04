import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import {
  FiActivity,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiArrowRight,
  FiShield,
  FiAlertCircle,
  FiClock,
  FiUsers,
  FiKey
} from 'react-icons/fi';

const DoctorLogin = () => {
  const [formData, setFormData] = useState({
    email: 'dr.akash@clinic.com',
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
      setError('Please provide both doctor email and password');
      setLoading(false);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address format');
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
      if (res?.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        setError('Please sign in with a registered doctor credentials.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid credentials or doctor account not found');
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
      if (user.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        setError('Verified, but this account is not registered as doctor.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired 2FA code.');
    } finally {
      setLoading(false);
    }
  };

  const doctorBenefits = [
    { text: 'Manage Daily Queue & Call Next Patient with 1 Click', icon: <FiUsers className="w-5 h-5 text-purple-400" /> },
    { text: 'Direct Patient Consultation History & Notes', icon: <FiActivity className="w-5 h-5 text-pink-400" /> },
    { text: 'Automated Socket Broadcast to Waiting Room TV', icon: <FiClock className="w-5 h-5 text-indigo-400" /> },
    { text: 'Daily Consultation & Earnings Insights', icon: <FiCheckCircle className="w-5 h-5 text-emerald-400" /> }
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-10 items-stretch">
          {/* Left Column: Visual Benefits (Desktop) */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-6">
                <FiShield className="w-3.5 h-3.5" />
                <span>Doctor Consultation Console</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3">
                Streamline Your Clinic Chamber.
              </h2>
              <p className="text-purple-100 text-sm leading-relaxed mb-8">
                Reduce chamber delays, manage walk-ins versus appointments effortlessly, and broadcast live token calls to waiting areas in real-time.
              </p>

              <div className="space-y-4">
                {doctorBenefits.map((item, idx) => (
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

            <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-purple-200">
              <span>Smart Clinical Triage</span>
              <span>WebRTC Telemedicine 2027</span>
            </div>
          </div>

          {/* Right Column: Doctor Login Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl p-8 md:p-10 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                {requires2FA ? <FiKey className="w-6 h-6" /> : <FiActivity className="w-6 h-6" />}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {requires2FA ? 'Clinical 2FA Verification' : 'Doctor Portal Login'}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {requires2FA
                  ? `Enter the 6-digit clinical security passcode sent to ${formData.email}`
                  : 'Access your clinic appointments, patient queue, and consultation notes.'}
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
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 rounded-2xl text-xs text-purple-800 dark:text-purple-300 flex items-center justify-between">
                    <span>Clinical Passcode: <strong>{mockOTP}</strong></span>
                    <button
                      type="button"
                      onClick={() => setTwoFactorCode(mockOTP)}
                      className="text-purple-600 underline font-bold"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <FiShield className="w-3.5 h-3.5 text-purple-600" /> 6-Digit 2FA Security Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Verifying 2FA...' : 'Verify & Enter Chamber'}
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
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-2xl text-xs">
                  <div className="font-bold text-purple-900 dark:text-purple-200 mb-1.5 flex items-center gap-1.5">
                    <FiKey className="text-purple-600" /> Quick Demo Doctor Logins:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ email: 'dr.akash@clinic.com', password: 'doctor123' })}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-semibold rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition text-[11px]"
                    >
                      Dr. Akash Modi (Cardio)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ email: 'dr.vipin@clinic.com', password: 'doctor123' })}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-semibold rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition text-[11px]"
                    >
                      Dr. Vipin Garg (Ortho)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <FiMail className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Doctor Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="doctor@clinic.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <FiLock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Password
                    </label>
                    <Link
                      to="/forgot-password?role=doctor"
                      className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Open Doctor Dashboard</span>
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Are you a new doctor?{' '}
                <Link to="/register/doctor" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
                  Register Chamber
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

export default DoctorLogin;
