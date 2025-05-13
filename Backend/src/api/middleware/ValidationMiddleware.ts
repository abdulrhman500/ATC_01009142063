// @api/middleware/ValidationMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer'; // Import plainToInstance
import { StatusCodes } from 'http-status-codes';
import ResponseEntity from "@api/shared/ResponseEntity"; // Your response formatter

// Helper function to format validation errors
function formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.map(error => ({
        property: error.property,
        constraints: error.constraints,
        children: error.children && error.children.length > 0 ? formatValidationErrors(error.children) : undefined,
    }));
}

// Middleware factory function
export function ValidationMiddleware(dtoType: any) {
    return (req: Request, res: Response, next: NextFunction) => {
        // 1. Transform plain request body object to an instance of the DTO class
        // plainToInstance handles mapping properties and applying transformations like @Type, @Transform
        const instance = plainToInstance(dtoType, req.body);

        // 2. Validate the instance
        // Use whitelist and forbidNonWhitelisted to strip unknown properties and reject requests with them
        validate(instance, { whitelist: true, forbidNonWhitelisted: true }).then(errors => {
            if (errors.length > 0) {
                // 3. If there are validation errors, return a 400 Bad Request response
                const errorDetails = formatValidationErrors(errors);
                const errorResponse = new ResponseEntity(
                    StatusCodes.BAD_REQUEST,
                    "Validation failed", // Generic validation error message
                    { errors: errorDetails } // Detailed error structure in the data/errors field
                );
                res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
            } else {
                // 4. If validation passes, replace req.body with the validated DTO instance
                // This ensures the controller receives the correctly typed and validated object
                req.body = instance;
                next(); // Proceed to the controller
            }
        });
    };
}