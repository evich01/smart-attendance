const mongoose = require('mongoose');

// -------------------------
// Regular Expressions
// -------------------------

// Allows letters, spaces, hyphens, and apostrophes.
// Examples:
// John Doe
// Mary-Jane Smith
// O'Connor
const NAME_REGEX = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

// Basic email format validation.
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Digits only, between 7 and 15 digits.
const PHONE_REGEX = /^\d{7,15}$/;


// -------------------------
// Name Validation
// -------------------------

function validateName(value, fieldLabel = 'Name') {
  if (typeof value !== 'string') {
    return `${fieldLabel} must be text`;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return `${fieldLabel} is required`;
  }

  if (trimmed.length < 2) {
    return `${fieldLabel} must be at least 2 characters`;
  }

  if (trimmed.length > 100) {
    return `${fieldLabel} must not exceed 100 characters`;
  }

  if (!NAME_REGEX.test(trimmed)) {
    return `${fieldLabel} may contain letters, spaces, hyphens, and apostrophes only`;
  }

  return null;
}


// -------------------------
// Email Validation
// -------------------------

function validateEmail(value) {
  if (typeof value !== 'string') {
    return 'Email must be text';
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return 'Email is required';
  }

  if (trimmed.length > 254) {
    return 'Email must not exceed 254 characters';
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Enter a valid email address';
  }

  return null;
}


// -------------------------
// Phone Validation
// -------------------------

function validatePhone(value, { required = false } = {}) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return required ? 'Phone number is required' : null;
  }

  if (typeof value !== 'string') {
    return 'Phone number must be text';
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return required ? 'Phone number is required' : null;
  }

  if (!PHONE_REGEX.test(trimmed)) {
    return 'Phone number must contain digits only (7–15 digits)';
  }

  return null;
}


// -------------------------
// Password Validation
// -------------------------

function validatePassword(value) {
  if (typeof value !== 'string') {
    return 'Password must be text';
  }

  if (!value) {
    return 'Password is required';
  }

  if (value.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (value.length > 128) {
    return 'Password must not exceed 128 characters';
  }

  if (/\s/.test(value)) {
    return 'Password must not contain spaces';
  }

  return null;
}


// -------------------------
// Role Validation
// -------------------------

function validateRole(value) {
  const allowedRoles = ['admin', 'manager', 'staff'];

  if (typeof value !== 'string') {
    return 'Role must be text';
  }

  if (!allowedRoles.includes(value)) {
    return 'Role must be admin, manager, or staff';
  }

  return null;
}


// -------------------------
// ObjectId Validation
// -------------------------

function validateObjectId(value, fieldLabel = 'ID') {
  if (!value) {
    return `${fieldLabel} is required`;
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return `${fieldLabel} is invalid`;
  }

  return null;
}


// -------------------------
// User Fields Validation
// -------------------------

function validateUserFields({
  name,
  email,
  phone,
  password,
  role,
  departmentId
}) {
  const nameError = validateName(name, 'Name');
  if (nameError) return nameError;

  const emailError = validateEmail(email);
  if (emailError) return emailError;

  const phoneError = validatePhone(phone);
  if (phoneError) return phoneError;

  if (password !== undefined) {
    const passwordError = validatePassword(password);
    if (passwordError) return passwordError;
  }

  if (role !== undefined) {
    const roleError = validateRole(role);
    if (roleError) return roleError;
  }

  if (departmentId !== undefined && departmentId !== null && departmentId !== '') {
    const departmentError = validateObjectId(
      departmentId,
      'Department ID'
    );

    if (departmentError) return departmentError;
  }

  return null;
}


// -------------------------
// Department Name Validation
// -------------------------

function validateDepartmentName(value) {
  return validateName(value, 'Department name');
}


// -------------------------
// Exports
// -------------------------

module.exports = {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateRole,
  validateObjectId,
  validateUserFields,
  validateDepartmentName
};
