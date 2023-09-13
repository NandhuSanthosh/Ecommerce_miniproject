const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
let isEmail;
let validationIntegrateObj = [];


addOnchangeValidations();


function addOnchangeValidations(){
    if(page == 'login' || page == 'signup'){
        validationIntegrateObj = [{
            field : emailMobile,
            validityFunction: emailMobileObjectCreater
        }]
    
        if(page == 'signup'){
            const additionalFields = [{
                    field: fullName, 
                    validityFunction: validateFullName
                },{
                    field: password, 
                    validityFunction: validatePasswordOne(confirmPassword)
                }
                , {
                    field: confirmPassword, 
                    validityFunction: validateConfirmPassword(password)
                }
            ]
            validationIntegrateObj.push(...additionalFields)
        }
        else{
            const passwordObj = {
                field : password, 
                validityFunction: validatePasswordOne()
            }
            validationIntegrateObj.push(passwordObj);
        }
    
        validationIntegrateObj.forEach( field => {
            field.field.addEventListener('input', field.validityFunction(field.field))
        })
    }
}

loginBtn?.addEventListener('click',  (e)=>{
    e.preventDefault();

    let credentialValidateObject = {};
    if(associate == 'user'){
        credentialValidateObject = validationIntegrateObj
    }
    else if(associate == 'admin'){
        credentialValidateObject = [{
            field: emailMobile, 
            validityFunction: adminValidationEmail()(emailMobile)
        }, {
            field: password, 
            validityFunction: validatePasswordOne()(password)
        }]
    }


    // this is a function which return true/false based on the user input
    // the function accepts a array of object which contains the field referance and function to validate
    let status = validaityForm(credentialValidateObject)
    console.log(status)
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

    console.log(validationIntegrateObj)
    let status = validaityForm(validationIntegrateObj)
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
                    location.assign("http://localhost:3000/otp-Auth?superSet="+superSet)
            }
            else{
                showModel(d.errorMessage)
            }
        })
    }

})





function emailMobileObjectCreater(field){
    return ()=>{
        const value = extractValue(field);
        const isMobileResult = isMobile(value);
            if(isMobileResult){
            isEmail = false;
            return validateMobile(field, value)
        }
        isEmail = true;
        return validateEmail(field, value);
    }
}

function validaityForm(validationObject){
    let status = true;
    let validationResult;
    validationObject.forEach( x => {
        validationResult = x.validityFunction(x.field)();
        status &&= validationResult;
    })
        return status;
}

function validateFullName(field){
    return ()=>{
        let fullName = extractValue(field)
        var regName = /^[a-zA-Z]+ [a-zA-Z]+$/;
        if(regName.test(fullName)){
            errorCorrection(field);
            return true;
        }
        setError(field, "Invalid Name")
    }
}

function adminValidationEmail(field){
    return ()=>{
        return validateEmail(field, extractValue(field));
    }
}

function validateEmail(field, email){
    // validate 
    console.log("what is this")
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
        errorCorrection(field);
        return true;
    } 
    setError(field, "Please enter a valid email")
    return false;
}

function validatePasswordOne(confirmPassword){
    return (field)=>{
        return ()=>{
            if(confirmPassword && extractValue(confirmPassword) != ""){
                validateConfirmPassword(field)(confirmPassword)();
            }   
            return validatePassword(field);
        }
    }
}

// general function which validate both password and confirmpassword
// this is called from validatePasswordOne and validateConfirmPassword
function validatePassword(field){
    //check empty password field  
        let password = extractValue(field);
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

function validateConfirmPassword(password){
    return (confirmPassword)=>{
        return()=>{
            if(!validatePassword(confirmPassword)){
                setError(confirmPassword, "Not a valid password")
                return false;
            }
        
            if(extractValue(password) !== extractValue(confirmPassword)){
                setError(confirmPassword, "Passwords doesn't match")
                return false;
            }
            errorCorrection(confirmPassword);
            return true;
        }
    }
}

function validateMobile(field, mobile){
    const phoneRegex = /^[6789]\d{9}$/;
    if(phoneRegex.test(mobile)){
        errorCorrection(field)
        return true;
    }
    setError(field, "Invalid Mobile Number")
    return false;
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



