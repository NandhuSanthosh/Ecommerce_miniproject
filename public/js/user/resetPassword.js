
newPassword.addEventListener('input', validateNewPassword)
confirmNewPassword.addEventListener('input', updateConfirmPassword)
changePasswordBtn.addEventListener('click', resetPasswordHandler)

function resetPasswordHandler(){
    const newPass = newPassword.value.trim();
    fetch("http://localhost:3000/reset_password/" + key, {
        method: "PATCH",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            newPassword: newPass
        })
    })
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess){
            alert("Password sucessfully updated")
            location.assign("http://localhost:3000/")
        }
        else{
            showModal(data.errorMessage)
        }
    })
}

function changePasswordHandler(){
        const currPass = currentPassword.value;
        const newPass = newPassword.value;
        
        fetch("http://localhost:3000/change_password", {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify({
                currentPassword: currPass, 
                newPassword: newPass
            })
        })
        .then( response => response.json())
        .then( data => {
            if(data.isSuccess){
                showModal("Password successfully changed");
                reset(currentPassword)
                reset(newPassword)
                reset(confirmNewPassword)
                function reset(field){
                    field.value = "";
                    field.classList.remove("success")
                }
                const instructionList = document.querySelector('.passwordInstructionsList');
                const childElements = Array.from(instructionList.children);
                childElements.forEach( x => {
                    x.classList.remove('success')
                })
            }
            else{
                showModal(data.errorMessage)
            }
        })
}
function validateNewPassword(e){
    const status = passwordValidate(e.target);
    if(status){
        updateConfirmPassword();
        e.target.classList.add('success')
        e.target.classList.remove('error')
    }
    else{
        e.target.classList.remove('success')
        e.target.classList.add('error')
    }
    resetPasswordChangeBtn()
}
function updateConfirmPassword(e){
    if(confirmNewPassword.value.trim() == "") return;
    if(validateConfirmPassword()){
        confirmNewPassword.classList.remove('error')
        confirmNewPassword.classList.add('success')
    }
    else{
        confirmNewPassword.classList.add('error')
        confirmNewPassword.classList.remove('success')
    }
    resetPasswordChangeBtn()
}

function validateConfirmPassword(e){
    return newPassword.value == confirmNewPassword.value;
}

function passwordValidate(field){
    const password = field.value.trim();
    const minLength = /.{8,}/
    const upperCase = /[A-Z]/
    const specialCharacter = /[^a-zA-Z0-9]/
    const number = /\d/

    let status = true;

    status = validate(minLength, "minLength") && status
    status = validate(upperCase, "uppercase") && status
    status = validate(specialCharacter, "specialCharacter") && status
    status = validate(number, "number") && status
    return status;
    
    function validate(regexString, className){
        if(regexString.test(password)){
            setSuccess(document.querySelector('.' + className));
            return true;
        }
        else{
            setFailure(document.querySelector('.' + className))
            return false;
        }
    }

    function setSuccess(field){
        field.classList.add('success')
        field.classList.remove('error')
    }
    function setFailure(field){
        field.classList.remove("success")
        field.classList.add('error')
    }
}
function resetPasswordChangeBtn(){
    const confirmPasswordStatus = this.validateConfirmPassword()
    const newPasswordStatus = this.passwordValidate(newPassword)
    if(newPasswordStatus && confirmPasswordStatus){
        changePasswordBtn.disabled = false;
    }
    else{
        changePasswordBtn.disabled = true;
    }
    // changePasswordBtn
}