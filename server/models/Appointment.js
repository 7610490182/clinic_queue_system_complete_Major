const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'checked_in',
      'in_queue',
      'consulting',
      'completed',
      'cancelled',
      'no_show',
      'late'
    ],
    default: 'confirmed'
  },
  // Feature 3: Smart Queue Optimization & Triage
  priority: {
    type: String,
    enum: ['normal', 'priority', 'emergency'],
    default: 'normal'
  },
  queueType: {
    type: String,
    enum: ['online', 'walkin', 'emergency'],
    default: 'online'
  },
  branch: {
    type: String,
    default: 'Gwalior Main Clinic'
  },
  // Feature 4: QR-based Check-in
  checkInStatus: {
    type: String,
    enum: ['not_arrived', 'checked_in', 'in_room', 'completed'],
    default: 'not_arrived'
  },
  checkInCode: {
    type: String,
    default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
  },
  checkInTime: {
    type: Date
  },
  qrTokenSignature: {
    type: String
  },
  // Feature 1: AI Waiting-Time Prediction
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 15
  },
  confidenceInterval: {
    min: { type: Number, default: 10 },
    max: { type: Number, default: 20 }
  },
  predictedConsultationTime: {
    type: String // formatted '11:45 AM'
  },
  actualDuration: {
    type: Number, // actual consultation duration in minutes
    default: null
  },
  consultationStartTime: {
    type: Date
  },
  consultationEndTime: {
    type: Date
  },
  // Feature 5: Telemedicine & Virtual Consultations
  telemedicine: {
    isVirtual: { type: Boolean, default: false },
    meetingId: { type: String, default: '' },
    meetingUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['not_started', 'waiting_room', 'in_call', 'completed'],
      default: 'not_started'
    },
    preConsultationVitals: {
      bloodPressure: { type: String, default: '' },
      temperature: { type: String, default: '' },
      pulseRate: { type: String, default: '' },
      symptomsNotes: { type: String, default: '' }
    }
  },
  // Feature 5 & 6: Digital Prescription & EMR
  prescription: {
    prescriptionId: { type: String, default: '' },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, default: '1 tablet' },
        frequency: { type: String, default: 'Twice daily' },
        duration: { type: String, default: '5 days' },
        instructions: { type: String, default: 'After meals' }
      }
    ],
    diagnosis: { type: String, default: '' },
    clinicalNotes: { type: String, default: '' },
    investigationsRecommended: { type: [String], default: [] },
    dietAdvice: { type: String, default: '' },
    followUpDate: { type: Date },
    issuedAt: { type: Date }
  },
  payment: {
    orderId: String,
    paymentId: String,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
appointmentSchema.index({ doctor: 1, date: 1, tokenNumber: 1 });
appointmentSchema.index({ checkInCode: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
