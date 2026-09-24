import { AppError } from "./AppError.js";

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details = []) {
    super(422, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}
