import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiClock,
  FiCalendar,
  FiFileText,
  FiUploadCloud,
  FiShield,
  FiCheckCircle,
  FiDownload,
  FiPlus,
  FiLock,
  FiUnlock,
  FiActivity,
  FiAlertTriangle
} from 'react-icons/fi';
import { FaUserMd, FaHospital, FaNotesMedical } from 'react-icons/fa';

const HealthTimeline = () => {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Lab Report',
    doctorName: '',
    summary: ''
  });
  const [consentDoctorId, setConsentDoctorId] = useState('');
  const [allDoctors, setAllDoctors] = useState([]);
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    if (user?._id) {
      fetchTimeline();
      fetchDoctors();
    }
  }, [user]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/records/timeline/${user._id}`);
      setTimeline(res.data);
    } catch (err) {
      console.error('Error fetching health timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/doctors');
      setAllDoctors(Array.isArray(res.data) ? res.data : (res.data?.doctors || []));
    } catch (e) {}
  };

  const handleUploadRecord = async (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) return;

    try {
      await axios.post('/api/records/upload', uploadForm);
      setShowUploadModal(false);
      setUploadForm({ title: '', category: 'Lab Report', doctorName: '', summary: '' });
      fetchTimeline();
    } catch (err) {
      console.error('Error uploading record:', err);
    }
  };

  const handleGrantConsent = async (doctorId) => {
    try {
      await axios.post('/api/records/consent', {
        doctorId,
        action: 'grant',
        purpose: 'Clinical Evaluation and Prescription Management',
        durationDays: 30
      });
      fetchTimeline();
    } catch (err) {
      console.error('Error granting consent:', err);
    }
  };

  const handleRevokeConsent = async (doctorId) => {
    try {
      await axios.post('/api/records/consent', {
        doctorId,
        action: 'revoke'
      });
      fetchTimeline();
    } catch (err) {
      console.error('Error revoking consent:', err);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await axios.post('/api/records/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealthRecord_${user.name.replace(/\s+/g, '_')}_DPDP.json`;
      a.click();
      setExportNotice('✓ DPDP-compliant Health Record downloaded successfully.');
      setTimeout(() => setExportNotice(''), 4000);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-slate-200">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold">Loading Encrypted Digital Health Timeline...</p>
        </div>
      </div>
    );
  }

  const patient = timeline?.patient || {};
  const appointments = timeline?.appointments || [];
  const records = patient.medicalRecords || [];

  return (
    <div className="py-6 max-w-6xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider mb-2">
            <FaNotesMedical /> Electronic Medical Record (EMR)
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Digital Health Timeline & Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure, consent-driven patient history compliant with Indian DPDP Act & ABDM standards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <FiUploadCloud /> Upload Lab Report
          </button>
          <button
            onClick={handleExportData}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
          >
            <FiDownload /> Export Record (DPDP)
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 text-xs font-bold rounded-xl">
          {exportNotice}
        </div>
      )}

      {/* Patient Health ID Card Preview */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-200 block">Digital Patient Profile</span>
          <h2 className="text-2xl font-black">{patient.name}</h2>
          <p className="text-xs text-blue-100 mt-1">
            Blood Group: <strong>{patient.bloodGroup || 'O+'}</strong> • Phone: {patient.phone}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-blue-200 block">ABHA Health ID</span>
          <span className="font-mono text-base font-bold tracking-wider block bg-white/10 px-3 py-1 rounded-xl">
            {patient.abhaId || '14-8291-0492-1823'}
          </span>
          <span className="text-[11px] text-blue-200 block">{patient.abhaAddress || 'patient@abdm'}</span>
        </div>
        <div className="space-y-1 md:text-right">
          <span className="text-[10px] uppercase font-bold text-blue-200 block">Health Card Number</span>
          <span className="font-mono text-base font-bold text-amber-300 block">
            {patient.healthCardId || 'MQ-GWL-2027'}
          </span>
          <span className="text-[10px] text-emerald-300 font-bold block">✓ DPDP Act Consent Governed</span>
        </div>
      </div>

      {/* Grid: Timeline and Doctor Consent Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Chronological Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FiClock className="text-blue-500" />
            <span>Consultation & Prescription Timeline</span>
          </h2>

          <div className="relative border-l-2 border-blue-200 dark:border-blue-900 ml-4 space-y-8 pl-6">
            {/* Appointments Timeline */}
            {appointments.map((apt) => (
              <div key={apt._id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        Token #{apt.tokenNumber}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {apt.doctor?.name} ({apt.doctor?.specialization})
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(apt.date).toLocaleDateString()} at {apt.time}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clinic: {apt.doctor?.clinic || 'Main Center'} • Status: <strong className="capitalize text-emerald-600">{apt.status}</strong>
                  </p>

                  {/* Digital Prescription Details if issued */}
                  {apt.prescription?.medicines?.length > 0 && (
                    <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <FiFileText className="text-indigo-500" />
                        <span>Prescription (Rx) — Diagnosis: {apt.prescription.diagnosis || 'Consultation'}</span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        {apt.prescription.medicines.map((m, i) => (
                          <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                            <strong>{m.name}</strong>
                            <span className="text-[11px] text-slate-400">{m.dosage} • {m.frequency} • {m.duration}</span>
                          </div>
                        ))}
                      </div>
                      {apt.prescription.clinicalNotes && (
                        <p className="text-xs text-slate-500 italic mt-1">
                          Advice: &quot;{apt.prescription.clinicalNotes}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Uploaded Documents */}
            {records.map((rec, i) => (
              <div key={i} className="relative group">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-purple-600 ring-4 ring-white dark:ring-slate-900" />
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded-full">
                      {rec.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(rec.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {rec.title}
                  </h3>
                  {rec.summary && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {rec.summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Consent Management (DPDP Act) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <FiShield className="text-emerald-500 text-lg" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Consent-Based Record Sharing
                </h3>
                <p className="text-[11px] text-slate-400">
                  DPDP Act 2023 & ABDM Privacy Framework
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Doctors cannot view your medical timeline without your explicit consent. You can grant 30-day clinical access or revoke anytime.
            </p>

            {/* Active Consents */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">
                Active Doctor Permissions:
              </span>
              {patient.activeConsents?.filter(c => c.status === 'active').length > 0 ? (
                patient.activeConsents
                  .filter(c => c.status === 'active')
                  .map((c, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between text-xs border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {c.doctorName || 'Doctor'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Expires: {new Date(c.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRevokeConsent(c.doctor)}
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Revoke
                      </button>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-slate-400 italic">No external doctor currently has access.</p>
              )}
            </div>

            {/* Grant Access Picker */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-[11px] uppercase font-bold text-slate-400 block">
                Grant New Doctor Access:
              </label>
              <select
                value={consentDoctorId}
                onChange={(e) => setConsentDoctorId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              >
                <option value="">Select Doctor in Gwalior...</option>
                {allDoctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.name} ({doc.specialization})
                  </option>
                ))}
              </select>
              <button
                disabled={!consentDoctorId}
                onClick={() => {
                  handleGrantConsent(consentDoctorId);
                  setConsentDoctorId('');
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow transition"
              >
                ✓ Grant 30-Day Consent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Upload Health Record</h3>
            <form onSubmit={handleUploadRecord} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lipid Profile Lab Test"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="Lab Report">Lab Report</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Imaging/X-Ray">Imaging/X-Ray</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                  <option value="Vaccine Certificate">Vaccine Certificate</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Consulting Doctor / Hospital</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Akash Modi / Sahara Hospital"
                  value={uploadForm.doctorName}
                  onChange={(e) => setUploadForm({ ...uploadForm, doctorName: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Summary / Key Findings</label>
                <textarea
                  rows={2}
                  placeholder="Key test values, diagnosis notes..."
                  value={uploadForm.summary}
                  onChange={(e) => setUploadForm({ ...uploadForm, summary: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthTimeline;

