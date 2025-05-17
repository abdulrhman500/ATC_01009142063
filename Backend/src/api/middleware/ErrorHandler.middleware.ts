// src/api/middleware/ErrorHandler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import ResponseEntity from '@api/shared/ResponseEntity';
import UserAlreadyExistException from '@domain/user/exceptions/UserAlreadyExistException';
import { HttpException, NotFoundException } from '@shared/exceptions/http.exception'; // Assuming NotFoundException is defined here or similar

const errorHandlerMiddleware = (err: any, req: Request, res: Response, next: NextFunction): void => {
    console.error("Caught exception:", err.message); // Log the message for clarity
console.log("Caught exception:", err); // Log the message for clarity
console.log("Type of err:", typeof err); // Check the type of err

    if (err instanceof NotFoundException) { // ADD THIS BLOCK
        const responseEntity = new ResponseEntity(StatusCodes.NOT_FOUND, err.message, null);
        res.status(responseEntity.getStatus()).json(responseEntity);
        return;
    } else if (err instanceof UserAlreadyExistException) {
        const responseEntity = new ResponseEntity(StatusCodes.CONFLICT, err.message, null); // Changed {} to null for consistency
        res.status(responseEntity.getStatus()).json(responseEntity);
        return;
    }
    else if(err instanceof HttpException){
        res.status(err.statusCode).json(err);

    }
    // Add other 'else if' blocks here for other specific custom exceptions you want to handle
    // else if (err instanceof YourCustomBadRequestException) {
    //     const responseEntity = new ResponseEntity(StatusCodes.BAD_REQUEST, err.message, err.details || null);
    //     res.status(responseEntity.getStatus()).json(responseEntity);
    //     return;
    // }

    // Fallback for all other unhandled errors
    // Log the full stack for unexpected errors
    console.error("Internal Server Error Details:", err); // Log the full error object
    if (err.stack) {
        console.error("Stack:", err.stack);
    }
    
    const responseEntity = new ResponseEntity(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ReasonPhrases.INTERNAL_SERVER_ERROR, // Generic message for client
        null // Don't leak error details for 500 errors by default
    );
    res.status(responseEntity.getStatus()).json(responseEntity);
    // No need for 'return' here as it's the end of the function
};

export default errorHandlerMiddleware;