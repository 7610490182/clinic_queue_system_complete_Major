const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { auth, authorizeRoles } = require('../middleware/auth');
const { predictQueueWaitTime } = require('../services/queuePredictor');
const { getNextAtomicTokenNumber } = require('../services/tokenService');

/**
 * GET /api/queue/:doctorId
 * Fetch active dynamic queue for a doctor today with AI predictions
 */
router.get('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled'] }
    })
      .populate('patient', 'name phone bloodGroup healthCardId')
      .sort({ priority: -1, tokenNumber: 1 });

    // Identify currently consulting patient
    const currentConsulting = appointments.find(a => a.status === 'consulting');

    // Enrich each appointment with AI prediction
    const enrichedQueue = await Promise.all(
      appointments.map(async (apt) => {
        const prediction = await predictQueueWaitTime(doctorId, apt.tokenNumber);
        return {
          ...apt.toObject(),
          aiPrediction: prediction
        };
      })
    );

    res.json({
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        clinic: doctor.clinic
      },
      currentConsultingToken: currentConsulting ? currentConsulting.tokenNumber : null,
      totalWaiting: appointments.filter(a => ['confirmed', 'checked_in', 'in_queue'].includes(a.status)).length,
      queue: enrichedQueue
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ message: 'Server error fetching queue', error: error.message });
  }
});

/**
 * GET /api/queue/predict/:doctorId/:tokenNumber
 * Direct AI wait-time prediction telemetry for a specific token
 */
router.get('/predict/:doctorId/:tokenNumber', async (req, res) => {
  try {
    const { doctorId, tokenNumber } = req.params;
    const prediction = await predictQueueWaitTime(doctorId, parseInt(tokenNumber, 10));
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating prediction', error: error.message });
  }
});

/**
 * POST /api/queue/qr-checkin
 * Contactless QR / Check-In Code Scanner endpoint
 * Validates check-in code and updates patient to checked_in status with instant queue broadcast
 */
router.post('/qr-checkin', async (req, res) => {
  try {
    const { checkInCode, appointmentId } = req.body;

    const query = {};
    if (checkInCode) query.checkInCode = checkInCode.trim().toUpperCase();
    if (appointmentId) query._id = appointmentId;

    const appointment = await Appointment.findOne(query).populate('patient', 'name phone').populate('doctor', 'name specialization');
    if (!appointment) {
      return res.status(404).json({ message: 'Invalid QR Code or Check-in PIN. Appointment not found.' });
    }

    if (appointment.checkInStatus === 'checked_in') {
      return res.json({
        message: 'Patient already checked in.',
        alreadyCheckedIn: true,
        appointment
      });
    }

    appointment.checkInStatus = 'checked_in';
    appointment.checkInTime = new Date();
    if (appointment.status === 'confirmed') {
      appointment.status = 'checked_in';
    }
    await appointment.save();

    // Log compliance audit
    await AuditLog.create({
      userId: appointment.patient?._id,
      userName: appointment.patient?.name,
      userRole: 'patient',
      action: 'QR_CHECKIN',
      resource: 'Appointment',
      targetPatientId: appointment.patient?._id,
      details: { tokenNumber: appointment.tokenNumber, doctor: appointment.doctor?.name },
      ipAddress: req.ip
    });

    // Notify socket clients
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_${appointment.doctor?._id}`).emit('queue:patient_checked_in', {
        appointmentId: appointment._id,
        tokenNumber: appointment.tokenNumber,
        patientName: appointment.patient?.name
      });
    }

    res.json({
      success: true,
      message: `Token #${appointment.tokenNumber} marked Checked-In successfully!`,
      appointment
    });
  } catch (error) {
    console.error('Error during QR check-in:', error);
    res.status(500).json({ message: 'Check-in failed', error: error.message });
  }
});

/**
 * POST /api/queue/:appointmentId/triage
 * Emergency priority triage escalation (Normal -> Priority -> Emergency)
 * Restricted to Staff (Admin and Doctors). Patients forbidden.
 */
