import { validationResult } from 'express-validator';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));

    res.status(400).json({
      error: 'Validation failed',
      errors: formattedErrors,
    });
  };
};

export const handleValidationError = (error) => {
  if (error.name === 'ValidationError') {
    return {
      status: 400,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
      })),
    };
  }
  return null;
};