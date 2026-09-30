import { AppError } from "./AppError.js";
export class BadRequestError extends AppError {
  constructor(message = "Bad request", details = []) {
    super(400, "BAD_REQUEST", message, details);
    this.name = "BadRequestError";
  }
}