const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const AuditLog = require('../models/AuditLog');
const { auth, authorizeRoles } = require('../middleware/auth');

/**
 * POST /api/telemedicine/enable/:appointmentId
 * Convert an appointment into a virtual telemedicine session
 */
router.post('/enable/:appointmentId', auth, authorizeRoles('admin', 'doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const meetingId = `telemed-${appointment._id.toString().substring(18)}-${Date.now().toString(36)}`;
    appointment.telemedicine = {
      isVirtual: true,
      meetingId,
      status: 'waiting_room'
    };

    await appointment.save();
    res.json({ success: true, message: 'Telemedicine room initialized', telemedicine: appointment.telemedicine });
  } catch (error) {
    res.status(500).json({ message: 'Error initializing telemedicine', error: error.message });
  }
});

/**
 * POST /api/telemedicine/vitals/:appointmentId
 * Patient submits pre-consultation vitals & notes before video call
 */
router.post('/vitals/:appointmentId', auth, async (req, res) => {
  try {
    const { bloodPressure, temperature, pulseRate, symptomsNotes } = req.body;
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Ensure the patient owns this appointment
    if (req.user.role === 'patient' && String(appointment.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. You cannot submit vitals for another patient\'s appointment.' });
    }

    if (!appointment.telemedicine) {
      appointment.telemedicine = { isVirtual: true, status: 'waiting_room' };
    }

    appointment.telemedicine.preConsultationVitals = {
      bloodPressure: bloodPressure || '',
      temperature: temperature || '',
      pulseRate: pulseRate || '',
      symptomsNotes: symptomsNotes || ''
    };
    appointment.telemedicine.status = 'waiting_room';

    await appointment.save();

    // Broadcast patient arrival in waiting room
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_${appointment.doctor}`).emit('telemed:patient_waiting', {
        appointmentId: appointment._id,
        vitals: appointment.telemedicine.preConsultationVitals
      });
    }

    res.json({ success: true, message: 'Pre-consultation vitals recorded', vitals: appointment.telemedicine.preConsultationVitals });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save vitals', error: error.message });
  }
});

/**
 * POST /api/telemedicine/prescription/:appointmentId
 * Doctor generates and signs digital prescription (EMR)
 * Strictly Doctor only. Admins and Patients are forbidden.
 */
router.post('/prescription/:appointmentId', auth, authorizeRoles('doctor'), async (req, res) => {
  try {
    const { medicines, diagnosis, clinicalNotes, investigationsRecommended, dietAdvice, followUpDate } = req.body;

    const appointment = await Appointment.findById(req.params.appointmentId).populate('doctor', 'name specialization clinic');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify assigned doctor
    const doctorRecord = await Doctor.findOne({ $or: [{ email: req.user.email }, { name: req.user.name }] });
    const doctorId = appointment.doctor?._id || appointment.doctor;
    if (!doctorRecord || String(doctorId) !== String(doctorRecord._id)) {
      return res.status(403).json({
        message: 'Access denied. You are only authorized to issue prescriptions for your own assigned patients.'
      });
    }

    const prescriptionId = `RX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    appointment.prescription = {
      prescriptionId,
      medicines: medicines || [],
      diagnosis: diagnosis || 'General Medical Consultation',
      clinicalNotes: clinicalNotes || '',
      investigationsRecommended: investigationsRecommended || [],
      dietAdvice: dietAdvice || '',
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      issuedAt: new Date()
    };
    appointment.status = 'completed';
    appointment.checkInStatus = 'completed';
    await appointment.save();

    // Log audit trail for EMR generation
    await AuditLog.create({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'ISSUE_PRESCRIPTION',
      resource: 'Prescription',
      targetPatientId: appointment.patient,
      details: { prescriptionId, diagnosis, medicinesCount: medicines?.length },
      ipAddress: req.ip
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`patient_${appointment.patient}`).emit('telemed:prescription_ready', {
        appointmentId: appointment._id,
        prescription: appointment.prescription
      });
    }

    res.json({ success: true, message: 'Digital prescription issued and stored', prescription: appointment.prescription });
  } catch (error) {
    res.status(500).json({ message: 'Failed to issue prescription', error: error.message });
  }
});

module.exports = router;
