import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import {
  FiActivity,
  FiMail,
  FiLock,
  FiShield,
  FiArrowRight,
  FiAlertCircle,
  FiKey
} from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
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

  const handleRoleFill = (role) => {
    setError('');
    if (role === 'admin') {
      setFormData({ email: 'admin@clinic.com', password: 'admin123' });
    } else if (role === 'doctor') {
      setFormData({ email: 'dr.akash@clinic.com', password: 'doctor123' });
    } else {
      setFormData({ email: 'patient@clinic.com', password: 'patient123' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in both email and password');
      setLoading(false);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address format (e.g. name@example.com)');
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
      } else if (res?.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/doctors');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid email or password');
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
      } else if (user.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/doctors');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid 2FA verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl p-8 md:p-10 border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <FiActivity className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
              Sign in to your MediQueue account
            </p>
          </div>

          {/* 1-Click Demo Login Selector Banner */}
          <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs">
            <div className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <FiKey className="text-blue-600" /> Quick Demo Fill:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleFill('patient')}
                className="py-1 px-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900 hover:bg-blue-100 text-[11px] transition text-center"
              >
                👤 Patient
              </button>
              <button
                type="button"
                onClick={() => handleRoleFill('doctor')}
                className="py-1 px-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-900 hover:bg-purple-100 text-[11px] transition text-center"
              >
                🩺 Doctor
              </button>
              <button
                type="button"
                onClick={() => handleRoleFill('admin')}
                className="py-1 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900 hover:bg-rose-100 text-[11px] transition text-center"
              >
                🛡️ Admin
              </button>
            </div>
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
                  <span>Passcode: <strong>{mockOTP}</strong></span>
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
                {loading ? 'Verifying...' : 'Verify & Continue'}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  <FiMail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <FiLock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
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
                className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
