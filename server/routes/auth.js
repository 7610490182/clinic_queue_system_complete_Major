const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { auth } = require('../middleware/auth');

const router = express.Router();

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[0-9]{10}$/;

const formatUserData = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  isActive: user.isActive !== false,
  bloodGroup: user.bloodGroup || '',
  age: user.age || null,
  gender: user.gender || '',
  address: user.address || '',
  emergencyContact: user.emergencyContact || { name: '', phone: '', relation: '' },
  allergies: user.allergies || [],
  medicalHistory: user.medicalHistory || [],
  healthCardId: user.healthCardId || `MQ-${String(user._id).slice(-6).toUpperCase()}`,
  createdAt: user.createdAt
});

// Register (Public registration strictly restricted to patient role)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Required fields check
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Role enforcement: Public registration is strictly restricted to patients
    if (role && String(role).trim().toLowerCase() !== 'patient') {
      return res.status(403).json({
        message: 'Public registration is restricted to patient accounts only. Doctor and Administrator accounts must be provisioned by a clinic administrator.'
      });
    }

    // Email format validation
    const cleanEmail = String(email).trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address (e.g. name@example.com)' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Phone validation (strictly 10 digits)
    let cleanPhone = '';
    if (phone) {
      cleanPhone = String(phone).replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ message: 'Mobile number must be exactly 10 digits (e.g. 9876543210)' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email address already exists' });
    }

    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'patient',
      isActive: true,
      phone: cleanPhone
    });
    await user.save();

    const jwtSecret = process.env.JWT_SECRET || 'clinic-queue-jwt-default-secret-key-2026';
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: formatUserData(user)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address format' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Account active check - Reject deactivated users immediately
    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact clinic administration.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Feature 8: Healthcare-Grade 2FA for Clinical Users
    if (user.twoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.twoFactorCode = otp;
      user.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();
      console.log(`[AUTH 2FA] Verification code for ${cleanEmail}: ${otp}`);
      return res.json({
        requires2FA: true,
        email: user.email,
        message: 'Two-Factor authentication code required for clinical access.',
        mockOTP: otp
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'clinic-queue-jwt-default-secret-key-2026';
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '7d' });

    res.json({
      token,
      user: formatUserData(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// Forgot Password - Generate 6-Digit OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email address' });
    }

    // Generate 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    await user.save();

    console.log(`[AUTH] Password Reset OTP for ${cleanEmail}: ${otp}`);

    res.json({
      success: true,
      message: `Password reset verification code has been dispatched.`,
      email: cleanEmail,
      demoOtp: otp // Dispatched OTP code for instant verification
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request', error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordOTP: String(otp).trim(),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please request a new one.' });
    }

    res.json({
      success: true,
      message: 'Verification code confirmed. You may now enter your new password.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify code', error: error.message });
  }
});

// Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, verification code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordOTP: String(otp).trim(),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please request a new one.' });
    }

    user.password = newPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log(`[AUTH] Password successfully reset for ${cleanEmail}`);

    res.json({
      success: true,
      message: 'Your password has been reset successfully! You can now log in with your new credentials.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});

// Change Password (Authenticated user session)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  res.json({
    user: formatUserData(req.user)
  });
});

// Update profile details (Patient / User)
router.put('/profile', auth, async (req, res) => {
  try {
    // Prevent unauthorized role privilege escalation attempts
    if (req.body.role && req.body.role !== req.user.role) {
      return res.status(403).json({
        message: 'Modifying account role is strictly prohibited. Roles can only be managed by a system administrator.'
      });
    }

    const {
      name,
      phone,
      bloodGroup,
      age,
      gender,
      address,
      emergencyContact,
      allergies,
      medicalHistory
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name.trim();

    // Validate phone if supplied
    if (phone !== undefined) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone && cleanPhone.length !== 10) {
        return res.status(400).json({ message: 'Phone number must be exactly 10 digits (e.g. 9876543210)' });
      }
      user.phone = cleanPhone;
    }

    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (address !== undefined) user.address = address;

    if (emergencyContact !== undefined) {
      let icePhone = emergencyContact.phone || '';
      if (icePhone) {
        icePhone = String(icePhone).replace(/\D/g, '').slice(0, 10);
      }
      user.emergencyContact = {
        name: emergencyContact.name || '',
        phone: icePhone,
        relation: emergencyContact.relation || ''
      };
    }

    if (allergies !== undefined) user.allergies = Array.isArray(allergies) ? allergies : [allergies];
    if (medicalHistory !== undefined) user.medicalHistory = Array.isArray(medicalHistory) ? medicalHistory : [medicalHistory];

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: formatUserData(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Feature 8: Verify 2FA code during login
router.post('/2fa/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and 6-digit 2FA code are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || user.twoFactorCode !== String(code).trim() || (user.twoFactorExpires && new Date() > user.twoFactorExpires)) {
      return res.status(400).json({ message: 'Invalid or expired 2FA verification code' });
    }

    user.twoFactorCode = null;
    user.twoFactorExpires = null;
    await user.save();

    const jwtSecret = process.env.JWT_SECRET || 'clinic-queue-jwt-default-secret-key-2026';
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '7d' });

    res.json({
      message: '2FA authentication verified successfully',
      token,
      user: formatUserData(user)
    });
  } catch (error) {
    res.status(500).json({ message: '2FA verification error', error: error.message });
  }
});

// Feature 8: Toggle 2FA for account
router.post('/2fa/toggle', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();

    res.json({
      message: `Two-Factor Authentication has been ${user.twoFactorEnabled ? 'Enabled' : 'Disabled'}`,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle 2FA', error: error.message });
  }
});

module.exports = router;
