const express = require('express');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { auth, adminAuth, logAuditAction } = require('../middleware/auth');

const router = express.Router();

// Get all doctors (Public/Active)
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add doctor (Admin only - Official Doctor Provisioning Workflow)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, specialization, email, phone, experience, timings, availableDays, password } = req.body;

    // Validate required fields
    if (!name || !specialization || !email || !experience) {
      return res.status(400).json({ message: 'Name, specialization, email, and experience are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email: cleanEmail });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }

    // Check if user already exists for this email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'A user account with this email already exists' });
    }

    const doctorUser = new User({
      name: name.trim(),
      email: cleanEmail,
      phone,
      password: password || 'doctor123',
      role: 'doctor',
      isActive: true
    });
    await doctorUser.save();

    const doctor = new Doctor({
      userId: doctorUser._id,
      name: name.trim(),
      specialization,
      email: cleanEmail,
      phone,
      experience,
      timings: timings || { start: '09:00', end: '17:00' },
      availableDays: availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isActive: true
    });
    await doctor.save();

    // Audit log
    await logAuditAction({
      user: req.user,
      action: 'CREATE_DOCTOR',
      resource: 'Doctor',
      details: { doctorId: doctor._id, name: doctor.name, email: doctor.email },
      ip: req.ip
    });

    res.status(201).json(doctor);
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ message: 'Failed to add doctor', error: error.message });
  }
});

// Update doctor (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const { email, name, phone, password, specialization, experience, timings, availableDays, isActive } = req.body;
    const updatedDoctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    const doctorUser = await User.findOne({ email: doctor.email, role: 'doctor' });
    if (doctorUser) {
      const userUpdate = {};
      if (email) userUpdate.email = email.trim().toLowerCase();
      if (name) userUpdate.name = name.trim();
      if (phone) userUpdate.phone = phone;
      if (isActive !== undefined) userUpdate.isActive = isActive;

      if (Object.keys(userUpdate).length > 0) {
        await User.findOneAndUpdate(
          { email: doctor.email, role: 'doctor' },
          userUpdate,
          { new: true, runValidators: true }
        );
      }

      if (password) {
        doctorUser.password = password;
        await doctorUser.save();
      }
    }

    // Audit log
    await logAuditAction({
      user: req.user,
      action: 'UPDATE_DOCTOR',
      resource: 'Doctor',
      details: { doctorId: doctor._id, changes: Object.keys(req.body) },
      ip: req.ip
    });

    res.json(updatedDoctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ message: 'Failed to update doctor', error: error.message });
  }
});

// Toggle Doctor Status (Active / Deactive) (Admin only)
router.patch('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive boolean flag is required' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isActive = isActive;
    await doctor.save();

    // Synchronize linked User account so sessions are immediately blocked
    await User.findOneAndUpdate(
      { email: doctor.email, role: 'doctor' },
      { isActive }
    );

    // Audit log
    await logAuditAction({
      user: req.user,
      action: isActive ? 'ACTIVATE_DOCTOR' : 'DEACTIVATE_DOCTOR',
      resource: 'Doctor',
      details: { doctorId: doctor._id, doctorName: doctor.name, isActive },
      ip: req.ip
    });

    res.json({
      success: true,
      message: `Doctor ${doctor.name} has been ${isActive ? 'activated' : 'deactivated'} successfully`,
      doctor
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change doctor status', error: error.message });
  }
});

// Reseed real Gwalior doctors (Admin only)
router.post('/reseed', auth, adminAuth, async (req, res) => {
  try {
    const { seedDatabase } = require('../seed');
    await seedDatabase({ skipClear: false, closeConnection: false });
    const doctors = await Doctor.find();

    await logAuditAction({
      user: req.user,
      action: 'RESEED_DOCTORS',
      resource: 'Doctor',
      details: { count: doctors.length },
      ip: req.ip
    });

    res.json({ success: true, count: doctors.length, doctors });
  } catch (error) {
    console.error('Error reseeding doctors:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete doctor (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await User.findOneAndDelete({ email: doctor.email, role: 'doctor' });
    await Doctor.findByIdAndDelete(req.params.id);

    // Audit log
    await logAuditAction({
      user: req.user,
      action: 'DELETE_DOCTOR',
      resource: 'Doctor',
      details: { doctorId: req.params.id, doctorName: doctor.name },
      ip: req.ip
    });

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Failed to delete doctor', error: error.message });
  }
});

module.exports = router;
