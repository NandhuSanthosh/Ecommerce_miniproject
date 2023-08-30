exports.errorHandler = async (error, req, res, next)=> {
    // res.send({isSuccess: false, errorMessage: error.message})
    if(error.name == "ValidationError"){
        console.log(error)
        res.status(422).send({isSuccess: false, errorMessage: "Field validation failed"})
    }
    else{
        console.log(error);
        res.status(500).send({isSuccess: false, errorMessage: error.message})
    }
}