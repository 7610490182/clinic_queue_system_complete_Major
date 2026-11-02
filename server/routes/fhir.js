const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');
const {
  validateAbhaId,
  validateAbhaAddress,
  toFHIRPatient,
  toFHIRPractitioner,
  toFHIRAppointment,
  toFHIRBundle
} = require('../services/fhirService');

/**
 * GET /api/fhir/patient/:id
 * Export HL7 FHIR R4 Patient Resource
 * Protected: Patient can view self, assigned Doctor, or Admin.
 */
router.get('/patient/:id', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Resource owner checks
    if (req.user.role === 'patient' && String(req.user._id) !== String(targetUserId)) {
      return res.status(403).json({ message: 'Access denied. You can only access your own FHIR patient resource.' });
    }

    if (req.user.role === 'doctor') {
      const doctorRecord = await Doctor.findOne({ email: req.user.email });
      const hasAppointment = await Appointment.findOne({ doctor: doctorRecord?._id, patient: targetUserId });
      if (!hasAppointment) {
        return res.status(403).json({ message: 'Access denied. You are not authorized for this patient\'s records.' });
      }
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Patient not found' }] });
    }
    const fhirResource = toFHIRPatient(user);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(fhirResource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fhir/practitioner/:id
 * Export HL7 FHIR R4 Practitioner Resource
 */
router.get('/practitioner/:id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Doctor not found' }] });
    }
    const fhirResource = toFHIRPractitioner(doctor);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(fhirResource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fhir/bundle/:id
 * Export complete ABDM/FHIR R4 Bundle for an appointment OR patient user
 * Protected: Resource ownership check.
 */
router.get('/bundle/:id', auth, async (req, res) => {
  try {
    // 1. Try finding by Appointment ID
    let appointment = await Appointment.findById(req.params.id).populate('patient').populate('doctor');

    // 2. If not an appointment, check if :id is a Patient User ID
    if (!appointment) {
      const user = await User.findById(req.params.id);
      if (user) {
        // Ownership check
        if (req.user.role === 'patient' && String(req.user._id) !== String(user._id)) {
          return res.status(403).json({ message: 'Access denied. You can only export your own FHIR bundle.' });
        }

        appointment = await Appointment.findOne({ patient: user._id }).populate('doctor');
        if (appointment) {
          appointment.patient = user;
        } else {
          // Patient has no appointments yet; construct a patient-only FHIR Bundle
          const patientFhir = toFHIRPatient(user);
          const emptyBundle = {
            resourceType: 'Bundle',
            id: `bundle-patient-${user._id}`,
            meta: {
              versionId: '1',
              lastUpdated: new Date().toISOString(),
              profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle']
            },
            type: 'collection',
            timestamp: new Date().toISOString(),
            total: 1,
            entry: [{ fullUrl: `urn:uuid:patient-${user._id}`, resource: patientFhir }]
          };
          res.setHeader('Content-Type', 'application/fhir+json');
          return res.json(emptyBundle);
        }
      }
    }

    if (!appointment) {
      return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Record not found for given ID' }] });
    }

    // Ownership check for appointment bundle
    if (req.user.role === 'patient' && String(appointment.patient?._id || appointment.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. You do not own this appointment bundle.' });
    }

    if (req.user.role === 'doctor') {
      const doctorRecord = await Doctor.findOne({ email: req.user.email });
      if (!doctorRecord || String(appointment.doctor?._id || appointment.doctor) !== String(doctorRecord._id)) {
        return res.status(403).json({ message: 'Access denied. You are not authorized for this appointment bundle.' });
      }
    }

    const bundle = toFHIRBundle(appointment, appointment.patient, appointment.doctor);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fhir/validate-abha
 * Mock ABHA Address / ID validation endpoint
 */
router.post('/validate-abha', auth, async (req, res) => {
  try {
    const { abhaId, abhaAddress } = req.body;
    let idValid = true;
    let addrValid = true;

    if (abhaId) idValid = validateAbhaId(abhaId);
    if (abhaAddress) addrValid = validateAbhaAddress(abhaAddress);

    res.json({
      valid: idValid && addrValid,
      abhaIdValid: idValid,
      abhaAddressValid: addrValid,
      gatewayResponse: {
        status: idValid && addrValid ? 'VERIFIED' : 'FAILED',
        timestamp: new Date().toISOString(),
        network: 'ABDM Unified Health Interface (Sandbox)'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
