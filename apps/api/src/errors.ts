export class ApiError extends Error {
  public constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  public static badRequest(message: string): ApiError {
    return new ApiError(400, "INVALID_INPUT", message);
  }

  public static notFound(message: string): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  public static conflict(message: string): ApiError {
    return new ApiError(409, "CONFLICT", message);
  }

  public static forbidden(message = "Capability required"): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }
}
