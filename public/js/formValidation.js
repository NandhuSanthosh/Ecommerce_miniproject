const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
let isEmail;

loginBtn?.addEventListener('click',  (e)=>{
    e.preventDefault();

    const emailMobileValidationFunction = emailMobileObjectCreater(emailMobile);

    // we are keeping this object to credentials
    // if the associate(the person who uses) is admin, admin is only allowed to use email
    // and if associate is user then we are calling a function to figure out which validate function to use
    let credentialValidateObject = {};
    if(associate == 'user'){
        credentialValidateObject = {
            field: emailMobile, 
            validityFunction: emailMobileValidationFunction
        }
    }
    else if(associate == 'admin'){
        credentialValidateObject = {
            field: emailMobile, 
            validityFunction: validateEmail
        }
    }


    // this is a function which return true/false based on the user input
    // the function accepts a array of object which contains the field referance and function to validate
    let status = validaityForm([credentialValidateObject, {
        field: password, 
        validityFunction: validatePassword
    }])

    // if the validityForm result is positive(true) we will submit the form
    if(status){
        // we keep a object named credentials to keep track of the credential details
        // we are using this because the user can login using email and mobile
        let credentials;
        if(!isEmail){
            credentials = {
                mobile: {
                    number: extractValue(emailMobile)
                }
            }
        }
        else{
            credentials = {
                email: extractValue(emailMobile).toLowerCase().trim()
            }
        }


        let body = {
            credentials, 
            password: extractValue(password)
        }

        // gives url to send login request and url to the page to load after the request is successful 
        // based on associate   
        const {reqUrl, successUrl} = getLoginUrl();
        console.log(successUrl)
        fetch(reqUrl, {
            method: "post", 
            headers: {
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(body)
        })
        .then( response => response.json())
        .then( d => {
            console.log(d)
            if(d.isSuccess){
                location.assign(successUrl);
            }
            else{
                showModel(d.errorMessage);
            }
        })
    }
})


function getLoginUrl(){
    if(associate == "user"){
        return {
            reqUrl: "http://localhost:3000/login", 
            successUrl: "http://localhost:3000/otp-auth?superSet=login"
        }
    }
    return {
        reqUrl: "http://localhost:3000/admin/login", 
        successUrl: "http://localhost:3000/admin/otp-auth?superSet=login"
    }
}



signupBtn?.addEventListener('click', (e)=>{
    e.preventDefault();

    const emailMobileValidationFunction = emailMobileObjectCreater(emailMobile);

    let status = validaityForm([{
        field : emailMobile,
        validityFunction: emailMobileValidationFunction
    },{
        field : password, 
        validityFunction: validatePassword
    }, {
        field : fullName, 
        validityFunction: validateFullName
    }])

    // checking whether password and confirm password are equal
    status = validateConfirmPassword(password, confirmPassword) && status;

    
    if(status){
        let credentials;
        if(isEmail){
            credentials = {
                email: extractValue(emailMobile)
            }
        }
        else{
            credentials = {
                mobile: {
                    countryCode: getCountryCode(),
                    number: extractValue(emailMobile)
                }
            }
        }
        const body = {
            name: extractValue(fullName), 
            credentials,
            password: extractValue(password)
        }
        console.log(superSet)
        fetch('http://localhost:3000/signin', {
            method: 'post', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then( d=> {
            if(d.isSuccess){
                    console.log('here')
                    location.assign("http://localhost:3000/otp-Auth?superSet="+superSet)
            }
            else{
                showModel(d.errorMessage)
            }
        })
    }

})





function emailMobileObjectCreater(field){
    if(isMobile(extractValue(field).trim())){
        isEmail = false;
        return validateMobile
    }
    isEmail = true;
    return validateEmail;
}

function validaityForm(validationObject){
    let status = true;
    let validationResult;
    validationObject.forEach( x => {
        validationResult = x.validityFunction(x.field, extractValue(x.field).trim());
        status &&= validationResult;
    })
    return status;
}

function validateFullName(field, fullName){
    var regName = /^[a-zA-Z]+ [a-zA-Z]+$/;
    if(regName.test(fullName)){
        errorCorrection(field);
        return true;
    }
    setError(field, "Invalid Name")
}

function validateEmail(field, email){
    // validate 
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
        errorCorrection(field);
        return true;
    } 
    setError(field, "Please enter a valid email")
    return false;
}

function validatePassword(field, password){
    //check empty password field  

    const regexSpecialChar = /[^a-zA-Z0-9\s]/;
    const regexNumber = /\d/;

    const regexUppercase = /[A-Z]/;
    const regexLowercase = /[a-z]/;

    if(password == "") {  
        setError(field, "Fill the password!")
        return false;  
    }  

    if(password.length < 8) {  
        setError(field,"Password length must be atleast 8 characters");  
        return false;  
    }
    
    if(password.length > 15) {  
        setError(field, "Password length must not exceed 15 characters");  
        return false;  
    }  
    
    if( !(regexUppercase.test(password) && regexLowercase.test(password))){
        setError(field, "Must contain uppercase and lowercase characters")
        return false;
    }

    if( !(regexNumber.test(password))){
        setError(field, "Must contain at one number")
        return false;
    }

    if( !regexSpecialChar.test(password)){
        setError(field, "Must contain at lease one special character.")
        return false;
    }

    errorCorrection(field);
    return true;
}

function validateConfirmPassword(password, confirmPassword){

    if(!validatePassword(confirmPassword, extractValue(confirmPassword))){
        return false;
    }

    if(extractValue(password) !== extractValue(confirmPassword)){
        setError(confirmPassword, "Passwords doesn't match")
        return false;
    }
    errorCorrection(confirmPassword);
    return true;
}

function validateMobile(field, mobile){
    const phoneRegex = /^(?:\+?\d{1,4}[ -]?)?(?:\(\d{1,4}\)[ -]?)?\d{1,4}[ -]?\d{1,4}[ -]?\d{1,4}$/;
    if(phoneRegex.test(mobile)){
        errorCorrection(field)
        return true;
    }
    setError(field, "Invalid Mobile Number")
    return true;
}


// to extract a value form the input contianer
function extractValue(container){
    return container.querySelector('input').value;
}

// to set the error in the form if any
function setError(field, errorMessage){
    field.style.borderColor = 'red';
    let tooltip = field.querySelector('span');
    tooltip.classList.remove('d-none')
    tooltip.classList.add('d-block')
    tooltip.setAttribute("data-tooltip", errorMessage)
}

// do remove the previously added errors 
function errorCorrection(field){
    field.style.borderColor = 'green';
    let tooltip = field.querySelector('span');
    tooltip.classList.add('d-none')
    tooltip.classList.remove('d-block')
}

function isMobile(value){
    if(!isNaN(value[0])){
        return true;
    }
    else{
        return false;
    }
}

function showModel(message){
    modelContent.innerHTML = message
    $("#exampleModal").modal();
}



