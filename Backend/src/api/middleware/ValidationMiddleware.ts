// src/api/middleware/ValidationMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { validate, ValidationError } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import ResponseEntity from "@api/shared/ResponseEntity";

function formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.map(error => ({
        property: error.property,
        constraints: error.constraints,
        children: error.children && error.children.length > 0 ? formatValidationErrors(error.children) : undefined,
    }));
}

export type RequestDataSource = 'body' | 'query' | 'params';

export function ValidationMiddleware<T extends object>(
    dtoType: ClassConstructor<T>,
    source: RequestDataSource = 'body', // Default to 'body' for backward compatibility
    // Validation options from class-validator
    validationOptions: { whitelist?: boolean, forbidNonWhitelisted?: boolean, skipMissingProperties?: boolean } = 
        { whitelist: true, forbidNonWhitelisted: true, skipMissingProperties: false } 
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        let dataToValidate: any;

        switch (source) {
            case 'query':
                dataToValidate = req.query;
                break;
            case 'params':
                dataToValidate = req.params;
                break;
            case 'body':
            default:
                dataToValidate = req.body;
                break;
        }

        // Convert plain object to class instance.
        // This is crucial for decorators to work, and for @Type to convert query param strings.
        const instance = plainToInstance(dtoType, dataToValidate, {});
        console.log("--------------------------------------");
        console.log("instance: ", instance);
        console.log("--------------------------------------");   
        
        try {
            const errors = await validate(instance, validationOptions);

            if (errors.length > 0) {
                const errorDetails = formatValidationErrors(errors);
                const errorResponse = new ResponseEntity(
                    StatusCodes.BAD_REQUEST,
                    "Validation failed",
                    { errors: errorDetails }
                );
                // Do not call next() if response is sent
                return res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
            } else {
                // Store the validated and transformed DTO instance back onto the request object.
                if (source === 'body') {
                    req.body = instance; // Overwrite body, common practice
                } else if (source === 'query') {
                    (req as any).validatedQuery = instance; // Attach to a custom property
                } else if (source === 'params') {
                    (req as any).validatedParams = instance; // Attach to a custom property
                }
                next();
            }
        } catch (error) {
            // Catch errors from plainToInstance or validate itself
            next(error); // Pass to global Express error handler
        }
    };
}