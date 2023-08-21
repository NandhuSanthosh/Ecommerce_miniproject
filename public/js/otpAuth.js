const sendOtpBtn = document.getElementById('sendOtpBtn');
const otpValidationForm  = document.getElementById('otpValidationForm');

let isFirstAttempt = true;
let timerInterval;

sendOtpBtn?.addEventListener('click', (e)=> {
    e.preventDefault();

    if(isFirstAttempt){
        requestOtp();
        enableInputFields();
        configureResendButton();
        updateSendButton();
        isFirstAttempt = false;
    }
    else{
        // verify otp
        sendOtpVerificationRequest();
    }
})


function updateSendButton(){
    sendOtpBtn.innerHTML = 'Verify';
}


// based to the attempt(whether first time or not) the reset button and timer is updated
function configureResendButton(){
    
    if(isFirstAttempt){
        createResentButton();
    }
    else{
        // disble resend button
        disabledResendButton();
        // addtimer
    }


    

    var timerElement = document.getElementById('timer');
    timerInterval = setInterval(startTimer(timerElement, 2.5), 1000);

}

function createResentButton(){
    const resendBtnContainer = document.createElement('div');
    resendBtnContainer.classList.add('mt-2', 'd-flex', 'align-items-center', 'resendBtnContainer');
    resendBtnContainer.innerHTML = "<button id='resendBtn' class='btn btn-link' disabled>Resend Code </button> <span id='timer'></span>"
    otpValidationForm.append(resendBtnContainer);
    resendBtn.addEventListener('click', resendButtonEvent)
}

function enableResendButton(){
    resendBtn.disabled = false;
}

function disabledResendButton(){
    resendBtn.disabled  = true;
}

function resendButtonEvent(){
    // request for another otp
    configureResendButton();
    requestOtp();
}

// starts timer
function startTimer(...[timerElement, timeLimitInMinutes]) {
    displayTimer();
    var timeLimitInSeconds = timeLimitInMinutes * 60;
    return function(){
        timeLimitInSeconds--;
        var minutes = Math.floor(timeLimitInSeconds / 60);
        var seconds = timeLimitInSeconds % 60;

        // after timer expired
        if (timeLimitInSeconds < 0) {
            timerElement.textContent = '00:00';
            removeTimer(timerElement);
            enableResendButton()
            clearInterval(timerInterval);
            return;
        }

        // updating the timer value
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        timerElement.textContent = minutes + ':' + seconds;
    }
    function removeTimer(){
        timerElement.style.display = 'none'
    }
    function displayTimer(){
        timerElement.style.display = 'block'
    }
}

function enableInputFields(){
    document.querySelectorAll('#otp input').forEach( x=> {
        x.disabled = false;
    })
}

// to change input field when entering otp
document.addEventListener("DOMContentLoaded", function (event) {
    function OTPInput() {
        const inputs = document.querySelectorAll('#otp > *[id]');
        for (let i = 0; i < inputs.length; i++) { inputs[i].addEventListener('keydown', function (event) { if (event.key === "Backspace") { inputs[i].value = ''; if (i !== 0) inputs[i - 1].focus(); } else { if (i === inputs.length - 1 && inputs[i].value !== '') { return true; } else if (event.keyCode > 47 && event.keyCode < 58) { inputs[i].value = event.key; if (i !== inputs.length - 1) inputs[i + 1].focus(); event.preventDefault(); } else if (event.keyCode > 64 && event.keyCode < 91) { inputs[i].value = String.fromCharCode(event.keyCode); if (i !== inputs.length - 1) inputs[i + 1].focus(); event.preventDefault(); } } }); }
    } OTPInput();
});




async function requestOtp(){
    fetch('http://localhost:3000/request-otp')
    .then( response => response.json())
    .then( data => {
        console.log(data)
        if(!data.isSuccess){
            showModel("Session expired")
        }
        else{
            showModel("Otp successfully send.")
        }
    })
}

// sends to request to verify otp
function sendOtpVerificationRequest(){
    const userOtpInput = validateOtpFields();
    if(userOtpInput){
        console.log(userOtpInput)
        fetch('http://localhost:3000/verify-otp', {
            method: 'post', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ otp: userOtpInput})
        })
        .then( response => response.json())
        .then( data => {
            console.log(data)
            if(data.isSuccess){
                location.assign('/');
            }
            else{
                showModel(data.errorMessage)
            }
        })
    }
}

// validate whether all the fields are  filled
// if filled returns otp
function validateOtpFields(){
    const otpFields = getOtpFields();
    let isAllFieldsFilled = true;
    let userOtpInput = "";
    otpFields.forEach( x=> {
        if(x.value){
            correctErrorOtp(x);
            userOtpInput += x.value;
        }
        else{
            setErrorOtp(x);
            isAllFieldsFilled = false;
        }
    })
    if(isAllFieldsFilled){
        return userOtpInput;
    }
}

// remove error from otp fields
function correctErrorOtp(field){
    field.classList.remove('otpFieldError')
}

// set error to otp fields
function setErrorOtp(field){
    field.classList.add('otpFieldError');
}

// return all the otp fields
function getOtpFields(){
    return otp.querySelectorAll('input')
}