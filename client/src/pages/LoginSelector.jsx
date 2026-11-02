import { Link } from 'react-router-dom';
import { FiUser, FiActivity, FiShield, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const LoginSelector = () => {
  const roles = [
    {
      title: 'Patient',
      description: 'Book appointments, track live queue radar & manage digital health profile.',
      link: '/login/patient',
      icon: <FiUser className="w-8 h-8" />,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Self-Service Care',
      features: ['Live Token Tracker', 'Digital Health ID', 'Online Booking']
    },
    {
      title: 'Doctor',
      description: 'Call next tokens, update consultation status & review daily patient lists.',
      link: '/login/doctor',
      icon: <FiActivity className="w-8 h-8" />,
      color: 'from-purple-500 to-indigo-600',
      badge: 'Chamber Console',
      features: ['1-Click Next Call', 'Queue Management', 'Consultation Logs']
    },
    {
      title: 'Administrator',
      description: 'Control clinic operations, manage doctors, verify queue load & analytics.',
      link: '/login/admin',
      icon: <FiShield className="w-8 h-8" />,
      color: 'from-rose-500 to-orange-600',
      badge: 'Full Clinic Control',
      features: ['Doctor Onboarding', 'Queue TV Display', 'Live Analytics']
    }
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 mb-3">
            <FiCheckCircle className="w-3.5 h-3.5" />
            Secure Authentication Portal
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">MediQueue</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base max-w-lg mx-auto mt-3">
            Choose your portal role to access customized real-time queue dashboards and records.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Link
              key={role.title}
              to={role.link}
              className="group relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Icon & Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {role.icon}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    {role.badge}
                  </span>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {role.title} Portal
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {role.description}
                </p>

                {/* Feature checklist */}
                <div className="space-y-2 mb-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {role.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <FiCheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Continue as {role.title}</span>
                <FiArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer / Switch link */}
        <div className="text-center mt-12 bg-white dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 max-w-xl mx-auto shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            New to MediQueue? Create an account in under 30 seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register/patient"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Patient Sign Up
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to="/register/doctor"
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Doctor Registration
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-400">
              Demo Admin: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">admin@clinic.com / admin123</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSelector;