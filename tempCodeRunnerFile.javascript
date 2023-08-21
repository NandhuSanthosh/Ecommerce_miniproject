const {phone} = require('phone');

function isValidPhoneNumber(phoneNumber, countryCode) {
  const validatedNumbers = phone(phoneNumber, countryCode);
  return validatedNumbers.isValid;
}

// Example usage
const phoneNumber = '6238973581'; // Replace with the actual phone number
const countryCode = '+1'; // Replace with the actual country code

const isValid = isValidPhoneNumber(phoneNumber, countryCode);
console.log(`Is valid phone number: ${isValid}`);