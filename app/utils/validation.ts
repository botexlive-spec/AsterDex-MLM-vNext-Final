/**
 * Validation Utilities
 * Comprehensive validation patterns and functions for form inputs
 */

// Regular expression patterns
export const ValidationPatterns = {
  // Email validation - Accepts all standard formats including test TLDs (.test, .local, .dev)
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Phone validation - International format (allows +, spaces, dashes, parentheses)
  // Matches formats like: +1 234-567-8900, (123) 456-7890, +44 20 1234 5678
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,

  // Password validation - At least 8 characters
  password: /^.{8,}$/,

  // Strong password - At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,

  // ZIP code - US format (12345 or 12345-6789)
  zipCode: /^\d{5}(-\d{4})?$/,

  // Alphanumeric with spaces
  alphanumeric: /^[a-zA-Z0-9\s]+$/,

  // Letters only with spaces
  lettersOnly: /^[a-zA-Z\s]+$/,

  // Numbers only
  numbersOnly: /^\d+$/,

  // URL validation
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
};

// Validation error messages
export const ValidationMessages = {
  email: {
    required: 'Email address is required',
    invalid: 'Please enter a valid email address (e.g., user@example.com)',
  },
  phone: {
    required: 'Phone number is required',
    invalid: 'Please enter a valid phone number (e.g., +1 234-567-8900)',
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 8 characters long',
    strong: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    mismatch: 'Passwords do not match',
  },
  name: {
    required: 'Name is required',
    invalid: 'Please enter a valid name (letters and spaces only)',
  },
  address: {
    required: 'Address is required',
  },
  zipCode: {
    required: 'ZIP code is required',
    invalid: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)',
  },
  required: 'This field is required',
};

// Field validation error type
export interface FieldError {
  field: string;
  message: string;
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, message: ValidationMessages.email.required };
  }

  if (!ValidationPatterns.email.test(email)) {
    return { isValid: false, message: ValidationMessages.email.invalid };
  }

  return { isValid: true };
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string, required: boolean = true): { isValid: boolean; message?: string } => {
  if (!phone || phone.trim() === '') {
    if (required) {
      return { isValid: false, message: ValidationMessages.phone.required };
    }
    return { isValid: true }; // Optional field is valid when empty
  }

  if (!ValidationPatterns.phone.test(phone)) {
    return { isValid: false, message: ValidationMessages.phone.invalid };
  }

  return { isValid: true };
};

/**
 * Validate password
 */
export const validatePassword = (password: string, requireStrong: boolean = false): { isValid: boolean; message?: string } => {
  if (!password || password.trim() === '') {
    return { isValid: false, message: ValidationMessages.password.required };
  }

  if (password.length < 8) {
    return { isValid: false, message: ValidationMessages.password.minLength };
  }

  if (requireStrong && !ValidationPatterns.strongPassword.test(password)) {
    return { isValid: false, message: ValidationMessages.password.strong };
  }

  return { isValid: true };
};

/**
 * Validate password confirmation
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): { isValid: boolean; message?: string } => {
  if (password !== confirmPassword) {
    return { isValid: false, message: ValidationMessages.password.mismatch };
  }

  return { isValid: true };
};

/**
 * Validate name (letters and spaces only)
 */
export const validateName = (name: string): { isValid: boolean; message?: string } => {
  if (!name || name.trim() === '') {
    return { isValid: false, message: ValidationMessages.name.required };
  }

  if (!ValidationPatterns.lettersOnly.test(name)) {
    return { isValid: false, message: ValidationMessages.name.invalid };
  }

  return { isValid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value: string, fieldName: string = 'This field'): { isValid: boolean; message?: string } => {
  if (!value || value.trim() === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }

  return { isValid: true };
};

/**
 * Validate ZIP code
 */
export const validateZipCode = (zipCode: string, required: boolean = true): { isValid: boolean; message?: string } => {
  if (!zipCode || zipCode.trim() === '') {
    if (required) {
      return { isValid: false, message: ValidationMessages.zipCode.required };
    }
    return { isValid: true };
  }

  if (!ValidationPatterns.zipCode.test(zipCode)) {
    return { isValid: false, message: ValidationMessages.zipCode.invalid };
  }

  return { isValid: true };
};

/**
 * Generic pattern validator
 */
export const validatePattern = (value: string, pattern: RegExp, errorMessage: string): { isValid: boolean; message?: string } => {
  if (!pattern.test(value)) {
    return { isValid: false, message: errorMessage };
  }

  return { isValid: true };
};

/**
 * Validate multiple fields at once
 * Returns all validation errors
 */
export const validateFields = (
  fields: Array<{ name: string; value: string; validator: (value: string) => { isValid: boolean; message?: string } }>
): ValidationResult => {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    const result = field.validator(field.value);
    if (!result.isValid && result.message) {
      errors[field.name] = result.message;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  ValidationPatterns,
  ValidationMessages,
  validateEmail,
  validatePhone,
  validatePassword,
  validatePasswordMatch,
  validateName,
  validateRequired,
  validateZipCode,
  validatePattern,
  validateFields,
};
