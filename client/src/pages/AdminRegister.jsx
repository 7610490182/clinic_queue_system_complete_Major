import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import {
  FiShield,
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiKey,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    adminKey: 'ADMIN2024',
    role: 'admin'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhoneChange = (e) => {
    const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({
      ...prev,
      phone: numericOnly
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate admin key
    if (formData.adminKey.trim() !== 'ADMIN2024') {
      setError('Invalid admin key. Enter ADMIN2024 to verify administrative privileges.');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      setError('Please provide a valid administrator email address');
      return;
    }

    if (!formData.phone || formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register({
        ...formData,
        email: cleanEmail
      });
      navigate('/login/admin');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl p-8 md:p-10 border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/20">
              <FiShield className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Admin Registration
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
              Restricted portal registration for authorized clinic supervisors.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <FiUser className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Administrator Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Clinic Manager"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  <FiMail className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  Admin Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin.staff@clinic.com"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <FiPhone className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Phone Number
                  </label>
                  <span className="text-[11px] text-slate-400">{formData.phone.length}/10</span>
                </div>
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="9800000000"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <FiKey className="w-3.5 h-3.5 text-orange-500" />
                Administrative Passkey (Enter: <span className="font-mono text-orange-600 dark:text-orange-400">ADMIN2024</span>)
              </label>
              <input
                type="text"
                name="adminKey"
                value={formData.adminKey}
                onChange={handleChange}
                placeholder="ADMIN2024"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <FiLock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Create Password
              </label>
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
              className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Passkey...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Register Administrator Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            Already verified?{' '}
            <Link to="/login/admin" className="font-bold text-rose-600 dark:text-rose-400 hover:underline">
              Admin Portal Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;