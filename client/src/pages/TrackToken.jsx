import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import QRCheckInCard from '../components/QRCheckInCard';
import {
  FiCompass,
  FiSearch,
  FiClock,
  FiUser,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiCreditCard,
  FiVolume2,
  FiArrowRight,
  FiRefreshCw,
  FiVideo,
  FiShield,
  FiSliders,
  FiX
} from 'react-icons/fi';
import { FaUserMd, FaHospital } from 'react-icons/fa';

const TrackToken = () => {
  const { user } = useAuth();
  const { t, lang, language, speakAnnouncement } = useLanguage();
  const isHindi = lang === 'hi' || language === 'hi';
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [userAppointments, setUserAppointments] = useState([]);

  // Search Inputs
  const [selectedDoctorId, setSelectedDoctorId] = useState(searchParams.get('doctor') || '');
  const [tokenInput, setTokenInput] = useState(searchParams.get('token') || '');
  const [appointmentIdInput, setAppointmentIdInput] = useState(searchParams.get('appointmentId') || '');

  // Tracking state
  const [trackingData, setTrackingData] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchDoctors();
    if (user) {
      fetchUserAppointments();
    }
  }, [user]);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/doctors');
      const data = res.data;
      setDoctors(Array.isArray(data) ? data : (data?.doctors || []));
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const fetchUserAppointments = async () => {
    try {
      const res = await axios.get('/api/appointments/my');
      const active = (res.data || []).filter(a =>
        !['completed', 'cancelled'].includes(a.status)
      );
      setUserAppointments(active);

      if (active.length > 0 && !selectedDoctorId && !tokenInput && !appointmentIdInput) {
        const first = active[0];
        const docId = first.doctor?._id || first.doctor;
        setSelectedDoctorId(docId);
        setTokenInput(first.tokenNumber);
        setAppointmentIdInput(first._id);
        trackTokenData({ appointmentId: first._id });
      }
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
    }
  };

  const trackTokenData = useCallback(async (overrideParams) => {
    const docId = overrideParams?.doctorId || selectedDoctorId;
    const token = overrideParams?.tokenNumber || tokenInput;
    const apptId = overrideParams?.appointmentId || appointmentIdInput;

    if (!apptId && (!token || !docId)) {
      setError('Please provide your Token Number and select the Doctor, or choose an active appointment.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = {};
      if (apptId) params.appointmentId = apptId;
      if (token) params.tokenNumber = token;
      if (docId) params.doctorId = docId;

      const res = await axios.get('/api/appointments/track-token', { params });
      setTrackingData(res.data);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Fetch 2027 AI Queue Prediction Telemetry
      const doctorIdVal = res.data.appointment?.doctor?._id || docId;
      const tokenNumVal = res.data.appointment?.tokenNumber || token;
      if (doctorIdVal && tokenNumVal) {
        try {
          const predRes = await axios.get(`/api/queue/predict/${doctorIdVal}/${tokenNumVal}`);
          setAiPrediction(predRes.data);
        } catch (predErr) {
          console.warn('AI prediction telemetry fallback');
        }
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError(err.response?.data?.message || 'Token not found for today. Verify your token number and selected doctor.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, tokenInput, appointmentIdInput]);

  useEffect(() => {
    if (appointmentIdInput || (tokenInput && selectedDoctorId)) {
      trackTokenData();
    }
  }, [appointmentIdInput, tokenInput, selectedDoctorId, trackTokenData]);

  // Real-time Socket.IO Queue Listener
  useEffect(() => {
    const socket = io(socketUrl);

    socket.on('queue:patient_checked_in', () => trackTokenData());
    socket.on('queue:status_changed', () => trackTokenData());
    socket.on('queue:priority_changed', () => trackTokenData());
    socket.on('appointmentUpdate', () => trackTokenData());

    return () => socket.close();
  }, [socketUrl, trackTokenData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppointmentIdInput('');
    trackTokenData();
  };

  const handleVoiceAnnouncement = () => {
    if (!trackingData) return;
    const token = trackingData.appointment?.tokenNumber;
    const docName = trackingData.appointment?.doctor?.name;
    const ahead = trackingData.tokensAhead;
    const wait = aiPrediction?.estimatedWaitMinutes || trackingData.estimatedWaitMinutes;
    const range = aiPrediction?.confidenceInterval?.formatted || `${wait - 3}–${wait + 4} mins`;

    if (lang === 'hi') {
      speakAnnouncement(
        `टोकन नंबर ${token}, डॉक्टर ${docName}। आपसे पहले ${ahead} मरीज हैं। अनुमानित प्रतीक्षा समय ${range} है।`,
        'hi'
      );
    } else {
      speakAnnouncement(
        `Token number ${token} for Dr. ${docName}. You have ${ahead} patients ahead of you. Estimated waiting time is ${range}.`,
        'en'
      );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'consulting':
        return { text: '👨‍⚕️ In Consultation', bg: 'bg-emerald-500 text-white animate-pulse' };
      case 'in_queue':
        return { text: '⏳ In Queue', bg: 'bg-amber-500 text-white' };
      case 'confirmed':
        return { text: '✅ Confirmed', bg: 'bg-blue-600 text-white' };
      case 'checked_in':
        return { text: '📍 Arrived & Checked-In', bg: 'bg-emerald-600 text-white' };
      default:
        return { text: status, bg: 'bg-slate-500 text-white' };
    }
  };

  return (
    <div className="py-6 max-w-6xl mx-auto space-y-8">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
          <FiCompass /> 2027 AI Queue Radar • Gwalior Clinics
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Track My Token Live
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
          AI-powered waiting time predictions, machine learning delay recalculations, and contactless QR check-in passes.
        </p>
      </div>

      {/* User Active Appointments Quick Select Pills */}
      {userAppointments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-md border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block px-2">
            Your Active Bookings Today (Click to Track):
          </span>
          <div className="flex flex-wrap gap-2">
            {userAppointments.map((apt) => {
              const docId = apt.doctor?._id || apt.doctor;
              const isSelected = appointmentIdInput === apt._id || (tokenInput == apt.tokenNumber && selectedDoctorId === docId);

              return (
                <button
                  key={apt._id}
                  onClick={() => {
                    setSelectedDoctorId(docId);
                    setTokenInput(apt.tokenNumber);
                    setAppointmentIdInput(apt._id);
                    trackTokenData({ appointmentId: apt._id });
                  }}
                  className={`text-xs px-3.5 py-2 rounded-2xl font-bold transition flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <span className="font-mono bg-white/20 px-2 py-0.5 rounded-lg text-xs">
                    #{apt.tokenNumber}
                  </span>
                  <span>{apt.doctor?.name || 'Doctor'}</span>
                  <span className="text-[10px] opacity-75 font-normal">({apt.time})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lookup Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t('selectDoctorPrompt')}
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{isHindi ? '-- विशेषज्ञ का चयन करें --' : '-- Choose Specialist --'}</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} — {doc.specialization} ({doc.clinic?.split('&')[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t('tokenNumberPrompt')}
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="e.g. 7"
                min="1"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">#</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
            >
              {loading ? <FiRefreshCw className="animate-spin text-base" /> : <FiSearch className="text-base" />}
              <span>{t('trackLive')}</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
            <FiAlertCircle className="text-base flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Live Tracking Result Display */}
      {trackingData && (
        <div className="space-y-6">
          {/* Delay Alert Banner if current consultation is running long */}
          {aiPrediction?.delayAlert && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-3 shadow-sm">
              <FiAlertCircle className="text-lg text-amber-500 flex-shrink-0" />
              <span>{aiPrediction.delayAlert}</span>
            </div>
          )}

          {/* Emergency Priority Alert Banner */}
          {trackingData.appointment?.priority === 'emergency' && (
            <div className="p-4 rounded-2xl bg-red-600 text-white font-bold text-xs flex items-center justify-between shadow-xl animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚨</span>
                <span>EMERGENCY TRIAGED APPOINTMENT — FAST TRACK PROTOCOL ACTIVE</span>
              </div>
              <span className="text-[10px] uppercase bg-white/20 px-2 py-0.5 rounded-full">High Priority</span>
            </div>
          )}

          {/* Main Token Radar Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Top Bar with Voice Announcement Button */}
            <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl shadow-md">
                  <FaUserMd />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                    {trackingData.appointment?.doctor?.name}
                  </h2>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                    {trackingData.appointment?.doctor?.specialization} • {trackingData.appointment?.doctor?.clinic}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Gwalior, Madhya Pradesh
                  </p>
                </div>
              </div>

              {/* Voice Announcement & Check-In Pass Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceAnnouncement}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1.5 border border-blue-200 dark:border-slate-700 shadow-sm"
                  title="Audio Token Announcement"
                >
                  <FiVolume2 className="text-sm" />
                  <span>{t('voiceAnnounce')} ({isHindi ? 'हिंदी' : 'Eng'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQRModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold transition flex items-center gap-1.5 border border-purple-200 dark:border-purple-800 shadow-sm"
                >
                  <FiCompass className="text-sm" />
                  <span>{isHindi ? 'क्यूआर चेक-इन पास' : 'QR Check-In Pass'}</span>
                </button>
              </div>
            </div>

            {/* AI Telemetry Cards Grid */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Serving Now in Cabin */}
              <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-center">
                <div className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                  {isHindi ? 'केबिन में वर्तमान मरीज' : 'Now Inside Cabin'}
                </div>
                <div className="text-5xl md:text-6xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
                  #{trackingData.currentServingToken}
                </div>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-2 font-medium">
                  {trackingData.isCurrentlyConsulting
                    ? (isHindi ? 'सक्रिय परामर्श जारी है' : 'Active Consultation Ongoing')
                    : (isHindi ? 'डॉक्टर अगले मरीज के लिए तैयार हैं' : 'Doctor Ready For Next Token')}
                </p>
              </div>

              {/* Your Token */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center shadow-lg">
                <div className="text-xs font-black uppercase tracking-wider text-indigo-200 mb-1">
                  {isHindi ? 'आपकी टोकन स्थिति' : 'Your Token Position'}
                </div>
                <div className="text-5xl md:text-6xl font-black tracking-tight">
                  #{trackingData.appointment?.tokenNumber}
                </div>
                <div className="mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getStatusBadge(trackingData.appointment?.status).bg}`}>
                    {getStatusBadge(trackingData.appointment?.status).text}
                  </span>
                </div>
              </div>

              {/* AI-Predicted Waiting Time & Confidence Range */}
              <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-850 text-center flex flex-col justify-center">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                  {isHindi ? 'अनुमानित प्रतीक्षा समय (एआई)' : 'AI Predicted Wait Time'}
                </div>
                <div className="text-3xl md:text-4xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                  {aiPrediction?.confidenceInterval?.formatted || `${trackingData.estimatedWaitMinutes} mins`}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-2 font-semibold">
                  {isHindi ? 'बुलावे का समय:' : 'Expected Call-In:'} <strong>{aiPrediction?.predictedConsultationTime || (isHindi ? 'शीघ्र' : 'Soon')}</strong>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {trackingData.tokensAhead} {isHindi ? 'मरीज आपसे पहले • एमएल कैलिब्रेटेड' : 'patient(s) ahead • ML calibrated'}
                </span>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isHindi ? 'मरीज:' : 'Patient:'} <strong className="text-slate-800 dark:text-slate-200">{trackingData.appointment?.patient?.name}</strong> • {isHindi ? 'चेक-इन कोड:' : 'Check-In Code:'} <strong className="font-mono text-blue-600">{trackingData.appointment?.checkInCode || 'N/A'}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/telemedicine/${trackingData.appointment?._id}`}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <FiVideo /> {isHindi ? 'वीडियो परामर्श कक्ष में प्रवेश करें' : 'Enter Telemedicine Video Room'}
                </Link>

                <Link
                  to={`/doctor/${trackingData.appointment?.doctor?._id}`}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition"
                >
                  {isHindi ? 'डॉक्टर का स्थान व मैप →' : 'Doctor Location & Map →'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Contactless Check-In Modal */}
      {showQRModal && trackingData?.appointment && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-lg flex items-center justify-center font-bold"
            >
              <FiX />
            </button>
            <QRCheckInCard appointment={trackingData.appointment} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackToken;
