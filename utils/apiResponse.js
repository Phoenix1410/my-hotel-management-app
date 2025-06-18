/**
 * Standard API response format
 * @param {Boolean} success - Whether the request was successful
 * @param {String} message - Message to be sent to the client
 * @param {Object|Array} data - Data to be sent to the client
 * @param {Object} meta - Additional metadata (pagination, etc.)
 * @returns {Object} Formatted API response
 */
const formatResponse = (success, message = '', data = null, meta = {}) => {
  const response = {
    success,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return response;
};

/**
 * Success response
 * @param {String} message - Success message
 * @param {Object|Array} data - Data to be sent to the client
 * @param {Object} meta - Additional metadata (pagination, etc.)
 * @returns {Object} Formatted success response
 */
exports.success = (message, data, meta) => {
  return formatResponse(true, message, data, meta);
};

/**
 * Error response
 * @param {String} message - Error message
 * @param {Object} data - Additional error data
 * @returns {Object} Formatted error response
 */
exports.error = (message, data) => {
  return formatResponse(false, message, data);
};

/**
 * Pagination helper
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
exports.pagination = (page, limit, total) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const pagination = {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  };

  if (endIndex < total) {
    pagination.next = page + 1;
  }

  if (startIndex > 0) {
    pagination.prev = page - 1;
  }

  return pagination;
};