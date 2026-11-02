/**
 * Backend Notification Service
 * Handles email notifications and reminders for appointments
 */

const isEmailConfigured = () => {
  return (
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD &&
    !process.env.EMAIL_USER.includes('your-email') &&
    !process.env.EMAIL_PASSWORD.includes('your-app-password')
  );
};

let transporter = null;
const getTransporter = () => {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    try {
      const nodemailer = require('nodemailer');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } catch (err) {
      console.warn('Nodemailer not available or failed to initialize:', err.message);
    }
  }
  return transporter;
};

/**
 * Send appointment confirmation or reminder email
 * @param {Object} patient - Patient user object with name, email
 * @param {Object} appointment - Appointment object
 * @param {Object} doctor - Doctor object with name, specialization
 */
const sendAppointmentReminder = async (patient, appointment, doctor) => {
  if (!patient || !patient.email) {
    return { success: false, message: 'Patient email missing' };
  }

  const doctorName = doctor?.name || 'Assigned Specialist';
  const doctorSpecialization = doctor?.specialization || 'Consultation';
  const appointmentDate = new Date(appointment.date).toLocaleDateString();

  console.log(`📧 [NotificationService] Dispatching reminder to ${patient.email} for Dr. ${doctorName} (Token #${appointment.tokenNumber})`);

  const transport = getTransporter();
  if (!transport) {
    console.log(`ℹ️ [NotificationService] EMAIL_USER not configured. Mock email dispatched to: ${patient.email}`);
    return { success: true, mock: true };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patient.email,
    subject: `🏥 Appointment Confirmation - Token #${appointment.tokenNumber} with Dr. ${doctorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #2563eb;">🏥 MediQueue Appointment Confirmation</h2>
        <p>Dear <strong>${patient.name}</strong>,</p>
        <p>Your appointment has been successfully scheduled:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p><strong>Doctor:</strong> Dr. ${doctorName} (${doctorSpecialization})</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time Slot:</strong> ${appointment.time}</p>
          <p><strong>Token Number:</strong> <span style="font-size: 18px; color: #2563eb; font-weight: bold;">#${appointment.tokenNumber}</span></p>
          <p><strong>Status:</strong> ${appointment.status}</p>
        </div>
        <p>Please arrive 10 minutes prior to your time slot with your photo ID.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">MediQueue Clinic Management System</p>
      </div>
    `
  };

  try {
    const info = await transport.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email reminder:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendAppointmentReminder,
  isEmailConfigured
};

