const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const AuditLog = require('../models/AuditLog');
const { auth, adminAuth, authorizeRoles } = require('../middleware/auth');

/**
 * GET /api/records/timeline/:patientId
 * Get comprehensive patient timeline: visits, prescriptions, vitals, uploaded lab reports
 */
router.get('/timeline/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check if requester is authorized (the patient himself, or an authorized doctor, or admin)
    const isSelf = String(req.user.id || req.user._id) === String(patientId);
    const isAdmin = req.user.role === 'admin';
    let isDoctorAuthorized = false;

    const patient = await User.findById(patientId).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.user.role === 'doctor') {
      const doctorRecord = await Doctor.findOne({ $or: [{ email: req.user.email }, { name: req.user.name }] });
      if (doctorRecord) {
        const hasAppointment = await Appointment.findOne({
          doctor: doctorRecord._id,
          patient: patientId
        });
        const activeConsent = patient.activeConsents?.find(
          c => (String(c.doctor) === String(doctorRecord._id) || String(c.doctor) === String(req.user.id)) &&
               c.status === 'active' &&
               new Date(c.expiresAt) > new Date()
        );
        if (hasAppointment || activeConsent) {
          isDoctorAuthorized = true;
        }
      }
    }

    if (!isSelf && !isAdmin && !isDoctorAuthorized) {
      await AuditLog.create({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'VIEW_RECORD',
        resource: 'PatientTimeline',
        targetPatientId: patientId,
        status: 'DENIED',
        ipAddress: req.ip
      });
      return res.status(403).json({ message: 'Access denied. You do not have permission to view this patient\'s records.' });
    }

    // Fetch all patient appointments with prescriptions
    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'name specialization clinic address phone')
      .sort({ date: -1 });

    // Log successful audit
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'VIEW_RECORD',
      resource: 'PatientTimeline',
      targetPatientId: patientId,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      patient: {
        id: patient._id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        medicalHistory: patient.medicalHistory,
        healthCardId: patient.healthCardId,
        abhaId: patient.abhaId,
        abhaAddress: patient.abhaAddress,
        medicalRecords: patient.medicalRecords || [],
        activeConsents: patient.activeConsents || []
      },
      appointments
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ message: 'Failed to fetch timeline', error: error.message });
  }
});

/**
 * POST /api/records/consent
 * Patient grants or revokes consent to a doctor (DPDP Act Compliance)
 */
router.post('/consent', auth, async (req, res) => {
  try {
    const { doctorId, action, purpose, durationDays } = req.body;
    const patient = await User.findById(req.user.id);
    const doctor = await Doctor.findById(doctorId);

    if (!patient || !doctor) {
      return res.status(404).json({ message: 'Patient or Doctor not found' });
    }

    if (action === 'grant') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));

      // Remove existing consent if any
      patient.activeConsents = (patient.activeConsents || []).filter(
        c => c.doctor?.toString() !== doctorId.toString()
      );

      patient.activeConsents.push({
        doctor: doctor._id,
        doctorName: doctor.name,
        grantedAt: new Date(),
        expiresAt,
        purpose: purpose || 'Clinical Diagnosis and Continuity of Care',
        status: 'active'
      });
    } else if (action === 'revoke') {
      patient.activeConsents = (patient.activeConsents || []).map(c => {
        if (c.doctor?.toString() === doctorId.toString()) {
          c.status = 'revoked';
        }
        return c;
      });
    }

    await patient.save();

    await AuditLog.create({
      userId: patient._id,
      userName: patient.name,
      userRole: 'patient',
      action: action === 'grant' ? 'GRANT_CONSENT' : 'REVOKE_CONSENT',
      resource: 'ConsentArtifact',
      targetPatientId: patient._id,
      details: { doctor: doctor.name, purpose },
      ipAddress: req.ip
    });

    res.json({ success: true, message: `Consent ${action}ed successfully`, consents: patient.activeConsents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update consent', error: error.message });
  }
});

/**
 * POST /api/records/upload
 * Add report/record entry to patient's digital health record
 */
router.post('/upload', auth, async (req, res) => {
  try {
    const { title, category, doctorName, fileUrl, summary } = req.body;
    const patient = await User.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    patient.medicalRecords.unshift({
      title: title || 'Clinical Lab Document',
      category: category || 'Lab Report',
      doctorName: doctorName || 'Attending Physician',
      date: new Date(),
      fileUrl: fileUrl || '',
      summary: summary || ''
    });

    await patient.save();

    await AuditLog.create({
      userId: patient._id,
      userRole: 'patient',
      action: 'UPLOAD_RECORD',
      resource: 'MedicalRecord',
      targetPatientId: patient._id,
      details: { title, category },
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Health record saved to digital profile', records: patient.medicalRecords });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload record', error: error.message });
  }
});

/**
 * GET /api/records/audit-logs
 * Healthcare-grade compliance audit log trail (Admin only)
 */
router.get('/audit-logs', auth, adminAuth, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
});

/**
 * POST /api/records/export
 * DPDP Act data portability export (download complete JSON health record)
 */
router.post('/export', auth, async (req, res) => {
  try {
    const patient = await User.findById(req.user.id).select('-password');
    const appointments = await Appointment.find({ patient: req.user.id }).populate('doctor', 'name specialization clinic');

    await AuditLog.create({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'EXPORT_DATA',
      resource: 'PatientDataExport',
      targetPatientId: req.user.id,
      ipAddress: req.ip
    });

    res.json({
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        framework: 'India DPDP Act 2023 Compliant Data Export',
        patientName: patient.name,
        abhaId: patient.abhaId
      },
      patient,
      appointments
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to export patient data', error: error.message });
  }
});

module.exports = router;

