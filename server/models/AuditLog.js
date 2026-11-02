const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    default: 'Anonymous'
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'system'],
    default: 'system'
  },
  action: {
    type: String,
    required: true // 'VIEW_RECORD', 'EXPORT_DATA', 'UPDATE_CONSENT', 'ISSUE_PRESCRIPTION', 'TRIAGE_EMERGENCY', 'QR_CHECKIN'
  },
  resource: {
    type: String,
    required: true // 'PatientProfile', 'Appointment', 'Prescription', 'Queue', 'ABHA_FHIR'
  },
  targetPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetPatientName: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'DENIED', 'ERROR'],
    default: 'SUCCESS'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, action: 1 });
auditLogSchema.index({ targetPatientId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

