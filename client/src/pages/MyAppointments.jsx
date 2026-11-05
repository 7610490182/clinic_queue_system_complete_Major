import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { getSocketUrl } from '../config';
import { predictWaitTime } from '../services/aiService';
import { sendQueueUpdateNotification } from '../services/notificationService';
import QRCheckInCard from '../components/QRCheckInCard';
import {
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiCompass,
  FiCheckCircle,
  FiXCircle,
  FiActivity,
  FiAlertCircle,
  FiTrash2,
  FiArrowRight,
  FiUser,
  FiTag,
  FiVideo,
  FiCamera,
  FiFileText,
  FiX
} from 'react-icons/fi';
import { FaUserMd } from 'react-icons/fa';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState(null);
  const [qrPassApt, setQrPassApt] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const navigate = useNavigate();
  const socketUrl = getSocketUrl();

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await axios.get('/api/appointments/my');
      setAppointments(res.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();

    const newSocket = io(socketUrl);

    newSocket.on('appointmentUpdate', (data) => {
      fetchAppointments();
      if (data?.status === 'in_queue') {
        const apt = appointments.find(a => a._id === data.appointmentId);
        if (apt) {
          sendQueueUpdateNotification(apt, 0, data.estimatedWaitTime || 15);
        }
      }
    });

    return () => newSocket.close();
  }, [socketUrl, fetchAppointments, appointments]);

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async (apt) => {
    setPayingId(apt._id);
    try {
      const res = await axios.post('/api/payments/create-order', {
        appointmentId: apt._id,
        amount: 500
      });

      if (res.data.mock) {
        alert(res.data.message || 'Payment completed in Instant Mock Mode!');
        await fetchAppointments();
        if (selectedApt && selectedApt._id === apt._id) {
          setSelectedApt(prev => ({
            ...prev,
            payment: { ...prev.payment, status: 'paid' },
            status: 'confirmed'
          }));
        }
        return;
      }

      await loadRazorpayScript();

      const options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: res.data.currency,
        order_id: res.data.orderId,
        name: 'MediQueue Care',
        description: 'Consultation Fee',
        handler: async function (response) {
          try {
            await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            alert('Payment successful! Appointment confirmed.');
            await fetchAppointments();
            if (selectedApt && selectedApt._id === apt._id) {
              setSelectedApt(prev => ({
                ...prev,
                payment: { ...prev.payment, status: 'paid' },
                status: 'confirmed'
              }));
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
            alert('Payment verification failed. Please contact clinic reception.');
          }
        },
        prefill: {
          name: apt.patientName,
          contact: apt.contact
        },
        theme: {
          color: '#2563EB'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Error initiating payment:', err);
      alert('Could not initiate payment. Falling back to reception pay.');
    } finally {
      setPayingId(null);
    }
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment and release your queue token?')) return;
    try {
      await axios.put(`/api/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'checked_in':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
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

  const getWaitTimeEstimate = (apt) => {
    if (apt.estimatedWaitTime) return apt.estimatedWaitTime;
    const prediction = predictWaitTime({
      aheadInQueue: Math.max(0, (apt.tokenNumber || 1) - 1),
      avgDoctorTime: 12,
      emergencyDelay: 0
    });
    return prediction.estimatedWaitMinutes;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
            <FiActivity className="w-3.5 h-3.5" />
            <span>Digital Appointment Wallet</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Appointments & Tokens
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Live queue position, contactless QR passes, and WebRTC video consultations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/track-token"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <FiCompass className="w-4 h-4" />
            <span>Track Token Radar</span>
          </Link>

          <Link
            to="/doctors"
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <FaUserMd className="w-3.5 h-3.5 text-blue-500" />
            <span>Book New</span>
          </Link>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No Appointments Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            You don&apos;t have any active or past appointments registered with this profile.
          </p>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition"
          >
            <span>Explore Gwalior Specialists</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((appointment) => {
            const isPaid = appointment.payment?.status === 'paid';
            const isActive = !['completed', 'cancelled'].includes(appointment.status);
            const isCheckedIn = appointment.checkInStatus === 'arrived';

            return (
              <div
                key={appointment._id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Token & Status */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-lg flex items-center justify-center shadow-inner">
                        #{appointment.tokenNumber}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Queue Token
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Token #{appointment.tokenNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(appointment.status)}`}>
                        {appointment.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {isCheckedIn && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                          ✓ Arrived at Clinic
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                      {appointment.doctor?.image ? (
                        <img
                          src={appointment.doctor.image}
                          alt={appointment.doctor.name}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <FaUserMd className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {appointment.doctor?.name || 'Dr. Specialist'}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {appointment.doctor?.specialization || 'Consultant'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Patient: {appointment.patientName}
                      </p>
                    </div>
                  </div>

                  {/* Date, Time & AI Wait Info */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 mb-5 text-xs">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Date</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {new Date(appointment.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Time Slot</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {appointment.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Track Live Token Direct Radar Button */}
                    {isActive && (
                      <button
                        onClick={() => navigate(`/track-token?appointmentId=${appointment._id}`)}
                        className="flex-1 min-w-[140px] py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition"
                      >
                        <FiCompass className="w-3.5 h-3.5" />
                        <span>Track Live Token</span>
                      </button>
                    )}

                    {/* QR Check-In Pass Button */}
                    <button
                      onClick={() => setQrPassApt(appointment)}
                      className="py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1.5"
                    >
                      <FiCamera className="w-3.5 h-3.5" />
                      <span>QR Pass</span>
                    </button>

                    {/* Telemedicine Video Room Button */}
                    <Link
                      to={`/telemedicine/${appointment._id}`}
                      className="py-2.5 px-3 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl border border-purple-200 dark:border-purple-800 transition flex items-center gap-1.5"
                      title="Join Telemedicine Video Call"
                    >
                      <FiVideo className="w-3.5 h-3.5" />
                      <span>Video</span>
                    </Link>

                    {/* Pay Now Button */}
                    {!isPaid && isActive && (
                      <button
                        onClick={() => handlePayNow(appointment)}
                        disabled={payingId === appointment._id}
                        className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <FiCreditCard className="w-3.5 h-3.5" />
                        <span>{payingId === appointment._id ? 'Processing...' : 'Pay ₹500'}</span>
                      </button>
                    )}

                    {/* Cancel */}
                    {isActive && (
                      <button
                        onClick={() => cancelAppointment(appointment._id)}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 transition flex items-center gap-1"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Check-In Card Modal */}
      {qrPassApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setQrPassApt(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <FiX className="text-xl" />
            </button>
            <div className="mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Contactless Check-In Pass
              </h3>
              <p className="text-xs text-slate-500">Scan at clinic kiosk or enter 6-digit PIN</p>
            </div>
            <QRCheckInCard appointment={qrPassApt} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
