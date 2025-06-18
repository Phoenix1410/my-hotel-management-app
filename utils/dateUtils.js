/**
 * Utility functions for date operations
 */

/**
 * Check if two date ranges overlap
 * @param {Date} startDate1 - Start date of first range
 * @param {Date} endDate1 - End date of first range
 * @param {Date} startDate2 - Start date of second range
 * @param {Date} endDate2 - End date of second range
 * @returns {Boolean} True if ranges overlap, false otherwise
 */
exports.datesOverlap = (startDate1, endDate1, startDate2, endDate2) => {
  // Convert to timestamps for easier comparison
  const start1 = new Date(startDate1).getTime();
  const end1 = new Date(endDate1).getTime();
  const start2 = new Date(startDate2).getTime();
  const end2 = new Date(endDate2).getTime();

  // Check if date ranges overlap
  return (start1 <= end2 && start2 <= end1);
};

/**
 * Calculate the number of days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Number} Number of days
 */
exports.calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set hours to noon to avoid DST issues
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);
  
  // Calculate difference in milliseconds
  const diffTime = Math.abs(end - start);
  
  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if a date is in the past
 * @param {Date} date - Date to check
 * @returns {Boolean} True if date is in the past, false otherwise
 */
exports.isDateInPast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
};

/**
 * Check if a date is valid
 * @param {String|Date} date - Date to check
 * @returns {Boolean} True if date is valid, false otherwise
 */
exports.isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {String} Formatted date
 */
exports.formatDate = (date) => {
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};