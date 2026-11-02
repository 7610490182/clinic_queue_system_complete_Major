/**
 * AI Service for clinic queue prediction and optimization
 * Provides wait time estimation, appointment recommendations, and queue optimization
 */

/**
 * Predict estimated wait time based on queue data and doctor performance metrics
 * @param {Array} queue - Current queue appointments
 * @param {Object} doctor - Doctor info with avgConsultationTime
 * @param {Number} appointmentIndex - Position in queue
 * @returns {Number} Estimated wait time in minutes
 */
export const predictWaitTime = (queue, doctor, appointmentIndex = 0) => {
  try {
    // Base consultation time (default 15 minutes if not specified)
    const avgConsultationTime = doctor?.avgConsultationTime || 15;
    
    // Filter patients ahead in queue
    const patientsAhead = Math.max(0, appointmentIndex);
    
    // Calculate wait time: patients ahead × avg consultation + buffer time
    const baseWait = patientsAhead * avgConsultationTime;
    const bufferTime = Math.ceil(patientsAhead * 0.1); // 10% buffer for delays
    
    const estimatedWait = baseWait + bufferTime;
    
    return Math.max(0, estimatedWait);
  } catch (error) {
    console.error('Error predicting wait time:', error);
    return 15; // Default fallback
  }
};

/**
 * Recommend best available time slots based on historical queue patterns
 * @param {Array} availableSlots - Available time slots for a doctor on a date
 * @param {Array} historicalData - Past appointment data for pattern analysis
 * @returns {Array} Ranked slots with scores
 */
export const recommendBestSlots = (availableSlots, historicalData = []) => {
  try {
    const slotScores = availableSlots.map((slot) => {
      let score = 100;
      
      // Parse time
      const [hours] = slot.split(':').map(Number);
      
      // Prefer mid-morning and early afternoon (lower congestion)
      if ((hours >= 10 && hours < 12) || (hours >= 14 && hours < 15)) {
        score += 20;
      }
      
      // Avoid peak hours (lunch, end of day)
      if ((hours >= 12 && hours < 13) || hours >= 17) {
        score -= 25;
      }
      
      // Avoid very early morning
      if (hours < 9) {
        score -= 15;
      }
      
      // Analyze historical congestion patterns
      if (historicalData.length > 0) {
        const historyForSlot = historicalData.filter((apt) => {
          const aptHours = parseInt(apt.time.split(':')[0]);
          return aptHours === hours;
        });
        
        // Lower score for historically busy hours
        if (historyForSlot.length > 3) {
          score -= 10 * (historyForSlot.length - 3);
        }
      }
      
      return {
        slot,
        score: Math.max(0, score),
        reason: getSlotReason(hours, score)
      };
    });
    
    // Sort by score descending
    return slotScores.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error recommending slots:', error);
    return availableSlots.map((slot) => ({ slot, score: 50, reason: 'Standard availability' }));
  }
};

/**
 * Get reason explanation for slot recommendation
 * @param {Number} hours - Hour of the slot
 * @param {Number} score - Score assigned to slot
 * @returns {String} Reason text
 */
const getSlotReason = (hours, score) => {
  if (score >= 120) return '✅ Best time - Low congestion';
  if (score >= 100) return '👍 Good time - Moderate wait';
  if (score >= 80) return '⚠️ Acceptable - Possible wait';
  return '❌ Busy period - Expected delays';
};

/**
 * Optimize queue order based on priority and urgency
 * @param {Array} appointments - Current queue appointments
 * @returns {Array} Reordered queue with priority scores
 */
export const optimizeQueueOrder = (appointments) => {
  try {
    const scored = appointments.map((apt) => {
      let priority = 50; // Base priority
      
      // Patients who checked in get priority
      if (apt.status === 'checked_in') {
        priority += 30;
      }
      
      // Older appointments get priority (waited longer)
      const appointmentAge = Date.now() - new Date(apt.createdAt).getTime();
      const ageInMinutes = appointmentAge / (1000 * 60);
      priority += Math.min(20, ageInMinutes / 5); // Up to 20 points for age
      
      // Emergency or urgent flags
      if (apt.isUrgent || apt.priority === 'high') {
        priority += 25;
      }
      
      // Senior citizens or special needs
      if (apt.patient?.isSenior || apt.patient?.specialNeeds) {
        priority += 15;
      }
      
      return {
        ...apt,
        aiPriority: Math.min(100, priority),
        reason: getPriorityReason(priority)
      };
    });
    
    return scored.sort((a, b) => b.aiPriority - a.aiPriority);
  } catch (error) {
    console.error('Error optimizing queue:', error);
    return appointments;
  }
};

