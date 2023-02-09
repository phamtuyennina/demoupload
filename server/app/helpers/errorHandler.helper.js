
class ErrorHandler extends Error{
    constructor(success,message,statusCode){
        super(message, statusCode);
        this.statusCode = statusCode
        this.success = success
        Error.captureStackTrace(this,this.constructor);
    }
}
module.exports = ErrorHandler