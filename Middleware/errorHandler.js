exports.errorHandler = async (error, req, res, next)=> {
    // res.send({isSuccess: false, errorMessage: error.message})
    if(error.name == "ValidationError"){
        let errorMessage = "These fields are missing:";
        for( let x in error.errors){
            errorMessage +=" " +  x + ","
        }
        res.status(422).send({isSuccess: false, errorMessage})
    }
    else{
        console.log(error);
        res.status(500).send({isSuccess: false, errorMessage: error.message})
    }
}