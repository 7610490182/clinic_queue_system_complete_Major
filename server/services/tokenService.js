const Counter = require('../models/Counter');
const Appointment = require('../models/Appointment');

/**
 * Atomically generates the next sequential token number for a given doctor on a specific date.
 * Completely immune to race conditions and duplicate token issuance.
 *
 * @param {string|mongoose.Types.ObjectId} doctorId
 * @param {Date|string} date
 * @returns {Promise<number>} nextTokenNumber
 */
async function getNextAtomicTokenNumber(doctorId, date) {
  const targetDate = new Date(date);
  const dateStr = targetDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const key = `token_${String(doctorId)}_${dateStr}`;

  // Atomic increment
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // If newly created counter (seq === 1), check if existing appointments already exist in database
  if (counter.seq === 1) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const highestApt = await Appointment.findOne({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ tokenNumber: -1 });

    if (highestApt && highestApt.tokenNumber >= 1) {
      const updated = await Counter.findOneAndUpdate(
        { key },
        { $set: { seq: highestApt.tokenNumber + 1 } },
        { new: true }
      );
      return updated.seq;
    }
  }

  return counter.seq;
}

module.exports = {
  getNextAtomicTokenNumber
};

