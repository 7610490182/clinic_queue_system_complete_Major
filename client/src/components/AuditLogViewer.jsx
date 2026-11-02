import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiShield, FiRefreshCw, FiClock, FiUser, FiActivity } from 'react-icons/fi';

const AuditLogViewer = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/records/audit-logs');
      setAuditLogs(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = filterAction === 'ALL'
    ? auditLogs
    : auditLogs.filter(log => log.action === filterAction);

  const uniqueActions = ['ALL', ...new Set(auditLogs.map(l => l.action).filter(Boolean))];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6 mb-8 mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FiShield className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Healthcare Security & Compliance Audit Log</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident administrative audit trail: user status, access overrides, deactivations, EMR issuance, and DPDP events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2.5 text-left font-bold text-slate-700 dark:text-slate-300">Timestamp</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-700 dark:text-slate-300">User / Actor</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-700 dark:text-slate-300">Role</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-700 dark:text-slate-300">Action</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-700 dark:text-slate-300">Resource</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-700 dark:text-slate-300">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
              <tr key={log._id || Math.random()} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                  {log.userName || String(log.userId || 'Anonymous').slice(0, 10)}
                </td>
                <td className="px-4 py-2.5">
                  <span className="uppercase tracking-wider font-extrabold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {log.userRole || 'system'}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {log.action}
                </td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                  {log.resource}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    log.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {log.status || 'SUCCESS'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-500">
                  {loading ? 'Loading compliance audit logs...' : 'No audit records found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogViewer;

