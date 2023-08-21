const CountryCode = require('../Models/countryCodeModel')

exports.get_countyCode = (req, res)=> {
    console.log("here")
   res.send(CountryCode.getCountryCodes());
}