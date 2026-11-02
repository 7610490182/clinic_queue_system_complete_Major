const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const AuditLog = require('../models/AuditLog');
const { auth, adminAuth, authorizeRoles, logAuditAction } = require('../middleware/auth');
const { getNextAtomicTokenNumber } = require('../services/tokenService');

const router = express.Router();

// Get appointments for current user (Patient)
router.get('/my', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name specialization clinic timings address phone profileImage')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointments for current doctor (Doctor only)
router.get('/doctor', auth, authorizeRoles('doctor'), async (req, res) => {
  try {
    const doctorRecord = await Doctor.findOne({ email: req.user.email });
    if (!doctorRecord) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointments = await Appointment.find({ doctor: doctorRecord._id })
      .populate('patient', 'name phone email bloodGroup allergies healthCardId')
      .populate('doctor', 'name specialization clinic')
      .sort({ date: 1, tokenNumber: 1 });

    const appointmentData = appointments.map((apt) => ({
      _id: apt._id,
      patientName: apt.patient?.name || 'Unknown',
      tokenNumber: apt.tokenNumber,
      timeSlot: apt.time,
      contact: apt.patient?.phone || apt.patient?.email || 'N/A',
      status: apt.status,
      priority: apt.priority,
      date: apt.date,
      telemedicine: apt.telemedicine,
      prescription: apt.prescription
    }));

    const queue = appointmentData.filter((apt) =>
      ['confirmed', 'checked_in', 'in_queue', 'consulting', 'booked', 'waiting', 'ongoing'].includes(apt.status)
    );
    const todayAppointments = appointmentData.filter(
      (apt) => new Date(apt.date).toDateString() === new Date().toDateString()
    );
    const stats = {
      todayAppointments: todayAppointments.length,
      completedToday: todayAppointments.filter((apt) => apt.status === 'completed').length,
      earningsToday: appointments
        .filter((apt) => new Date(apt.date).toDateString() === new Date().toDateString() && apt.payment?.status === 'paid')
        .reduce((sum, apt) => sum + (apt.payment?.amount || 0), 0)
    };

    res.json({ appointments: appointmentData, queue, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Call next patient for current doctor (Strictly Doctor only - Admin & Patients forbidden)
router.post('/call-next', auth, authorizeRoles('doctor'), async (req, res) => {
  try {
    const doctorRecord = await Doctor.findOne({ email: req.user.email });
    if (!doctorRecord) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const nextAppointment = await Appointment.findOne({
      doctor: doctorRecord._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['checked_in', 'confirmed', 'booked', 'waiting', 'ongoing'] }
    })
      .populate('patient', 'name phone email bloodGroup')
      .sort({ priority: -1, tokenNumber: 1 });

    if (!nextAppointment) {
      return res.json({ success: false, message: 'No patients in queue' });
    }

    nextAppointment.status = 'consulting';
    nextAppointment.consultationStartTime = new Date();
    nextAppointment.checkInStatus = 'in_room';
    await nextAppointment.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_${doctorRecord._id}`).emit('appointmentUpdate', {
        appointmentId: nextAppointment._id,
        status: nextAppointment.status,
        tokenNumber: nextAppointment.tokenNumber,
        doctorId: doctorRecord._id
      });
      io.emit('appointmentUpdate', {
        appointmentId: nextAppointment._id,
        status: nextAppointment.status,
        tokenNumber: nextAppointment.tokenNumber,
        doctorId: doctorRecord._id
      });
    }

    const patient = {
      _id: nextAppointment._id,
      patientName: nextAppointment.patient?.name || 'Unknown Patient',
      tokenNumber: nextAppointment.tokenNumber,
      timeSlot: nextAppointment.time,
      contact: nextAppointment.patient?.phone || nextAppointment.patient?.email || 'N/A'
    };

    res.json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete the current appointment (Strictly Doctor assigned to this appointment)
router.post('/complete/:id', auth, authorizeRoles('doctor'), async (req, res) => {
  try {
    const doctorRecord = await Doctor.findOne({ email: req.user.email });
    if (!doctorRecord) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: doctorRecord._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or not assigned to your chamber' });
    }

    appointment.status = 'completed';
    appointment.checkInStatus = 'completed';
    appointment.consultationEndTime = new Date();
    if (appointment.consultationStartTime) {
      appointment.actualDuration = Math.max(1, Math.round((appointment.consultationEndTime - appointment.consultationStartTime) / 60000));
    }
    await appointment.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_${doctorRecord._id}`).emit('appointmentUpdate', {
        appointmentId: appointment._id,
        status: appointment.status,
        tokenNumber: appointment.tokenNumber,
        doctorId: doctorRecord._id
      });
      io.emit('appointmentUpdate', {
        appointmentId: appointment._id,
        status: appointment.status,
        tokenNumber: appointment.tokenNumber,
        doctorId: doctorRecord._id
      });
    }

    res.json({ success: true, message: 'Consultation marked as completed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all appointments (Admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email phone bloodGroup')
      .populate('doctor', 'name specialization clinic')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single appointment by ID (Resource Owner Verification)
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone bloodGroup healthCardId')
      .populate('doctor', 'name specialization clinic timings address phone profileImage');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Role-based Resource Ownership Check:
    // Admin: allowed
    // Patient: must be the patient who owns the appointment
    // Doctor: must be the assigned doctor
    if (req.user.role === 'patient') {
      const patientId = appointment.patient?._id || appointment.patient;
      if (String(patientId) !== String(req.user._id)) {
        return res.status(403).json({
          message: 'Access denied. You are not authorized to view another patient\'s appointment.'
        });
      }
    } else if (req.user.role === 'doctor') {
      const doctorRecord = await Doctor.findOne({ email: req.user.email });
      const doctorId = appointment.doctor?._id || appointment.doctor;
      if (!doctorRecord || String(doctorId) !== String(doctorRecord._id)) {
        return res.status(403).json({
          message: 'Access denied. You are not authorized to view this appointment.'
        });
      }
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Book appointment
// Strictly validates role and sanitizes input: patient cannot tamper tokenNumber or priority
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    // Validate required fields
    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: 'Doctor ID, date, and time are required' });
    }

    // Validate date is not in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return res.status(400).json({ message: 'Cannot book appointments in the past' });
    }

    // Check if doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.isActive === false) {
      return res.status(404).json({ message: 'Doctor not found or currently inactive' });
    }

    // Resource Owner Protection:
    // A patient can ONLY book for themselves (req.user._id). Disregard any spoofed patient ID in body.
    const bookingPatientId = req.user._id;

    // Check for duplicate active booking on same date with same doctor
    const existingAppointment = await Appointment.findOne({
      patient: bookingPatientId,
      doctor: doctorId,
      date: appointmentDate,
      status: { $nin: ['cancelled', 'completed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'You already have an active booking with this doctor for this date' });
    }

    // Atomic race-condition safe token allocation
    const tokenNumber = await getNextAtomicTokenNumber(doctorId, date);

    // Patient cannot tamper priority or status or payment
    const appointment = new Appointment({
      patient: bookingPatientId,
      doctor: doctorId,
      date,
      time,
      tokenNumber, // Server-generated atomic token
      priority: req.user.role === 'admin' && req.body.priority ? req.body.priority : 'normal',
      status: 'pending',
      queueType: 'online'
    });

    await appointment.save();
    await appointment.populate('doctor', 'name specialization clinic');

    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_${doctorId}`).emit('queue:new_token', appointment);
      io.emit('appointmentUpdate', {
        appointmentId: appointment._id,
        status: appointment.status,
        tokenNumber: appointment.tokenNumber,
        doctorId: appointment.doctor?._id || appointment.doctor
      });
    }

    try {
      const { sendAppointmentReminder } = require('../services/notificationService');
      sendAppointmentReminder(req.user, appointment, doctor);
    } catch (notifErr) {
      console.warn('Notification reminder dispatch failed:', notifErr.message);
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error during booking', error: error.message });
  }
});

// Update appointment status (Admin only)
router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('patient', 'name').populate('doctor', 'name');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await logAuditAction({
      user: req.user,
      action: 'ADMIN_UPDATE_APPOINTMENT_STATUS',
      resource: 'Appointment',
      targetPatientId: appointment.patient?._id,
      details: { appointmentId: appointment._id, status },
      ip: req.ip
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('appointmentUpdate', {
        appointmentId: appointment._id,
        status: appointment.status,
        tokenNumber: appointment.tokenNumber,
        doctorId: appointment.doctor?._id || appointment.doctor
      });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reschedule appointment (Patient can reschedule own; Admin can reschedule any)
router.put('/:id/reschedule', auth, async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && String(appointment.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. You can only reschedule your own appointments.' });
    }

    if (doctorId && doctorId !== String(appointment.doctor)) {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor || doctor.isActive === false) {
        return res.status(404).json({ message: 'Doctor not found or inactive' });
      }
      appointment.doctor = doctorId;
    }

    if (date) {
      appointment.date = new Date(date);
    }
    if (time) {
      appointment.time = time;
    }

    if (doctorId || date) {
      // Re-assign atomic token for target doctor and date
      appointment.tokenNumber = await getNextAtomicTokenNumber(appointment.doctor, appointment.date);
    }

    await appointment.save();
    await appointment.populate('patient', 'name');
    await appointment.populate('doctor', 'name specialization');

    const io = req.app.get('io');
    if (io) {
      io.emit('appointmentUpdate', {
        appointmentId: appointment._id,
        status: appointment.status,
        tokenNumber: appointment.tokenNumber,
        doctorId: appointment.doctor?._id || appointment.doctor
      });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get queue for a doctor on a specific date (Admin or Assigned Doctor)
router.get('/queue/:doctorId/:date', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
    }

    // Role check: Admin or the specific doctor
    if (req.user.role === 'patient') {
      return res.status(403).json({ message: 'Access denied. Staff only.' });
    }

    if (req.user.role === 'doctor') {
      const doctorRecord = await Doctor.findOne({ email: req.user.email });
      if (!doctorRecord || String(doctorRecord._id) !== String(doctorId)) {
        return res.status(403).json({ message: 'Access denied. You can only view your own chamber queue.' });
      }
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'checked_in', 'in_queue', 'booked', 'waiting', 'ongoing'] }
    })
      .populate('patient', 'name phone bloodGroup')
      .populate('doctor', 'name specialization')
      .sort({ priority: -1, tokenNumber: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ message: 'Failed to fetch queue', error: error.message });
  }
});

// Cancel appointment (Patient can cancel own; Admin can cancel any)
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization: patient can cancel own, admin can cancel any
    if (req.user.role !== 'admin' && String(appointment.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. You are not authorized to cancel this appointment.' });
    }

    // Cannot cancel already completed or cancelled appointments
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Cannot cancel a ' + appointment.status + ' appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    await logAuditAction({
      user: req.user,
      action: 'CANCEL_APPOINTMENT',
      resource: 'Appointment',
      targetPatientId: appointment.patient,
      details: { appointmentId: appointment._id, tokenNumber: appointment.tokenNumber },
      ip: req.ip
    });

    // Notify clients about cancellation
    const io = req.app.get('io');
    if (io) {
      io.emit('appointmentUpdate', {
        appointmentId: appointment._id,
        status: appointment.status,
        tokenNumber: appointment.tokenNumber,
        doctorId: appointment.doctor
      });
    }

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Failed to cancel appointment', error: error.message });
  }
});

// Patient-facing Live Queue status for a doctor (Public tokens display without private medical data)
router.get('/live-queue/:doctorId/:date?', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const targetDate = req.params.date ? new Date(req.params.date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const doctor = await Doctor.findById(doctorId).select('name specialization clinic timings address rating experience profileImage');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    }).sort({ priority: -1, tokenNumber: 1 });

    const consultingApt = appointments.find((a) => a.status === 'consulting');
    const waitingApts = appointments.filter((a) =>
      ['confirmed', 'checked_in', 'in_queue', 'booked', 'waiting', 'ongoing'].includes(a.status)
    );
    const completedCount = appointments.filter((a) => a.status === 'completed').length;

    const currentServingToken = consultingApt
      ? consultingApt.tokenNumber
      : waitingApts[0]
      ? waitingApts[0].tokenNumber
      : completedCount > 0
      ? appointments[appointments.length - 1]?.tokenNumber
      : 1;

    res.json({
      doctor,
      date: startOfDay.toISOString().split('T')[0],
      currentServingToken: currentServingToken || 1,
      isCurrentlyConsulting: Boolean(consultingApt),
      totalAppointments: appointments.length,
      waitingCount: waitingApts.length,
      completedCount,
      activeQueue: waitingApts.map((a) => ({
        tokenNumber: a.tokenNumber,
        time: a.time,
        status: a.status
      }))
    });
  } catch (error) {
    console.error('Error fetching live queue:', error);
    res.status(500).json({ message: 'Failed to fetch live queue', error: error.message });
  }
});

// Patient-facing Track Token Status
router.get('/track-token', async (req, res) => {
  try {
    const { tokenNumber, doctorId, appointmentId } = req.query;

    let query = {};
    if (appointmentId) {
      query._id = appointmentId;
    } else if (tokenNumber && doctorId) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      query = {
        tokenNumber: parseInt(tokenNumber, 10),
        doctor: doctorId,
        date: { $gte: todayStart, $lte: todayEnd }
      };
    } else {
      return res.status(400).json({ message: 'Provide either appointmentId or tokenNumber & doctorId' });
    }

    const appointment = await Appointment.findOne(query)
      .populate('doctor', 'name specialization clinic timings address rating phone profileImage')
      .populate('patient', 'name phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment / token not found for today' });
    }

    const apptDate = new Date(appointment.date);
    const startOfDay = new Date(apptDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(apptDate);
    endOfDay.setHours(23, 59, 59, 999);

    const allDayApts = await Appointment.find({
      doctor: appointment.doctor._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    }).sort({ priority: -1, tokenNumber: 1 });

    const consultingApt = allDayApts.find((a) => a.status === 'consulting');
    const currentServingToken = consultingApt
      ? consultingApt.tokenNumber
      : allDayApts.find((a) => ['confirmed', 'in_queue', 'waiting', 'checked_in'].includes(a.status))?.tokenNumber || 1;

    const tokensAhead = Math.max(0, appointment.tokenNumber - currentServingToken);
    const estimatedWaitMinutes =
      appointment.status === 'completed'
        ? 0
        : appointment.status === 'consulting'
        ? 0
        : Math.max(5, tokensAhead * 15);

    res.json({
      appointment,
      currentServingToken,
      tokensAhead,
      estimatedWaitMinutes,
      totalTokensToday: allDayApts.length,
      isNext: tokensAhead === 1,
      isNow: appointment.status === 'consulting' || (currentServingToken === appointment.tokenNumber && appointment.status !== 'completed')
    });
  } catch (error) {
    console.error('Error tracking token:', error);
    res.status(500).json({ message: 'Failed to track token', error: error.message });
  }
});

module.exports = router;
