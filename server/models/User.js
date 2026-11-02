const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String
  },
  // Feature 8: Healthcare-grade Security & 2FA
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorCode: {
    type: String,
    default: null
  },
  twoFactorExpires: {
    type: Date,
    default: null
  },
  // Feature 10: ABDM (Ayushman Bharat Digital Mission) Interoperability
  abhaId: {
    type: String,
    default: '' // e.g., '14-8291-0492-1823'
  },
  abhaAddress: {
    type: String,
    default: '' // e.g., 'patient@abdm'
  },
  abhaVerified: {
    type: Boolean,
    default: false
  },
  // Digital Patient Profile fields
  bloodGroup: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relation: { type: String, default: '' }
  },
  allergies: {
    type: [String],
    default: []
  },
  medicalHistory: {
    type: [String],
    default: []
  },
  chronicConditions: {
    type: [String],
    default: []
  },
  healthCardId: {
    type: String,
    default: ''
  },
  // Feature 6: Digital Health Records & Uploaded Reports
  medicalRecords: [
    {
      title: { type: String, required: true },
      category: {
        type: String,
        enum: ['Lab Report', 'Prescription', 'Discharge Summary', 'Imaging/X-Ray', 'Vaccine Certificate', 'Other'],
        default: 'Lab Report'
      },
      doctorName: { type: String, default: '' },
      date: { type: Date, default: Date.now },
      fileUrl: { type: String, default: '' },
      summary: { type: String, default: '' }
    }
  ],
  // Feature 6 & 8: Patient Consent-Based Sharing (DPDP Act Compliance)
  activeConsents: [
    {
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      doctorName: { type: String },
      grantedAt: { type: Date, default: Date.now },
      expiresAt: { type: Date },
      purpose: { type: String, default: 'Clinical Consultation' },
      status: { type: String, enum: ['active', 'revoked'], default: 'active' }
    }
  ],
  resetPasswordOTP: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate healthCardId and ABHA mock ID if not provided
userSchema.pre('save', async function(next) {
  if (!this.healthCardId) {
    this.healthCardId = `MQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  if (!this.abhaId && this.role === 'patient') {
    const p1 = Math.floor(10 + Math.random() * 89);
    const p2 = Math.floor(1000 + Math.random() * 8999);
    const p3 = Math.floor(1000 + Math.random() * 8999);
    const p4 = Math.floor(1000 + Math.random() * 8999);
    this.abhaId = `${p1}-${p2}-${p3}-${p4}`;
    this.abhaAddress = `${this.email.split('@')[0]}@abdm`;
    this.abhaVerified = true;
  }
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
