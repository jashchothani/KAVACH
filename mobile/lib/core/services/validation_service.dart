import '../config/app_config.dart';
import '../constants/app_strings.dart';

/// Static validation methods for all authentication form fields.
///
/// Returns `null` when valid, or an error message string when invalid.
class ValidationService {
  ValidationService._();

  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  static final RegExp _nameRegex = RegExp(r'^[a-zA-Z\s]+$');

  static final RegExp _uppercaseRegex = RegExp(r'[A-Z]');
  static final RegExp _lowercaseRegex = RegExp(r'[a-z]');
  static final RegExp _digitRegex = RegExp(r'[0-9]');
  static final RegExp _specialCharRegex = RegExp(r'[!@#$%^&*(),.?":{}|<>]');

  /// Validates that a field is not empty.
  static String? validateRequired(String? value) {
    if (value == null || value.trim().isEmpty) {
      return AppStrings.fieldRequired;
    }
    return null;
  }

  /// Validates email format.
  static String? validateEmail(String? value) {
    final requiredError = validateRequired(value);
    if (requiredError != null) return requiredError;

    if (!_emailRegex.hasMatch(value!.trim())) {
      return AppStrings.invalidEmail;
    }
    return null;
  }

  /// Validates password minimum length.
  static String? validatePassword(String? value) {
    final requiredError = validateRequired(value);
    if (requiredError != null) return requiredError;

    if (value!.length < AppConfig.passwordMinLength) {
      return AppStrings.passwordTooShort;
    }
    return null;
  }

  /// Validates password strength (uppercase, lowercase, digit, special char).
  static String? validatePasswordStrength(String? value) {
    final basicError = validatePassword(value);
    if (basicError != null) return basicError;

    if (!_uppercaseRegex.hasMatch(value!) ||
        !_lowercaseRegex.hasMatch(value) ||
        !_digitRegex.hasMatch(value) ||
        !_specialCharRegex.hasMatch(value)) {
      return AppStrings.passwordWeak;
    }
    return null;
  }

  /// Validates that confirm password matches original password.
  static String? validateConfirmPassword(String? value, String password) {
    final requiredError = validateRequired(value);
    if (requiredError != null) return requiredError;

    if (value!.trim() != password) {
      return AppStrings.passwordsDoNotMatch;
    }
    return null;
  }

  /// Validates name format (letters and spaces only).
  static String? validateName(String? value) {
    final requiredError = validateRequired(value);
    if (requiredError != null) return requiredError;

    if (!_nameRegex.hasMatch(value!.trim())) {
      return AppStrings.invalidName;
    }
    return null;
  }

  /// Validates organization name (just required, no special format).
  static String? validateOrganization(String? value) {
    return validateRequired(value);
  }
}
