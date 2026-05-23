export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = "Unauthorized", code?: string) {
    return new ApiError(401, message, code);
  }

  static forbidden(message = "Forbidden", code?: string) {
    return new ApiError(403, message, code);
  }

  static notFound(message = "Not found", code?: string) {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code?: string) {
    return new ApiError(409, message, code);
  }
}
