sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;
}

class UnauthenticatedException extends AppException {
  const UnauthenticatedException([super.message = 'Session expired. Please log in again.']);
}

class ForbiddenException extends AppException {
  const ForbiddenException([super.message = 'You do not have permission to do this.']);
}

class NotFoundException extends AppException {
  const NotFoundException([super.message = 'Resource not found.']);
}

class ValidationException extends AppException {
  const ValidationException(super.message);
}

class ServerException extends AppException {
  const ServerException([super.message = 'Something went wrong. Please try again.']);
}

class NetworkException extends AppException {
  const NetworkException([super.message = 'No internet connection.']);
}
