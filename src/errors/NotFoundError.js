import { AppError } from "./AppError.js";

export class NotFoundError extends AppError {
  constructor(code, message, details = []) {
    super(404, code, message, details);
    this.name = "NotFoundError";
  }
}
