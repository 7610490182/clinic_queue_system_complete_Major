/**
 * Smart Notification Service for clinic appointments
 * Handles appointment reminders, status updates, and AI-based alerts
 */

/**
 * Schedule appointment reminder notifications
 * @param {Object} appointment - Appointment object
 * @param {String} userEmail - User email for notifications
 * @returns {Promise} Notification scheduling result
 */
export const scheduleAppointmentReminder = async (appointment, userEmail) => {
  try {
    // Send reminder 24 hours before appointment
    const appointmentTime = new Date(appointment.date);
    const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (reminderTime > now) {
      const timeout = reminderTime.getTime() - now.getTime();
      
      setTimeout(() => {
        sendNotification({
          type: 'appointment_reminder',
          title: '📅 Appointment Reminder',
          message: `Your appointment with ${appointment.doctor?.name} is in 24 hours!`,
          appointmentId: appointment._id,
          recipient: userEmail
        });
      }, timeout);
      
      return { success: true, scheduledFor: reminderTime };
    }
  } catch (error) {
    console.error('Error scheduling reminder:', error);
  }
};

/**
 * Send pre-consultation notification with AI insights
 * @param {Object} appointment - Appointment object
 * @param {Object} aiInsights - AI analysis data
 * @returns {Promise}
 */
export const sendPreConsultationNotification = async (appointment, aiInsights = {}) => {
  try {
    const message = `
    📋 Pre-Appointment Checklist
    
    Doctor: ${appointment.doctor?.name}
    Time: ${new Date(appointment.date).toLocaleString()}
    ${aiInsights.estimatedWaitTime ? `⏳ Est. Wait: ${aiInsights.estimatedWaitTime} min` : ''}
    ${aiInsights.recommendation ? `💡 Tip: ${aiInsights.recommendation}` : ''}
    
    Please arrive 5-10 minutes early with your ID and insurance details.
    `;
    
    sendNotification({
      type: 'pre_consultation',
      title: '🏥 Pre-Appointment Information',
      message: message,
      appointmentId: appointment._id,
      recipient: appointment.patient?.email
    });
  } catch (error) {
    console.error('Error sending pre-consultation notification:', error);
  }
};

/**
 * Send queue status update notification
 * @param {Object} appointment - Current appointment
 * @param {Number} position - Current queue position
 * @param {Number} estimatedWait - Estimated wait time in minutes
 * @returns {Promise}
 */
export const sendQueueUpdateNotification = async (appointment, position, estimatedWait) => {
  try {
    let message = `🔔 Queue Update\n\nYour position: ${position}`;
    
    if (estimatedWait) {
      message += `\nEstimated wait: ~${estimatedWait} minutes`;
    }
    
    if (position === 1) {
      message += '\n\n✅ You\'re next! Please prepare for your consultation.';
    } else if (position <= 3) {
      message += '\n\n⚡ Almost your turn!';
    }
    
    sendNotification({
      type: 'queue_update',
      title: '📊 Queue Position Update',
      message: message,
      appointmentId: appointment._id,
      recipient: appointment.patient?.email,
      priority: position <= 2 ? 'high' : 'normal'
    });
  } catch (error) {
    console.error('Error sending queue update:', error);
  }
};

/**
 * Send appointment confirmation with smart scheduling insight
 * @param {Object} appointment - Booked appointment
 * @param {Object} insight - Smart scheduling data
 * @returns {Promise}
 */
export const sendConfirmationWithInsight = async (appointment, insight = {}) => {
  try {
    let message = `✅ Appointment Confirmed!\n\n`;
    message += `Doctor: ${appointment.doctor?.name}\n`;
    message += `Date: ${new Date(appointment.date).toLocaleDateString()}\n`;
    message += `Time: ${new Date(appointment.date).toLocaleTimeString()}\n`;
    
    if (insight.reason) {
      message += `\n💡 ${insight.reason}`;
    }
    
    if (insight.tips?.length) {
      message += `\n\n📌 Tips for better consultation:\n`;
      insight.tips.forEach((tip, i) => {
        message += `${i + 1}. ${tip}\n`;
      });
    }
    
    sendNotification({
      type: 'confirmation',
      title: '✨ Appointment Confirmed',
      message: message,
      appointmentId: appointment._id,
      recipient: appointment.patient?.email
    });
  } catch (error) {
    console.error('Error sending confirmation:', error);
  }
};

/**
 * Send doctor availability update notification
 * @param {Object} doctor - Doctor object
 * @param {String} userEmail - Patient email
 * @returns {Promise}
 */
export const sendDoctorAvailabilityNotification = async (doctor, userEmail) => {
  try {
    const message = `🏥 Doctor Available!\n\n${doctor.name} is now available for appointments.\nCurrent wait time: < 10 minutes`;
    
    sendNotification({
      type: 'doctor_available',
      title: '⚡ Doctor Now Available',
      message: message,
      doctorId: doctor._id,
      recipient: userEmail
    });
  } catch (error) {
    console.error('Error sending availability notification:', error);
  }
};

/**
 * Send analytics report to doctor
 * @param {Object} doctorData - Doctor analytics
 * @returns {Promise}
 */
export const sendDoctorAnalyticsNotification = async (doctorData) => {
  try {
    const message = `📊 Daily Analytics Report\n\n`;
    const report = `
    Patients Seen: ${doctorData.patientsSeen || 0}
    Avg. Consultation: ${doctorData.avgConsultationTime || 15} min
    Queue Efficiency: ${Math.round(doctorData.efficiency || 75)}%
    Patient Satisfaction: ${(doctorData.satisfaction || 0).toFixed(1)}/5 ⭐
    `;
    
    sendNotification({
      type: 'analytics',
      title: '📈 Your Daily Performance',
      message: message + report,
      doctorId: doctorData._id,
      recipient: doctorData.email
    });
  } catch (error) {
    console.error('Error sending analytics notification:', error);
  }
};

/**
 * Core notification sending function (can be extended for email/SMS)
 * @param {Object} notification - Notification object
 */
const sendNotification = (notification) => {
  try {
    // Log notification
    console.log('🔔 Notification:', notification);
    
    // Store in browser localStorage for display
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.push({
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false
    });
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.shift();
    }
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Dispatch custom event for real-time UI updates
    window.dispatchEvent(new CustomEvent('notificationReceived', {
      detail: notification
    }));
    
    // TODO: Integrate actual email/SMS service here
    // Example: sendEmail(notification.recipient, notification.title, notification.message)
    // Example: sendSMS(notification.phone, notification.message)
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * Get unread notifications count
 * @returns {Number} Count of unread notifications
 */
export const getUnreadNotificationsCount = () => {
  try {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter((n) => !n.read).length;
  } catch (error) {
    return 0;
  }
};

/**
 * Get all notifications
 * @returns {Array} All stored notifications
 */
export const getAllNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem('notifications') || '[]');
  } catch (error) {
    return [];
  }
};

/**
 * Mark notification as read
 * @param {Number} notificationId - Notification ID
 */
export const markNotificationAsRead = (notificationId) => {
  try {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = () => {
  try {
    localStorage.removeItem('notifications');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

export default {
  scheduleAppointmentReminder,
  sendPreConsultationNotification,
  sendQueueUpdateNotification,
  sendConfirmationWithInsight,
  sendDoctorAvailabilityNotification,
  sendDoctorAnalyticsNotification,
  getUnreadNotificationsCount,
  getAllNotifications,
  markNotificationAsRead,
  clearAllNotifications
};
