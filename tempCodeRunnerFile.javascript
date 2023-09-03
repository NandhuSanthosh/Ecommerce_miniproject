function validatePhoneNumber(number){
    const indianPhoneNumberRegex = /^[6789]\d{9}$/;
    return indianPhoneNumberRegex.test(number);
}
console.log(validatePhoneNumber('6238973581'))