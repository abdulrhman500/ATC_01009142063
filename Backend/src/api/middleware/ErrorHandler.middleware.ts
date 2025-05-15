import { Request, Response, NextFunction } from 'express';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import UserAlreadyExistException from '@shared/exceptions/UserAlreadyExistException.';
import ResponseEntity from '@api/shared/ResponseEntity';

const errorHandlerMiddleware = (err: any, req: Request, res: Response, next: NextFunction): void => {
    console.error("Caught exception:", err);

    if (err instanceof UserAlreadyExistException) {
        const responseEntity = new ResponseEntity(StatusCodes.CONFLICT, err.message, {});
        res.status(responseEntity.getStatus()).json(responseEntity);
        return; // End the function after sending response
    }
    // else if (err instanceof OtherHandledException) {
    //     // ... handle other errors ...
    //     res.status(...).json(...);
    //     return;
    // }

    // Fallback for all unhandled errors (unexpected errors, system errors, etc.)
    const responseEntity = new ResponseEntity(StatusCodes.INTERNAL_SERVER_ERROR,ReasonPhrases.INTERNAL_SERVER_ERROR,{}); 
    console.error("Internal Server Error Stack:", err.stack); 
    res.status(responseEntity.getStatus()).json(responseEntity);
    return;
};

export default errorHandlerMiddleware;