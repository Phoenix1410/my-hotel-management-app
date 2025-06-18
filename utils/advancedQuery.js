/**
 * Advanced query features for MongoDB with Mongoose
 * Includes filtering, sorting, field selection, and pagination
 */

class AdvancedQuery {
  /**
   * Initialize the query builder
   * @param {Object} model - Mongoose model
   * @param {Object} reqQuery - Request query object from Express
   */
  constructor(model, reqQuery) {
    this.model = model;
    this.reqQuery = reqQuery;
    this.query = null;
  }

  /**
   * Filter the query based on MongoDB operators
   * @returns {AdvancedQuery} this
   */
  filter() {
    // Create a copy of the request query
    const queryObj = { ...this.reqQuery };

    // Fields to exclude from filtering
    const excludedFields = ['select', 'sort', 'page', 'limit'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Create operators ($gt, $gte, etc)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Start the query
    this.query = this.model.find(JSON.parse(queryStr));

    return this;
  }

  /**
   * Select specific fields
   * @returns {AdvancedQuery} this
   */
  select() {
    if (this.reqQuery.select) {
      const fields = this.reqQuery.select.split(',').join(' ');
      this.query = this.query.select(fields);
    }

    return this;
  }

  /**
   * Sort results
   * @returns {AdvancedQuery} this
   */
  sort() {
    if (this.reqQuery.sort) {
      const sortBy = this.reqQuery.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort by creation date, descending
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  /**
   * Paginate results
   * @returns {AdvancedQuery} this
   */
  paginate() {
    // Parse page and limit, set defaults
    const page = parseInt(this.reqQuery.page, 10) || 1;
    const limit = parseInt(this.reqQuery.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.pagination = {
      page,
      limit
    };

    return this;
  }

  /**
   * Execute the query
   * @returns {Promise} Mongoose query promise
   */
  async execute() {
    const results = await this.query;
    
    // Get total count for pagination if needed
    if (this.pagination) {
      // Create a copy of the original query without pagination
      const totalQuery = { ...this.reqQuery };
      const excludedFields = ['select', 'sort', 'page', 'limit'];
      excludedFields.forEach(field => delete totalQuery[field]);
      
      // Convert operators
      let queryStr = JSON.stringify(totalQuery);
      queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
      
      const total = await this.model.countDocuments(JSON.parse(queryStr));
      
      this.pagination.total = total;
      this.pagination.pages = Math.ceil(total / this.pagination.limit);
      
      if (this.pagination.page < this.pagination.pages) {
        this.pagination.next = this.pagination.page + 1;
      }
      
      if (this.pagination.page > 1) {
        this.pagination.prev = this.pagination.page - 1;
      }
    }
    
    return {
      results,
      pagination: this.pagination
    };
  }
}

module.exports = AdvancedQuery;