/// Typed exception hierarchy.
/// All exceptions thrown by repositories must be one of these subtypes.
sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;
}

/// HTTP 401 — token missing or expired.
class UnauthenticatedException extends AppException {
  const UnauthenticatedException([super.message = 'Session expired. Please log in again.']);
}

/// HTTP 403 — authenticated but not allowed.
class ForbiddenException extends AppException {
  const ForbiddenException([super.message = 'You do not have permission to do this.']);
}

/// HTTP 404.
class NotFoundException extends AppException {
  const NotFoundException([super.message = 'Resource not found.']);
}

/// HTTP 422 / 400 — validation errors from the backend.
class ValidationException extends AppException {
  const ValidationException(super.message, {this.fieldErrors = const {}});
  final Map<String, String> fieldErrors;
}

/// HTTP 5xx or unexpected backend error.
class ServerException extends AppException {
  const ServerException([super.message = 'Something went wrong. Please try again.']);
}

/// No internet / DNS / timeout.
class NetworkException extends AppException {
  const NetworkException([super.message = 'No internet connection.']);
}
