import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  constructor(code, message, details = []) {
    super(409, code, message, details);
    this.name = "ConflictError";
  }
}
