function passwordValidate(field){
        const password = field;
        const minLength = /.{8,}/


        let status = true;

        status = validate(minLength, "minLength") && status
        return status;
        
        function validate(regexString, className){
            if(regexString.test(password)){
                console.log(className + " true")
                return true;
            }
            else{
                console.log(className + " false")
                return false;
            }
        }
    }

    passwordValidate("Nandhu3")