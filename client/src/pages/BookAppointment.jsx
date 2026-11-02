import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { recommendBestSlots } from '../services/aiService';
import { sendConfirmationWithInsight, scheduleAppointmentReminder } from '../services/notificationService';
import {
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiCheckCircle,
  FiMapPin,
  FiStar,
  FiShield,
  FiZap,
  FiArrowRight,
  FiUser,
  FiActivity,
  FiAlertCircle
} from 'react-icons/fi';
import { FaUserMd } from 'react-icons/fa';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: ''
  });
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [recommendedSlots, setRecommendedSlots] = useState([]);
  const [paying, setPaying] = useState(false);

  const fetchDoctor = useCallback(async () => {
    try {
      const res = await axios.get(`/api/doctors/${doctorId}`);
      setDoctor(res.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  // Generate and recommend slots based on doctor's timings
  useEffect(() => {
    if (doctor?.timings?.start && doctor?.timings?.end) {
      const [startH] = doctor.timings.start.split(':').map(Number);
      const [endH] = doctor.timings.end.split(':').map(Number);
      const slots = [];
      for (let h = startH; h < endH; h++) {
        const hh = h.toString().padStart(2, '0');
        slots.push(`${hh}:00`);
        slots.push(`${hh}:30`);
      }
      const ranked = recommendBestSlots(slots);
      setRecommendedSlots(ranked.slice(0, 6));
      if (!formData.time && ranked.length > 0) {
        setFormData(prev => ({ ...prev, time: ranked[0].slot }));
      }
    }
  }, [doctor]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.time) {
      alert('Please choose a consultation time slot');
      return;
    }
    setBooking(true);

    try {
      const res = await axios.post('/api/appointments', {
        doctorId,
        date: formData.date,
        time: formData.time
      });
      setAppointment(res.data);
      setShowPayment(true);
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(error.response?.data?.message || 'Failed to reserve appointment slot');
    } finally {
      setBooking(false);
    }
  };

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

  const notifyBookingSuccess = (apt) => {
    sendConfirmationWithInsight(apt, {
      estimatedWaitTime: 15,
      recommendation: 'Arrive 10 minutes early with your digital health card.'
    });
    if (user?.email) {
      scheduleAppointmentReminder(apt, user.email);
    }
  };

  const handlePayment = async () => {
    if (!appointment) return;
    setPaying(true);

    try {
      const res = await axios.post('/api/payments/create-order', {
        appointmentId: appointment._id,
        amount: 500
      });

      if (res.data.mock) {
        notifyBookingSuccess(appointment);
        alert(res.data.message || 'Payment completed successfully in Instant Mock Mode!');
        navigate(`/track-token?appointmentId=${appointment._id}`);
        return;
      }

      await loadRazorpayScript();

      const options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: res.data.currency,
        order_id: res.data.orderId,
        name: 'MediQueue Care',
        description: `Consultation Fee with ${doctor?.name}`,
        handler: async function (response) {
          try {
            await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            notifyBookingSuccess(appointment);
            alert('Payment successful! Your queue token is active.');
            navigate(`/track-token?appointmentId=${appointment._id}`);
          } catch (error) {
            const message = error.response?.data?.message || 'Payment verification failed';
            alert(message);
          }
        },
        modal: {
          ondismiss: () => {
            alert('Payment was not completed. You can complete it anytime from My Appointments.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error creating payment:', error);
      const message = error.response?.data?.message || error.message || 'Failed to initiate payment';
      alert(message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-600 dark:text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading doctor schedule & AI slot recommendations...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-3xl border border-red-200 dark:border-red-900 shadow-xl">
        <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Doctor Profile Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          The requested specialist could not be located or may currently be offline.
        </p>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition"
        >
          Browse All Doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb / Step Indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            !showPayment ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-emerald-600 text-white'
          }`}>
            {!showPayment ? '1' : <FiCheckCircle className="w-4 h-4" />}
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Select Slot</span>
        </div>
        <div className="flex-1 h-0.5 mx-4 bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            showPayment ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
          }`}>
            2
          </div>
          <span className={`text-sm font-semibold ${showPayment ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
            Token & Payment
          </span>
        </div>
      </div>

      {/* Main Booking Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Doctor Header Banner */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {doctor.profileImage && doctor.profileImage.trim() !== '' ? (
              <img
                src={doctor.profileImage}
                alt={doctor.name}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-700 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col items-center justify-center ring-4 ring-white dark:ring-slate-700 shadow-md flex-shrink-0">
                <FaUserMd className="text-3xl" />
                <span className="text-[10px] font-bold mt-0.5 uppercase tracking-wider text-blue-100">Doctor</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{doctor.name}</h1>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  <FiShield className="w-3 h-3" /> Verified Specialist
                </span>
              </div>
              <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-2">{doctor.specialization}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <FiMapPin className="text-slate-400" /> {doctor.clinic || 'Main Clinic Facility'}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock className="text-slate-400" /> {doctor.timings?.start} - {doctor.timings?.end}
                </span>
                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                  <FiStar className="fill-amber-400 text-amber-400" /> {doctor.rating?.toFixed(1) || '4.8'} ({doctor.reviewCount || 120}+ reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8">
          {!showPayment ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                  <FiCalendar className="text-blue-600 dark:text-blue-400" />
                  Select Consultation Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  required
                />
              </div>

              {/* Time Slots & AI Recommendation */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <FiClock className="text-blue-600 dark:text-blue-400" />
                    Available Consultation Slots
                  </label>
                  {recommendedSlots.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      <FiZap className="w-3 h-3 text-indigo-500" /> AI Ranked
                    </span>
                  )}
                </div>

                {recommendedSlots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                    {recommendedSlots.map((slotObj) => {
                      const isSelected = formData.time === slotObj.slot;
                      return (
                        <button
                          key={slotObj.slot}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, time: slotObj.slot }))}
                          className={`p-3 text-left rounded-2xl border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="text-sm font-bold flex items-center justify-between">
                            <span>{slotObj.slot}</span>
                            {isSelected && <FiCheckCircle className="w-4 h-4" />}
                          </div>
                          <p className={`text-[11px] mt-0.5 truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {slotObj.reason.split(' - ')[0]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Or manually specify time:</span>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    min={doctor.timings?.start}
                    max={doctor.timings?.end}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Patient Detail Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FiUser className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">Booking for: {user?.name || 'Registered Patient'}</p>
                  <p className="text-slate-500 dark:text-slate-400">{user?.phone || user?.email || 'Instant Queue Pass'}</p>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={booking}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 text-base"
              >
                {booking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Reserving Queue Position...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Confirm & Pay</span>
                    <FiArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Payment and Token Confirmation */
            <div className="space-y-6">
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <FiCheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Slot Reserved Successfully!</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Complete your consultation fee to instantly activate your live queue token.
                </p>
              </div>

              {/* Token Ticket Card */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/60 dark:to-slate-800/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Assigned Token</span>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">#{appointment.tokenNumber}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Date & Slot</span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{appointment.time}</div>
                  </div>
                </div>

                <div className="pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Consultation with</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{doctor.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Clinic Chamber</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{doctor.clinic || 'Main Chamber'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Estimated Initial Wait</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">~15 mins</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Doctor Consultation Fee</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">₹500</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                  <span>Queue Priority & Notification Service</span>
                  <span className="font-bold">FREE</span>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <FiShield className="w-4 h-4 shrink-0" />
                  <span>Razorpay 256-bit secure gateway & instant mock settlement enabled.</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition duration-200 text-base disabled:opacity-50"
                >
                  {paying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Initiating Payment...</span>
                    </>
                  ) : (
                    <>
                      <FiCreditCard className="w-5 h-5" />
                      <span>Pay ₹500 & Activate Token</span>
                    </>
                  )}
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/track-token?appointmentId=${appointment._id}`)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition text-center flex items-center justify-center gap-1.5"
                  >
                    <FiActivity className="w-4 h-4 text-blue-500" />
                    <span>Track Live Radar First</span>
                  </button>

                  <button
                    onClick={() => navigate('/my-appointments')}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition text-center"
                  >
                    View in My Appointments
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;