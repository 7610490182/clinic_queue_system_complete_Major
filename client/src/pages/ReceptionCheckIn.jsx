import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiCheckCircle,
  FiCamera,
  FiSearch,
  FiUser,
  FiClock,
  FiMapPin,
  FiAlertCircle,
  FiActivity
} from 'react-icons/fi';
import { FaUserMd, FaHospital } from 'react-icons/fa';

const ReceptionCheckIn = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  const handleCheckIn = async (e) => {
    e?.preventDefault();
    if (!code.trim()) {
      setError('Please enter a valid 6-character check-in code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const res = await axios.post('/api/queue/qr-checkin', {
        checkInCode: code.trim().toUpperCase()
      });

      setResult(res.data);
      setCode('');

      if (res.data.appointment) {
        setRecentCheckIns((prev) => [res.data.appointment, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
          <FiCamera /> Contactless Arrival Kiosk
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Reception & Kiosk Check-In
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Scan the patient QR code pass or enter the 6-character Check-In PIN to update live queue status.
        </p>
      </div>

      {/* Main Check-In Input Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
        <form onSubmit={handleCheckIn} className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Enter 6-Digit Check-In Code or Token PIN:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-4 text-slate-400 text-lg" />
              <input
                type="text"
                placeholder="e.g. 7X9K2P or CK-123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold tracking-widest rounded-2xl focus:outline-none focus:border-blue-500 uppercase placeholder:normal-case placeholder:font-sans placeholder:text-sm placeholder:tracking-normal"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiCheckCircle className="text-lg" />
              <span>{loading ? 'Verifying...' : 'Check In Patient'}</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <FiAlertCircle className="text-base flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Check-In Confirmation Banner */}
        {result && (
          <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400/50 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-md">
                <FiCheckCircle />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                  {result.message}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Patient marked present. Queue status updated in real time.
                </p>
              </div>
            </div>

            {result.appointment && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Token #</span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                    #{result.appointment.tokenNumber}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {result.appointment.patient?.name || 'Walk-in Patient'}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Doctor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {result.appointment.doctor?.name || 'Specialist'}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="font-black text-emerald-600 uppercase tracking-wider block">
                    ● Checked In
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Check-Ins Log */}
      {recentCheckIns.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recent Kiosk Check-Ins (Today):
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentCheckIns.map((apt) => (
              <div key={apt._id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-black flex items-center justify-center">
                    #{apt.tokenNumber}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {apt.patient?.name || 'Patient'}
                    </span>
                    <span className="text-slate-400">
                      {apt.doctor?.name} • Code: {apt.checkInCode}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                  Arrived
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionCheckIn;

