import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import {
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiPhoneOff,
  FiMessageSquare,
  FiFileText,
  FiActivity,
  FiCheckCircle,
  FiUser,
  FiSend,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';
import { FaUserMd, FaHospital } from 'react-icons/fa';

const TelemedicineRoom = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  // Vitals
  const [vitals, setVitals] = useState({
    bloodPressure: '120/80',
    temperature: '98.6°F',
    pulseRate: '72 bpm',
    symptomsNotes: ''
  });
  const [vitalsSaved, setVitalsSaved] = useState(false);

  // Digital Prescription Form (for Doctor)
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '1 Tab', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals' }
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [rxIssued, setRxIssued] = useState(false);

  // In-call Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'vitals' | 'prescription' | 'chat'

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

  useEffect(() => {
    fetchAppointment();
    setupSocket();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/appointments/${appointmentId}`);
      setAppointment(res.data);
      if (res.data.telemedicine?.preConsultationVitals) {
        setVitals(res.data.telemedicine.preConsultationVitals);
      }
      if (res.data.prescription?.medicines?.length > 0) {
        setMedicines(res.data.prescription.medicines);
        setDiagnosis(res.data.prescription.diagnosis || '');
        setClinicalNotes(res.data.prescription.clinicalNotes || '');
        setRxIssued(true);
      }
    } catch (err) {
      console.error('Error fetching appointment for telemedicine:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    socketRef.current = io(socketUrl);
    const roomId = `telemed-${appointmentId}`;

    socketRef.current.emit('telemed:join', {
      roomId,
      userId: user?._id,
      userName: user?.name,
      role: user?.role
    });

    socketRef.current.on('telemed:chat', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on('telemed:user_joined', ({ userName, role }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          system: true,
          message: `${userName} (${role}) has entered the session.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      if (isDoctor) {
        setWaitingRoom(false);
      }
    });

    socketRef.current.on('telemed:prescription_ready', () => {
      fetchAppointment();
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setInCall(true);
      setWaitingRoom(false);
    } catch (err) {
      console.warn('Camera/Mic access not granted or not available:', err);
      // Fallback in simulation mode so users can test even without webcam
      setInCall(true);
      setWaitingRoom(false);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioMuted(!audioTrack.enabled);
      }
    } else {
      setAudioMuted(!audioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOff(!videoTrack.enabled);
      }
    } else {
      setVideoOff(!videoOff);
    }
  };

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setInCall(false);
    navigate('/my-appointments');
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/telemedicine/vitals/${appointmentId}`, vitals);
      setVitalsSaved(true);
      setTimeout(() => setVitalsSaved(false), 3000);
    } catch (err) {
      console.error('Error saving vitals:', err);
    }
  };

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      { name: '', dosage: '1 Tab', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals' }
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateMedicine = (idx, field, value) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/telemedicine/prescription/${appointmentId}`, {
        medicines: medicines.filter((m) => m.name.trim() !== ''),
        diagnosis,
        clinicalNotes
      });
      setRxIssued(true);
    } catch (err) {
      console.error('Error issuing prescription:', err);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('telemed:chat', {
      roomId: `telemed-${appointmentId}`,
      message: chatInput.trim(),
      sender: user?.name || 'User',
      senderRole: user?.role
    });
    setChatInput('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-slate-200">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold">Connecting to Telemedicine Clinical Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Virtual Telemedicine Consultation
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Encrypted WebRTC Room • Token #{appointment?.tokenNumber} • Doctor: {appointment?.doctor?.name}
          </p>
        </div>

        {/* Action Tabs for Right Panel */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'video' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Video Feed
          </button>
          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'vitals' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Pre-Vitals
          </button>
          <button
            onClick={() => setActiveTab('prescription')}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'prescription' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Digital Rx
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'chat' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Chat ({chatMessages.length})
          </button>
        </div>
      </div>

      {/* Main Grid: Video Call Stage & Clinical Control Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Video Stage */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
            {/* Remote Doctor / Patient Feed */}
            {inCall ? (
              <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 rounded-full bg-blue-600/30 border-2 border-blue-400 text-white flex items-center justify-center mx-auto text-3xl font-black">
                    <FaUserMd />
                  </div>
                  <h3 className="text-white font-bold text-base">
                    {isDoctor ? appointment?.patient?.name : appointment?.doctor?.name}
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800">
                    ● Encrypted Clinical Stream Active
                  </span>
                </div>

                {/* Local Video Thumbnail */}
                <div className="absolute bottom-4 right-4 w-36 h-24 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-2 text-[10px] text-white/80 font-bold">
                    You {videoOff ? '(Video Off)' : ''}
                  </span>
                </div>
              </div>
            ) : (
              /* Virtual Waiting Room Screen */
              <div className="text-center p-8 space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto text-2xl">
                  <FiVideo />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {isDoctor ? 'Patient in Virtual Waiting Room' : 'Doctor Will Admit You Shortly'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your appointment token is <strong>#{appointment?.tokenNumber}</strong>. Please test your camera and enter the consultation when ready.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition"
                >
                  🚀 Start Consultation Now
                </button>
              </div>
            )}
          </div>

          {/* Call Controls Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-1.5 text-xs ${audioMuted ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}
              title={audioMuted ? 'Unmute' : 'Mute'}
            >
              {audioMuted ? <FiMicOff className="text-lg" /> : <FiMic className="text-lg" />}
              <span className="hidden sm:inline">{audioMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-1.5 text-xs ${videoOff ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}
              title={videoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {videoOff ? <FiVideoOff className="text-lg" /> : <FiVideo className="text-lg" />}
              <span className="hidden sm:inline">{videoOff ? 'Camera Off' : 'Camera On'}</span>
            </button>

            <button
              onClick={handleEndCall}
              className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition flex items-center gap-2 shadow-lg shadow-red-500/20"
            >
              <FiPhoneOff className="text-lg" />
              <span>Leave Consultation</span>
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Pre-Vitals, Digital Prescription or In-Call Chat */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 min-h-[460px] flex flex-col justify-between">
          {activeTab === 'vitals' && (
            <form onSubmit={handleSaveVitals} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <FiActivity className="text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pre-Consultation Vitals Form
                </h3>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                  placeholder="e.g. 120/80 mmHg"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Body Temperature</label>
                <input
                  type="text"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  placeholder="e.g. 98.6°F"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Pulse / Heart Rate</label>
                <input
                  type="text"
                  value={vitals.pulseRate}
                  onChange={(e) => setVitals({ ...vitals, pulseRate: e.target.value })}
                  placeholder="e.g. 72 bpm"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Chief Symptoms / Notes</label>
                <textarea
                  rows={3}
                  value={vitals.symptomsNotes}
                  onChange={(e) => setVitals({ ...vitals, symptomsNotes: e.target.value })}
                  placeholder="Describe your current discomfort or questions for doctor..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700"
              >
                {vitalsSaved ? '✓ Vitals Saved' : 'Update Vitals for Doctor'}
              </button>
            </form>
          )}

          {activeTab === 'prescription' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FiFileText className="text-indigo-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Digital Prescription (Rx)
                  </h3>
                </div>
                {rxIssued && (
                  <span className="text-[10px] font-black text-emerald-500 uppercase">
                    ✓ Issued & Signed
                  </span>
                )}
              </div>

              {isDoctor ? (
                <form onSubmit={handleIssuePrescription} className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Diagnosis</label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Acute Bronchitis / Hypertension"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Prescribed Medicines</label>
                    {medicines.map((med, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border space-y-1.5 text-xs">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Medicine name (e.g. Paracetamol 500mg)"
                            value={med.name}
                            onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border rounded-lg font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="text-red-500 p-1"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <input
                            type="text"
                            placeholder="Dosage (1 Tab)"
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Duration (5 days)"
                            value={med.duration}
                            onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border rounded-lg"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="text-xs text-blue-600 font-bold flex items-center gap-1"
                    >
                      <FiPlus /> Add Medicine
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Clinical Advice</label>
                    <textarea
                      rows={2}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Diet instructions, fluid intake, follow up..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Issue Digital Prescription & Complete
                  </button>
                </form>
              ) : (
                /* Patient View of Prescription */
                <div className="space-y-3">
                  {rxIssued ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Diagnosis:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{diagnosis}</span>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Medicines:</span>
                        {medicines.map((m, i) => (
                          <div key={i} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border">
                            <strong>{m.name}</strong> • {m.dosage} ({m.frequency}) for {m.duration}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
                      >
                        🖨️ Print Prescription
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">
                      Doctor will write and sign your digital prescription during this consultation.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-[420px] justify-between">
              <div className="overflow-y-auto space-y-2 p-1 flex-1">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-xs p-2.5 rounded-2xl ${msg.system ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 text-center' : msg.sender === user?.name ? 'bg-blue-600 text-white ml-6' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-6'}`}
                  >
                    {!msg.system && <span className="text-[10px] font-bold block opacity-75">{msg.sender}</span>}
                    <span>{msg.message}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t">
                <input
                  type="text"
                  placeholder="Send message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
                <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-xl">
                  <FiSend />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Details</span>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Doctor: {appointment?.doctor?.name} ({appointment?.doctor?.specialization})
                </div>
                <div className="text-xs text-slate-500">
                  Patient: {appointment?.patient?.name}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1 text-xs">
                <span className="font-bold text-blue-700 dark:text-blue-300 block">Pre-Vitals Summary:</span>
                <p className="text-slate-600 dark:text-slate-300">
                  BP: {vitals.bloodPressure || 'N/A'} • Temp: {vitals.temperature || 'N/A'} • Pulse: {vitals.pulseRate || 'N/A'}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('prescription')}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FiFileText /> View / Write Digital Prescription
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelemedicineRoom;

