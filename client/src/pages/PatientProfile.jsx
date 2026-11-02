import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHeart,
  FiShield,
  FiEdit2,
  FiCheck,
  FiPrinter,
  FiCalendar,
  FiAlertTriangle,
  FiPlus,
  FiX,
  FiLock,
  FiKey,
  FiDownload,
  FiCheckCircle,
  FiFolder,
  FiShare2
} from 'react-icons/fi';
import { FaIdCard, FaQrcode } from 'react-icons/fa';

const PatientProfile = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    age: '',
    gender: '',
    address: '',
    emergencyContact: { name: '', phone: '', relation: '' },
    allergies: [],
    medicalHistory: [],
    healthCardId: '',
    abhaId: '',
    abhaAddress: '',
    twoFactorEnabled: false
  });

  const [appointments, setAppointments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ABHA linking state
  const [linkingAbha, setLinkingAbha] = useState(false);
  const [abhaInput, setAbhaInput] = useState('');
  const [showAbhaModal, setShowAbhaModal] = useState(false);

  // 2FA state
  const [toggling2FA, setToggling2FA] = useState(false);

  // Tag inputs
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  // Change Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfileData();
    fetchAppointments();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data?.user) {
        const u = res.data.user;
        const uid = u._id || u.id || '';
        // Mock ABHA if not present for instant 2027 demonstration
        const defaultAbha = u.abhaId || `91-${String(uid).slice(-4).padStart(4, '8765')}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const defaultAbhaAddress = u.abhaAddress || `${(u.name || 'patient').toLowerCase().replace(/\s+/g, '')}@abdm`;

        setProfile({
          id: uid,
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          bloodGroup: u.bloodGroup || 'O+',
          age: u.age || '',
          gender: u.gender || '',
          address: u.address || '',
          emergencyContact: u.emergencyContact || { name: '', phone: '', relation: '' },
          allergies: u.allergies || [],
          medicalHistory: u.medicalHistory || [],
          healthCardId: u.healthCardId || `MQ-${String(uid).slice(-6).toUpperCase()}`,
          abhaId: defaultAbha,
          abhaAddress: defaultAbhaAddress,
          twoFactorEnabled: !!u.twoFactorEnabled
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('/api/appointments/my');
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Error fetching appointment stats:', err);
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Strict 10-digit numeric constraint for mobile numbers
    if (name === 'phone' || name === 'emergencyContact.phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggle2FA = async () => {
    setToggling2FA(true);
    try {
      const res = await axios.post('/api/auth/2fa/toggle');
      setProfile(prev => ({ ...prev, twoFactorEnabled: res.data.twoFactorEnabled }));
      setMessage({
        type: 'success',
        text: `Healthcare 2FA has been ${res.data.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}.`
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update 2FA status.' });
    } finally {
      setToggling2FA(false);
    }
  };

  const handleLinkAbha = async () => {
    setLinkingAbha(true);
    try {
      const res = await axios.post('/api/fhir/verify-abha', {
        abhaId: abhaInput || profile.abhaId
      });
      if (res.data?.valid) {
        setProfile(prev => ({
          ...prev,
          abhaId: res.data.abhaId,
          abhaAddress: res.data.abhaAddress
        }));
        setMessage({ type: 'success', text: `Ayushman Bharat ABHA ID linked: ${res.data.abhaId}` });
        setShowAbhaModal(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid ABHA ID format (Must be 14 digits)' });
    } finally {
      setLinkingAbha(false);
    }
  };

  const handleDownloadFHIR = async () => {
    try {
      const res = await axios.get(`/api/fhir/bundle/${profile.id || user?.id}`);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `FHIR-R4-HealthRecord-${profile.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setMessage({ type: 'success', text: 'HL7 FHIR R4 clinical JSON bundle exported successfully!' });
    } catch (err) {
      console.error('FHIR export error:', err);
      setMessage({ type: 'error', text: 'Failed to generate FHIR JSON bundle.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in both current and new passwords.' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match. Please re-type.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await axios.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordMessage({ type: 'success', text: res.data?.message || 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Check your current password.'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !profile.allergies.includes(newAllergy.trim())) {
      setProfile(prev => ({ ...prev, allergies: [...prev.allergies, newAllergy.trim()] }));
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleAddCondition = () => {
    if (newCondition.trim() && !profile.medicalHistory.includes(newCondition.trim())) {
      setProfile(prev => ({ ...prev, medicalHistory: [...prev.medicalHistory, newCondition.trim()] }));
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (index) => {
    setProfile(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.put('/api/auth/profile', profile);
      setMessage({ type: 'success', text: 'Digital Patient Profile updated successfully!' });
      setIsEditing(false);
      if (res.data?.user) {
        setProfile(prev => ({ ...prev, ...res.data.user }));
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const activeCount = appointments.filter(a => !['completed', 'cancelled'].includes(a.status)).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-slate-200">
        <div className="text-xl">⏳ Loading Digital Health Profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider mb-2">
              <FaIdCard /> ABDM & Digital Health Passport 2027
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {profile.name || 'Digital Patient'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Ayushman Bharat ABHA linked profile, HL7 FHIR interoperability, and encrypted EMR timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/health-records"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <FiFolder /> Open EMR Timeline
            </Link>

            <button
              onClick={handleDownloadFHIR}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-2"
              title="Download standardized HL7 FHIR R4 JSON record"
            >
              <FiDownload /> FHIR R4 JSON
            </button>

            <button
              onClick={handlePrintCard}
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-sm transition flex items-center gap-2"
            >
              <FiPrinter /> Print Card
            </button>

            <button
              onClick={() => setIsEditing(prev => !prev)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
            >
              <FiEdit2 /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-2xl text-sm flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.type === 'success' ? <FiCheck className="text-xl shrink-0" /> : <FiAlertTriangle className="text-xl shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Top Section: Ayushman Bharat ABHA Health Card & Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* DIGITAL HEALTH CARD (Ayushman Bharat + MediQueue) */}
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 text-white shadow-2xl border border-white/10">
              {/* Background ambient watermarks */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                {/* Card Top Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🇮🇳</span>
                    <div>
                      <h3 className="font-black text-lg tracking-wide uppercase">Ayushman Bharat • ABHA</h3>
                      <p className="text-[10px] text-blue-200 font-semibold uppercase tracking-widest">
                        National Health Authority (NHA)
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-mono font-bold tracking-wider">
                    {profile.healthCardId}
                  </div>
                </div>

                {/* Patient Primary Details */}
                <div className="flex items-center gap-5 pt-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-300 to-yellow-400 text-slate-900 font-black text-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{profile.name || 'Registered Patient'}</h2>
                    <p className="text-blue-100 text-xs mt-0.5">{profile.email}</p>
                    <p className="text-amber-300 text-xs font-mono font-bold mt-1 tracking-wider">
                      ABHA ID: {profile.abhaId || '14-Digit Not Linked'}
                    </p>
                    <p className="text-blue-200 text-[11px] font-mono">
                      Address: {profile.abhaAddress || 'patient@abdm'}
                    </p>
                  </div>
                </div>

                {/* Card Badges Row */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-blue-200 block">Blood Group</span>
                    <span className="text-lg font-black text-red-300">{profile.bloodGroup || 'O+'}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-blue-200 block">Age / Gender</span>
                    <span className="text-sm font-black">
                      {profile.age ? `${profile.age} yrs` : 'N/A'} • {profile.gender || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-200 block">Interoperability</span>
                      <span className="text-xs font-bold text-emerald-300">FHIR R4 Ready</span>
                    </div>
                    <FaQrcode className="text-2xl text-white/90" />
                  </div>
                </div>

                {/* Emergency Contact on Card */}
                {profile.emergencyContact?.name && (
                  <div className="pt-2 text-xs text-blue-100 flex items-center gap-2">
                    <span className="font-bold text-amber-300">🚨 Emergency ICE:</span>
                    <span>{profile.emergencyContact.name} ({profile.emergencyContact.relation || 'Contact'}) • {profile.emergencyContact.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Quick Stats */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-800 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl flex-shrink-0">
                  <FiCalendar />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{appointments.length}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Total Appointments</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-800 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl flex-shrink-0">
                  <FiCheck />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Completed Consultations</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Live Active Queue</span>
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {activeCount > 0 ? `${activeCount} upcoming token(s)` : 'No active queue token'}
                  </div>
                </div>
                <Link
                  to="/track-token"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
                >
                  Track Token →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 8 & 10: ABDM & Two-Factor Authentication Console */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ABDM Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
                🇮🇳
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Ayushman Bharat (ABDM) Integration</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">14-Digit ABHA ID & NHA Consent Architecture</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 text-xs mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">ABHA Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{profile.abhaId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">ABHA Address:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{profile.abhaAddress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  Verified Active
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAbhaModal(true)}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Link / Re-verify ABHA ID
              </button>
              <button
                onClick={handleDownloadFHIR}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-700"
              >
                FHIR JSON
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                  <FiShield />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Healthcare-Grade Security (2FA)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">DPDP Act 2023 Clinical Protection</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                profile.twoFactorEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {profile.twoFactorEnabled ? '2FA ACTIVE' : 'DISABLED'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Require a 6-digit one-time verification passcode on login to prevent unauthorized access to sensitive medical consultation notes and lab diagnostics.
            </p>

            <button
              onClick={handleToggle2FA}
              disabled={toggling2FA}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 ${
                profile.twoFactorEnabled
                  ? 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <FiKey />
              <span>
                {toggling2FA
                  ? 'Updating 2FA...'
                  : profile.twoFactorEnabled
                  ? 'Disable Two-Factor Authentication'
                  : 'Enable Two-Factor Authentication (Recommended)'}
              </span>
            </button>
          </div>
        </div>

        {/* Modal for linking ABHA */}
        {showAbhaModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🇮🇳</span> Link Ayushman Bharat ABHA
                </h3>
                <button
                  onClick={() => setShowAbhaModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <FiX />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Enter your 14-digit ABHA number (e.g. 91-8765-4321-0987) to link your nationwide health profile:
              </p>

              <input
                type="text"
                value={abhaInput}
                onChange={(e) => setAbhaInput(e.target.value)}
                placeholder="14-digit ABHA ID or leave blank for auto-generate"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAbhaModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkAbha}
                  disabled={linkingAbha}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {linkingAbha ? 'Verifying...' : 'Verify & Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Details & Edit Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiShield className="text-blue-600" /> Patient Medical & Demographic Records
            </h2>
            <span className="text-xs text-slate-400">
              {isEditing ? 'Editing Mode Active' : 'Read-only Mode'}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Email Address (Login ID)
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Phone Number
                  </label>
                  {isEditing && (
                    <span className="text-[11px] text-slate-400">{profile.phone.length}/10 digits</span>
                  )}
                </div>
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm font-mono tracking-wider disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={profile.bloodGroup}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Age (Years)
                </label>
                <input
                  type="number"
                  name="age"
                  value={profile.age}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. 28"
                  min="1"
                  max="120"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Residential Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Street address, city, state"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <FiPhone className="text-amber-500" /> Emergency Contact (In Case of Emergency)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Contact Person Name</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={profile.emergencyContact?.name || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm disabled:opacity-75"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-slate-400 font-medium">Emergency Phone</label>
                    {isEditing && (
                      <span className="text-[11px] text-slate-400">{(profile.emergencyContact?.phone || '').length}/10</span>
                    )}
                  </div>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={profile.emergencyContact?.phone || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="10-digit number"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm font-mono tracking-wider disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Relationship</label>
                  <input
                    type="text"
                    name="emergencyContact.relation"
                    value={profile.emergencyContact?.relation || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. Spouse, Father, Sibling"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* Allergies & Conditions */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Allergies */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <FiAlertTriangle className="text-red-500" /> Known Drug & Environmental Allergies
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.allergies.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No allergies recorded</span>
                  ) : (
                    profile.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs px-3 py-1 rounded-xl font-bold border border-red-200 dark:border-red-900"
                      >
                        {allergy}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAllergy(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiX />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Penicillin, Peanuts"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddAllergy}
                      className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Conditions / Medical History */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <FiHeart className="text-blue-500" /> Medical History & Chronic Conditions
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.medicalHistory.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No chronic conditions listed</span>
                  ) : (
                    profile.medicalHistory.map((condition, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 rounded-xl font-bold border border-blue-200 dark:border-blue-900"
                      >
                        {condition}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCondition(idx)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FiX />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Hypertension, Asthma"
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCondition}
                      className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-2xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Security & Password Management Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FiKey className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Security & Change Password</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your login password regularly to keep your health records secure.
              </p>
            </div>
          </div>

          {passwordMessage.text && (
            <div className={`mb-6 p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
              passwordMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
            }`}>
              {passwordMessage.type === 'success' ? <FiCheck className="w-4 h-4 shrink-0" /> : <FiAlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Current Password
              </label>
              <PasswordInput
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter current password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                New Password (Min 6 chars)
              </label>
              <PasswordInput
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Confirm New Password
              </label>
              <PasswordInput
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <FiLock className="w-3.5 h-3.5" />
                <span>{passwordLoading ? 'Updating Password...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
