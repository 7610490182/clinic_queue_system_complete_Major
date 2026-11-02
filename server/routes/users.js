const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { auth, adminAuth, logAuditAction } = require('../middleware/auth');

const router = express.Router();

// Get all patients (Admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password').sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a patient by ID (Admin, or Self, or Doctor assigned to patient)
router.get('/:id', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Check authorization: Admin can view any; Patient can view self
    if (req.user.role === 'patient' && String(req.user._id) !== String(targetUserId)) {
      return res.status(403).json({ message: 'Access denied. You cannot view another patient\'s account.' });
    }

    if (req.user.role === 'doctor') {
      // Check if doctor has an appointment with this patient
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findOne({ email: req.user.email });
      if (!doctor) {
        return res.status(403).json({ message: 'Doctor profile not found.' });
      }
      const hasAppointment = await Appointment.findOne({ doctor: doctor._id, patient: targetUserId });
      const targetUser = await User.findById(targetUserId);
      const hasConsent = targetUser?.activeConsents?.some(
        c => String(c.doctor) === String(doctor._id) && c.status === 'active'
      );
      if (!hasAppointment && !hasConsent) {
        return res.status(403).json({ message: 'Access denied. You are not authorized for this patient\'s care.' });
      }
    }

    const patient = await User.findById(targetUserId).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient details (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, email, phone, bloodGroup, age, gender, address, isActive } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone) updateData.phone = phone;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (address !== undefined) updateData.address = address;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPatient = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await logAuditAction({
      user: req.user,
      action: 'UPDATE_PATIENT',
      resource: 'User',
      targetPatientId: updatedPatient._id,
      details: { updatedFields: Object.keys(updateData) },
      ip: req.ip
    });

    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle User/Patient Account Status (Active / Deactive) (Admin only)
router.patch('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive boolean flag is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    user.isActive = isActive;
    await user.save();

    await logAuditAction({
      user: req.user,
      action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      resource: 'User',
      targetPatientId: user._id,
      details: { email: user.email, role: user.role, isActive },
      ip: req.ip
    });

    res.json({
      success: true,
      message: `Account for ${user.name} (${user.email}) has been ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update account status', error: error.message });
  }
});

// Delete patient (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const deletedPatient = await User.findByIdAndDelete(req.params.id);
    if (!deletedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await logAuditAction({
      user: req.user,
      action: 'DELETE_PATIENT',
      resource: 'User',
      targetPatientId: req.params.id,
      details: { email: deletedPatient.email, name: deletedPatient.name },
      ip: req.ip
    });

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
