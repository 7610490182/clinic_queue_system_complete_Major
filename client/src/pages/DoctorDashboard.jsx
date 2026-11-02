import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import {
  FiActivity,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiClock,
  FiPhone,
  FiVolume2,
  FiUsers,
  FiArrowRight,
  FiInbox,
  FiVideo,
  FiAlertTriangle,
  FiFolder,
  FiPlus,
  FiX
} from 'react-icons/fi';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [queue, setQueue] = useState([]);
  const [calling, setCalling] = useState(false);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    completedToday: 0,
    earningsToday: 0
  });

  // Walk-in modal
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinData, setWalkinData] = useState({
    patientName: '',
    phone: '',
    notes: '',
    priority: 'standard'
  });
  const [walkinLoading, setWalkinLoading] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState('');

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  const fetchDoctorData = useCallback(async () => {
    try {
      const response = await fetch('/api/appointments/doctor', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAppointments(data.appointments || []);
      setQueue(data.queue || []);
      if (data.stats) {
        setStats(data.stats);
      }
      const activeConsulting = (data.appointments || []).find(a => a.status === 'consulting');
      if (activeConsulting) {
        setCurrentPatient(activeConsulting);
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    }
  }, []);

  useEffect(() => {
    const newSocket = io(socketUrl);

    newSocket.on('appointmentUpdate', () => {
      fetchDoctorData();
    });

    fetchDoctorData();

    return () => {
      newSocket.disconnect();
    };
  }, [socketUrl, fetchDoctorData]);

  const callNextPatient = async () => {
    setCalling(true);
    try {
      const response = await fetch('/api/appointments/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCurrentPatient(data.patient);
        fetchDoctorData();
      }
    } catch (error) {
      console.error('Error calling next patient:', error);
    } finally {
      setCalling(false);
    }
  };

  const completeAppointment = async () => {
    if (!currentPatient) return;

    try {
      const response = await fetch(`/api/appointments/complete/${currentPatient._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCurrentPatient(null);
        fetchDoctorData();
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
  };

  const handleTriageEmergency = async (appointmentId) => {
    try {
      await axios.post(`/api/queue/${appointmentId}/triage`, {
        priority: 'emergency',
        notes: 'Priority clinical escalation from doctor console'
      });
      setDashboardMessage('🚨 Patient escalated to top emergency triage priority!');
      fetchDoctorData();
      setTimeout(() => setDashboardMessage(''), 4000);
    } catch (err) {
      console.error('Triage error:', err);
    }
  };

  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    setWalkinLoading(true);
    try {
      const res = await axios.post('/api/queue/walkin', {
        doctorId: user?.id || user?._id,
        patientName: walkinData.patientName,
        phone: walkinData.phone,
        priority: walkinData.priority,
        notes: walkinData.notes
      });
      setShowWalkinModal(false);
      setWalkinData({ patientName: '', phone: '', notes: '', priority: 'standard' });
      setDashboardMessage(`Walk-in Token #${res.data?.appointment?.tokenNumber} issued successfully!`);
      fetchDoctorData();
      setTimeout(() => setDashboardMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue walk-in token');
    } finally {
      setWalkinLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'checked_in':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'in_queue':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'consulting':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'cancelled':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
            <FiActivity className="w-3.5 h-3.5" />
            <span>Doctor Consultation Console 2027</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dr. {user?.name || 'Practitioner'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            AI dynamic waiting room queue, WebRTC telemedicine room, and EMR timeline access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowWalkinModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-500/20"
          >
            <FiPlus /> Issue Walk-In Token
          </button>

          <Link
            to="/health-records"
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <FiFolder /> Patient Records (EMR)
          </Link>

          <button
            onClick={callNextPatient}
            disabled={calling || queue.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50"
          >
            <FiVolume2 />
            <span>{calling ? 'Calling...' : 'Call Next Patient'}</span>
          </button>
        </div>
      </div>

      {dashboardMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold animate-in fade-in">
          {dashboardMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today&apos;s Appointments</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FiCalendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.todayAppointments}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Booked patient tokens</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Visits</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.completedToday}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Consultations finished</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">₹{stats.earningsToday}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Consultation fee collections</p>
        </div>
      </div>

      {/* Main Grid: Active Patient & Live Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Patient In Chamber */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiUser className="text-purple-600 dark:text-purple-400" />
                Active In-Chamber Patient
              </h2>
              {currentPatient && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                  Currently Consulting
                </span>
              )}
            </div>

            {currentPatient ? (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-purple-200/80 dark:border-slate-700">
                  <div className="flex items-center justify-between pb-4 border-b border-purple-100 dark:border-slate-700">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Current Token</span>
                      <div className="text-4xl font-black text-purple-600 dark:text-purple-400">
                        #{currentPatient.tokenNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Scheduled Slot</span>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentPatient.timeSlot}</div>
                    </div>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-3 text-xs mb-4">
                    <div>
                      <span className="text-slate-400">Patient Name:</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{currentPatient.patientName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Contact Number:</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{currentPatient.contact || 'N/A'}</p>
                    </div>
                  </div>

                  {/* 2027 Telemedicine and EMR Links for Current Patient */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-100 dark:border-slate-700">
                    <Link
                      to={`/telemedicine/${currentPatient._id}`}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-purple-700 transition"
                    >
                      <FiVideo /> Telemedicine Room
                    </Link>

                    <Link
                      to={`/health-records?patientId=${currentPatient.patient || ''}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition"
                    >
                      <FiFolder /> View EMR Record
                    </Link>

                    <button
                      onClick={() => handleTriageEmergency(currentPatient._id)}
                      className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1.5 border border-red-200 dark:border-red-900"
                    >
                      <FiAlertTriangle /> Urgent Triage
                    </button>
                  </div>
                </div>

                <button
                  onClick={completeAppointment}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition duration-200 text-sm"
                >
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Mark Consultation Completed</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <FiInbox className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Chamber is Currently Free
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                  Ready to attend the next patient in line. Click Call Next to notify them and update the lobby TV.
                </p>

                <button
                  onClick={callNextPatient}
                  disabled={calling || queue.length === 0}
                  className="py-3.5 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 inline-flex items-center gap-2 transition duration-200 text-sm disabled:opacity-50"
                >
                  <FiVolume2 className="w-4 h-4" />
                  <span>{calling ? 'Calling Token...' : '📢 Call Next Token'}</span>
                </button>
              </div>
            )}
          </div>

          {currentPatient && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Patient alert sound sent</span>
              <span>Token sync live</span>
            </div>
          )}
        </div>

        {/* Live Queue Waiting Line */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiUsers className="text-blue-600 dark:text-blue-400" />
              Waiting Line ({queue.length})
            </h2>
            <button
              onClick={callNextPatient}
              disabled={queue.length === 0 || calling}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-40 flex items-center gap-1.5"
            >
              <FiVolume2 className="w-3.5 h-3.5" />
              <span>Call Next</span>
            </button>
          </div>

          {queue.length > 0 ? (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {queue.map((patient, index) => (
                <div
                  key={patient._id || index}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                    patient.priority === 'emergency'
                      ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 animate-pulse'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center ${
                      patient.priority === 'emergency'
                        ? 'bg-red-500 text-white'
                        : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{patient.patientName}</span>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                          Token #{patient.tokenNumber}
                        </span>
                        {patient.priority === 'emergency' && (
                          <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Slot: {patient.timeSlot} • {patient.contact || 'No phone'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTriageEmergency(patient._id)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900"
                      title="Prioritize to emergency"
                    >
                      Urgent
                    </button>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-900/50">
                      Waiting
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FiUsers className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No patients currently waiting in line. New checked-in tokens will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Walk-in Token Generation Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <FiPlus className="text-emerald-500" /> Issue Instant Walk-In Token
              </h3>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateWalkin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Mishra"
                  value={walkinData.patientName}
                  onChange={(e) => setWalkinData(w => ({ ...w, patientName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Mobile Number (10 digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9826012345"
                  value={walkinData.phone}
                  onChange={(e) => setWalkinData(w => ({ ...w, phone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Triage Priority</label>
                <select
                  value={walkinData.priority}
                  onChange={(e) => setWalkinData(w => ({ ...w, priority: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="standard">Standard Walk-In</option>
                  <option value="priority">Priority Case</option>
                  <option value="emergency">🚨 Emergency (Immediate Call)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Clinical Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Acute abdominal pain, arrived via desk"
                  value={walkinData.notes}
                  onChange={(e) => setWalkinData(w => ({ ...w, notes: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkinLoading || !walkinData.patientName}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
                >
                  {walkinLoading ? 'Issuing...' : 'Issue Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Today's Appointments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200 dark:border-slate-800 shadow-md">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <FiCalendar className="text-emerald-600 dark:text-emerald-400" />
          Today&apos;s Full Schedule ({todayAppointments.length})
        </h2>

        {todayAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Slot</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {todayAppointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-black text-blue-600 dark:text-blue-400 text-sm">
                      #{apt.tokenNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {apt.patientName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {apt.timeSlot}
                    </td>
                    <td className="py-3.5 px-4">
                      {apt.priority === 'emergency' ? (
                        <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 px-2 py-0.5 rounded-full font-black">
                          EMERGENCY
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/telemedicine/${apt._id}`}
                          className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
                          title="Open Telemedicine Room"
                        >
                          <FiVideo className="text-sm" />
                        </Link>
                        <button
                          onClick={() => handleTriageEmergency(apt._id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                          title="Emergency Triage"
                        >
                          <FiAlertTriangle className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
            No appointments booked for today yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
