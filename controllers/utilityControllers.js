const CountryCode = require('../Models/countryCodeModel')

// returns the country codes, used in user signin page
exports.get_countyCode = (req, res)=> {
    res.send(CountryCode.getCountryCodes());
}