/**
 * Get priority reason explanation
 * @param {Number} priority - Priority score
 * @returns {String} Reason text
 */
const getPriorityReason = (priority) => {
  if (priority >= 90) return 'Urgent - High priority';
  if (priority >= 75) return 'Standard - Normal priority';
  if (priority >= 50) return 'Low - Can wait';
  return 'Flexible - Non-urgent';
};

/**
 * Calculate doctor availability and suggest best doctor based on wait time
 * @param {Array} doctors - List of available doctors
 * @param {Array} queuesData - Queue data for each doctor
 * @returns {Array} Ranked doctors with wait time estimates
 */
export const suggestBestDoctor = (doctors, queuesData = []) => {
  try {
    const rankedDoctors = doctors.map((doctor) => {
      const queueForDoctor = queuesData.find((q) => q.doctorId === doctor._id) || {};
      const currentQueueLength = queueForDoctor.length || 0;
      
      // Estimate wait time
      const avgConsultTime = doctor.avgConsultationTime || 15;
      const estimatedWait = currentQueueLength * avgConsultTime;
      
      return {
        ...doctor,
        estimatedWaitTime: estimatedWait,
        queueLength: currentQueueLength,
        score: calculateDoctorScore(doctor, estimatedWait),
        recommendation: getRecommendation(estimatedWait)
      };
    });
    
    return rankedDoctors.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error suggesting doctors:', error);
    return doctors;
  }
};

/**
 * Calculate overall score for doctor selection
 * @param {Object} doctor - Doctor object
 * @param {Number} waitTime - Estimated wait time
 * @returns {Number} Score (0-100)
 */
const calculateDoctorScore = (doctor, waitTime) => {
  let score = 100;
  
  // Deduct points for wait time (1 point per 5 minutes)
  score -= waitTime / 5;
  
  // Bonus for ratings
  if (doctor.rating) {
    score += doctor.rating * 5; // 5 points per rating star
  }
  
  // Bonus for experience
  if (doctor.experience) {
    score += Math.min(15, doctor.experience / 2); // Up to 15 points
  }
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Get recommendation text for doctor
 * @param {Number} waitTime - Wait time in minutes
 * @returns {String} Recommendation
 */
const getRecommendation = (waitTime) => {
  if (waitTime < 10) return '⚡ Quick - Available now';
  if (waitTime < 20) return '✅ Good - Short wait';
  if (waitTime < 30) return '👍 Acceptable - Moderate wait';
  if (waitTime < 45) return '⏳ Possible - Longer wait';
  return '❌ Busy - Extended wait';
};

/**
 * Analyze appointment patterns and predict peak hours
 * @param {Array} historicalAppointments - Past appointment data
 * @param {String} dayOfWeek - Target day (optional)
 * @returns {Object} Peak hour analysis
 */
export const analyzePeakHours = (historicalAppointments = [], dayOfWeek) => {
  try {
    const hourlyCount = {};
    
    historicalAppointments.forEach((apt) => {
      const date = new Date(apt.date);
      
      // Filter by day of week if provided
      if (dayOfWeek && date.toLocaleDateString('en-US', { weekday: 'long' }) !== dayOfWeek) {
        return;
      }
      
      const hour = date.getHours();
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });
    
    const sorted = Object.entries(hourlyCount).sort((a, b) => b[1] - a[1]);
    
    return {
      peakHours: sorted.slice(0, 3).map(([hour, count]) => ({
        hour: `${hour}:00`,
        appointments: count,
        level: count > 5 ? 'Busy' : count > 2 ? 'Moderate' : 'Quiet'
      })),
      quietestHours: sorted.slice(-3).map(([hour, count]) => ({
        hour: `${hour}:00`,
        appointments: count,
        level: 'Quiet'
      }))
    };
  } catch (error) {
    console.error('Error analyzing peak hours:', error);
    return { peakHours: [], quietestHours: [] };
  }
};

export default {
  predictWaitTime,
  recommendBestSlots,
  optimizeQueueOrder,
  suggestBestDoctor,
  analyzePeakHours
};
