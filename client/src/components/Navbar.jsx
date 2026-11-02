import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getAllNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  clearAllNotifications
} from '../services/notificationService';
import {
  FiHome,
  FiSun,
  FiMoon,
  FiBell,
  FiUser,
  FiCalendar,
  FiActivity,
  FiUsers,
  FiShield,
  FiBarChart2,
  FiLogOut,
  FiLogIn,
  FiUserPlus,
  FiCompass,
  FiMenu,
  FiX,
  FiCheck,
  FiGlobe,
  FiFolder,
  FiCamera,
  FiType
} from 'react-icons/fi';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const {
    language,
    toggleLanguage,
    t,
    textSize,
    setTextSize,
    decreaseTextSize,
    increaseTextSize,
    resetTextSize
  } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const refreshNotifications = () => {
    setNotifications(getAllNotifications());
    setUnreadCount(getUnreadNotificationsCount());
  };

  useEffect(() => {
    refreshNotifications();

    const handleNewNotification = () => {
      refreshNotifications();
    };

    window.addEventListener('notificationReceived', handleNewNotification);
    return () => {
      window.removeEventListener('notificationReceived', handleNewNotification);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotificationClick = (id) => {
    markNotificationAsRead(id);
    refreshNotifications();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    refreshNotifications();
  };

  const cycleTextSize = () => {
    if (textSize === 'normal') setTextSize('large');
    else if (textSize === 'large') setTextSize('xlarge');
    else setTextSize('normal');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-40 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo / Home Brand */}
          <Link to="/" className="flex items-center gap-3 group" title="MediQueue Home">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 group-hover:shadow-blue-500/40 transition duration-200">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white drop-shadow">
                <rect x="12" y="3" width="8" height="26" rx="4" fill="currentColor" fillOpacity="0.28" />
                <rect x="3" y="12" width="26" height="8" rx="4" fill="currentColor" fillOpacity="0.28" />
                <path
                  d="M4 16h6l2.5-6 4.5 12 3-8 2 2H28"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="28" cy="16" r="2.2" fill="#34D399" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">MediQueue</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                {t('smartClinicSystems')}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1.5">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                isActive('/')
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FiHome className="text-sm" />
              <span>{t('home')}</span>
            </Link>

            <Link
              to="/doctors"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                isActive('/doctors')
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FiUsers className="text-sm" />
              <span>{t('findDoctors')}</span>
            </Link>

            <Link
              to="/track-token"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                isActive('/track-token')
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FiCompass className="text-sm animate-spin-slow" />
              <span>{t('trackToken')}</span>
            </Link>

            <Link
              to="/reception-checkin"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                isActive('/reception-checkin')
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FiCamera className="text-sm" />
              <span>{t('checkIn')}</span>
            </Link>

            {user?.role === 'patient' && (
              <>
                <Link
                  to="/health-records"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive('/health-records')
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiFolder className="text-sm" />
                  <span>{t('records')}</span>
                </Link>

                <Link
                  to="/my-appointments"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive('/my-appointments')
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiCalendar className="text-sm" />
                  <span>{t('myAppointments')}</span>
                </Link>

                <Link
                  to="/profile"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive('/profile')
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiUser className="text-sm" />
                  <span>{t('digitalProfile')}</span>
                </Link>
              </>
            )}

            {user?.role === 'doctor' && (
              <>
                <Link
                  to="/health-records"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive('/health-records')
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiFolder className="text-sm" />
                  <span>{t('records')}</span>
                </Link>

                <Link
                  to="/doctor-dashboard"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive('/doctor-dashboard')
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiActivity className="text-sm" />
                  <span>{t('doctorDashboard')}</span>
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive('/admin')
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiShield className="text-sm" />
                  <span>{t('adminPanel')}</span>
                </Link>

                <Link
                  to="/analytics"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive('/analytics')
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiBarChart2 className="text-sm" />
                  <span>{t('analytics')}</span>
                </Link>
              </>
            )}
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2">
            {/* Multilingual Switcher (English ↔ हिन्दी) */}
            <button
              onClick={toggleLanguage}
              className={`px-3 py-2 rounded-2xl transition shadow-sm text-xs font-black flex items-center gap-1.5 border ${
                language === 'hi'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400/40'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
              }`}
              title={language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
              aria-label="Switch Language"
            >
              <FiGlobe className="text-blue-600 dark:text-blue-400 text-sm" />
              <span>{language === 'hi' ? '🇮🇳 हिन्दी' : '🌐 EN'}</span>
            </button>

            {/* Accessibility Font Size Controller (-A, --a, A, A+, A++) */}
            <div
              className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm"
              title={`${t('adjustTextSize') || 'Adjust text size'}: --a, -A, A, A+, A++`}
            >
              {/* Decrease font size button: -A / --a */}
              <button
                type="button"
                onClick={decreaseTextSize}
                disabled={textSize === 'xsmall'}
                className={`px-2 py-1 rounded-xl text-xs font-black transition flex items-center ${
                  textSize === 'xsmall'
                    ? 'bg-amber-500 text-white shadow-xs font-black'
                    : textSize === 'small'
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                } disabled:opacity-30`}
                title={
                  textSize === 'small'
                    ? 'Make text extra small (--a / 80%)'
                    : textSize === 'xsmall'
                    ? 'Minimum text size reached (--a)'
                    : 'Decrease text size (-A / 90%)'
                }
                aria-label="Decrease text size"
              >
                <span>{textSize === 'xsmall' ? '--a' : '-A'}</span>
              </button>

              {/* Reset to Normal: A */}
              <button
                type="button"
                onClick={resetTextSize}
                className={`px-2 py-1 rounded-xl text-xs font-black transition ${
                  textSize === 'normal'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Reset text size to Normal (A / 100%)"
                aria-label="Reset text size to normal"
              >
                <span>A</span>
              </button>

              {/* Increase font size button: A+ / A++ */}
              <button
                type="button"
                onClick={increaseTextSize}
                disabled={textSize === 'xlarge'}
                className={`px-2 py-1 rounded-xl text-xs font-black transition flex items-center ${
                  textSize === 'xlarge'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : textSize === 'large'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                } disabled:opacity-30`}
                title={
                  textSize === 'large'
                    ? 'Make text extra large (A++ / 130%)'
                    : textSize === 'xlarge'
                    ? 'Maximum text size reached (A++)'
                    : 'Increase text size (A+ / 115%)'
                }
                aria-label="Increase text size"
              >
                <span>{textSize === 'xlarge' ? 'A++' : 'A+'}</span>
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm text-base"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {darkMode ? <FiSun className="text-amber-400" /> : <FiMoon className="text-slate-700" />}
            </button>

            {user ? (
              <>
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(prev => !prev);
                      refreshNotifications();
                    }}
                    className="relative p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm text-base"
                    title="Notifications"
                    aria-label="View notifications"
                  >
                    <FiBell />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Container */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="font-extrabold text-sm flex items-center gap-2">
                          <FiBell className="text-blue-600" />
                          <span>Clinic Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-[11px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAll}
                            className="text-xs text-red-500 hover:text-red-700 font-bold transition"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2.5">
                        {notifications.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            <div className="text-2xl mb-1">📭</div>
                            No recent notifications
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif.id)}
                              className={`p-3.5 rounded-2xl border transition cursor-pointer text-xs ${
                                notif.read
                                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                                  : 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-slate-900 dark:text-slate-100 font-medium'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-xs">{notif.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="whitespace-pre-line leading-relaxed text-[11px] opacity-90">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Pill */}
                <div className="hidden sm:flex items-center gap-2 pl-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-bold transition text-base ml-1"
                  title={t('logout')}
                  aria-label="Logout"
                >
                  <FiLogOut />
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <FiLogIn /> {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                >
                  <FiUserPlus /> {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-lg ml-1"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-6 space-y-3 animate-in fade-in duration-200">
          <Link
            to="/"
            className={`flex items-center gap-3 p-3 rounded-2xl font-bold text-xs transition ${
              isActive('/')
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
            }`}
          >
            <FiHome className="text-base text-blue-600 dark:text-blue-400" />
            <span>{t('home')}</span>
          </Link>

          <Link
            to="/doctors"
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-bold text-xs"
          >
            <FiUsers /> {t('findDoctors')}
          </Link>
          <Link
            to="/track-token"
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-bold text-xs"
          >
            <FiCompass /> {t('trackToken')}
          </Link>
          <Link
            to="/reception-checkin"
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-bold text-xs"
          >
            <FiCamera /> {t('checkIn')}
          </Link>

          {user && (
            <Link
              to="/health-records"
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-bold text-xs"
            >
              <FiFolder /> {t('records')}
            </Link>
          )}

          {user?.role === 'patient' && (
            <>
              <Link
                to="/my-appointments"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-bold text-xs"
              >
                <FiCalendar /> {t('myAppointments')}
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-bold text-xs"
              >
                <FiUser /> {t('digitalProfile')}
              </Link>
            </>
          )}

          {user?.role === 'doctor' && (
            <>
              <Link
                to="/doctor-dashboard"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-bold text-xs"
              >
                <FiActivity /> {t('doctorDashboard')}
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-bold text-xs"
              >
                <FiShield /> {t('adminPanel')}
              </Link>
              <Link
                to="/analytics"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-bold text-xs"
              >
                <FiBarChart2 /> {t('analytics')}
              </Link>
            </>
          )}

          {!user && (
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                className="p-3 text-center rounded-2xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="p-3 text-center rounded-2xl bg-blue-600 text-white font-bold text-xs"
              >
                {t('register')}
              </Link>
            </div>
          )}

          {/* Mobile Language Switcher Row */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t('language')}</span>
            <button
              onClick={toggleLanguage}
              className={`px-3 py-1.5 rounded-xl transition text-xs font-black flex items-center gap-1.5 border ${
                language === 'hi'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400/30'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <FiGlobe className="text-blue-500" />
              <span>{language === 'hi' ? '🇮🇳 हिन्दी (Hindi)' : '🌐 English'}</span>
            </button>
          </div>

          {/* Mobile Text Size Adjuster Row (--a, -A, A, A+, A++) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t('textSize')}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTextSize('xsmall')}
                className={`px-2 py-1 rounded-xl text-xs font-black border transition ${
                  textSize === 'xsmall'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Extra Small (--a / 80%)"
              >
                --a
              </button>
              <button
                type="button"
                onClick={() => setTextSize('small')}
                className={`px-2 py-1 rounded-xl text-xs font-black border transition ${
                  textSize === 'small'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Small (-A / 90%)"
              >
                -A
              </button>
              <button
                type="button"
                onClick={() => setTextSize('normal')}
                className={`px-2.5 py-1 rounded-xl text-xs font-black border transition ${
                  textSize === 'normal'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Normal (A / 100%)"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setTextSize('large')}
                className={`px-2 py-1 rounded-xl text-xs font-black border transition ${
                  textSize === 'large'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Large (A+ / 115%)"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setTextSize('xlarge')}
                className={`px-2 py-1 rounded-xl text-xs font-black border transition ${
                  textSize === 'xlarge'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Extra Large (A++ / 130%)"
              >
                A++
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
