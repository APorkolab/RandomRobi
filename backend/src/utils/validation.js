const Joi = require('joi');
const { ValidationError } = require('./errors');

/**
 * Common validation schemas
 */
const schemas = {
  id: Joi.number().integer().positive().required(),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
  
  user: {
    create: Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
        .messages({
          'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one digit'
        }),
    }),
    
    update: Joi.object({
      username: Joi.string().alphanum().min(3).max(30),
      email: Joi.string().email(),
      password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .messages({
          'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one digit'
        }),
    }).min(1),
    
    login: Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    }),
  },
  
  video: {
    create: Joi.object({
      link: Joi.string().uri().required(),
      createdAt: Joi.date().iso().optional(),
    }),
    
    update: Joi.object({
      link: Joi.string().uri(),
      createdAt: Joi.date().iso(),
    }).min(1),
  },
  
  query: Joi.object({
    search: Joi.string().max(255),
    sortBy: Joi.string().valid('id', 'createdAt', 'username', 'email', 'link'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

/**
 * Middleware for request validation
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      allowUnknown: false,
      stripUnknown: true,
      abortEarly: false,
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));
      
      throw new ValidationError('Validation failed', errors);
    }
    
    req[property] = value;
    next();
  };
};

/**
 * Validate parameters middleware
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate query parameters middleware
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate request body middleware
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Async validation wrapper
 */
const asyncValidate = async (schema, data) => {
  try {
    const { error, value } = schema.validate(data, {
      allowUnknown: false,
      stripUnknown: true,
      abortEarly: false,
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));
      
      throw new ValidationError('Validation failed', errors);
    }
    
    return value;
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err;
    }
    throw new ValidationError('Validation error occurred', []);
  }
};

/**
 * Sanitize HTML to prevent XSS
 */
const sanitizeHtml = (dirty) => {
  if (typeof dirty !== 'string') return dirty;
  
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Deep sanitize object
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeHtml(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  
  return sanitized;
};

module.exports = {
  schemas,
  validate,
  validateParams,
  validateQuery,
  validateBody,
  asyncValidate,
  sanitizeHtml,
  sanitizeObject,
};
