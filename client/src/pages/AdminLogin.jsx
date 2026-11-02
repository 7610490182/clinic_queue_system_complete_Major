import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import {
  FiShield,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiArrowRight,
  FiAlertCircle,
  FiTv,
  FiBarChart2,
  FiUsers,
  FiKey
} from 'react-icons/fi';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: 'admin@clinic.com',
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
      setError('Please provide both administrator email and password');
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
      if (res?.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Please sign in with administrator credentials.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid administrator credentials');
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
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Verified, but this account is not registered as admin.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired 2FA code.');
    } finally {
      setLoading(false);
    }
  };

  const adminCapabilities = [
    { text: 'Manage Doctor Profiles, Schedules & Chambers', icon: <FiUsers className="w-5 h-5 text-orange-400" /> },
    { text: 'Waiting Room TV Queue Display Mode', icon: <FiTv className="w-5 h-5 text-amber-400" /> },
    { text: 'Comprehensive Patient Throughput & Analytics', icon: <FiBarChart2 className="w-5 h-5 text-rose-400" /> },
    { text: 'Full Operational Override & Token Rescheduling', icon: <FiShield className="w-5 h-5 text-yellow-400" /> }
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-10 items-stretch">
          {/* Left Column: Visual Highlights (Desktop) */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-rose-600 via-orange-600 to-slate-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-6">
                <FiKey className="w-3.5 h-3.5" />
                <span>Clinic Headquarters</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3">
                Master Administration Suite.
              </h2>
              <p className="text-orange-100 text-sm leading-relaxed mb-8">
                Oversee every chamber, audit wait-time compliance, configure clinic fee structures, and display live tokens on lobby screens.
              </p>

              <div className="space-y-4">
                {adminCapabilities.map((item, idx) => (
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

            <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-orange-200">
              <span>Predictive Operations 2027</span>
              <span>Enterprise DPDP Audit Logs</span>
            </div>
          </div>

          {/* Right Column: Admin Login Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl p-8 md:p-10 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                {requires2FA ? <FiKey className="w-6 h-6" /> : <FiShield className="w-6 h-6" />}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {requires2FA ? 'Admin 2FA Verification' : 'Admin Control Login'}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {requires2FA
                  ? `Enter the 6-digit administrative 2FA passcode sent to ${formData.email}`
                  : 'Restricted access: Clinic directors, operations managers, and queue supervisors.'}
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
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
                    <span>Admin Security Code: <strong>{mockOTP}</strong></span>
                    <button
                      type="button"
                      onClick={() => setTwoFactorCode(mockOTP)}
                      className="text-rose-600 underline font-bold"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <FiShield className="w-3.5 h-3.5 text-rose-600" /> 6-Digit 2FA Security Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Verifying 2FA...' : 'Authorize Admin Session'}
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
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <FiMail className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Administrator Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@clinic.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <FiLock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      Master Password
                    </label>
                    <Link
                      to="/forgot-password?role=admin"
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Open Admin Console</span>
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Clinic Administrator Portal
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

export default AdminLogin;
