import { ValidationError } from 'class-validator';
import { StatusCodes } from 'http-status-codes';
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

export class NotFoundException extends HttpException {
  constructor(message: string) {
    super(404, message);
  }

}
export class BadRequestException extends HttpException{
  constructor(message: string) {
    super(400, message);
  }
}
export class UnauthorizedException extends HttpException{
  constructor(message: string) {
    super(401, message);
  }
}
export class ForbiddenException extends HttpException{
  constructor(message: string) {
    super(403, message);
  }
}