router.post('/:appointmentId/triage', auth, authorizeRoles('admin', 'doctor'), async (req, res) => {
  try {
    const { priority } = req.body; // 'normal', 'priority', 'emergency'
    const normalizedPriority = priority === 'standard' ? 'normal' : priority;
    if (!['normal', 'priority', 'emergency'].includes(normalizedPriority)) {
      return res.status(400).json({ message: 'Invalid priority level' });
    }

    const appointment = await Appointment.findById(req.params.appointmentId).populate('doctor', 'name');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.priority = normalizedPriority;
    await appointment.save();

    // Log triage action in audit log
    await AuditLog.create({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'TRIAGE_EMERGENCY',
      resource: 'Queue',
      targetPatientId: appointment.patient,
      details: { priority, tokenNumber: appointment.tokenNumber },
      ipAddress: req.ip
    });

    // Broadcast queue update
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_${appointment.doctor._id}`).emit('queue:priority_changed', {
        appointmentId: appointment._id,
        tokenNumber: appointment.tokenNumber,
        priority
      });
    }

    res.json({ success: true, message: `Token #${appointment.tokenNumber} priority set to ${priority}`, appointment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update triage priority', error: error.message });
  }
});

/**
 * POST /api/queue/:appointmentId/status
 * Update status (consulting, completed, no_show, late)
 * Restricted to Staff (Admin and Doctor). Patients forbidden.
 */
router.post('/:appointmentId/status', auth, authorizeRoles('admin', 'doctor'), async (req, res) => {
  try {
    const { status, actualDuration } = req.body;
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // If doctor, verify this appointment belongs to their chamber
    if (req.user.role === 'doctor') {
      const doctorRecord = await Doctor.findOne({ email: req.user.email });
      if (!doctorRecord || String(appointment.doctor) !== String(doctorRecord._id)) {
        return res.status(403).json({ message: 'Access denied. You can only update appointments for your own chamber.' });
      }
    }

    appointment.status = status;
    if (status === 'consulting') {
      appointment.consultationStartTime = new Date();
      appointment.checkInStatus = 'in_room';
    } else if (status === 'completed') {
      appointment.consultationEndTime = new Date();
      appointment.checkInStatus = 'completed';
      if (appointment.consultationStartTime) {
        appointment.actualDuration = Math.round((appointment.consultationEndTime - appointment.consultationStartTime) / 60000) || actualDuration || 15;
      } else if (actualDuration) {
        appointment.actualDuration = actualDuration;
      }
    }

    await appointment.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_${appointment.doctor}`).emit('queue:status_changed', {
        appointmentId: appointment._id,
        tokenNumber: appointment.tokenNumber,
        status
      });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
});

/**
 * POST /api/queue/walkin
 * Instant walk-in token generation with atomic token sequencing (prevents race conditions)
 * Restricted to Staff (Admin and Doctor)
 */
router.post('/walkin', auth, authorizeRoles('admin', 'doctor'), async (req, res) => {
  try {
    const { doctorId, patientName, patientPhone, phone, priority } = req.body;
    if (!doctorId || !patientName) {
      return res.status(400).json({ message: 'Doctor ID and patient name are required' });
    }

    const contactPhone = patientPhone || phone || '9800000000';
    const today = new Date();

    // Atomic race-condition safe token allocation
    const nextTokenNumber = await getNextAtomicTokenNumber(doctorId, today);

    // Find or create temporary walk-in user
    let user = await User.findOne({ phone: contactPhone });
    if (!user) {
      user = await User.create({
        name: patientName,
        phone: contactPhone,
        email: `walkin_${Date.now()}@clinic.local`,
        password: 'walkinpassword123',
        role: 'patient',
        isActive: true
      });
    }

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const appointment = await Appointment.create({
      patient: user._id,
      doctor: doctorId,
      date: today,
      time: timeString,
      tokenNumber: nextTokenNumber,
      status: 'checked_in',
      checkInStatus: 'checked_in',
      checkInTime: new Date(),
      queueType: 'walkin',
      priority: priority || 'normal'
    });

    const populated = await Appointment.findById(appointment._id).populate('doctor', 'name specialization clinic');

    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_${doctorId}`).emit('queue:new_token', populated);
    }

    res.status(201).json({ success: true, message: `Walk-in Token #${nextTokenNumber} allocated!`, appointment: populated });
  } catch (error) {
    console.error('Walk-in error:', error);
    res.status(500).json({ message: 'Failed to generate walk-in token', error: error.message });
  }
});

module.exports = router;

