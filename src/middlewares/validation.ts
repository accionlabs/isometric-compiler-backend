import { ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';

function extractValidationErrors(errors: ValidationError[], parentKey: string = ''): string[] {
  let errorMessages: string[] = [];

  errors.forEach((error) => {
    // Check for nested validation errors
    const currentKey = parentKey ? `${parentKey}.${error.property}` : error.property;

    if (error.constraints) {
      // If the error has constraints, extract them
      errorMessages.push(...Object.values(error.constraints).map((msg) => `${currentKey}: ${msg}`));
    }

    // Recursively check for nested validation errors
    if (error.children && error.children.length > 0) {
      errorMessages.push(...extractValidationErrors(error.children, currentKey));
    }
  });

  return errorMessages;
}


export function validateRequest(validSchema: any) {
  return async function (req: Request, res: Response, next: NextFunction) {
    // Transform the request body into an instance of the validation schema
    const transformedBody = plainToInstance(validSchema, req.body);
    console.log("transformedBody", transformedBody)
    // Validate the transformed object
    validate(transformedBody).then((errs: ValidationError[]) => {
      if (errs.length > 0) {
        // Extract and log validation errors
        const errorMessages = extractValidationErrors(errs);
        console.log("Validation Errors:", errorMessages);

        const errMessage = errorMessages.join(', ');

        next(new ApiError(errMessage, 400));
      } else {
        next();
      }
    }).catch((error) => {
      // Catch any unexpected errors during validation
      next(new ApiError(error.message, 500));
    });
  };
}
