/**
 * validators.js
 * Joi-based validation utilities for Customer, Carrier, Flight payloads
 */

const Joi = require('joi');
const moment = require('moment');

// Name rule: alphabet groups separated by single spaces, start/end must be alphabet
const fullNamePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const customerRegisterSchema = Joi.object({
  FullName: Joi.string().pattern(fullNamePattern).required()
    .messages({ 'string.pattern.base': 'FullName must use alphabets and single spaces only' }),
  Password: Joi.string().min(8).required()
    .messages({ 'string.min': 'Password must be at least 8 characters' }),
  Phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
    .messages({ 'string.pattern.base': 'Phone must be 10 digits and start with 6-9' }),
  EmailId: Joi.string().email().required(),
  AddressLine1: Joi.string().required(),
  AddressLine2: Joi.string().allow('').optional(),
  City: Joi.string().required(),
  State: Joi.string().required(),
  ZipCode: Joi.string().required(),
  DOB: Joi.date().required().custom((value, helpers) => {
    const today = moment();
    const birth = moment(value);
    if (!birth.isValid()) return helpers.error('any.invalid', { message: 'Invalid DOB' });
    if (birth.isBefore('1930-01-01')) return helpers.error('any.invalid', { message: 'DOB before 1930-01-01 not allowed' });
    if (today.diff(birth, 'years') < 18) return helpers.error('any.invalid', { message: 'User must be at least 18 years old' });
    return value;
  }, 'DOB validation'),
  CustomerCategory: Joi.string().valid('Silver', 'Gold', 'Platinum').optional()
});

const carrierSchema = Joi.object({
  CarrierName: Joi.string().max(50).required(),
  Discounts: Joi.object({
    days30: Joi.number().min(0).max(100).optional(),
    days60: Joi.number().min(0).max(100).optional(),
    days90: Joi.number().min(0).max(100).optional(),
    bulkBookingPercent: Joi.number().min(0).max(100).optional(),
    tierDiscounts: Joi.object({
      Silver: Joi.number().min(0).max(100).optional(),
      Gold: Joi.number().min(0).max(100).optional(),
      Platinum: Joi.number().min(0).max(100).optional()
    }).optional()
  }).optional(),
  Refunds: Joi.object({
    days2: Joi.number().min(0).max(100).optional(),
    days10: Joi.number().min(0).max(100).optional(),
    days20plus: Joi.number().min(0).max(100).optional()
  }).optional()
});

const flightSchema = Joi.object({
  CarrierId: Joi.number().required(),
  Origin: Joi.string().required(),
  Destination: Joi.string().required(),
  AirFare: Joi.number().min(0).required(),
  SeatCapacityBusiness: Joi.number().integer().min(0).required(),
  SeatCapacityEconomy: Joi.number().integer().min(0).required(),
  SeatCapacityExecutive: Joi.number().integer().min(0).required()
});

function validateCustomerRegister(payload) {
  return customerRegisterSchema.validate(payload, { abortEarly: false });
}
function validateCarrier(payload) {
  return carrierSchema.validate(payload, { abortEarly: false });
}
function validateFlight(payload) {
  return flightSchema.validate(payload, { abortEarly: false });
}

module.exports = {
  validateCustomerRegister,
  validateCarrier,
  validateFlight
};
