/// Centralized user-facing strings for the Authentication module.
class AppStrings {
  AppStrings._();

  // ── Splash ──────────────────────────────────────────────────────────────
  static const String splashTitle = 'KAVACH';
  static const String splashSubtitle =
      'Enterprise XDR & SOAR Security Platform';

  // ── Login ───────────────────────────────────────────────────────────────
  static const String loginTitle = 'Welcome Back';
  static const String loginSubtitle = 'Securely sign in to continue';
  static const String loginButton = 'Login';
  static const String rememberMe = 'Remember Me';
  static const String forgotPassword = 'Forgot Password?';
  static const String noAccount = "Don't have an account? ";
  static const String createAccount = 'Create Account';
  static const String orDivider = 'or';

  // ── Sign Up ─────────────────────────────────────────────────────────────
  static const String signUpTitle = 'Create Account';
  static const String signUpSubtitle =
      'Join the enterprise security platform';
  static const String signUpButton = 'Create Account';
  static const String fullName = 'Full Name';
  static const String organization = 'Organization';
  static const String email = 'Email';
  static const String password = 'Password';
  static const String confirmPassword = 'Confirm Password';
  static const String selectRole = 'Select Role';
  static const String alreadyHaveAccount = 'Already have an account? ';
  static const String login = 'Login';

  // ── Forgot Password ────────────────────────────────────────────────────
  static const String forgotPasswordTitle = 'Reset Password';
  static const String forgotPasswordSubtitle =
      'Enter your email address and we\'ll send you a verification link to reset your password.';
  static const String sendVerification = 'Send Verification';
  static const String backToLogin = 'Back to Login';
  static const String resetEmailSent = 'Verification email sent!';
  static const String resetEmailSentMessage =
      'Please check your email inbox and follow the instructions to reset your password.';

  // ── Email Verification ─────────────────────────────────────────────────
  static const String verifyEmailTitle = 'Verify Your Email';
  static const String verifyEmailMessage =
      'Verification email has been sent.';
  static const String verifyEmailSubMessage =
      'Please verify your email before logging in.';
  static const String openEmailApp = 'Open Email App';
  static const String resendEmail = 'Resend Email';

  // ── Validation Messages ────────────────────────────────────────────────
  static const String fieldRequired = 'This field is required';
  static const String invalidEmail = 'Please enter a valid email address';
  static const String passwordTooShort =
      'Password must be at least 8 characters';
  static const String passwordWeak =
      'Password must contain uppercase, lowercase, number and special character';
  static const String passwordsDoNotMatch = 'Passwords do not match';
  static const String invalidName =
      'Name must contain only letters and spaces';
}
