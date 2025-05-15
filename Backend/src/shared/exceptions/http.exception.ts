import { ValidationError } from 'class-validator';

export class HttpException extends Error {
  public statusCode: number;
  public message: string;
  public errors?: ValidationError[];

  constructor(statusCode: number, message: string, errors?: ValidationError[]) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
  }
}

export class ValidationException extends HttpException {
  constructor(errors: ValidationError[]) {
    super(400, 'Validation failed', errors);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string) {
    super(409, message);
  }
}