const Joi = require('joi');

// Request validation middleware using Joi
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false, // Return all validation errors
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errorMessage
            });
        }

        next();
    };
};

module.exports = validateRequest;
