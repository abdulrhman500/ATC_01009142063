import { Request, Response, NextFunction } from "express";
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer'; 
import { StatusCodes } from 'http-status-codes';
import ResponseEntity from "@api/shared/ResponseEntity";

function formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.map(error => ({
        property: error.property,
        constraints: error.constraints,
        children: error.children && error.children.length > 0 ? formatValidationErrors(error.children) : undefined,
    }));
}

export function ValidationMiddleware(dtoType: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      
        const instance = plainToInstance(dtoType, req.body);

        validate(instance, { whitelist: true, forbidNonWhitelisted: true }).then(errors => {
            if (errors.length > 0) {
                const errorDetails = formatValidationErrors(errors);
                const errorResponse = new ResponseEntity(
                    StatusCodes.BAD_REQUEST,
                    "Validation failed",
                    { errors: errorDetails } 
                );
                res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
            } else {
            
                req.body = instance;
                next();
            }
        });
    };
}